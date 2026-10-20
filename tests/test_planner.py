"""
Unit tests for preparation planning, critical fractile optimization, and batch allocation.
"""

import pytest
from src.planner import PreparationPlanner


def test_critical_ratio_calculation():
    planner = PreparationPlanner()
    # High shortage cost vs low surplus cost -> higher critical ratio (prefer slight over-prep)
    cr_high = planner.calculate_critical_ratio(cost_surplus=15.0, cost_shortage=80.0)
    # High surplus cost vs low shortage cost -> lower critical ratio (prefer conservative prep)
    cr_low = planner.calculate_critical_ratio(cost_surplus=80.0, cost_shortage=15.0)
    
    assert cr_high > cr_low
    assert 0.15 <= cr_high <= 0.95
    assert 0.15 <= cr_low <= 0.95


def test_generate_plan_outputs():
    planner = PreparationPlanner()
    plan = planner.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=72.0,
        lower_bound=64.0,
        upper_bound=80.0,
        current_stock=0,
        service_level_preference=0.50,
        traditional_baseline_prep=100,
    )
    
    assert plan.menu_item == "Pav Bhaji"
    assert plan.recommended_total_plan > 0
    assert plan.recommended_initial_batch <= plan.recommended_total_plan
    assert plan.refill_trigger_threshold >= 0
    assert plan.recommendation_reason != ""
    assert plan.risk_classification in ["Low", "Moderate", "High"]
    # Compare against traditional 100 prep policy:
    # 72 predicted vs 100 traditional -> traditional expected surplus should be higher!
    assert plan.current_policy_expected_surplus >= plan.wastewise_expected_surplus


def test_existing_stock_reduces_recommendation():
    planner = PreparationPlanner()
    plan_no_stock = planner.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=72.0,
        lower_bound=64.0,
        upper_bound=80.0,
        current_stock=0,
    )
    plan_with_stock = planner.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=72.0,
        lower_bound=64.0,
        upper_bound=80.0,
        current_stock=25,
    )
    
    assert plan_with_stock.recommended_total_plan < plan_no_stock.recommended_total_plan
    assert "Existing inventory" in plan_with_stock.recommendation_reason


def test_existing_stock_is_available_in_cost_simulation():
    plan = PreparationPlanner().generate_plan("Pav Bhaji", 100, 90, 110, current_stock=100)
    assert plan.recommended_total_plan == 0
    assert plan.wastewise_expected_shortage < 5
    assert plan.refill_trigger_threshold == 0


def test_partial_stock_preserves_available_supply():
    planner = PreparationPlanner()
    without = planner.generate_plan("Pav Bhaji", 100, 90, 110)
    stocked = planner.generate_plan("Pav Bhaji", 100, 90, 110, current_stock=25)
    assert stocked.wastewise_expected_shortage == without.wastewise_expected_shortage
    assert stocked.wastewise_expected_surplus == without.wastewise_expected_surplus
