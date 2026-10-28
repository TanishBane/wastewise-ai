"""
WasteWise AI - Pydantic Request & Response Schemas
Provides strictly typed, validated data boundaries for FastAPI endpoints.
Configured with extra="forbid" and from_attributes=True per Pydantic v2 engineering best practices.
"""

from backend.schemas.forecast import ForecastScenarioRequest
from backend.schemas.planner import PreparationPlanRequest
from backend.schemas.outcomes import ActualOutcomeRequest
from backend.schemas.organization import CreateOrganizationRequest

__all__ = [
    "ForecastScenarioRequest",
    "PreparationPlanRequest",
    "ActualOutcomeRequest",
    "CreateOrganizationRequest",
]
