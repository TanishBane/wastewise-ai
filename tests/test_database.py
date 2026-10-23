"""
Unit and integration tests for SQLite durable persistence,
service layer interactions, and outcome recording.
"""

import asyncio
import io
from datetime import date, timedelta
import pytest
from fastapi import UploadFile
from backend import main as api
from backend.database import get_db_context, init_db
from backend.models import (
    ActualOutcomeModel,
    ForecastRunModel,
    MenuItemModel,
    PreparationPlanModel,
    UploadHistoryModel,
)
from src.data import DATA_DIR


def test_menu_catalog_persisted():
    with get_db_context() as db:
        items = db.query(MenuItemModel).all()
        assert len(items) >= 8
        pav = db.query(MenuItemModel).filter(MenuItemModel.name == "Pav Bhaji").first()
        assert pav is not None
        assert pav.cost_price == 35.0
        assert pav.selling_price == 75.0


def test_forecast_persists_to_database():
    initial_count = 0
    with get_db_context() as db:
        initial_count = db.query(ForecastRunModel).count()

    req = api.ForecastScenarioRequest(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.2,
        campus_event=1,
        weather="Sunny / Mild",
    )
    data = api.predict_forecast(req)
    assert data["predicted_demand"] > 0

    with get_db_context() as db:
        assert db.query(ForecastRunModel).count() == initial_count + 1
        last_run = db.query(ForecastRunModel).order_by(ForecastRunModel.timestamp.desc()).first()
        assert last_run.menu_item == "Pav Bhaji"
        assert last_run.attendance_index == 1.2
        assert last_run.is_event == 1


def test_preparation_plan_persists_to_database():
    initial_count = 0
    with get_db_context() as db:
        initial_count = db.query(PreparationPlanModel).count()

    req = api.PreparationPlanRequest(
        menu_item="Pav Bhaji",
        predicted_demand=160.0,
        lower_bound=140.0,
        upper_bound=180.0,
        current_stock=20,
    )
    data = api.create_preparation_plan(req)
    assert data["recommended_total_plan"] > 0

    with get_db_context() as db:
        assert db.query(PreparationPlanModel).count() == initial_count + 1
        last_plan = db.query(PreparationPlanModel).order_by(PreparationPlanModel.created_at.desc()).first()
        assert last_plan.menu_item == "Pav Bhaji"
        assert last_plan.current_stock == 20


def test_actual_outcome_recording_and_retrieval():
    req = api.ActualOutcomeRequest(
        service_date="2026-10-22",
        target_meal="Lunch",
        menu_item="Pav Bhaji",
        portions_prepared=150,
        portions_sold=142,
        portions_leftover=8,
        waste_cause="Over-preparation",
        discarded_kg=1.6,
        donation_kg=0.0,
        waste_cost=280.0,
        notes="Regular service, slight surplus donated to staff.",
    )
    res_data = api.record_outcome(req)
    assert res_data["status"] == "success"

    outcomes = api.get_outcomes(service_date="2026-10-22")
    assert any(o["menu_item"] == "Pav Bhaji" and o["portions_sold"] == 142 and o.get("waste_cause") == "Over-preparation" for o in outcomes)


def test_upload_persists_audit_and_syncs_catalog():
    start = date(2026, 8, 1)
    csv_data = (
        "date,day_of_week,menu_item,portions_sold,attendance_index,campus_event,weather,temperature_c,cost_per_portion,selling_price\n"
        + "\n".join([
            f"{(start + timedelta(days=i)).isoformat()},{(start + timedelta(days=i)).strftime('%A')},Special Paneer Tikka,120,1.0,0,Sunny / Mild,28.0,45.0,90.0"
            for i in range(24)
        ])
    )
    file = UploadFile(
        filename="paneer_service.csv",
        file=io.BytesIO(csv_data.encode("utf-8-sig")),
    )
    result = asyncio.run(api.upload_csv(file))
    assert result["status"] == "success"

    with get_db_context() as db:
        last_upload = db.query(UploadHistoryModel).filter(UploadHistoryModel.is_active == True).first()
        assert last_upload is not None
        assert last_upload.filename == "paneer_service.csv"
        assert last_upload.row_count == 24

        # Check newly discovered menu item added to catalog
        paneer = db.query(MenuItemModel).filter(MenuItemModel.name == "Special Paneer Tikka").first()
        assert paneer is not None
        assert paneer.active == True

    # The active validated upload is recoverable after a new application state
    # is constructed, rather than being only an in-memory frontend session.
    restarted_state = api.AppState()
    restarted_state.restore_persisted_dataset()
    assert restarted_state.is_synthetic is False
    assert "Special Paneer Tikka" in set(restarted_state.dataset_df["menu_item"])

    # Reset back to demo dataset
    api.reset_to_demo_data()
    # Keep the repository data directory clean after exercising restart recovery.
    active_path = DATA_DIR / "active_operator_dataset.csv"
    if active_path.exists():
        active_path.unlink()
