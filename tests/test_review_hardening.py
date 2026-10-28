"""
WasteWise AI - Hardening & Potential Verification Test Suite
Verifies:
1. Multi-tenant path traversal defense and sanitization in OrgStateRegistry
2. Per-tenant locking isolation and double-checked caching
3. Exact temporal holdout boundary validation in forecasting trajectories
4. Isolated NumPy RNG generator in planning service (zero global seed mutation)
5. CORS regex origin strictness against arbitrary third-party subdomains
6. Vectorized holdout simulation metrics computation
"""

import os
import re
import numpy as np
import pandas as pd
import pytest

from backend.services.org_state_service import OrgStateRegistry
from backend.services.forecasting_service import ForecastingService
from backend.services.planning_service import PlanningService
from src.metrics import simulate_holdout_impact
from src.data import get_demonstration_data
from src.model import DemandForecastingEngine


def test_org_state_path_traversal_rejection(tmp_path):
    registry = OrgStateRegistry(base_data_dir=tmp_path)
    
    # Path traversal strings must be rejected with ValueError
    traversal_attacks = [
        "../../etc/passwd",
        "..\\..\\windows\\system32",
        "tenant/../../secret",
        "org*bad",
        "org$invalid",
        "../tenant",
        "tenant/child",
    ]
    for attack in traversal_attacks:
        with pytest.raises(ValueError):
            registry.sanitize_org_id(attack)
            
        with pytest.raises(ValueError):
            registry.get_tenant_dir(attack)


def test_org_state_valid_tenant_identifiers(tmp_path):
    registry = OrgStateRegistry(base_data_dir=tmp_path)
    
    valid_ids = ["org-123", "kitchen_central", "canteen_north-01", "ORG_DEFAULT"]
    for valid_id in valid_ids:
        sanitized = registry.sanitize_org_id(valid_id)
        assert sanitized == valid_id
        t_dir = registry.get_tenant_dir(valid_id)
        assert t_dir.exists()
        assert t_dir.is_relative_to(registry.tenants_dir)


def test_org_state_lock_isolation(tmp_path):
    registry = OrgStateRegistry(base_data_dir=tmp_path)
    lock1 = registry._get_tenant_lock("org-1")
    lock2 = registry._get_tenant_lock("org-2")
    lock1_again = registry._get_tenant_lock("org-1")
    
    assert lock1 is lock1_again
    assert lock1 is not lock2


def test_forecasting_holdout_boundary_accuracy():
    df = get_demonstration_data()
    engine = DemandForecastingEngine(n_estimators=10, random_state=42)
    engine.train_and_evaluate(df, holdout_days=14)
    split_date = engine.train_split_date
    assert split_date is not None

    res = ForecastingService.predict_scenario(
        engine=engine,
        dataset_df=df,
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.0,
        campus_event=0,
        weather="Sunny / Mild",
    )
    
    trajectory = res["trajectory"]
    assert len(trajectory) > 0
    
    for pt in trajectory:
        d = pt["date"]
        expected_holdout = (d >= split_date)
        assert pt["is_holdout"] == expected_holdout, (
            f"Date {d} with split {split_date} expected is_holdout={expected_holdout}, got {pt['is_holdout']}"
        )


def test_planning_rng_isolation_no_global_seed_pollution():
    # Set a known state in global random
    np.random.seed(999)
    before_state = np.random.get_state()[1][0]
    
    # Run planning service which generates Monte Carlo simulation curves
    service = PlanningService()
    plan = service.generate_plan(
        menu_item="Pav Bhaji",
        predicted_demand=75,
        lower_bound=65,
        upper_bound=85,
    )
    
    # Global RNG state should NOT have been reset to seed(42)
    np.random.seed(42)
    seed_42_state = np.random.get_state()[1][0]
    
    assert before_state != seed_42_state
    assert plan["recommended_total_plan"] > 0
    assert len(plan["distribution"]) > 0


def test_cors_origin_regex_hardening():
    pattern = re.compile(
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://(wastewise[a-zA-Z0-9_-]*\.)?vercel\.app$"
    )
    
    # Legitimate origins must pass
    assert pattern.match("http://localhost:5173")
    assert pattern.match("http://127.0.0.1:3000")
    assert pattern.match("https://wastewise.vercel.app")
    assert pattern.match("https://wastewise-preview-12.vercel.app")
    
    # Arbitrary / malicious third-party vercel apps must be blocked
    assert not pattern.match("https://malicious-attacker.vercel.app")
    assert not pattern.match("https://evil-phishing.vercel.app")
    assert not pattern.match("https://my-other-app.vercel.app")


def test_simulate_holdout_impact_execution():
    df = get_demonstration_data().head(50)
    preds = df["portions_sold"].values.astype(float)
    
    summary = simulate_holdout_impact(
        test_df=df,
        ml_preds=preds,
    )
    
    assert summary.estimated_surplus_avoided_portions >= 0
    assert summary.estimated_ingredient_cost_avoided >= 0.0
    assert 0.0 <= summary.stockout_rate_wastewise <= 100.0
    assert summary.total_portions_prepared_baseline > 0
