from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ScopeType(str, Enum):
    GROUP = "group"
    INSTITUTION = "institution"
    CAMPUS = "campus"
    DEPARTMENT = "department"


class RoleCreate(BaseModel):
    name: str
    code: str = Field(pattern=r"^[a-z0-9_]+$")
    description: str = ""
    permissions: list[str] = Field(default_factory=list)
    scope_type: ScopeType = ScopeType.INSTITUTION


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None
    scope_type: ScopeType | None = None
    is_active: bool | None = None


class RoleOut(BaseModel):
    id: str
    name: str
    code: str
    description: str
    permissions: list[str]
    scope_type: ScopeType
    is_system_role: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
