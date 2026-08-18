from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class LoginMethod(str, Enum):
    PASSWORD_OTP = "password_otp"
    OTP_ONLY = "otp_only"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    group_id: str
    institution_id: str | None = None
    campus_id: str | None = None
    department_id: str | None = None
    role_ids: list[str] = Field(default_factory=list)
    login_method: LoginMethod = LoginMethod.PASSWORD_OTP
    must_change_password: bool = True


class UserSummary(BaseModel):
    id: str
    email: str
    full_name: str
    group_id: str | None = None
    institution_id: str | None = None
    campus_id: str | None = None
    department_id: str | None = None
    role_codes: list[str]
    permissions: list[str]
    login_method: LoginMethod
    must_change_password: bool
    last_login_at: datetime | None = None


class LoginPasswordRequest(BaseModel):
    email: EmailStr
    password: str


class OtpOnlyRequest(BaseModel):
    email: EmailStr


class ChallengeResponse(BaseModel):
    challenge_id: str
    masked_destination: str
    expires_in_seconds: int
    resend_cooldown_seconds: int


class OtpVerifyRequest(BaseModel):
    challenge_id: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserSummary


class OtpResendRequest(BaseModel):
    challenge_id: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    challenge_id: str
    otp: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class GenericMessage(BaseModel):
    message: str


class SessionOut(BaseModel):
    id: str
    user_agent: str | None
    ip_address: str | None
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    is_current: bool = False
