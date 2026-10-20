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
