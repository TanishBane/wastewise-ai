"""
WasteWise AI - SQLAlchemy Database Models
Durable storage for Organizations, Memberships, User Profiles, Menu Items,
Upload Ingestion History, Forecast Runs, Preparation Plans, and Actual Service Outcomes.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
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
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class UserProfileModel(Base):
    """User profile synced with Supabase auth.users."""
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True)  # auth.users UUID
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class OrganizationMemberModel(Base):
    """Associates users with organizations under strict RBAC."""
    __tablename__ = "organization_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    role = Column(String(20), default="member", nullable=False)  # 'owner' | 'admin' | 'member'
    created_at = Column(DateTime, default=utc_now)


class MenuItemModel(Base):
    """Catalog of operational canteen dishes scoped to an organization."""
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(36), index=True, default=DEFAULT_ORG_ID)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    cost_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    prep_time_min = Column(Integer, default=30)
    prep_batch_size = Column(Integer, default=20)
    shelf_life_hours = Column(Float, default=4.0)
    base_demand = Column(Float, default=50.0)
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class UploadHistoryModel(Base):
    """Provenance and audit log of ingested service datasets."""
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(36), index=True, default=DEFAULT_ORG_ID)
    user_id = Column(String(36), index=True, nullable=True)
    filename = Column(String(255), nullable=False)
    checksum = Column(String(64), nullable=False, index=True)
    row_count = Column(Integer, nullable=False)
    service_days = Column(Integer, default=0)
    validation_warnings_json = Column(Text, default="[]")
    timestamp = Column(DateTime, default=utc_now, index=True)
    source = Column(String(30), default="operator")  # 'synthetic' | 'operator'
    is_active = Column(Boolean, default=True)


class ForecastRunModel(Base):
    """Execution log of scenario forecasts and model predictions."""
    __tablename__ = "forecast_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(36), index=True, default=DEFAULT_ORG_ID)
    user_id = Column(String(36), index=True, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    menu_item = Column(String(100), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False)
    attendance_index = Column(Float, nullable=False)
    is_event = Column(Integer, nullable=False)
    weather = Column(String(50), nullable=False)
    target_service = Column(String(50), default="Lunch")
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    weekday_baseline = Column(Float, default=0.0)
    model_version = Column(String(50), default="1.0-rf")
    feature_contributions_json = Column(Text, default="{}")


class PreparationPlanModel(Base):
    """Operational batch recommendations generated for canteen kitchens."""
    __tablename__ = "preparation_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(36), index=True, default=DEFAULT_ORG_ID)
    user_id = Column(String(36), index=True, nullable=True)
    service_date = Column(String(20), nullable=False, index=True)
    target_meal = Column(String(50), default="Lunch")
    menu_item = Column(String(100), nullable=False, index=True)
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    current_stock = Column(Integer, default=0)
    critical_ratio = Column(Float, default=0.55)
    recommended_total_plan = Column(Integer, nullable=False)
    recommended_initial_batch = Column(Integer, nullable=False)
    refill_trigger_threshold = Column(Integer, default=0)
    wastewise_expected_cost = Column(Float, default=0.0)
    current_policy_expected_cost = Column(Float, default=0.0)
    net_cost_avoided = Column(Float, default=0.0)
    status = Column(String(30), default="recommended")  # 'recommended' | 'accepted' | 'overridden' | 'completed'
    created_at = Column(DateTime, default=utc_now, index=True)


class ActualOutcomeModel(Base):
    """Measured operational outcomes recorded by canteen operators post-service."""
    __tablename__ = "actual_outcomes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(36), index=True, default=DEFAULT_ORG_ID)
    user_id = Column(String(36), index=True, nullable=True)
    service_date = Column(String(20), nullable=False, index=True)
    target_meal = Column(String(50), default="Lunch")
    menu_item = Column(String(100), nullable=False, index=True)
    portions_prepared = Column(Integer, nullable=False)
    portions_sold = Column(Integer, nullable=False)
    portions_leftover = Column(Integer, nullable=False)
    waste_cause = Column(String(100), default="Over-preparation")
    discarded_kg = Column(Float, default=0.0)
    donation_kg = Column(Float, default=0.0)
    waste_cost = Column(Float, default=0.0)
    notes = Column(Text, default="")
    recorded_at = Column(DateTime, default=utc_now, index=True)
