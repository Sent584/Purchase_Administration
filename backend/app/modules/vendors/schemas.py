from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, computed_field


class VendorCategory(str, Enum):
    GOODS = "goods"
    SERVICES = "services"
    WORKS = "works"
    AMC = "annual_maintenance"


class GstRegistrationType(str, Enum):
    REGULAR = "regular"
    COMPOSITION = "composition"
    UNREGISTERED = "unregistered"


class TdsSection(str, Enum):
    NONE = "none"
    S194C = "194C"
    S194J = "194J"
    S194I = "194I"
    S194Q = "194Q"


class VendorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLACKLISTED = "blacklisted"


class Address(BaseModel):
    line1: str = ""
    line2: str = ""
    city: str = ""
    state: str = "Tamil Nadu"
    pincode: str = ""
    country: str = "India"


class BankAccount(BaseModel):
    account_holder: str = ""
    account_number: str = ""
    ifsc_code: str = ""
    bank_name: str = ""
    branch: str = ""


class VendorRating(BaseModel):
    quality: float = 0
    delivery: float = 0
    price: float = 0
    service: float = 0

    @computed_field  # type: ignore[prop-decorator]
    @property
    def overall(self) -> float:
        values = [self.quality, self.delivery, self.price, self.service]
        return round(sum(values) / len(values), 2) if any(values) else 0.0


class VendorDocument(BaseModel):
    """Metadata only — no file bytes stored yet (Object Storage module isn't built)."""

    name: str
    doc_type: str = "other"
    reference_number: str = ""
    issued_date: datetime | None = None
    expiry_date: datetime | None = None


class VendorCreate(BaseModel):
    institution_id: str
    legal_name: str
    trade_name: str
    vendor_category: VendorCategory = VendorCategory.GOODS
    gst_registration_type: GstRegistrationType = GstRegistrationType.REGULAR
    gstin: str = ""
    pan: str = ""
    msme_registered: bool = False
    udyam_number: str = ""
    tds_section: TdsSection = TdsSection.NONE
    lower_deduction_certificate_rate: float | None = None
    address: Address = Field(default_factory=Address)
    contact_person: str = ""
    contact_phone: str = ""
    contact_email: EmailStr | None = None
    secondary_contact_person: str = ""
    secondary_contact_phone: str = ""
    credit_period_days: int = 30
    delivery_lead_time_days: int = 15
    quality_certifications: list[str] = Field(default_factory=list)
    bank_account: BankAccount = Field(default_factory=BankAccount)
    product_categories: list[str] = Field(default_factory=list)
    documents: list[VendorDocument] = Field(default_factory=list)
    empanelment_valid_from: datetime | None = None
    empanelment_valid_to: datetime | None = None


class VendorUpdate(BaseModel):
    trade_name: str | None = None
    vendor_category: VendorCategory | None = None
    gst_registration_type: GstRegistrationType | None = None
    gstin: str | None = None
    pan: str | None = None
    msme_registered: bool | None = None
    udyam_number: str | None = None
    tds_section: TdsSection | None = None
    lower_deduction_certificate_rate: float | None = None
    address: Address | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: EmailStr | None = None
    secondary_contact_person: str | None = None
    secondary_contact_phone: str | None = None
    credit_period_days: int | None = None
    delivery_lead_time_days: int | None = None
    quality_certifications: list[str] | None = None
    bank_account: BankAccount | None = None
    product_categories: list[str] | None = None
    documents: list[VendorDocument] | None = None
    empanelment_valid_from: datetime | None = None
    empanelment_valid_to: datetime | None = None
    status: VendorStatus | None = None
    rating: VendorRating | None = None


class VendorOut(BaseModel):
    id: str
    code: str
    institution_id: str
    legal_name: str
    trade_name: str
    vendor_category: VendorCategory
    gst_registration_type: GstRegistrationType
    gstin: str
    pan: str
    msme_registered: bool
    udyam_number: str
    tds_section: TdsSection
    lower_deduction_certificate_rate: float | None
    address: Address
    contact_person: str
    contact_phone: str
    contact_email: str | None
    secondary_contact_person: str
    secondary_contact_phone: str
    credit_period_days: int
    delivery_lead_time_days: int
    quality_certifications: list[str]
    bank_account: BankAccount
    product_categories: list[str]
    documents: list[VendorDocument]
    empanelment_valid_from: datetime | None
    empanelment_valid_to: datetime | None
    status: VendorStatus
    rating: VendorRating
    blacklist_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class VendorBlacklistRequest(BaseModel):
    reason: str


class VendorStats(BaseModel):
    vendor_id: str
    total_purchase_orders: int
    total_po_value: float
    total_grns: int
    total_bills: int
    total_billed_value: float
    on_time_grn_pct: float
    quality_acceptance_pct: float
