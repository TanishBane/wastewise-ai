"""
WasteWise AI - Supabase Authentication & Multi-Tenant Authorization
Enforces fail-closed token verification, cryptographic signature checks,
audience/issuer validation, algorithm pinning, and strict tenant membership controls.
"""

import os
import time
from typing import Dict, List, Optional
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db, set_session_user

# Environment configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_AUTH_ALGORITHM = os.environ.get("SUPABASE_AUTH_ALGORITHM", "HS256").upper()
AUTH_REQUIRED = os.environ.get("AUTH_REQUIRED", "true").lower() in ("true", "1", "yes")
WASTEWISE_DEMO_MODE = os.environ.get("WASTEWISE_DEMO_MODE", "true").lower() in ("true", "1", "yes")

# Test signing secret for pytest and automated test suites
TEST_AUTH_SECRET = os.environ.get(
    "TEST_AUTH_SECRET",
    "wastewise-test-secret-key-64chars-minimum-for-sha512-compliance!!",
)


def is_test_environment() -> bool:
    """Detects whether code is executing under pytest or automated test runner."""
    return bool(os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("WASTEWISE_ENV") == "test")


# PyJWKClient cache for asymmetric RS256 verification
_jwks_client: Optional[jwt.PyJWKClient] = None

if SUPABASE_AUTH_ALGORITHM == "RS256" and SUPABASE_URL:
    try:
        _jwks_client = jwt.PyJWKClient(
            f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json",
            cache_keys=True,
            max_cached_keys=16,
        )
    except Exception:
        _jwks_client = None

security_scheme = HTTPBearer(auto_error=False)


class UserIdentity(BaseModel):
    """Verified identity derived exclusively from cryptographically checked Supabase JWT claims."""
    id: str
    email: str
    role: str = "authenticated"
    app_metadata: Dict = {}
    user_metadata: Dict = {}


class OrgContext(BaseModel):
    """Verified tenant authorization context bound to the authenticated user."""
    organization_id: str
    role: str = "member"


def get_token_verification_key(token: str, expected_alg: str):
    """
    Retrieves the appropriate verification key based on algorithm configuration.
    Fails closed if keys are unconfigured, invalid, or mismatched.
    """
    if expected_alg == "RS256":
        if not _jwks_client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWKS verification client is not configured for RS256.",
            )
        try:
            signing_key = _jwks_client.get_signing_key_from_jwt(token)
            return signing_key.key
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unable to resolve asymmetric key ID (kid): {exc}",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

    elif expected_alg == "HS256":
        secret = SUPABASE_JWT_SECRET
        if not secret and is_test_environment():
            secret = TEST_AUTH_SECRET

        if not secret:
            # Fail closed: reject request if signing secret is missing
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication signing secret is unconfigured. Requests fail closed.",
            )
        return secret

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported token verification algorithm: {expected_alg}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_and_verify_token(token: str) -> Dict:
    """
    Decodes and cryptographically verifies a Supabase JWT access token.
    - Fails closed if keys are missing
    - Pins allowed algorithm to prevent 'alg: none' and header algorithm confusion attacks
    - Enforces expiration, subject claim, and expected issuer/audience
    """
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Inspect unverified header to verify algorithm matches pinned server configuration
    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format or header: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    token_alg = header.get("alg")
    if not token_alg or token_alg.lower() == "none":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsigned tokens ('alg: none') are strictly rejected.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected_alg = SUPABASE_AUTH_ALGORITHM
    if token_alg != expected_alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token algorithm '{token_alg}' does not match expected '{expected_alg}'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Retrieve verification key (fails closed if unconfigured)
    key = get_token_verification_key(token, expected_alg)

    # 3. Cryptographically verify signature and standard claims
    options = {
        "verify_signature": True,
        "verify_exp": True,
        "verify_aud": False,  # checked explicitly below
        "require": ["exp", "sub"],
    }

    try:
        payload = jwt.decode(
            token,
            key=key,
            algorithms=[expected_alg],
            options=options,
            issuer=f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else None,
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired. Please refresh session.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    # 4. Verify audience claim if present
    aud = payload.get("aud")
    if not aud or aud not in ("authenticated", "anon"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token audience '{aud}' is not valid for this service.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 5. Verify non-empty subject claim
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str) or len(sub.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing a valid 'sub' subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> UserIdentity:
    """
    Dependency requiring a valid Supabase authenticated user.
    Returns 401 Unauthorized if token is missing, invalid, or expired.
    Fails closed: no permissive anonymous defaults.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_and_verify_token(credentials.credentials)
    return UserIdentity(
        id=payload["sub"],
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
        app_metadata=payload.get("app_metadata", {}),
        user_metadata=payload.get("user_metadata", {}),
    )


GUEST_USER_ID = "00000000-0000-0000-0000-000000000000"
GUEST_USER = UserIdentity(
    id=GUEST_USER_ID,
    email="guest@wastewise.local",
    role="anon",
    app_metadata={"provider": "demo"},
    user_metadata={"full_name": "Demo Operator"},
)


async def get_current_user_or_demo(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> UserIdentity:
    """
    Returns verified UserIdentity if credentials provided.
    If no Authorization header or empty token, returns GUEST_USER for public demo canteen.
    If token is invalid, expired, or tampered, FAILS CLOSED with 401.
    """
    if (
        not credentials
        or not credentials.credentials
        or credentials.credentials in ("null", "undefined")
    ):
        return GUEST_USER

    payload = decode_and_verify_token(credentials.credentials)
    return UserIdentity(
        id=payload["sub"],
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
        app_metadata=payload.get("app_metadata", {}),
        user_metadata=payload.get("user_metadata", {}),
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Optional[UserIdentity]:
    """Optional authentication dependency for public endpoints."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_and_verify_token(credentials.credentials)
        return UserIdentity(
            id=payload["sub"],
            email=payload.get("email", ""),
            role=payload.get("role", "authenticated"),
            app_metadata=payload.get("app_metadata", {}),
            user_metadata=payload.get("user_metadata", {}),
        )
    except Exception:
        return None


async def require_tenant_context(
    user: UserIdentity = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    db: Session = Depends(get_db),
) -> OrgContext:
    """
    Enforces multi-tenant authorization.
    Verifies that the authenticated user is a verified member of the requested organization.
    Configures PostgreSQL transaction-scoped RLS claims for user session.
    Returns 403 Forbidden on cross-organization access attempts.
    """
    from backend import models

    # Set request-scoped PostgreSQL identity claim for RLS
    set_session_user(db, user_id=user.id, role=user.role)

    target_org_id = x_organization_id

    if target_org_id:
        membership = (
            db.query(models.OrganizationMemberModel)
            .filter(
                models.OrganizationMemberModel.organization_id == target_org_id,
                models.OrganizationMemberModel.user_id == user.id,
            )
            .first()
        )

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You do not have membership in organization '{target_org_id}'.",
            )

        return OrgContext(
            organization_id=target_org_id,
            role=membership.role,
        )

    # No header provided: look up user's active organization membership
    membership = (
        db.query(models.OrganizationMemberModel)
        .filter(models.OrganizationMemberModel.user_id == user.id)
        .first()
    )

    if membership:
        return OrgContext(
            organization_id=membership.organization_id,
            role=membership.role,
        )

    # In local testing or demo seed, check if demo membership exists
    demo_membership = (
        db.query(models.OrganizationMemberModel)
        .filter(
            models.OrganizationMemberModel.organization_id == models.DEFAULT_ORG_ID,
            models.OrganizationMemberModel.user_id == user.id,
        )
        .first()
    )
    if demo_membership:
        return OrgContext(
            organization_id=models.DEFAULT_ORG_ID,
            role=demo_membership.role,
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: You do not belong to any organization. Please join or create an organization.",
    )

async def require_tenant_context_or_demo(
    user: UserIdentity = Depends(get_current_user_or_demo),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    db: Session = Depends(get_db),
) -> OrgContext:
    """
    Enforces tenant context for operations.
    Allows unauthenticated guest users to access the default demo canteen (DEFAULT_ORG_ID).
    Rejects unauthenticated attempts to access private organizations with 401.
    Strictly verifies organization membership for authenticated users.
    """
    from backend import models

    if user.id == GUEST_USER_ID:
        if not x_organization_id or x_organization_id == models.DEFAULT_ORG_ID:
            return OrgContext(
                organization_id=models.DEFAULT_ORG_ID,
                role="viewer",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication required to access organization '{x_organization_id}'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await require_tenant_context(
        user=user, x_organization_id=x_organization_id, db=db
    )
