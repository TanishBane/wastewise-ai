import asyncio
import io

import pandas as pd
import pytest
from fastapi import HTTPException, UploadFile
from backend import main as api


def test_template_upload_round_trip(monkeypatch):
    monkeypatch.setattr(api, "state", api.AppState())
    response = api.download_csv_template()
    df = pd.read_csv(io.BytesIO(response.body))
    assert df["date"].nunique() >= 14
    # Exercise column normalization and the optional temperature default.
    df = df.drop(columns=["temperature_c"])
    df.columns = [f" {col.upper()} " for col in df.columns]
    file = UploadFile(filename="history.csv", file=io.BytesIO(df.to_csv(index=False).encode()))
    result = asyncio.run(api.upload_csv(file))
    assert result["status"] == "success"
    assert result["warnings"]
    assert api.state.is_synthetic is False
    assert api.state.engine.is_trained
    assert "temperature_c" in api.state.dataset_df
    assert isinstance(api.get_performance()["simulation"]["waste_reduction_pct"], (int, float))


def test_invalid_upload_preserves_model():
    engine = api.state.engine
    file = UploadFile(filename="bad.csv", file=io.BytesIO(b"date,portions_sold\n2026-01-01,10\n"))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(api.upload_csv(file))
    assert exc.value.status_code == 422
    assert api.state.engine is engine


def test_outcome_requires_balanced_portions():
    with pytest.raises(ValueError, match="Prepared portions"):
        api.ActualOutcomeRequest(
            service_date="2026-10-22",
            menu_item="Pav Bhaji",
            portions_prepared=20,
            portions_sold=15,
            portions_leftover=4,
        )


def test_plan_rejects_lower_bound_greater_than_upper_bound():
    """Validates that lower_bound cannot exceed upper_bound in plan requests."""
    with pytest.raises(ValueError, match="lower_bound cannot exceed upper_bound"):
        api.PreparationPlanRequest(
            menu_item="Pav Bhaji",
            predicted_demand=50.0,
            lower_bound=60.0,
            upper_bound=40.0,
        )


def test_drift_monitoring_handles_uninstalled_evidently_gracefully():
    """Drift endpoint returns 503 without raising AttributeError when evidently is missing or sentry is uninstalled."""
    try:
        api.get_monitoring_drift()
    except HTTPException as exc:
        assert exc.status_code == 503


def test_upload_rejects_empty_file():
    """Upload endpoint rejects empty file with HTTP 400."""
    file = UploadFile(filename="empty.csv", file=io.BytesIO(b""))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(api.upload_csv(file))
    assert exc.value.status_code == 400


def test_upload_rejects_oversized_file():
    """Upload endpoint rejects files larger than 10MB with HTTP 413."""
    large_payload = b"a" * (11 * 1024 * 1024)
    file = UploadFile(filename="large.csv", file=io.BytesIO(large_payload))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(api.upload_csv(file))
    assert exc.value.status_code == 413


def test_token_missing_audience_rejected():
    """Tokens missing an audience claim are strictly rejected with 401."""
    from backend.auth import decode_and_verify_token
    from tests.test_auth import create_test_token

    token = create_test_token("user-test-id", "test@canteen.edu", aud="")
    with pytest.raises(HTTPException) as exc:
        decode_and_verify_token(token)
    assert exc.value.status_code == 401
    assert "audience" in exc.value.detail.lower()
