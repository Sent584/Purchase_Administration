from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    INCOME = "income"
    EXPENSE = "expense"


class VoucherType(str, Enum):
    JOURNAL = "journal"
    RECEIPT = "receipt"
    PAYMENT = "payment"
    CONTRA = "contra"
    PURCHASE = "purchase"
    PAYROLL = "payroll"
    DEBIT_NOTE = "debit_note"
    CREDIT_NOTE = "credit_note"


class VoucherStatus(str, Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    APPROVED = "approved"
    POSTED = "posted"
    REVERSED = "reversed"


class AccountOut(BaseModel):
    id: str
    code: str
    name: str
    account_type: AccountType
    parent_code: str | None = None
    is_control: bool = False
    institution_id: str


class CostCentreOut(BaseModel):
    id: str
    code: str
    name: str
    institution_id: str
    campus_id: str | None = None


class BudgetOut(BaseModel):
    id: str
    fy: str
    account_code: str
    account_name: str = ""
    cost_centre_code: str
    allocated: float
    committed: float
    actual: float
    available: float
    institution_id: str


class VoucherLine(BaseModel):
    account_code: str
    cost_centre: str = ""
    debit: float = 0.0
    credit: float = 0.0


class VoucherCreate(BaseModel):
    institution_id: str
    voucher_type: VoucherType
    date: datetime | None = None
    narration: str = ""
    lines: list[VoucherLine] = Field(min_length=2)
    created_by_name: str = ""

    @model_validator(mode="after")
    def balanced(self) -> "VoucherCreate":
        debits = sum(l.debit for l in self.lines)
        credits = sum(l.credit for l in self.lines)
        if round(debits, 2) != round(credits, 2):
            raise ValueError("Voucher lines must balance (total debit = total credit)")
        return self


class VoucherOut(BaseModel):
    id: str
    voucher_number: str
    voucher_type: VoucherType
    date: datetime
    narration: str
    lines: list[VoucherLine]
    status: VoucherStatus
    total_debit: float
    total_credit: float
    institution_id: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime


class BankAccountOut(BaseModel):
    id: str
    bank_name: str
    account_number_masked: str
    ifsc: str
    account_type: str
    institution_id: str
    current_balance: float


class TrialBalanceRow(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    debit: float
    credit: float


class AccountsDashboard(BaseModel):
    cash_position: float
    budget_utilised_pct: float
    pending_vouchers: int
    posted_vouchers: int
    bank_accounts: int
    fy_label: str
