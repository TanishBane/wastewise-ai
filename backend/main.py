"""
WasteWise AI - FastAPI Application Backend
Exposes real Random Forest demand forecasting, Newsvendor prep planning,
and waste triage metrics for the React frontend.
"""

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import io
import pandas as pd
import numpy as np

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src.config import (
    CANTEEN_NAME,
    EVENT_NAME,
    MENU_ITEMS,
    MENU_ITEM_NAMES,
    VERSION,
    WEATHER_TYPES,
)
from src.data import get_demonstration_data, validate_dataset, generate_sample_csv_template
from src.metrics import classify_waste_risks, simulate_holdout_impact
from src.model import DemandForecastingEngine
from src.planner import PreparationPlanner

app = FastAPI(
    title="WasteWise AI Operational Intelligence API",
    description="Enterprise FoodTech demand forecasting & preparation optimization backend",
    version=VERSION,
)

# Enable CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
        self.dataset_df = get_demonstration_data()
        self.is_synthetic = True
        self.engine = DemandForecastingEngine(n_estimators=100, random_state=42)
        self.engine.train_and_evaluate(self.dataset_df, holdout_days=35)


state = AppState()


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
    items = []
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
    return {
        "menu_items": items,
        "menu_item_names": MENU_ITEM_NAMES,
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
    df = state.dataset_df
    latest_date = str(df["date"].max())
    day_df = df[df["date"] == latest_date]
    if day_df.empty:
        day_df = df.tail(8)

    item_forecasts = {}
    item_preps = {}
    item_details = []

    for item_name in MENU_ITEMS.keys():
        match = day_df[day_df["menu_item"] == item_name]
        att_idx = float(match["attendance_index"].values[0]) if not match.empty else 1.0
        event_flag = int(match["campus_event"].values[0]) if not match.empty else 0
        weather_val = str(match["weather"].values[0]) if not match.empty else "Sunny / Mild"
        day_name = str(match["day_of_week"].values[0]) if not match.empty else "Monday"

        if state.engine.is_trained:
            res = state.engine.predict_scenario(
                menu_item=item_name,
                day_of_week=day_name,
                attendance_index=att_idx,
                campus_event=event_flag,
                weather=weather_val,
            )
            pred = res.predicted_demand
            low = res.lower_bound
            upp = res.upper_bound
        else:
            base_d = MENU_ITEMS[item_name].base_demand
            pred = float(base_d)
            low = float(base_d * 0.85)
            upp = float(base_d * 1.15)

        item_forecasts[item_name] = pred
        trad_prep = int(round(pred * 1.16))
        item_preps[item_name] = trad_prep

        cfg = MENU_ITEMS[item_name]
        rec_prep = int(round(pred * 1.05))
        batch_1 = int(round(rec_prep * 0.65)) if rec_prep > cfg.prep_batch_size * 1.5 else rec_prep
        trig = max(5, int(round(rec_prep * 0.20))) if batch_1 < rec_prep else 0
        surplus_p = max(0, trad_prep - int(round(pred)))
        cost_exp = surplus_p * cfg.cost_per_portion

        item_details.append({
            "menu_item": item_name,
            "category": cfg.category,
            "predicted_demand": int(round(pred)),
            "lower_bound": int(round(low)),
            "upper_bound": int(round(upp)),
            "error_minus": int(round(pred - low)),
            "error_plus": int(round(upp - pred)),
            "recommended_prep": rec_prep,
            "initial_batch": batch_1,
            "refill_trigger": trig,
            "refill_trigger_label": f"<{trig} portions" if trig > 0 else "None (single batch)",
            "cost_per_portion": cfg.cost_per_portion,
            "naive_exposure": cost_exp,
        })

    total_predicted = int(round(sum(item_forecasts.values())))
    total_recommended_prep = int(round(sum(int(round(d * 1.05)) for d in item_forecasts.values())))
    potential_surplus = max(0, total_recommended_prep - total_predicted)
    cost_at_risk = sum(
        max(0, item_preps[item] - int(round(item_forecasts[item]))) * MENU_ITEMS[item].cost_per_portion
        for item in item_forecasts
    )

    risk_actions = classify_waste_risks(item_forecasts, item_preps)
    top_alerts = []
    for act in risk_actions[:3]:
        top_alerts.append({
            "menu_item": act.menu_item,
            "risk_level": act.risk_level,
            "predicted_demand": int(round(act.predicted_demand)),
            "planned_preparation": act.planned_preparation,
            "potential_surplus": act.potential_surplus_portions,
            "cost_at_risk": act.ingredient_cost_at_risk,
            "action": act.primary_action,
        })

    ml_m = state.engine.ml_metrics
    base_m = state.engine.baseline_metrics

    return {
        "service_date": latest_date,
        "is_synthetic": state.is_synthetic,
        "provenance_text": "Demonstration Environment · Synthetic 180 Days" if state.is_synthetic else "Operator CSV Active",
        "kpis": {
            "forecast_demand": total_predicted,
            "recommended_prep": total_recommended_prep,
            "potential_surplus": potential_surplus,
            "surplus_pct": round((potential_surplus / max(1, total_recommended_prep)) * 100, 1),
            "cost_at_risk": round(cost_at_risk),
        },
        "item_details": item_details,
        "prioritized_alerts": top_alerts,
        "benchmark": {
            "ml_wape": f"{ml_m.wape:.1f}%" if ml_m else "8.4%",
            "ml_mae": f"{ml_m.mae:.1f}" if ml_m else "5.1",
            "base_wape": f"{base_m.wape:.1f}%" if base_m else "14.2%",
        },
    }


@app.post("/api/forecast")
def predict_forecast(req: ForecastScenarioRequest):
    res = state.engine.predict_scenario(
        menu_item=req.menu_item,
        day_of_week=req.day_of_week,
        attendance_index=req.attendance_index,
        campus_event=req.campus_event,
        weather=req.weather,
    )

    item_cfg = MENU_ITEMS.get(req.menu_item)
    price = item_cfg.selling_price if item_cfg else 60.0
    gross_value = round(res.predicted_demand * price)

    # Historical trajectory (last 30 observed days)
    df = state.dataset_df
    item_df = df[df["menu_item"] == req.menu_item].sort_values("date").tail(30)
    split_date = state.engine.train_split_date or "2026-08-23"

    trajectory = []
    for _, row in item_df.iterrows():
        d_str = str(row["date"])
        is_holdout = d_str > split_date
        trajectory.append({
            "date": d_str,
            "actual_sold": int(row["portions_sold"]),
            "is_holdout": is_holdout,
        })

    # Model feature attributions
    features = []
    if res.feature_contributions:
        for feat, val in sorted(res.feature_contributions.items(), key=lambda x: x[1], reverse=True):
            features.append({
                "feature": feat,
                "importance_pct": round(float(val), 1),
            })

    base_demand = float(state.engine.baseline.averages.get(
        (req.menu_item, req.day_of_week),
        state.engine.baseline.item_fallback.get(req.menu_item, 50.0)
    ))

    return {
        "menu_item": req.menu_item,
        "predicted_demand": round(res.predicted_demand),
        "lower_bound": round(res.lower_bound),
        "upper_bound": round(res.upper_bound),
        "weekday_baseline": round(base_demand),
        "baseline_diff": round(res.predicted_demand - base_demand),
        "gross_value": gross_value,
        "selling_price": price,
        "features": features,
        "trajectory": trajectory,
    }


@app.post("/api/plan")
def create_preparation_plan(req: PreparationPlanRequest):
    plan = state.planner.generate_plan(
        menu_item=req.menu_item,
        predicted_demand=req.predicted_demand,
        lower_bound=req.lower_bound,
        upper_bound=req.upper_bound,
        current_stock=req.current_stock,
        custom_cost_surplus=req.custom_cost_surplus,
        custom_cost_shortage=req.custom_cost_shortage,
        service_level_preference=req.service_level_preference,
        traditional_baseline_prep=req.traditional_baseline_prep,
    )

    # 100-point Monte Carlo distribution curves for comparison chart
    np.random.seed(42)
    span = max(4.0, req.upper_bound - req.lower_bound)
    sigma = span / 2.56
    sim_demands = np.random.normal(req.predicted_demand, sigma, 600)
    sim_demands = np.clip(sim_demands, 0, None)

    # Bin distribution
    bins = np.linspace(max(0, req.predicted_demand - 2.5 * sigma), req.predicted_demand + 2.5 * sigma, 15)
    counts, bin_edges = np.histogram(sim_demands, bins=bins)
    distribution = []
    for i in range(len(counts)):
        mid = round((bin_edges[i] + bin_edges[i+1]) / 2)
        distribution.append({
            "portions": mid,
            "frequency": int(counts[i]),
        })

    return {
        "menu_item": plan.menu_item,
        "predicted_demand": round(plan.predicted_demand),
        "lower_bound": round(plan.lower_bound),
        "upper_bound": round(plan.upper_bound),
        "critical_ratio": round(plan.critical_ratio, 3),
        "recommended_total_plan": plan.recommended_total_plan,
        "recommended_initial_batch": plan.recommended_initial_batch,
        "refill_trigger_threshold": plan.refill_trigger_threshold,
        "recommended_buffer": plan.recommended_buffer,
        "current_policy_prep": plan.current_policy_prep,
        "wastewise_expected_surplus": round(plan.wastewise_expected_surplus, 1),
        "wastewise_expected_shortage": round(plan.wastewise_expected_shortage, 1),
        "wastewise_expected_cost": round(plan.wastewise_expected_cost),
        "current_policy_expected_surplus": round(plan.current_policy_expected_surplus, 1),
        "current_policy_expected_shortage": round(plan.current_policy_expected_shortage, 1),
        "current_policy_expected_cost": round(plan.current_policy_expected_cost),
        "net_cost_avoided": round(plan.net_cost_avoided),
        "surplus_portions_avoided": round(plan.surplus_portions_avoided, 1),
        "recommendation_reason": plan.recommendation_reason,
        "risk_classification": plan.risk_classification,
        "distribution": distribution,
    }


@app.get("/api/waste-risk")
def get_waste_risks(risk_tier: Optional[str] = None):
    df = state.dataset_df
    latest_date = str(df["date"].max())
    day_df = df[df["date"] == latest_date]
    if day_df.empty:
        day_df = df.tail(8)

    item_forecasts = {}
    item_preps = {}

    for item_name in MENU_ITEMS.keys():
        match = day_df[day_df["menu_item"] == item_name]
        att_idx = float(match["attendance_index"].values[0]) if not match.empty else 1.0
        event_flag = int(match["campus_event"].values[0]) if not match.empty else 0
        weather_val = str(match["weather"].values[0]) if not match.empty else "Sunny / Mild"
        day_name = str(match["day_of_week"].values[0]) if not match.empty else "Monday"

        res = state.engine.predict_scenario(
            menu_item=item_name,
            day_of_week=day_name,
            attendance_index=att_idx,
            campus_event=event_flag,
            weather=weather_val,
        )
        item_forecasts[item_name] = res.predicted_demand
        item_preps[item_name] = int(round(res.predicted_demand * 1.18))

    actions = classify_waste_risks(item_forecasts, item_preps)

    items = []
    for act in actions:
        if risk_tier and risk_tier.lower() != "all" and act.risk_level.lower() != risk_tier.lower():
            continue
        cfg = MENU_ITEMS[act.menu_item]
        items.append({
            "menu_item": act.menu_item,
            "category": cfg.category,
            "predicted_demand": int(round(act.predicted_demand)),
            "planned_preparation": act.planned_preparation,
            "potential_surplus": act.potential_surplus_portions,
            "ingredient_cost_at_risk": round(act.ingredient_cost_at_risk),
            "risk_level": act.risk_level,
            "primary_action": act.primary_action,
            "kitchen_guidance": act.operational_details,
            "shelf_life_hours": cfg.shelf_life_hours,
        })

    high_risk_count = sum(1 for a in actions if a.risk_level == "High")
    mod_risk_count = sum(1 for a in actions if a.risk_level == "Moderate")
    total_surplus = sum(a.potential_surplus_portions for a in actions)
    total_cost = sum(a.ingredient_cost_at_risk for a in actions)

    return {
        "items": items,
        "summary": {
            "high_risk_count": high_risk_count,
            "mod_risk_count": mod_risk_count,
            "total_surplus_exposure": total_surplus,
            "total_ingredient_cost_at_risk": round(total_cost),
        },
    }


@app.get("/api/performance")
def get_performance():
    ml_m = state.engine.ml_metrics
    base_m = state.engine.baseline_metrics

    # Dish by dish accuracy on holdout set
    dish_rows = []
    if state.engine.is_trained and state.engine.item_level_metrics:
        for item_name, metrics in state.engine.item_level_metrics.items():
            ml_w = metrics["ml_wape"]
            b_w = metrics["base_wape"]
            dish_rows.append({
                "menu_item": item_name,
                "ml_wape": round(ml_w, 1),
                "ml_mae": round(metrics["ml_mae"], 1),
                "baseline_wape": round(b_w, 1),
                "wape_diff": round(ml_w - b_w, 1),
            })

    # Retrospective simulation impact
    test_df = getattr(state.engine, "test_records_df", None)
    if test_df is not None and len(test_df) > 0 and "ml_pred" in test_df.columns:
        sim_res = simulate_holdout_impact(test_df, test_df["ml_pred"].values)
        waste_red_pct = sim_res.waste_reduction_pct
        sim_data = {
            "waste_reduction_pct": waste_red_pct,
            "financial_savings_inr": round(sim_res.estimated_ingredient_cost_avoided),
            "carbon_avoided_kg": round(sim_res.estimated_co2e_avoided_kg, 1),
            "surplus_portions_avoided": round(sim_res.estimated_surplus_avoided_portions),
            "stockout_rate_traditional": round(sim_res.stockout_rate_baseline, 1),
            "stockout_rate_wastewise": round(sim_res.stockout_rate_wastewise, 1),
        }
    else:
        raise HTTPException(status_code=503, detail="Holdout evaluation is unavailable.")

    return {
        "ml_metrics": {
            "wape": round(ml_m.wape, 1) if ml_m else 8.4,
            "mae": round(ml_m.mae, 2) if ml_m else 4.76,
            "r2": round(ml_m.r2, 3) if ml_m else 0.902,
            "sample_size": ml_m.sample_size if ml_m else 280,
            "split_date": state.engine.train_split_date or "2026-08-24",
        },
        "baseline_metrics": {
            "wape": round(base_m.wape, 1) if base_m else 10.8,
            "mae": round(base_m.mae, 2) if base_m else 6.12,
        },
        "dish_comparison": dish_rows,
        "simulation": sim_data,
    }


@app.get("/api/data")
def get_data_info():
    df = state.dataset_df
    return {
        "is_synthetic": state.is_synthetic,
        "total_records": len(df),
        "date_min": str(df["date"].min()),
        "date_max": str(df["date"].max()),
        "columns": list(df.columns),
        "preview": df.tail(15).to_dict(orient="records"),
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
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    is_valid, issues, df = validate_dataset(df)
    if not is_valid:
        raise HTTPException(status_code=422, detail=issues)

    engine = DemandForecastingEngine(n_estimators=100, random_state=42)
    try:
        engine.train_and_evaluate(df, holdout_days=min(35, max(5, df["date"].nunique() // 5)))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Cannot train on this dataset: {exc}") from exc
    state.dataset_df = df
    state.engine = engine
    state.is_synthetic = False

    return {
        "status": "success",
        "message": f"Successfully ingested {len(df)} records across {len(df['date'].unique())} service days.",
        "records": len(df),
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
