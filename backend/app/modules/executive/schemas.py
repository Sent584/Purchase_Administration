from datetime import datetime

from pydantic import BaseModel


class OrgMetricPoint(BaseModel):
    name: str
    spend: float = 0
    headcount: int = 0
    pending_approvals: int = 0
    stock_value: float = 0


class FunctionPulse(BaseModel):
    key: str
    label: str
    primary: str
    secondary: str
    tone: str = "crimson"
    href: str


class ExecutiveOverview(BaseModel):
    institutions: int
    campuses: int
    divisions: int
    departments: int
    headcount: int
    po_spend: float
    cash_position: float
    stock_value: float
    asset_book: float
    pending_approvals: int
    attendance_pct: float
    budget_pct: float
    by_campus: list[OrgMetricPoint]
    by_division: list[OrgMetricPoint]
    by_department: list[OrgMetricPoint]
    functions: list[FunctionPulse]


class ApprovalItem(BaseModel):
    id: str
    domain: str
    title: str
    subtitle: str
    amount: float | None = None
    campus_name: str = ""
    division_name: str = ""
    department_name: str = ""
    status: str
    created_at: datetime | None = None
    href: str
    action: str  # approve | issue | award
    permission: str


class ApprovalsInbox(BaseModel):
    total: int
    items: list[ApprovalItem]
