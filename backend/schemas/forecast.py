"""
Pydantic Schemas for Demand Forecasting Endpoints
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ForecastScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    menu_item: str = Field(..., min_length=1, max_length=100)
    day_of_week: str = Field(..., min_length=3, max_length=20)
    attendance_index: float = Field(default=1.0, ge=0.1, le=1.8)
    campus_event: int = Field(default=0, ge=0, le=1)
    weather: str = Field(default="Sunny / Mild", max_length=50)
    target_service: str = Field(default="Lunch", max_length=50)


class FeatureContributionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    feature: str
    importance_pct: float


class TrajectoryPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: str
    actual_sold: int
    is_holdout: bool


class ForecastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    menu_item: str
    predicted_demand: int
    lower_bound: int
    upper_bound: int
    weekday_baseline: int
    confidence_level: float
    model_name: str
    gross_value_inr: int
    feature_contributions: List[FeatureContributionItem]
    trajectory: List[TrajectoryPoint]
