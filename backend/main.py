"""
WasteWise AI - FastAPI Application Backend
Exposes real Random Forest demand forecasting, Newsvendor prep planning,
waste triage metrics, and operational outcome tracking for the React frontend.
Architected for strict multi-tenant data and ML model isolation via OrgStateRegistry.
"""

import io
import os
import re
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from backend.auth import (
    OrgContext,
    UserIdentity,
    get_current_user,
    get_optional_user,
    require_tenant_context,
)
from backend.database import get_db, get_db_context, init_db, reset_demo_catalog
from backend.models import (
    MenuItemModel,
    OrganizationMemberModel,
    OrganizationModel,
    UploadHistoryModel,
    DEFAULT_ORG_ID,
    generate_uuid,
)
from backend.services.forecasting_service import ForecastingService
from backend.services.ingestion_service import IngestionService
from backend.services.org_state_service import org_state_registry, OrgState
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


if os.getenv("SENTRY_DSN") and sentry_sdk:
    sentry_sdk.init(
        dsn=os.environ["SENTRY_DSN"],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        send_default_pii=False,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize persistent tables and eagerly prepare default demo state
    init_db()
    org_state_registry.get_state(DEFAULT_ORG_ID)
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
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://([a-zA-Z0-9_-]+\.)?vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppState:
    """Compatibility adapter backed by OrgStateRegistry for unit test backwards-compatibility."""

    def __init__(self, organization_id: str = DEFAULT_ORG_ID):
        self.organization_id = organization_id

    @property
    def _inner(self) -> OrgState:
        return org_state_registry.get_state(self.organization_id)

    @property
    def dataset_df(self) -> pd.DataFrame:
        return self._inner.dataset_df

    @dataset_df.setter
    def dataset_df(self, val: pd.DataFrame):
        self._inner.dataset_df = val

    @property
    def engine(self) -> DemandForecastingEngine:
        return self._inner.engine

    @engine.setter
    def engine(self, val: DemandForecastingEngine):
        self._inner.engine = val

    @property
    def is_synthetic(self) -> bool:
        return self._inner.is_synthetic

    @is_synthetic.setter
    def is_synthetic(self, val: bool):
        self._inner.is_synthetic = val

    @property
    def planner(self) -> PreparationPlanner:
        return self._inner.planner

    def reset_dataset(self):
        org_state_registry.reset_tenant_state(self.organization_id)

    def restore_persisted_dataset(self):
        # Force re-read from disk
        csv_path = org_state_registry.get_tenant_csv_path(self.organization_id)
        if not csv_path.exists() and self.organization_id == DEFAULT_ORG_ID:
            csv_path = DATA_DIR / "active_operator_dataset.csv"
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                valid, _, clean_df = validate_dataset(df)
                if valid:
                    eng = DemandForecastingEngine(n_estimators=100, random_state=42)
                    holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))
                    eng.train_and_evaluate(clean_df, holdout_days=holdout_days)
                    org_state_registry.set_tenant_state(
                        self.organization_id, clean_df, eng, is_synthetic=False
                    )
            except Exception:
                pass


# Root application state compatibility instance
state = AppState(DEFAULT_ORG_ID)

# Instantiate domain services
forecasting_service = ForecastingService()
planning_service = PlanningService()
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
    target_service: str = Field(default="Lunch")


class PreparationPlanRequest(BaseModel):
    menu_item: str
    predicted_demand: float = Field(gt=0)
    lower_bound: float = Field(ge=0)
    upper_bound: float = Field(ge=0)
    current_stock: int = Field(default=0, ge=0)
    custom_cost_surplus: Optional[float] = None
    custom_cost_shortage: Optional[float] = None
    service_level_preference: float = Field(default=0.55, ge=0.01, le=0.99)
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


class CreateOrganizationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=100)


# --- Endpoints ---
@app.get("/api/health")
def get_health():
    default_state = org_state_registry.get_state(DEFAULT_ORG_ID)
    return {
        "status": "healthy",
        "app_name": "WasteWise AI",
        "version": VERSION,
        "event": EVENT_NAME,
        "workspace": CANTEEN_NAME,
        "is_synthetic": default_state.is_synthetic,
        "model_trained": default_state.engine.is_trained,
    }


@app.get("/api/config")
def get_config(
    user: Optional[UserIdentity] = Depends(get_optional_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    db: Session = Depends(get_db),
):
    effective_org_id = x_organization_id or DEFAULT_ORG_ID
    if user and not x_organization_id:
        membership = (
            db.query(OrganizationMemberModel)
            .filter(OrganizationMemberModel.user_id == user.id)
            .first()
        )
        if membership:
            effective_org_id = membership.organization_id

    tenant_state = org_state_registry.get_state(effective_org_id)

    # Read active menu items scoped to this organization
    items = []
    names = []
    db_items = (
        db.query(MenuItemModel)
        .filter(MenuItemModel.organization_id == effective_org_id, MenuItemModel.active == True)
        .all()
    )
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
        "is_synthetic": tenant_state.is_synthetic,
        "latest_date": tenant_state.latest_date,
    }


# --- Authentication & Tenant Profile Endpoints ---
@app.get("/api/auth/me")
def get_auth_me(user: UserIdentity = Depends(get_current_user)):
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.user_metadata.get("full_name") or user.email.split("@")[0],
    }


@app.get("/api/auth/organizations")
def get_user_organizations(
    user: UserIdentity = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(OrganizationMemberModel)
        .filter(OrganizationMemberModel.user_id == user.id)
        .all()
    )
    results = []
    for m in memberships:
        org = db.query(OrganizationModel).filter(OrganizationModel.id == m.organization_id).first()
        if org:
            results.append({
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "role": m.role,
            })
    return {"organizations": results}


@app.post("/api/auth/organizations")
def create_organization_endpoint(
    req: CreateOrganizationRequest,
    user: UserIdentity = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new organization with the calling user securely assigned as owner."""
    computed_slug = req.slug
    if not computed_slug:
        computed_slug = f"org-{user.id[:8]}-{int(pd.Timestamp.now().timestamp())}"
    else:
        computed_slug = re.sub(r"[^a-zA-Z0-9\-]", "-", computed_slug.strip().lower())

    # Ensure uniqueness of organization slug
    existing = db.query(OrganizationModel).filter(OrganizationModel.slug == computed_slug).first()
    if existing:
        computed_slug = f"{computed_slug}-{generate_uuid()[:6]}"

    new_org = OrganizationModel(
        id=generate_uuid(),
        name=req.name.strip(),
        slug=computed_slug,
    )
    db.add(new_org)
    db.flush()

    membership = OrganizationMemberModel(
        id=generate_uuid(),
        organization_id=new_org.id,
        user_id=user.id,
        role="owner",
    )
    db.add(membership)

    # Seed default menu items for the new canteen
    for key, item in MENU_ITEMS.items():
        db_item = MenuItemModel(
            organization_id=new_org.id,
            name=item.name,
            category=item.category,
            cost_price=item.cost_per_portion,
            selling_price=item.selling_price,
            prep_time_min=30,
            prep_batch_size=item.prep_batch_size,
            shelf_life_hours=item.shelf_life_hours,
            base_demand=item.base_demand,
            active=True,
        )
        db.add(db_item)

    db.commit()

    return {
        "status": "success",
        "organization": {
            "id": new_org.id,
            "name": new_org.name,
            "slug": new_org.slug,
            "role": "owner",
        },
    }


def _resolve_context(user: Any, org: Any):
    """Fallback only when endpoint functions are called directly in unit tests."""
    if not isinstance(user, UserIdentity):
        user = UserIdentity(id="00000000-0000-0000-0000-000000000000", email="test@wastewise.local")
    if not isinstance(org, OrgContext):
        org = OrgContext(organization_id=DEFAULT_ORG_ID, role="owner")
    return user, org


@app.get("/api/overview")
def get_overview(
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
    return reporting_service.get_overview(
        engine=tenant_state.engine,
        dataset_df=tenant_state.dataset_df,
        is_synthetic=tenant_state.is_synthetic,
        organization_id=org.organization_id,
    )


@app.post("/api/forecast")
def predict_forecast(
    req: ForecastScenarioRequest,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
    return forecasting_service.predict_scenario(
        engine=tenant_state.engine,
        dataset_df=tenant_state.dataset_df,
        menu_item=req.menu_item,
        day_of_week=req.day_of_week,
        attendance_index=req.attendance_index,
        campus_event=req.campus_event,
        weather=req.weather,
        target_service=req.target_service,
        organization_id=org.organization_id,
        user_id=user.id,
    )


@app.get("/api/forecast/history")
def get_forecast_history(
    limit: int = 50,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    return forecasting_service.get_forecast_history(
        organization_id=org.organization_id,
        limit=limit,
    )


@app.post("/api/plan")
def create_preparation_plan(
    req: PreparationPlanRequest,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
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
        organization_id=org.organization_id,
        user_id=user.id,
    )


@app.get("/api/plan/history")
def get_plan_history(
    limit: int = 50,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    return planning_service.get_recent_plans(
        organization_id=org.organization_id,
        limit=limit,
    )


@app.get("/api/waste-risk")
def get_waste_risks(
    risk_tier: Optional[str] = None,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
    return rescue_service.get_waste_risks(
        engine=tenant_state.engine,
        dataset_df=tenant_state.dataset_df,
        risk_tier=risk_tier,
        organization_id=org.organization_id,
    )


@app.get("/api/performance")
def get_performance(
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
    return reporting_service.get_performance(engine=tenant_state.engine)


@app.get("/api/monitoring/drift")
def get_monitoring_drift():
    """Compare the training period with the holdout period using Evidently."""
    if state.engine.test_records_df is None:
        raise HTTPException(status_code=503, detail="Model evaluation data is not available.")
    try:
        from evidently import Report
        from evidently.presets import DataDriftPreset

        reference = state.dataset_df.drop(columns=["portions_sold"], errors="ignore")
        current = state.engine.test_records_df.drop(
            columns=["portions_sold", "lower_bound", "upper_bound", "ml_pred", "baseline_pred"],
            errors="ignore",
        )
        report = Report(metrics=[DataDriftPreset()])
        snapshot = report.run(current_data=current, reference_data=reference)
        return snapshot.dict()
    except ImportError as error:
        sentry_sdk.capture_exception(error)
        raise HTTPException(status_code=503, detail="Evidently monitoring is not installed.") from error


@app.post("/api/outcomes")
def record_outcome(
    req: ActualOutcomeRequest,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
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
        organization_id=org.organization_id,
        user_id=user.id,
    )


@app.get("/api/outcomes")
def get_outcomes(
    service_date: Optional[str] = None,
    menu_item: Optional[str] = None,
    limit: int = 100,
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    return reporting_service.get_outcomes(
        service_date=service_date,
        menu_item=menu_item,
        organization_id=org.organization_id,
        limit=limit,
    )


@app.get("/api/data")
def get_data_info(
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    tenant_state = org_state_registry.get_state(org.organization_id)
    df = tenant_state.dataset_df
    last_upload = None
    with get_db_context() as db:
        last_upload = (
            db.query(UploadHistoryModel)
            .filter(UploadHistoryModel.organization_id == org.organization_id)
            .order_by(UploadHistoryModel.timestamp.desc())
            .first()
        )
    return {
        "is_synthetic": tenant_state.is_synthetic,
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
async def upload_csv(
    file: UploadFile = File(...),
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    content = await file.read()
    clean_df, engine, issues = await ingestion_service.process_and_train_csv(
        file_bytes=content,
        filename=file.filename or "upload.csv",
        organization_id=org.organization_id,
        user_id=user.id,
    )

    return {
        "status": "success",
        "message": f"Successfully ingested {len(clean_df)} records across {len(clean_df['date'].unique())} service days.",
        "records": len(clean_df),
        "warnings": issues,
    }


@app.post("/api/data/reset")
def reset_to_demo_data(
    user: Any = Depends(get_current_user),
    org: Any = Depends(require_tenant_context),
):
    user, org = _resolve_context(user, org)
    org_state_registry.reset_tenant_state(org.organization_id)
    return {
        "status": "success",
        "message": "Reset to default 180-day demonstration dataset.",
    }


# Serve the production frontend from the same origin as the API.
if FRONTEND_DIST_DIR.is_dir():
    @app.get("/", include_in_schema=False)
    def serve_frontend() -> FileResponse:
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR), name="static")
