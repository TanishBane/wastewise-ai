"""
WasteWise AI - Perfect 10 Verification Suite
Verifies:
1. MenuCatalogRepository dynamic tenant catalog resolution and fallback mechanics.
2. DemandForecastingEngine joblib serialization/deserialization (save and load).
3. RateLimiter token bucket behavior and 429 Too Many Requests response.
4. Zero-division resilience in holdout simulation with empty/zero inputs.
5. Pydantic v2 extra='forbid' schema protection against unexpected field injection.
"""

import os
import tempfile
import pytest
import numpy as np
import pandas as pd
from fastapi import HTTPException
from pydantic import ValidationError

from backend.database import get_db_context, init_db
from backend.models import MenuItemModel, OrganizationModel, DEFAULT_ORG_ID, generate_uuid
from backend.rate_limit import SlidingWindowRateLimiter
from backend.repositories.menu_catalog_repository import MenuCatalogRepository
from backend.schemas.forecast import ForecastScenarioRequest
from backend.schemas.planner import PreparationPlanRequest
from backend.schemas.outcomes import ActualOutcomeRequest
from src.data import get_demonstration_data
from src.metrics import simulate_holdout_impact
from src.model import DemandForecastingEngine


def test_menu_catalog_repository_database_lookup():
    """Confirms that custom tenant catalog items override default config."""
    init_db()
    test_org_id = generate_uuid()
    
    with get_db_context() as db:
        org = OrganizationModel(
            id=test_org_id,
            name="Test Gourmet Kitchen",
            slug=f"gourmet-{test_org_id[:6]}",
        )
        db.add(org)
        db.flush()

        custom_item = MenuItemModel(
            id=generate_uuid(),
            organization_id=test_org_id,
            name="Special Gourmet Biryani",
            category="Main",
            cost_price=85.0,
            selling_price=160.0,
            prep_batch_size=25,
            shelf_life_hours=5.0,
            base_demand=75,
            active=True,
        )
        db.add(custom_item)
        db.commit()

    # Query repository for custom organization
    item = MenuCatalogRepository.get_item("Special Gourmet Biryani", organization_id=test_org_id)
    assert item is not None
    assert item.cost_price == 85.0
    assert item.selling_price == 160.0
    assert item.is_custom is True

    # Unknown item in default organization falls back gracefully
    fallback_item = MenuCatalogRepository.get_item("Unknown Mystery Dish", organization_id=test_org_id)
    assert fallback_item is not None
    assert fallback_item.cost_price == 40.0
    assert fallback_item.selling_price == 60.0


def test_model_serialization_save_and_load(tmp_path):
    """Verifies that trained Random Forest models can be serialized to disk and loaded identically."""
    df = get_demonstration_data().head(60)
    engine = DemandForecastingEngine(n_estimators=10, random_state=42)
    engine.train_and_evaluate(df, holdout_days=7)

    # Make reference prediction before saving
    pred_before = engine.predict_scenario(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.0,
        campus_event=0,
        weather="Sunny / Mild",
    )

    save_path = tmp_path / "test_rf_model.joblib"
    engine.save(save_path)
    assert save_path.exists()
    assert save_path.stat().st_size > 0

    # Load into fresh engine
    loaded_engine = DemandForecastingEngine.load(save_path)
    assert loaded_engine.is_trained is True
    assert loaded_engine.train_split_date == engine.train_split_date

    pred_after = loaded_engine.predict_scenario(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.0,
        campus_event=0,
        weather="Sunny / Mild",
    )

    assert pred_before.predicted_demand == pred_after.predicted_demand
    assert pred_before.lower_bound == pred_after.lower_bound
    assert pred_before.upper_bound == pred_after.upper_bound


def test_sliding_window_rate_limiter():
    """Verifies that rate limiter enforces maximum requests per window."""
    limiter = SlidingWindowRateLimiter(requests_per_minute=3)
    key = "test_client_ip"

    # First 3 requests should pass
    limiter.check(key)
    limiter.check(key)
    limiter.check(key)

    # 4th request must trigger HTTP 429
    with pytest.raises(HTTPException) as exc_info:
        limiter.check(key)

    assert exc_info.value.status_code == 429
    assert "Retry-After" in exc_info.value.headers
    assert "Rate limit exceeded" in exc_info.value.detail


def test_zero_row_holdout_simulation_resilience():
    """Ensures simulate_holdout_impact handles edge cases with zero division guard."""
    df = pd.DataFrame(columns=["date", "menu_item", "portions_sold", "cost_per_portion"])
    preds = np.array([])
    
    summary = simulate_holdout_impact(test_df=df, ml_preds=preds)
    assert summary.stockout_rate_wastewise == 0.0
    assert summary.stockout_rate_baseline == 0.0
    assert summary.waste_reduction_pct == 0.0


def test_pydantic_schema_extra_fields_forbidden():
    """Ensures input validation strictly rejects unrecognized injected properties."""
    with pytest.raises(ValidationError):
        ForecastScenarioRequest(
            menu_item="Pav Bhaji",
            day_of_week="Monday",
            attendance_index=1.0,
            campus_event=0,
            weather="Sunny / Mild",
            injected_malicious_field="unexpected",  # Should trigger ValidationError
        )

    with pytest.raises(ValidationError):
        PreparationPlanRequest(
            menu_item="Pav Bhaji",
            predicted_demand=50,
            lower_bound=40,
            upper_bound=60,
            unknown_parameter=True,  # Should trigger ValidationError
        )
