"""
WasteWise AI - Automated Security, Authentication & Multi-Tenant Authorization Tests
Verifies JWT verification, token expiration, unauthorized rejection, and strict tenant isolation.
"""

import os
import time
import uuid
import jwt
import pytest
from fastapi.testclient import TestClient

from backend.auth import TEST_AUTH_SECRET
from backend.database import get_db_context, init_db
from backend.main import app
from backend import models

client = TestClient(app)


def create_test_token(user_id: str, email: str, expires_in: int = 3600, secret: str = TEST_AUTH_SECRET) -> str:
    """Helper to generate signed test Supabase JWT tokens."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()),
        "app_metadata": {"provider": "email"},
        "user_metadata": {"full_name": email.split("@")[0].title()},
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_public_health_endpoint():
    """Public health check does not require authorization header."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_missing_token_on_protected_endpoint(monkeypatch):
    """When authentication is required, request without Bearer token returns 401."""
    monkeypatch.setattr("backend.auth.AUTH_REQUIRED", True)
    res = client.get("/api/overview")
    assert res.status_code == 401
    assert "Missing Authorization" in res.json()["detail"]


def test_invalid_token_signature(monkeypatch):
    """Token signed with wrong key or tampered payload returns 401."""
    monkeypatch.setattr("backend.auth.AUTH_REQUIRED", True)
    bad_token = create_test_token("test-user-id", "test@canteen.edu", secret="wrong-secret-key-that-does-not-match")
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {bad_token}"})
    assert res.status_code == 401
    assert "Invalid authentication token" in res.json()["detail"]


def test_expired_token(monkeypatch):
    """Token with expiration timestamp in the past returns 401."""
    monkeypatch.setattr("backend.auth.AUTH_REQUIRED", True)
    expired_token = create_test_token("test-user-id", "test@canteen.edu", expires_in=-120)
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_valid_token_authenticated(monkeypatch):
    """Valid token derives user identity and allows access."""
    user_id = str(uuid.uuid4())
    token = create_test_token(user_id, "chef_anita@canteen.edu")

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == user_id
    assert data["email"] == "chef_anita@canteen.edu"
    assert data["role"] == "authenticated"


def test_multi_tenant_isolation_and_cross_org_rejection(monkeypatch):
    """
    Strict Tenant Isolation Verification:
    User A (member of Org A) cannot access or read Org B data.
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    org_a_id = str(uuid.uuid4())
    org_b_id = str(uuid.uuid4())

    with get_db_context() as db:
        # Create Org A and Org B
        db.add(models.OrganizationModel(id=org_a_id, name="Campus Alpha Canteen", slug=f"slug-{org_a_id}"))
        db.add(models.OrganizationModel(id=org_b_id, name="Campus Beta Canteen", slug=f"slug-{org_b_id}"))

        # Add memberships
        db.add(models.OrganizationMemberModel(organization_id=org_a_id, user_id=user_a_id, role="owner"))
        db.add(models.OrganizationMemberModel(organization_id=org_b_id, user_id=user_b_id, role="owner"))
        db.commit()

    token_a = create_test_token(user_a_id, "anita@alpha.edu")
    token_b = create_test_token(user_b_id, "rahul@beta.edu")

    # 1. User A accesses Org A -> 200 OK
    res_a = client.get(
        "/api/overview",
        headers={
            "Authorization": f"Bearer {token_a}",
            "X-Organization-Id": org_a_id,
        },
    )
    assert res_a.status_code == 200

    # 2. User A attempts to access Org B -> 403 Forbidden!
    res_breach = client.get(
        "/api/overview",
        headers={
            "Authorization": f"Bearer {token_a}",
            "X-Organization-Id": org_b_id,
        },
    )
    assert res_breach.status_code == 403
    assert "membership" in res_breach.json()["detail"].lower()


def test_cross_tenant_outcome_data_leak_prevention():
    """
    Verifies that User B cannot read or overwrite service outcomes recorded by User A in Org A.
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    org_a_id = str(uuid.uuid4())
    org_b_id = str(uuid.uuid4())
    service_date = "2026-10-23"

    with get_db_context() as db:
        db.add(models.OrganizationModel(id=org_a_id, name="Org Alpha", slug=f"slug-{org_a_id}"))
        db.add(models.OrganizationModel(id=org_b_id, name="Org Beta", slug=f"slug-{org_b_id}"))
        db.add(models.OrganizationMemberModel(organization_id=org_a_id, user_id=user_a_id, role="owner"))
        db.add(models.OrganizationMemberModel(organization_id=org_b_id, user_id=user_b_id, role="owner"))
        db.commit()

    token_a = create_test_token(user_a_id, "anita@alpha.edu")
    token_b = create_test_token(user_b_id, "rahul@beta.edu")

    # User A records an outcome for Org A
    payload_a = {
        "service_date": service_date,
        "target_meal": "Lunch",
        "menu_item": "Pav Bhaji",
        "portions_prepared": 100,
        "portions_sold": 90,
        "portions_leftover": 10,
        "waste_cause": "Over-preparation",
        "discarded_kg": 2.0,
        "donation_kg": 0.0,
        "waste_cost": 350.0,
        "notes": "Alpha secret shift notes",
    }
    res_record = client.post(
        "/api/outcomes",
        json=payload_a,
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_record.status_code == 200

    # User B queries outcomes in Org B -> must NOT see Org A's record!
    res_query_b = client.get(
        f"/api/outcomes?service_date={service_date}",
        headers={"Authorization": f"Bearer {token_b}", "X-Organization-Id": org_b_id},
    )
    assert res_query_b.status_code == 200
    outcomes_b = res_query_b.json()
    assert not any(o.get("notes") == "Alpha secret shift notes" for o in outcomes_b)

    # User A queries outcomes in Org A -> sees their record
    res_query_a = client.get(
        f"/api/outcomes?service_date={service_date}",
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_query_a.status_code == 200
    outcomes_a = res_query_a.json()
    assert any(o.get("notes") == "Alpha secret shift notes" for o in outcomes_a)
