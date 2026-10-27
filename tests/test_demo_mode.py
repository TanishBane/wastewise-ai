"""
WasteWise AI - Demo-Only Architecture & Security Regression Tests
Validates that:
1. Public demonstration endpoints operate cleanly with zero authentication tokens.
2. Missing Supabase credentials/environment variables do not break the demo.
3. Strict tenant isolation rejects unauthorized cross-organization access attempts.
4. Protected administrative endpoints fail closed.
5. Interactive OpenAPI/Swagger documentation is disabled in public demo mode.
6. Frontend source code contains no active Supabase, auth dialogs, or backend diagnostics.
"""

import os
from pathlib import Path
import re
import pytest
from fastapi.testclient import TestClient

from backend.auth import GUEST_USER_ID
from backend.models import DEFAULT_ORG_ID
from backend.main import app

client = TestClient(app)


def test_demo_public_endpoints_accessible_without_auth():
    """All core operational endpoints function without any Authorization header."""
    # 1. Health
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "healthy"
    assert data_health["demo_mode"] is True

    # 2. Config
    res_config = client.get("/api/config")
    assert res_config.status_code == 200
    data_config = res_config.json()
    assert len(data_config["menu_items"]) > 0
    assert "Pav Bhaji" in data_config["menu_item_names"]

    # 3. Overview
    res_overview = client.get("/api/overview")
    assert res_overview.status_code == 200
    data_overview = res_overview.json()
    assert "service_date" in data_overview
    assert len(data_overview["item_details"]) > 0
    assert data_overview["is_synthetic"] is True

    # 4. Forecast
    forecast_payload = {
        "menu_item": "Pav Bhaji",
        "day_of_week": "Monday",
        "attendance_index": 1.0,
        "campus_event": 0,
        "weather": "Sunny / Mild",
        "target_service": "Lunch",
    }
    res_forecast = client.post("/api/forecast", json=forecast_payload)
    assert res_forecast.status_code == 200
    data_forecast = res_forecast.json()
    assert data_forecast["predicted_demand"] > 0
    assert data_forecast["lower_bound"] <= data_forecast["predicted_demand"] <= data_forecast["upper_bound"]

    # 5. Plan
    plan_payload = {
        "menu_item": "Pav Bhaji",
        "predicted_demand": data_forecast["predicted_demand"],
        "lower_bound": data_forecast["lower_bound"],
        "upper_bound": data_forecast["upper_bound"],
        "service_level_preference": 0.55,
    }
    res_plan = client.post("/api/plan", json=plan_payload)
    assert res_plan.status_code == 200
    data_plan = res_plan.json()
    assert data_plan["recommended_total_plan"] > 0
    assert data_plan["recommended_initial_batch"] > 0

    # 6. Waste Rescue
    res_rescue = client.get("/api/waste-risk")
    assert res_rescue.status_code == 200
    assert "items" in res_rescue.json()
    assert "summary" in res_rescue.json()

    # 7. Performance
    res_perf = client.get("/api/performance")
    assert res_perf.status_code == 200
    assert "simulation" in res_perf.json()

    # 8. Data Info
    res_data = client.get("/api/data")
    assert res_data.status_code == 200
    assert res_data.json()["total_records"] > 0


def test_demo_mode_tenant_isolation_and_forgery_rejection():
    """
    Anonymous users cannot access or forge arbitrary tenant organizations.
    Any attempt to pass an unauthenticated X-Organization-Id other than DEFAULT_ORG_ID
    must fail closed with 401 Unauthorized.
    """
    fake_org_id = "e9999999-9999-9999-9999-999999999999"

    # Attempt overview with forged tenant ID
    res_overview = client.get("/api/overview", headers={"X-Organization-Id": fake_org_id})
    assert res_overview.status_code == 401
    assert "Authentication required to access organization" in res_overview.json()["detail"]
    assert fake_org_id in res_overview.json()["detail"]

    # Attempt forecast with forged tenant ID
    res_forecast = client.post(
        "/api/forecast",
        json={"menu_item": "Pav Bhaji", "day_of_week": "Monday"},
        headers={"X-Organization-Id": fake_org_id},
    )
    assert res_forecast.status_code == 401

    # Attempt plan with forged tenant ID
    res_plan = client.post(
        "/api/plan",
        json={"menu_item": "Pav Bhaji", "predicted_demand": 50, "lower_bound": 40, "upper_bound": 60},
        headers={"X-Organization-Id": fake_org_id},
    )
    assert res_plan.status_code == 401

    # Attempt data info with forged tenant ID
    res_data = client.get("/api/data", headers={"X-Organization-Id": fake_org_id})
    assert res_data.status_code == 401

    # Explicit default demo org passes normally
    res_default = client.get("/api/overview", headers={"X-Organization-Id": DEFAULT_ORG_ID})
    assert res_default.status_code == 200


def test_protected_endpoints_fail_closed_without_token():
    """Administrative endpoints require a verified token and reject anonymous callers."""
    # /api/auth/me rejects unauthenticated callers
    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 401

    # /api/auth/organizations rejects unauthenticated callers
    res_orgs = client.get("/api/auth/organizations")
    assert res_orgs.status_code == 401

    # POST /api/auth/organizations rejects unauthenticated callers
    res_create_org = client.post("/api/auth/organizations", json={"name": "Attacker Org"})
    assert res_create_org.status_code == 401


def test_docs_and_swagger_disabled_in_public_demo():
    """In public demo mode, /docs, /redoc, and /openapi.json are disabled."""
    res_docs = client.get("/docs")
    assert res_docs.status_code == 404

    res_redoc = client.get("/redoc")
    assert res_redoc.status_code == 404

    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 404


def test_no_supabase_env_vars_needed(monkeypatch):
    """Confirm demo endpoints work even if all Supabase environment variables are absent."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.delenv("SUPABASE_DB_URL", raising=False)
    monkeypatch.delenv("VITE_SUPABASE_URL", raising=False)
    monkeypatch.delenv("VITE_SUPABASE_ANON_KEY", raising=False)

    res_health = client.get("/api/health")
    assert res_health.status_code == 200

    res_overview = client.get("/api/overview")
    assert res_overview.status_code == 200


def test_frontend_source_code_clean_of_auth_and_backend_pages():
    """Static inspection of frontend/src to verify no remaining auth or backend diagnostics UI."""
    frontend_src = Path(__file__).resolve().parent.parent / "frontend" / "src"

    banned_terms = [
        "useAuth",
        "AuthModal",
        "AuthContext",
        "@supabase/supabase-js",
        "createClient",
        "BackendApi",
    ]

    for tsx_file in frontend_src.rglob("*.tsx"):
        content = tsx_file.read_text(encoding="utf-8")
        for term in banned_terms:
            assert term not in content, f"Found banned auth/backend term '{term}' in {tsx_file.name}"

    for ts_file in frontend_src.rglob("*.ts"):
        content = ts_file.read_text(encoding="utf-8")
        for term in banned_terms:
            assert term not in content, f"Found banned auth/backend term '{term}' in {ts_file.name}"

    # Verify no 'backend-api' navigation entries or rendered views
    app_content = (frontend_src / "App.tsx").read_text(encoding="utf-8")
    assert 'id: "backend-api"' not in app_content
    assert "<BackendApi" not in app_content
    assert "Sign In" not in app_content
    assert "Sign Out" not in app_content

    sidebar_content = (frontend_src / "Sidebar.tsx").read_text(encoding="utf-8")
    assert 'id: "backend-api"' not in sidebar_content
    assert "Sign In" not in sidebar_content
    assert "Sign Out" not in sidebar_content
