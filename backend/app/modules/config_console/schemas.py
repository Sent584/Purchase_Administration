from datetime import datetime

from pydantic import BaseModel, Field


class PasswordPolicy(BaseModel):
    min_length: int = 10
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digit: bool = True
    require_special: bool = True
    history_count: int = 5
    expiry_days: int = 90


class OtpPolicy(BaseModel):
    length: int = 6
    validity_minutes: int = 5
    resend_cooldown_seconds: int = 30
    max_attempts: int = 5
    max_resends: int = 5
    lockout_duration_minutes: int = 30


class DocumentNumberingRule(BaseModel):
    prefix: str
    use_financial_year: bool = True
    padding: int = 4
    separator: str = "/"


class GlobalConfig(BaseModel):
    app_name: str = "Sasurie ERP"
    org_short_name: str = "SASURIE"
    default_language: str = "en-IN"
    additional_languages: list[str] = Field(default_factory=lambda: ["ta-IN"])
    default_country: str = "India"
    default_state: str = "Tamil Nadu"
    default_currency: str = "INR"
    financial_year_start_month: int = 4
    academic_year_start_month: int = 6
    date_format: str = "DD-MM-YYYY"
    time_format: str = "24h"
    timezone: str = "Asia/Kolkata"
    number_format: str = "en-IN"
    decimal_precision: int = 2
    default_email_domain: str = "sasurie.edu.in"
    website: str = "https://www.sasurie.edu.in"
    helpdesk_email: str = "helpdesk@sasurie.edu.in"
    helpdesk_phone: str = "+91-422-2680000"
    privacy_policy_url: str = "https://www.sasurie.edu.in/privacy-policy"
    terms_url: str = "https://www.sasurie.edu.in/terms"
    data_retention_years: int = 7
    session_timeout_minutes: int = 30
    max_concurrent_sessions: int = 3
    require_otp_on_login: bool = False
    max_upload_size_mb: int = 25
    allowed_file_types: list[str] = Field(
        default_factory=lambda: ["pdf", "jpg", "jpeg", "png", "xlsx", "docx"]
    )
    password_policy: PasswordPolicy = Field(default_factory=PasswordPolicy)
    otp_policy: OtpPolicy = Field(default_factory=OtpPolicy)
    document_numbering: dict[str, DocumentNumberingRule] = Field(
        default_factory=lambda: {
            "purchase_order": DocumentNumberingRule(prefix="PO"),
            "grn": DocumentNumberingRule(prefix="GRN"),
            "purchase_bill": DocumentNumberingRule(prefix="PB"),
            "rfq": DocumentNumberingRule(prefix="RFQ"),
            "indent": DocumentNumberingRule(prefix="PR"),
            "voucher": DocumentNumberingRule(prefix="JV"),
            "payslip": DocumentNumberingRule(prefix="PS"),
            "employee": DocumentNumberingRule(prefix="EMP", use_financial_year=False, padding=5),
        }
    )


class GlobalConfigOut(GlobalConfig):
    id: str
    version: int
    effective_from: datetime
    updated_at: datetime
    updated_by: str | None = None


class GlobalConfigUpdate(BaseModel):
    """Partial update: every field optional, only supplied ones change."""

    app_name: str | None = None
    org_short_name: str | None = None
    default_language: str | None = None
    additional_languages: list[str] | None = None
    default_country: str | None = None
    default_state: str | None = None
    default_currency: str | None = None
    financial_year_start_month: int | None = None
    academic_year_start_month: int | None = None
    date_format: str | None = None
    time_format: str | None = None
    timezone: str | None = None
    number_format: str | None = None
    decimal_precision: int | None = None
    default_email_domain: str | None = None
    website: str | None = None
    helpdesk_email: str | None = None
    helpdesk_phone: str | None = None
    privacy_policy_url: str | None = None
    terms_url: str | None = None
    data_retention_years: int | None = None
    session_timeout_minutes: int | None = None
    max_concurrent_sessions: int | None = None
    require_otp_on_login: bool | None = None
    max_upload_size_mb: int | None = None
    allowed_file_types: list[str] | None = None
    password_policy: PasswordPolicy | None = None
    otp_policy: OtpPolicy | None = None
    document_numbering: dict[str, DocumentNumberingRule] | None = None
