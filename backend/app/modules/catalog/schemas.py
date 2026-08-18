from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ItemCategory(str, Enum):
    CONSUMABLE = "consumable"
    LAB_CHEMICAL = "lab_chemical"
    GLASSWARE = "glassware"
    STATIONERY = "stationery"
    ELECTRICAL = "electrical"
    IT_CONSUMABLE = "it_consumable"
    SPORTS = "sports"
    HOUSEKEEPING = "housekeeping"
    MEDICAL = "medical"
    FURNITURE = "furniture"
    CAPITAL = "capital"
    SERVICE = "service"


class ItemStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ItemCreate(BaseModel):
    institution_id: str
    name: str
    category: ItemCategory = ItemCategory.CONSUMABLE
    uom: str = "Nos"
    hsn_code: str = ""
    gst_rate: float = 18.0
    standard_rate: float = 0
    specification: str = ""
    reorder_level: float = 0
    is_capital_item: bool = False
    manufacturer: str = ""
    model_number: str = ""
    warranty_months: int = 0
    minimum_order_quantity: float = 1
    lead_time_days: int = 15
    preferred_vendor_ids: list[str] = Field(default_factory=list)


class ItemUpdate(BaseModel):
    name: str | None = None
    category: ItemCategory | None = None
    uom: str | None = None
    hsn_code: str | None = None
    gst_rate: float | None = None
    standard_rate: float | None = None
    specification: str | None = None
    reorder_level: float | None = None
    is_capital_item: bool | None = None
    manufacturer: str | None = None
    model_number: str | None = None
    warranty_months: int | None = None
    minimum_order_quantity: float | None = None
    lead_time_days: int | None = None
    preferred_vendor_ids: list[str] | None = None
    status: ItemStatus | None = None


class ItemOut(BaseModel):
    id: str
    code: str
    institution_id: str
    name: str
    category: ItemCategory
    uom: str
    hsn_code: str
    gst_rate: float
    standard_rate: float
    specification: str
    reorder_level: float
    is_capital_item: bool
    manufacturer: str
    model_number: str
    warranty_months: int
    minimum_order_quantity: float
    lead_time_days: int
    preferred_vendor_ids: list[str]
    status: ItemStatus
    created_at: datetime
    updated_at: datetime
