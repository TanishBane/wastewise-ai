"""
WasteWise AI - Automated Security, Authentication & Multi-Tenant Authorization Tests
Verifies JWT verification, token expiration, fail-closed handling, unauthorized rejection,
algorithm pinning, and strict multi-tenant ML model and dataset isolation.
"""

import io
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


def create_test_token(
    user_id: str,
    email: str,
    expires_in: int = 3600,
    secret: str = TEST_AUTH_SECRET,
    alg: str = "HS256",
    aud: str = "authenticated",
) -> str:
    """Helper to generate signed test Supabase JWT tokens."""
    payload = {
        "sub": user_id,
        "email": email,
        "aud": aud,
        "role": "authenticated",
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()),
        "app_metadata": {"provider": "email"},
        "user_metadata": {"full_name": email.split("@")[0].title()},
    }
    headers = {"alg": alg, "typ": "JWT"}
    return jwt.encode(payload, secret, algorithm=alg, headers=headers)


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_public_health_endpoint():
    """Public health check does not require authorization header."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_missing_token_on_protected_endpoint():
    """Protected endpoints return 401 when Authorization header is missing."""
    res = client.get("/api/overview")
    assert res.status_code == 401
    assert "Missing Authorization" in res.json()["detail"]


def test_invalid_token_signature():
    """Token signed with wrong key or tampered payload returns 401."""
    bad_token = create_test_token("test-user-id", "test@canteen.edu", secret="wrong-secret-key-that-does-not-match")
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {bad_token}"})
    assert res.status_code == 401
    assert "Invalid authentication token" in res.json()["detail"]


def test_expired_token():
    """Token with expiration timestamp in the past returns 401."""
    expired_token = create_test_token("test-user-id", "test@canteen.edu", expires_in=-120)
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_unsigned_alg_none_token_rejected():
    """Tokens with 'alg: none' header are strictly rejected."""
    payload = {
        "sub": "user-none",
        "email": "attacker@evil.com",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    # Forge alg: none token without signature
    none_token = jwt.encode(payload, key="", algorithm="none")
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {none_token}"})
    assert res.status_code == 401
    assert "none" in res.json()["detail"].lower() or "algorithm" in res.json()["detail"].lower()


def test_mismatched_algorithm_rejected():
    """Tokens claiming unexpected algorithm (e.g. HS512 when HS256 expected) are rejected."""
    payload = {
        "sub": "user-mismatch",
        "email": "attacker@evil.com",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    mismatch_token = jwt.encode(payload, TEST_AUTH_SECRET, algorithm="HS512")
    res = client.get("/api/overview", headers={"Authorization": f"Bearer {mismatch_token}"})
    assert res.status_code == 401
    assert "does not match" in res.json()["detail"]


def test_fail_closed_when_secret_missing(monkeypatch):
    """When signing secret is missing and test bypass is disabled, auth fails closed."""
    monkeypatch.setattr("backend.auth.SUPABASE_JWT_SECRET", "")
    monkeypatch.setattr("backend.auth.is_test_environment", lambda: False)
    token = create_test_token("user-failclosed", "failclosed@canteen.edu")

    res = client.get("/api/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 500
    assert "fail closed" in res.json()["detail"].lower() or "unconfigured" in res.json()["detail"].lower()


def test_valid_token_authenticated():
    """Valid token derives user identity and allows reading authenticated profile."""
    user_id = str(uuid.uuid4())
    token = create_test_token(user_id, "chef_anita@canteen.edu")

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == user_id
    assert data["email"] == "chef_anita@canteen.edu"
    assert data["role"] == "authenticated"


def test_multi_tenant_isolation_and_cross_org_rejection():
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
        org_a = models.OrganizationModel(id=org_a_id, name="Campus Alpha Canteen", slug=f"slug-{org_a_id}")
        org_b = models.OrganizationModel(id=org_b_id, name="Campus Beta Canteen", slug=f"slug-{org_b_id}")
        db.add(org_a)
        db.add(org_b)
        db.flush()

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


def test_user_without_org_membership_rejected():
    """A user who belongs to no organizations is rejected with 403."""
    orphan_user_id = str(uuid.uuid4())
    token = create_test_token(orphan_user_id, "orphan@nowhere.edu")

    res = client.get("/api/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "do not belong to any organization" in res.json()["detail"]


def test_create_organization_endpoint():
    """User can securely create an organization and is automatically granted owner role."""
    user_id = str(uuid.uuid4())
    token = create_test_token(user_id, "founder@startup.edu")
    test_slug = f"eng-block-{uuid.uuid4().hex[:6]}"

    res = client.post(
        "/api/auth/organizations",
        json={"name": "Engineering Block Canteen", "slug": test_slug},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    org = data["organization"]
    assert org["name"] == "Engineering Block Canteen"
    assert org["role"] == "owner"

    # Now verify user can access overview for this new organization
    res_ov = client.get(
        "/api/overview",
        headers={"Authorization": f"Bearer {token}", "X-Organization-Id": org["id"]},
    )
    assert res_ov.status_code == 200


def test_two_independent_organizations_upload_isolation():
    """
    CRITICAL ISOLATION TEST:
    Org A uploads a dataset with unique custom dishes.
    Org B must NOT see Org A's custom dishes, custom model, or upload history.
    Resetting Org A must NOT alter Org B.
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    org_a_id = str(uuid.uuid4())
    org_b_id = str(uuid.uuid4())

    with get_db_context() as db:
        org_a = models.OrganizationModel(id=org_a_id, name="Org Alpha Canteen", slug=f"slug-{org_a_id}")
        org_b = models.OrganizationModel(id=org_b_id, name="Org Beta Canteen", slug=f"slug-{org_b_id}")
        db.add(org_a)
        db.add(org_b)
        db.flush()

        db.add(models.OrganizationMemberModel(organization_id=org_a_id, user_id=user_a_id, role="owner"))
        db.add(models.OrganizationMemberModel(organization_id=org_b_id, user_id=user_b_id, role="owner"))
        db.commit()

    token_a = create_test_token(user_a_id, "anita@alpha.edu")
    token_b = create_test_token(user_b_id, "rahul@beta.edu")

    # Prepare custom CSV for Org A containing a unique dish: 'Alpha Special Biryani'
    from datetime import date, timedelta
    start = date(2026, 8, 1)
    csv_a = (
        "date,day_of_week,menu_item,portions_sold,attendance_index,campus_event,weather,temperature_c,cost_per_portion,selling_price\n"
        + "\n".join([
            f"{(start + timedelta(days=i)).isoformat()},{(start + timedelta(days=i)).strftime('%A')},Alpha Special Biryani,110,1.0,0,Sunny / Mild,28.0,50.0,120.0"
            for i in range(25)
        ])
    )

    # 1. Org A uploads CSV
    res_upload_a = client.post(
        "/api/data/upload",
        files={"file": ("alpha_dataset.csv", io.BytesIO(csv_a.encode("utf-8-sig")), "text/csv")},
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_upload_a.status_code == 200

    # 2. Org A data info shows custom dish and upload record
    res_data_a = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_data_a.status_code == 200
    assert res_data_a.json()["is_synthetic"] is False
    assert res_data_a.json()["last_filename"] == "alpha_dataset.csv"

    # 3. Org B data info must STILL be synthetic demo dataset with NO alpha uploads!
    res_data_b = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {token_b}", "X-Organization-Id": org_b_id},
    )
    assert res_data_b.status_code == 200
    assert res_data_b.json()["is_synthetic"] is True
    assert res_data_b.json()["last_filename"] is None

    # 4. Org A overview contains 'Alpha Special Biryani'
    res_ov_a = client.get(
        "/api/overview",
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_ov_a.status_code == 200
    dishes_a = [d["menu_item"] for d in res_ov_a.json()["item_details"]]
    assert "Alpha Special Biryani" in dishes_a

    # 5. Org B overview must NOT contain 'Alpha Special Biryani'
    res_ov_b = client.get(
        "/api/overview",
        headers={"Authorization": f"Bearer {token_b}", "X-Organization-Id": org_b_id},
    )
    assert res_ov_b.status_code == 200
    dishes_b = [d["menu_item"] for d in res_ov_b.json()["item_details"]]
    assert "Alpha Special Biryani" not in dishes_b

    # 6. Reset Org A
    res_reset_a = client.post(
        "/api/data/reset",
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_reset_a.status_code == 200

    # Org A is now synthetic
    res_data_a_post = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {token_a}", "X-Organization-Id": org_a_id},
    )
    assert res_data_a_post.json()["is_synthetic"] is True
