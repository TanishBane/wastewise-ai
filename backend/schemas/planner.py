"""
Pydantic Schemas for Preparation Planning Endpoints
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class PreparationPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    menu_item: str = Field(..., min_length=1, max_length=100)
    predicted_demand: float = Field(gt=0)
    lower_bound: float = Field(ge=0)
    upper_bound: float = Field(ge=0)
    current_stock: int = Field(default=0, ge=0)
    custom_cost_surplus: Optional[float] = Field(default=None, ge=0)
    custom_cost_shortage: Optional[float] = Field(default=None, ge=0)
    service_level_preference: float = Field(default=0.55, ge=0.01, le=0.99)
    traditional_baseline_prep: Optional[int] = Field(default=None, ge=0)
    service_date: Optional[str] = Field(default=None, max_length=20)
    target_meal: str = Field(default="Lunch", max_length=50)

    @model_validator(mode="after")
    def validate_bounds(self):
        if self.lower_bound > self.upper_bound:
            raise ValueError("lower_bound cannot exceed upper_bound.")
        return self
