from pydantic import BaseModel, Field


class NamedAmount(BaseModel):
    name: str
    amount: float
    count: int = 0


class FeeLineOut(BaseModel):
    payment_status: str
    total_amount: float
    type_name: str
    category: str
    due_date: str
    programme: str
    year: str
    payment_on: str
    due_bucket: str
    campus: str | None = None
    division: str | None = None
    department: str | None = None
    batch: str | None = None


class FeesOverview(BaseModel):
    as_of: str
    line_count: int
    total_pending: float
    overdue_amount: float
    due_soon_amount: float
    upcoming_amount: float
    programmes: int
    fee_categories: int
    student_count: int = 0
    by_category: list[NamedAmount] = Field(default_factory=list)
    by_programme: list[NamedAmount] = Field(default_factory=list)
    by_year: list[NamedAmount] = Field(default_factory=list)
    by_due_bucket: list[NamedAmount] = Field(default_factory=list)
    by_campus: list[NamedAmount] = Field(default_factory=list)
    by_division: list[NamedAmount] = Field(default_factory=list)
    by_department: list[NamedAmount] = Field(default_factory=list)
    by_batch: list[NamedAmount] = Field(default_factory=list)
    top_lines: list[FeeLineOut] = Field(default_factory=list)


class StudentFeeSummary(BaseModel):
    student_id: str
    student_name: str
    campus: str
    division: str
    department: str
    batch: str
    programme: str
    year: str
    pending_amount: float
    line_count: int


class StudentFeeLine(BaseModel):
    type_name: str
    category: str
    due_date: str
    due_bucket: str
    total_amount: float
    payment_status: str


class StudentFeeDetail(BaseModel):
    student_id: str
    student_name: str
    campus: str
    division: str
    department: str
    batch: str
    programme: str
    year: str
    pending_amount: float
    lines: list[StudentFeeLine] = Field(default_factory=list)
