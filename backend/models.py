"""
WasteWise AI - SQLAlchemy Database Models
Durable storage for Organizations, Memberships, User Profiles, Menu Items,
Upload Ingestion History, Forecast Runs, Preparation Plans, and Actual Service Outcomes.
Reconciled with PostgreSQL UUID schema contract while maintaining SQLite local compatibility.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"


class OrganizationModel(Base):
    """Tenant representing a distinct canteen or dining hall operation."""
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class UserProfileModel(Base):
    """User profile synced with Supabase auth.users."""
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True)  # auth.users UUID
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class OrganizationMemberModel(Base):
    """Associates users with organizations under strict RBAC."""
    __tablename__ = "organization_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(String(36), nullable=False, index=True)
    role = Column(String(20), default="member", nullable=False)  # 'owner' | 'admin' | 'member'
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )


class MenuItemModel(Base):
    """Catalog of operational canteen dishes scoped to an organization."""
    __tablename__ = "menu_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=DEFAULT_ORG_ID,
    )
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    cost_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    prep_time_min = Column(Integer, default=30, nullable=False)
    prep_batch_size = Column(Integer, default=20, nullable=False)
    shelf_life_hours = Column(Float, default=4.0, nullable=False)
    base_demand = Column(Float, default=50.0, nullable=False)
    active = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_org_menu_item"),
    )


class UploadHistoryModel(Base):
    """Provenance and audit log of ingested service datasets."""
    __tablename__ = "upload_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=DEFAULT_ORG_ID,
    )
    user_id = Column(String(36), index=True, nullable=True)
    filename = Column(String(255), nullable=False)
    checksum = Column(String(64), nullable=False, index=True)
    row_count = Column(Integer, nullable=False)
    service_days = Column(Integer, default=0, nullable=False)
    validation_warnings_json = Column(Text, default="[]", nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    source = Column(String(30), default="operator", nullable=False)  # 'synthetic' | 'operator'
    is_active = Column(Boolean, default=True, nullable=False)


class ForecastRunModel(Base):
    """Execution log of scenario forecasts and model predictions."""
    __tablename__ = "forecast_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=DEFAULT_ORG_ID,
    )
    user_id = Column(String(36), index=True, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    menu_item = Column(String(100), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False)
    attendance_index = Column(Float, nullable=False)
    is_event = Column(Integer, nullable=False)
    weather = Column(String(50), nullable=False)
    target_service = Column(String(50), default="Lunch", nullable=False)
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    weekday_baseline = Column(Float, default=0.0, nullable=False)
    model_version = Column(String(50), default="1.0-rf", nullable=False)
    feature_contributions_json = Column(Text, default="{}", nullable=False)


class PreparationPlanModel(Base):
    """Operational batch recommendations generated for canteen kitchens."""
    __tablename__ = "preparation_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=DEFAULT_ORG_ID,
    )
    user_id = Column(String(36), index=True, nullable=True)
    service_date = Column(String(20), nullable=False, index=True)
    target_meal = Column(String(50), default="Lunch", nullable=False)
    menu_item = Column(String(100), nullable=False, index=True)
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    critical_ratio = Column(Float, default=0.55, nullable=False)
    recommended_total_plan = Column(Integer, nullable=False)
    recommended_initial_batch = Column(Integer, nullable=False)
    refill_trigger_threshold = Column(Integer, default=0, nullable=False)
    wastewise_expected_cost = Column(Float, default=0.0, nullable=False)
    current_policy_expected_cost = Column(Float, default=0.0, nullable=False)
    net_cost_avoided = Column(Float, default=0.0, nullable=False)
    status = Column(String(30), default="recommended", nullable=False)  # 'recommended' | 'accepted' | 'overridden' | 'completed'
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)


class ActualOutcomeModel(Base):
    """Measured operational outcomes recorded by canteen operators post-service."""
    __tablename__ = "actual_outcomes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=DEFAULT_ORG_ID,
    )
    user_id = Column(String(36), index=True, nullable=True)
    service_date = Column(String(20), nullable=False, index=True)
    target_meal = Column(String(50), default="Lunch", nullable=False)
    menu_item = Column(String(100), nullable=False, index=True)
    portions_prepared = Column(Integer, nullable=False)
    portions_sold = Column(Integer, nullable=False)
    portions_leftover = Column(Integer, nullable=False)
    waste_cause = Column(String(100), default="Over-preparation", nullable=False)
    discarded_kg = Column(Float, default=0.0, nullable=False)
    donation_kg = Column(Float, default=0.0, nullable=False)
    waste_cost = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, default="", nullable=True)
    recorded_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "portions_prepared >= 0 AND portions_sold >= 0 AND portions_leftover >= 0",
            name="check_portions_positive",
        ),
        CheckConstraint(
            "portions_prepared = portions_sold + portions_leftover",
            name="check_portions_invariant",
        ),
    )
