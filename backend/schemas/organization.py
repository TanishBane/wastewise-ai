"""
Pydantic Schemas for Multi-Tenant Organization Management
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateOrganizationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=100)


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    role: str
