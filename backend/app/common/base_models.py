from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.common.mongo import PyObjectId


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RecordStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class MongoBaseModel(BaseModel):
    """Base for documents stored in Mongo: adds `_id` <-> `id` mapping."""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class ScopeKeys(BaseModel):
    """Hierarchy scope carried by every business record for tenant-by-hierarchy filtering."""

    group_id: PyObjectId
    institution_id: PyObjectId | None = None
    campus_id: PyObjectId | None = None
    department_id: PyObjectId | None = None


class AuditFields(BaseModel):
    created_at: datetime = Field(default_factory=utcnow)
    created_by: PyObjectId | None = None
    updated_at: datetime = Field(default_factory=utcnow)
    updated_by: PyObjectId | None = None


class EffectiveDating(BaseModel):
    effective_from: datetime = Field(default_factory=utcnow)
    effective_to: datetime | None = None
