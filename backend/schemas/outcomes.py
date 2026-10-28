"""
Pydantic Schemas for Actual Kitchen Outcome Recording
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActualOutcomeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    service_date: str = Field(..., min_length=8, max_length=20)
    target_meal: str = Field(default="Lunch", max_length=50)
    menu_item: str = Field(..., min_length=1, max_length=100)
    portions_prepared: int = Field(ge=0)
    portions_sold: int = Field(ge=0)
    portions_leftover: int = Field(ge=0)
    waste_cause: Optional[str] = Field(default="Over-preparation", max_length=100)
    discarded_kg: float = Field(default=0.0, ge=0)
    donation_kg: float = Field(default=0.0, ge=0)
    waste_cost: float = Field(default=0.0, ge=0)
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def quantities_match_service(self):
        if self.portions_sold + self.portions_leftover != self.portions_prepared:
            raise ValueError("Prepared portions must equal portions sold plus portions leftover.")
        return self
