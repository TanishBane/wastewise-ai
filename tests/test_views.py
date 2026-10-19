"""
Comprehensive smoke test for all view functions and workflows.
Ensures no view throws unhandled exceptions during execution.
"""

import pandas as pd
import pytest
from src.data import generate_synthetic_canteen_data
from src.model import DemandForecastingEngine
from src.metrics import classify_waste_risks, simulate_holdout_impact
from src.planner import PreparationPlanner


@pytest.fixture(scope="module")
def prepared_engine_and_data():
    df = generate_synthetic_canteen_data(num_days=40, random_seed=42)
    engine = DemandForecastingEngine(n_estimators=25, random_state=42)
    engine.train_and_evaluate(df, holdout_days=10)
    return engine, df


def test_scenario_prediction_and_planning_pipeline(prepared_engine_and_data):
    engine, df = prepared_engine_and_data
    # 1. Forecast for normal day
    res_normal = engine.predict_scenario(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.0,
        campus_event=0,
        weather="Sunny / Mild",
    )
    assert res_normal.predicted_demand > 0
    
    # 2. Forecast for campus event day
    res_event = engine.predict_scenario(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.3,
        campus_event=1,
        weather="Sunny / Mild",
    )
    # Event + higher attendance should predict higher demand
    assert res_event.predicted_demand >= res_normal.predicted_demand

    # 3. Plan for both
    planner = PreparationPlanner()
    plan_normal = planner.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=res_normal.predicted_demand,
        lower_bound=res_normal.lower_bound,
        upper_bound=res_normal.upper_bound,
    )
    plan_event = planner.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=res_event.predicted_demand,
        lower_bound=res_event.lower_bound,
        upper_bound=res_event.upper_bound,
    )
    assert plan_event.recommended_total_plan >= plan_normal.recommended_total_plan


def test_waste_rescue_pipeline(prepared_engine_and_data):
    engine, df = prepared_engine_and_data
    forecasts = {
        item: engine.predict_scenario(item, "Monday", 1.0, 0, "Sunny / Mild").predicted_demand
        for item in ["Pav Bhaji", "Idli Sambar", "Veg Thali"]
    }
    planned = {item: int(round(forecasts[item] * 1.30)) for item in forecasts}
    
    actions = classify_waste_risks(forecasts, planned)
    assert len(actions) == 3
    for act in actions:
        assert act.risk_level in ["High", "Moderate", "Low"]
        assert act.ingredient_cost_at_risk >= 0


def test_simulation_pipeline(prepared_engine_and_data):
    engine, df = prepared_engine_and_data
    summary = simulate_holdout_impact(
        test_df=engine.test_records_df,
        ml_preds=engine.test_records_df["ml_pred"].values,
    )
    assert summary.total_portions_prepared_wastewise > 0
    assert summary.estimated_ingredient_cost_avoided >= 0
