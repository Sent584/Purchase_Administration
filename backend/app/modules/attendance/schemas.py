from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    ON_DUTY = "on_duty"
    HOLIDAY = "holiday"
    WEEK_OFF = "week_off"
    LEAVE = "leave"


class AttendanceSource(str, Enum):
    BIOMETRIC = "biometric"
    WEB = "web"
    MANUAL = "manual"
    GEO = "geo"


class LeaveAppStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ShiftCreate(BaseModel):
    name: str
    code: str
    start_time: str
    end_time: str
    grace_minutes: int = 15
    is_night: bool = False
    institution_id: str


class ShiftUpdate(BaseModel):
    name: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    grace_minutes: int | None = None
    is_night: bool | None = None


class ShiftOut(BaseModel):
    id: str
    name: str
    code: str
    start_time: str
    end_time: str
    grace_minutes: int
    is_night: bool
    institution_id: str
    created_at: datetime
    updated_at: datetime


class AttendanceCreate(BaseModel):
    employee_id: str
    employee_name: str
    date: date
    shift_code: str = "GEN"
    in_time: str | None = None
    out_time: str | None = None
    status: AttendanceStatus = AttendanceStatus.PRESENT
    late_minutes: int = 0
    early_minutes: int = 0
    source: AttendanceSource = AttendanceSource.MANUAL
    campus_id: str | None = None
    institution_id: str


class AttendanceBulkCreate(BaseModel):
    records: list[AttendanceCreate]


class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: date
    shift_code: str
    in_time: str | None
    out_time: str | None
    status: AttendanceStatus
    late_minutes: int
    early_minutes: int
    source: AttendanceSource
    campus_id: str | None
    institution_id: str
    created_at: datetime
    updated_at: datetime


class LeaveTypeOut(BaseModel):
    id: str
    code: str
    name: str
    paid: bool
    accrual_per_year: float
    max_carry_forward: float
    encashable: bool
    gender_restriction: str | None
    requires_document: bool


class LeaveBalanceOut(BaseModel):
    id: str
    employee_id: str
    leave_type_code: str
    opening: float
    accrued: float
    availed: float
    balance: float
    year: int


class LeaveApplicationCreate(BaseModel):
    employee_id: str
    leave_type_code: str
    from_date: date
    to_date: date
    days: float
    reason: str = ""
    substitute_name: str = ""
    institution_id: str


class LeaveApplicationUpdate(BaseModel):
    from_date: date | None = None
    to_date: date | None = None
    days: float | None = None
    reason: str | None = None
    substitute_name: str | None = None


class LeaveDecision(BaseModel):
    notes: str = ""
    approver_name: str = ""


class LeaveApplicationOut(BaseModel):
    id: str
    employee_id: str
    leave_type_code: str
    from_date: date
    to_date: date
    days: float
    reason: str
    status: LeaveAppStatus
    approver_name: str
    substitute_name: str
    institution_id: str
    created_at: datetime
    updated_at: datetime


class AttendanceDashboard(BaseModel):
    present_today: int
    absent_today: int
    on_leave_today: int
    pending_regularisations: int = Field(description="Submitted leave apps awaiting approval")
