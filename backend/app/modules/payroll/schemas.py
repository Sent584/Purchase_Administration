from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class ComponentType(str, Enum):
    EARNING = "earning"
    DEDUCTION = "deduction"
    EMPLOYER = "employer"


class StatutoryCode(str, Enum):
    EPF_EE = "epf_ee"
    EPF_ER = "epf_er"
    ESI_EE = "esi_ee"
    ESI_ER = "esi_er"
    PT = "pt"
    TDS = "tds"
    NONE = "none"


class PayrollRunStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    REVIEW = "review"
    APPROVED = "approved"
    LOCKED = "locked"
    POSTED = "posted"


class PayslipStatus(str, Enum):
    DRAFT = "draft"
    FINAL = "final"


class PayComponentOut(BaseModel):
    id: str
    code: str
    name: str
    type: ComponentType
    taxable: bool
    statutory_code: StatutoryCode
    formula_hint: str = ""


class StructureComponent(BaseModel):
    code: str
    amount: float


class SalaryStructureOut(BaseModel):
    id: str
    employee_id: str | None = None
    pay_level: str | None = None
    components: list[StructureComponent]
    effective_from: date
    institution_id: str


class PayrollRunCreate(BaseModel):
    period_year: int
    period_month: int = Field(ge=1, le=12)
    institution_id: str


class PayrollRunOut(BaseModel):
    id: str
    period_year: int
    period_month: int
    institution_id: str
    status: PayrollRunStatus
    employee_count: int
    gross_total: float
    deduction_total: float
    net_total: float
    employer_contrib_total: float
    created_at: datetime
    updated_at: datetime


class PayslipOut(BaseModel):
    id: str
    payroll_run_id: str
    employee_id: str
    employee_name: str
    employee_code: str
    designation: str
    department: str
    earnings: dict[str, float]
    deductions: dict[str, float]
    employer: dict[str, float]
    gross: float
    total_deductions: float
    net: float
    days_paid: float
    lop_days: float
    ytd_gross: float
    ytd_tax: float
    bank_last4: str
    status: PayslipStatus
    institution_id: str


class PayrollDashboard(BaseModel):
    runs_this_fy: int
    latest_run_status: str | None
    employees_paid_last_run: int
    net_paid_last_run: float
    pending_approval: int
