from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, client_ip, get_current_user
from app.modules.auth import service
from app.modules.auth.schemas import (
    AccessTokenResponse,
    ChallengeResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GenericMessage,
    LoginPasswordRequest,
    OtpOnlyRequest,
    OtpResendRequest,
    OtpVerifyRequest,
    RefreshRequest,
    ResetPasswordRequest,
    SessionOut,
    TokenResponse,
    UserCreate,
    UserSummary,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/users", response_model=UserSummary, status_code=201)
async def create_user(
    payload: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    # Foundation scope note: user provisioning is normally driven by HR
    # onboarding once that module exists. For now any authenticated admin
    # can create accounts directly; tighten to require_permission("user:write")
    # once role assignment is exercised end-to-end in the seed data.
    return await service.create_user(db, payload)


@router.post("/login/password", response_model=ChallengeResponse | TokenResponse)
async def login_password(payload: LoginPasswordRequest, request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Returns a ChallengeResponse if OTP is required by policy (Global Configuration >
    # Login Security), or a TokenResponse directly if the OTP step has been disabled.
    return await service.start_password_login(
        db, payload.email, payload.password, client_ip(request), request.headers.get("user-agent")
    )


@router.post("/login/otp-only", response_model=ChallengeResponse)
async def login_otp_only(payload: OtpOnlyRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await service.start_otp_only_login(db, payload.email)


@router.post("/login/otp/resend", response_model=ChallengeResponse)
async def resend_otp(payload: OtpResendRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await service.resend_otp(db, payload.challenge_id)


@router.post("/login/otp/verify", response_model=TokenResponse)
async def verify_otp(payload: OtpVerifyRequest, request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await service.verify_login_otp(
        db, payload.challenge_id, payload.otp, client_ip(request), request.headers.get("user-agent")
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    access_token, expires_in = await service.refresh_access_token(db, payload.refresh_token)
    return AccessTokenResponse(access_token=access_token, expires_in=expires_in)


@router.post("/logout", response_model=GenericMessage)
async def logout(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    await service.logout(db, payload.refresh_token)
    return GenericMessage(message="Logged out successfully")


@router.get("/me", response_model=CurrentUser)
async def me(current_user: CurrentUser = Depends(get_current_user)):
    return current_user


@router.get("/sessions", response_model=list[SessionOut])
async def sessions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await service.list_sessions(db, current_user.id, current_sid=current_user.session_id)


@router.delete("/sessions/{session_id}", response_model=GenericMessage)
async def revoke_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    await service.revoke_session(db, current_user.id, session_id)
    return GenericMessage(message="Session revoked")


@router.post("/forgot-password/request", response_model=ChallengeResponse)
async def forgot_password_request(payload: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await service.start_forgot_password(db, payload.email)


@router.post("/forgot-password/reset", response_model=GenericMessage)
async def forgot_password_reset(payload: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    await service.reset_password(db, payload.challenge_id, payload.otp, payload.new_password)
    return GenericMessage(message="Password has been reset. Please log in with your new password.")


@router.post("/change-password", response_model=GenericMessage)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    await service.change_password(db, current_user.id, payload.current_password, payload.new_password)
    return GenericMessage(message="Password changed successfully")
