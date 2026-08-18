from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class RecordStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class Address(BaseModel):
    line1: str = ""
    line2: str = ""
    city: str = ""
    district: str = ""
    state: str = "Tamil Nadu"
    pincode: str = ""
    country: str = "India"


# ---------------------------------------------------------------- Group ----

class GroupCreate(BaseModel):
    legal_name: str
    trade_name: str
    org_code: str = Field(pattern=r"^[A-Z0-9_-]+$")
    org_type: str = "trust"
    registration_number: str = ""
    registration_date: datetime | None = None
    pan: str = ""
    tan: str = ""
    gstins: list[str] = Field(default_factory=list)
    address: Address = Field(default_factory=Address)
    website: str = ""
    established_date: datetime | None = None


class GroupUpdate(BaseModel):
    legal_name: str | None = None
    trade_name: str | None = None
    org_type: str | None = None
    registration_number: str | None = None
    registration_date: datetime | None = None
    pan: str | None = None
    tan: str | None = None
    gstins: list[str] | None = None
    address: Address | None = None
    website: str | None = None
    established_date: datetime | None = None
    status: RecordStatus | None = None


class GroupOut(GroupCreate):
    id: str
    status: RecordStatus
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------- Institution ----

class InstitutionCreate(BaseModel):
    group_id: str
    code: str = Field(pattern=r"^[A-Z0-9_-]+$")
    name: str
    short_name: str
    institution_type: str = "engineering_college"
    university_affiliation: str = ""
    autonomous_status: bool = False
    aicte_approved: bool = False
    ugc_recognized: bool = False
    naac_grade: str = ""
    naac_cycle: str = ""
    nba_programmes: list[str] = Field(default_factory=list)
    establishment_date: datetime | None = None
    principal_name: str = ""
    address: Address = Field(default_factory=Address)
    gstin: str = ""
    pan: str = ""
    tan: str = ""
    website: str = ""
    logo_url: str = ""


class InstitutionUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
    institution_type: str | None = None
    university_affiliation: str | None = None
    autonomous_status: bool | None = None
    aicte_approved: bool | None = None
    ugc_recognized: bool | None = None
    naac_grade: str | None = None
    naac_cycle: str | None = None
    nba_programmes: list[str] | None = None
    establishment_date: datetime | None = None
    principal_name: str | None = None
    address: Address | None = None
    gstin: str | None = None
    pan: str | None = None
    tan: str | None = None
    website: str | None = None
    logo_url: str | None = None
    status: RecordStatus | None = None


class InstitutionOut(InstitutionCreate):
    id: str
    status: RecordStatus
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------- Campus ----

class CampusContacts(BaseModel):
    head: str = ""
    admin_officer: str = ""
    finance_officer: str = ""
    hr_officer: str = ""
    purchase_officer: str = ""
    stores_officer: str = ""


class CampusCreate(BaseModel):
    institution_id: str
    code: str = Field(pattern=r"^[A-Z0-9_-]+$")
    name: str
    campus_type: str = "main"
    address: Address = Field(default_factory=Address)
    geo_lat: float | None = None
    geo_lng: float | None = None
    geo_fence_radius_m: int | None = None
    contacts: CampusContacts = Field(default_factory=CampusContacts)
    working_days: list[str] = Field(
        default_factory=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    )


class CampusUpdate(BaseModel):
    name: str | None = None
    campus_type: str | None = None
    address: Address | None = None
    geo_lat: float | None = None
    geo_lng: float | None = None
    geo_fence_radius_m: int | None = None
    contacts: CampusContacts | None = None
    working_days: list[str] | None = None
    status: RecordStatus | None = None


class CampusOut(CampusCreate):
    id: str
    status: RecordStatus
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------- Org Unit ----

class OrgUnitType(str, Enum):
    COLLEGE = "college"
    SCHOOL = "school"
    FACULTY = "faculty"
    DIRECTORATE = "directorate"
    DIVISION = "division"
    DEPARTMENT = "department"
    CENTRE = "centre"
    CELL = "cell"
    SECTION = "section"
    UNIT = "unit"
    OFFICE = "office"
    LABORATORY = "laboratory"
    LIBRARY = "library"
    HOSTEL = "hostel"
    STORE = "store"
    PROJECT = "project"
    COMMITTEE = "committee"
    COST_CENTRE = "cost_centre"


class OrgUnitCreate(BaseModel):
    campus_id: str
    parent_id: str | None = None
    code: str = Field(pattern=r"^[A-Z0-9_-]+$")
    name: str
    unit_type: OrgUnitType
    is_academic: bool = True
    head_name: str = ""
    head_email: EmailStr | None = None
    cost_centre_code: str = ""


class OrgUnitUpdate(BaseModel):
    name: str | None = None
    parent_id: str | None = None
    is_academic: bool | None = None
    head_name: str | None = None
    head_email: EmailStr | None = None
    cost_centre_code: str | None = None
    status: RecordStatus | None = None


class OrgUnitOut(BaseModel):
    id: str
    campus_id: str
    institution_id: str
    group_id: str
    parent_id: str | None
    code: str
    name: str
    unit_type: OrgUnitType
    is_academic: bool
    head_name: str
    head_email: str | None
    cost_centre_code: str
    status: RecordStatus
    created_at: datetime
    updated_at: datetime
