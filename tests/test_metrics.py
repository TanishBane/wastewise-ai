"""
Unit tests for waste risk classification and simulation impact calculation.
"""

import numpy as np
import pytest
from src.data import generate_synthetic_canteen_data
from src.metrics import classify_waste_risks, simulate_holdout_impact


def test_classify_waste_risks():
    forecasts = {
        "Pav Bhaji": 60.0,
        "Veg Thali": 90.0,
    }
    planned = {
        "Pav Bhaji": 90,  # 30 portion surplus -> High risk
        "Veg Thali": 92,  # 2 portion surplus -> Low risk
    }
    actions = classify_waste_risks(forecasts, planned)
    assert len(actions) == 2
    
    # Pav Bhaji should be classified as High risk with highest cost at risk
    pb_action = next(a for a in actions if a.menu_item == "Pav Bhaji")
    assert pb_action.risk_level == "High"
    assert pb_action.potential_surplus_portions == 30
    assert "Pull back" in pb_action.primary_action or "Staggered" in pb_action.action_type
    assert "Food Safety Alert" in pb_action.safety_advisory


def test_simulate_holdout_impact():
    df = generate_synthetic_canteen_data(num_days=30, random_seed=42)
    # Mock ML predictions
    preds = df["portions_sold"].values + np.random.normal(0, 3, size=len(df))
    
    summary = simulate_holdout_impact(df, preds)
    assert summary.total_portions_prepared_baseline > 0
    assert summary.total_portions_prepared_wastewise > 0
    assert summary.estimated_ingredient_cost_avoided >= 0.0
    assert summary.estimated_co2e_avoided_kg >= 0.0
    assert "Simulation Methodology" in summary.methodology_note


def test_simulation_replays_planner_and_uses_baseline_waste():
    import pandas as pd
    from src.planner import PreparationPlanner
    df = pd.DataFrame([dict(menu_item="Pav Bhaji", portions_sold=60,
        latent_demand=60, portions_prepared=100, cost_per_portion=20,
        lower_bound=55, upper_bound=65)])
    plan = PreparationPlanner().generate_plan("Pav Bhaji", 60, 55, 65, service_level_preference=0.55)
    summary = simulate_holdout_impact(df, np.array([60.0]))
    assert summary.total_portions_prepared_wastewise == plan.recommended_total_plan
    expected = (40 - max(0, plan.recommended_total_plan - 60)) / 40 * 100
    assert summary.waste_reduction_pct == round(expected, 1)
    df["portions_prepared"] = 60
    zero = simulate_holdout_impact(df, np.array([60.0]))
    assert zero.waste_reduction_pct == 0
