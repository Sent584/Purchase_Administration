from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, computed_field


class IndentPurpose(str, Enum):
    ACADEMIC = "academic"
    LAB = "lab"
    ADMINISTRATIVE = "administrative"
    HOSTEL = "hostel"
    PROJECT = "project"


class IndentPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class IndentStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLOSED = "closed"


class ApprovalLevelStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class IndentLine(BaseModel):
    item_id: str | None = None
    item_name: str = ""
    description: str = ""
    specification: str = ""
    quantity: float
    uom: str = "Nos"
    estimated_rate: float = 0

    @computed_field  # type: ignore[prop-decorator]
    @property
    def estimated_amount(self) -> float:
        return round(self.quantity * self.estimated_rate, 2)


class IndentAttachment(BaseModel):
    name: str
    doc_type: str = "supporting_document"
    uploaded_by: str = ""
    uploaded_at: datetime


class ApprovalLevel(BaseModel):
    level: int
    level_name: str
    status: ApprovalLevelStatus = ApprovalLevelStatus.PENDING
    approver_email: str | None = None
    notes: str = ""
    decided_at: datetime | None = None


class IndentCreate(BaseModel):
    institution_id: str
    campus_id: str
    department_id: str
    division_id: str | None = None
    requested_by_name: str
    requested_by_email: str = ""
    purpose: IndentPurpose = IndentPurpose.ACADEMIC
    priority: IndentPriority = IndentPriority.MEDIUM
    requisition_date: datetime | None = None
    required_by_date: datetime | None = None
    delivery_location: str = ""
    budget_head: str = ""
    justification: str = ""
    remarks: str = ""
    lines: list[IndentLine] = Field(default_factory=list)
    attachments: list[IndentAttachment] = Field(default_factory=list)


class IndentUpdate(BaseModel):
    campus_id: str | None = None
    department_id: str | None = None
    division_id: str | None = None
    requested_by_name: str | None = None
    requested_by_email: str | None = None
    purpose: IndentPurpose | None = None
    priority: IndentPriority | None = None
    requisition_date: datetime | None = None
    required_by_date: datetime | None = None
    delivery_location: str | None = None
    budget_head: str | None = None
    justification: str | None = None
    remarks: str | None = None
    lines: list[IndentLine] | None = None
    attachments: list[IndentAttachment] | None = None


class IndentDecision(BaseModel):
    notes: str = ""


class IndentAttachmentAdd(BaseModel):
    name: str
    doc_type: str = "supporting_document"


class IndentOut(BaseModel):
    id: str
    indent_number: str
    institution_id: str
    campus_id: str
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str
    department_name: str = ""
    requested_by_name: str
    requested_by_email: str
    purpose: IndentPurpose
    priority: IndentPriority
    requisition_date: datetime | None = None
    required_by_date: datetime | None = None
    delivery_location: str = ""
    budget_head: str = ""
    justification: str = ""
    remarks: str = ""
    lines: list[IndentLine]
    attachments: list[IndentAttachment]
    approval_chain: list[ApprovalLevel]
    status: IndentStatus
    approver_notes: str = ""
    approved_by: str | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_estimated_amount(self) -> float:
        return round(sum(line.estimated_amount for line in self.lines), 2)
