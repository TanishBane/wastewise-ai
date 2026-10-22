"""
WasteWise AI - FastAPI Application Backend
Exposes real Random Forest demand forecasting, Newsvendor prep planning,
waste triage metrics, and operational outcome tracking for the React frontend.
Refactored with clean service-layer separation and SQLite persistence.
"""

import io
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

from backend.database import get_db_context, init_db, reset_demo_catalog
from backend.models import MenuItemModel, UploadHistoryModel
from backend.services.forecasting_service import ForecastingService
from backend.services.ingestion_service import IngestionService
from backend.services.planning_service import PlanningService
from backend.services.reporting_service import ReportingService
from backend.services.rescue_service import WasteRescueService
from src.config import (
    CANTEEN_NAME,
    EVENT_NAME,
    MENU_ITEMS,
    MENU_ITEM_NAMES,
    VERSION,
    WEATHER_TYPES,
)
from src.data import (
    DATA_DIR,
    generate_sample_csv_template,
    get_demonstration_data,
    validate_dataset,
)
from src.model import DemandForecastingEngine
from src.planner import PreparationPlanner


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize persistent tables before restoring an operator dataset.
    init_db()
    state.restore_persisted_dataset()
    yield


app = FastAPI(
    title="WasteWise AI Operational Intelligence API",
    description="Enterprise FoodTech demand forecasting & preparation optimization backend",
    version=VERSION,
    lifespan=lifespan,
)

# Enable CORS for React frontend (Vite dev server)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "WASTEWISE_CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppState:
    def __init__(self):
        self.dataset_df: pd.DataFrame = get_demonstration_data()
        self.is_synthetic: bool = True
        self.engine = DemandForecastingEngine(n_estimators=100, random_state=42)
        self.engine.train_and_evaluate(self.dataset_df, holdout_days=35)
        self.planner = PreparationPlanner()

    def reset_dataset(self):
        reset_demo_catalog()
        with get_db_context() as db:
            db.query(UploadHistoryModel).filter(UploadHistoryModel.is_active == True).update(
                {"is_active": False}
            )
            db.commit()
        self.dataset_df = get_demonstration_data()
        self.is_synthetic = True
        self.engine = DemandForecastingEngine(n_estimators=100, random_state=42)
        self.engine.train_and_evaluate(self.dataset_df, holdout_days=35)

    def restore_persisted_dataset(self):
        """Restore the most recently validated operator dataset after restart."""
        active_path = DATA_DIR / "active_operator_dataset.csv"
        if not active_path.exists():
            return
        with get_db_context() as db:
            active_upload = (
                db.query(UploadHistoryModel)
                .filter(UploadHistoryModel.is_active == True)
                .order_by(UploadHistoryModel.timestamp.desc())
                .first()
            )
        if not active_upload:
            return
        try:
            uploaded_df = pd.read_csv(active_path)
            valid, _, clean_df = validate_dataset(uploaded_df)
            if not valid:
                return
            engine = DemandForecastingEngine(n_estimators=100, random_state=42)
            holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))
            engine.train_and_evaluate(clean_df, holdout_days=holdout_days)
            self.dataset_df = clean_df
            self.engine = engine
            self.is_synthetic = False
        except Exception:
            # A corrupt historic upload must not prevent the local app starting.
            # It remains in the audit table for an operator to investigate.
            return


state = AppState()

# Instantiate domain services
forecasting_service = ForecastingService()
planning_service = PlanningService(state.planner)
rescue_service = WasteRescueService()
ingestion_service = IngestionService()
reporting_service = ReportingService()


# --- Pydantic Request Models ---
class ForecastScenarioRequest(BaseModel):
    menu_item: str
    day_of_week: str
    attendance_index: float = Field(default=1.0, ge=0.1, le=1.8)
    campus_event: int = Field(default=0, ge=0, le=1)
    weather: str = Field(default="Sunny / Mild")


class PreparationPlanRequest(BaseModel):
    menu_item: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    current_stock: int = 0
    custom_cost_surplus: Optional[float] = None
    custom_cost_shortage: Optional[float] = None
    service_level_preference: float = 0.55
    traditional_baseline_prep: Optional[int] = None
    service_date: Optional[str] = None
    target_meal: str = "Lunch"


class ActualOutcomeRequest(BaseModel):
    service_date: str
    target_meal: str = "Lunch"
    menu_item: str
    portions_prepared: int = Field(ge=0)
    portions_sold: int = Field(ge=0)
    portions_leftover: int = Field(ge=0)
    waste_cause: Optional[str] = Field(default="Over-preparation", max_length=100)
    discarded_kg: float = Field(default=0.0, ge=0)
    donation_kg: float = Field(default=0.0, ge=0)
    waste_cost: float = Field(default=0.0, ge=0)
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def quantities_match_service(self):
        if self.portions_sold + self.portions_leftover != self.portions_prepared:
            raise ValueError("Prepared portions must equal portions sold plus portions leftover.")
        return self


# --- Endpoints ---
@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "app_name": "WasteWise AI",
        "version": VERSION,
        "event": EVENT_NAME,
        "workspace": CANTEEN_NAME,
        "is_synthetic": state.is_synthetic,
        "model_trained": state.engine.is_trained,
    }


@app.get("/api/config")
def get_config():
    # Read active menu items from SQLite or fallback to config
    items = []
    names = []
    with get_db_context() as db:
        db_items = db.query(MenuItemModel).filter(MenuItemModel.active == True).all()
        if db_items:
            for it in db_items:
                items.append({
                    "name": it.name,
                    "category": it.category,
                    "cost_per_portion": it.cost_price,
                    "selling_price": it.selling_price,
                    "prep_batch_size": it.prep_batch_size,
                    "shelf_life_hours": it.shelf_life_hours,
                    "base_demand": it.base_demand,
                })
                names.append(it.name)

    if not items:
        for name, cfg in MENU_ITEMS.items():
            items.append({
                "name": cfg.name,
                "category": cfg.category,
                "cost_per_portion": cfg.cost_per_portion,
                "selling_price": cfg.selling_price,
                "prep_batch_size": cfg.prep_batch_size,
                "shelf_life_hours": cfg.shelf_life_hours,
                "base_demand": cfg.base_demand,
            })
        names = MENU_ITEM_NAMES

    return {
        "menu_items": items,
        "menu_item_names": names,
        "weather_types": WEATHER_TYPES,
        "days_of_week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "workspace": CANTEEN_NAME,
        "event_name": EVENT_NAME,
        "version": VERSION,
        "is_synthetic": state.is_synthetic,
        "latest_date": str(state.dataset_df["date"].max()),
    }


@app.get("/api/overview")
def get_overview():
    return reporting_service.get_overview(
        engine=state.engine,
        dataset_df=state.dataset_df,
        is_synthetic=state.is_synthetic,
    )


@app.post("/api/forecast")
def predict_forecast(req: ForecastScenarioRequest):
    return forecasting_service.predict_scenario(
        engine=state.engine,
        dataset_df=state.dataset_df,
        menu_item=req.menu_item,
        day_of_week=req.day_of_week,
        attendance_index=req.attendance_index,
        campus_event=req.campus_event,
        weather=req.weather,
    )


@app.get("/api/forecast/history")
def get_forecast_history(limit: int = 50):
    return forecasting_service.get_forecast_history(limit=limit)


@app.post("/api/plan")
def create_preparation_plan(req: PreparationPlanRequest):
    return planning_service.generate_plan(
        menu_item=req.menu_item,
        predicted_demand=req.predicted_demand,
        lower_bound=req.lower_bound,
        upper_bound=req.upper_bound,
        current_stock=req.current_stock,
        custom_cost_surplus=req.custom_cost_surplus,
        custom_cost_shortage=req.custom_cost_shortage,
        service_level_preference=req.service_level_preference,
        traditional_baseline_prep=req.traditional_baseline_prep,
        service_date=req.service_date,
        target_meal=req.target_meal,
    )


@app.get("/api/plan/history")
def get_plan_history(limit: int = 50):
    return planning_service.get_recent_plans(limit=limit)


@app.get("/api/waste-risk")
def get_waste_risks(risk_tier: Optional[str] = None):
    return rescue_service.get_waste_risks(
        engine=state.engine,
        dataset_df=state.dataset_df,
        risk_tier=risk_tier,
    )


@app.get("/api/performance")
def get_performance():
    return reporting_service.get_performance(engine=state.engine)


@app.post("/api/outcomes")
def record_outcome(req: ActualOutcomeRequest):
    return reporting_service.record_outcome(
        service_date=req.service_date,
        target_meal=req.target_meal,
        menu_item=req.menu_item,
        portions_prepared=req.portions_prepared,
        portions_sold=req.portions_sold,
        portions_leftover=req.portions_leftover,
        waste_cause=req.waste_cause or "Over-preparation",
        discarded_kg=req.discarded_kg,
        donation_kg=req.donation_kg,
        waste_cost=req.waste_cost,
        notes=req.notes,
    )


@app.get("/api/outcomes")
def get_outcomes(
    service_date: Optional[str] = None,
    menu_item: Optional[str] = None,
    limit: int = 100,
):
    return reporting_service.get_outcomes(
        service_date=service_date,
        menu_item=menu_item,
        limit=limit,
    )


@app.get("/api/data")
def get_data_info():
    df = state.dataset_df
    last_upload = None
    with get_db_context() as db:
        last_upload = (
            db.query(UploadHistoryModel)
            .order_by(UploadHistoryModel.id.desc())
            .first()
        )
    return {
        "is_synthetic": state.is_synthetic,
        "total_records": len(df),
        "date_min": str(df["date"].min()),
        "date_max": str(df["date"].max()),
        "columns": list(df.columns),
        "preview": df.tail(15).to_dict(orient="records"),
        "last_import": (
            last_upload.timestamp.strftime("%Y-%m-%d %H:%M UTC")
            if last_upload and last_upload.timestamp
            else None
        ),
        "last_filename": last_upload.filename if last_upload else None,
    }


@app.get("/api/data/template")
def download_csv_template():
    return Response(
        content=generate_sample_csv_template(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="wastewise_canteen_template.csv"'},
    )


@app.post("/api/data/upload")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    clean_df, engine, issues = await ingestion_service.process_and_train_csv(
        file_bytes=content,
        filename=file.filename or "upload.csv",
    )
    state.dataset_df = clean_df
    state.engine = engine
    state.is_synthetic = False

    return {
        "status": "success",
        "message": f"Successfully ingested {len(clean_df)} records across {len(clean_df['date'].unique())} service days.",
        "records": len(clean_df),
        "warnings": issues,
    }


@app.post("/api/data/reset")
def reset_to_demo_data():
    state.reset_dataset()
    return {
        "status": "success",
        "message": "Reset to default 180-day demonstration dataset.",
    }


# Serve the production frontend from the same origin as the API. This keeps the
# website a single project and avoids requiring a separate frontend server.
if FRONTEND_DIST_DIR.is_dir():
    @app.get("/", include_in_schema=False)
    def serve_frontend() -> FileResponse:
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST_DIR, html=True),
        name="frontend",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
