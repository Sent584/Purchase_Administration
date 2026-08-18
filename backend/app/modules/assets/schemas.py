from datetime import datetime

from pydantic import BaseModel, Field

from app.modules.assets.enums import AssetClass, AssetStatus, DepreciationMethod, FundingSource


class AssetCreate(BaseModel):
    institution_id: str
    campus_id: str
    division_id: str | None = None
    department_id: str
    asset_class: AssetClass
    name: str
    description: str = ""
    make: str = ""
    model: str = ""
    serial_number: str = ""
    capitalization_date: datetime | None = None
    capitalization_value: float = 0
    funding_source: FundingSource = FundingSource.INSTITUTION
    supplier_name: str = ""
    po_id: str | None = None
    grn_id: str | None = None
    warranty_expiry: datetime | None = None
    amc_expiry: datetime | None = None
    insurance_expiry: datetime | None = None
    custodian_name: str = ""
    custodian_employee_id: str | None = None
    location_building: str = ""
    location_floor: str = ""
    location_room: str = ""
    useful_life_years: int = 5
    depreciation_method: DepreciationMethod = DepreciationMethod.WDV
    depreciation_rate: float = 15.0
    residual_value: float = 0
    current_book_value: float | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    make: str | None = None
    model: str | None = None
    serial_number: str | None = None
    funding_source: FundingSource | None = None
    supplier_name: str | None = None
    warranty_expiry: datetime | None = None
    amc_expiry: datetime | None = None
    insurance_expiry: datetime | None = None
    custodian_name: str | None = None
    custodian_employee_id: str | None = None
    location_building: str | None = None
    location_floor: str | None = None
    location_room: str | None = None
    useful_life_years: int | None = None
    depreciation_method: DepreciationMethod | None = None
    depreciation_rate: float | None = None
    residual_value: float | None = None
    current_book_value: float | None = None
    status: AssetStatus | None = None


class AssetOut(BaseModel):
    id: str
    asset_code: str
    institution_id: str
    campus_id: str
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str
    department_name: str = ""
    asset_class: AssetClass
    name: str
    description: str
    make: str
    model: str
    serial_number: str
    capitalization_date: datetime | None
    capitalization_value: float
    funding_source: FundingSource
    supplier_name: str
    po_id: str | None
    grn_id: str | None
    warranty_expiry: datetime | None
    amc_expiry: datetime | None
    insurance_expiry: datetime | None
    custodian_name: str
    custodian_employee_id: str | None
    location_building: str
    location_floor: str
    location_room: str
    useful_life_years: int
    depreciation_method: DepreciationMethod
    depreciation_rate: float
    residual_value: float
    current_book_value: float
    status: AssetStatus
    disposal_sale_value: float | None = None
    disposal_gain_loss: float | None = None
    disposal_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class AssetTransferRequest(BaseModel):
    custodian_name: str = ""
    custodian_employee_id: str | None = None
    location_building: str = ""
    location_floor: str = ""
    location_room: str = ""
    campus_id: str | None = None
    division_id: str | None = None
    department_id: str | None = None
    remarks: str = ""


class AssetDisposeRequest(BaseModel):
    sale_value: float = Field(ge=0)
    reason: str
    disposal_date: datetime | None = None


class ClassCount(BaseModel):
    asset_class: str
    count: int
    total_value: float


class StatusCount(BaseModel):
    status: str
    count: int


class AssetsDashboard(BaseModel):
    total_assets: int
    total_capitalization_value: float
    total_book_value: float
    active_count: int
    under_repair_count: int
    disposed_count: int
    warranty_expiring_30d: int
    amc_expiring_30d: int
    by_class: list[ClassCount]
    by_status: list[StatusCount]
