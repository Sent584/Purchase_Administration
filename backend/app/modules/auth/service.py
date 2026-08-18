from datetime import timedelta

import jwt as pyjwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.audit import record_audit_event
from app.common.base_models import utcnow
from app.core.config import get_settings
from app.core.security import (
    TokenType,
    create_token,
    decode_token,
    generate_otp,
    hash_otp,
    hash_password,
    verify_otp,
    verify_password,
)
from app.modules.auth.email_backend import send_otp_email
from app.modules.auth.policy import mask_email, validate_password_strength
from app.modules.auth.schemas import (
    ChallengeResponse,
    LoginMethod,
    TokenResponse,
    UserCreate,
    UserSummary,
)
from app.modules.config_console.service import get_active_config


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


async def _load_user_summary(db: AsyncIOMotorDatabase, user: dict) -> UserSummary:
    role_ids = user.get("role_ids", [])
    roles = await db["roles"].find({"_id": {"$in": role_ids}}).to_list(length=100)
    permissions: set[str] = set()
    for role in roles:
        permissions.update(role.get("permissions", []))
    scope = user.get("scope", {})
    return UserSummary(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        group_id=str(scope["group_id"]) if scope.get("group_id") else None,
        institution_id=str(scope["institution_id"]) if scope.get("institution_id") else None,
        campus_id=str(scope["campus_id"]) if scope.get("campus_id") else None,
        department_id=str(scope["department_id"]) if scope.get("department_id") else None,
        role_codes=[r["code"] for r in roles],
        permissions=sorted(permissions),
        login_method=user.get("login_method", LoginMethod.PASSWORD_OTP.value),
        must_change_password=user.get("must_change_password", False),
        last_login_at=user.get("last_login_at"),
    )


async def create_user(db: AsyncIOMotorDatabase, payload: UserCreate) -> UserSummary:
    config = await get_active_config(db)
    validate_password_strength(payload.password, config.password_policy)

    if await db["users"].find_one({"email": payload.email.lower()}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"A user with email '{payload.email}' already exists")

    now = utcnow()
    doc = {
        "email": payload.email.lower(),
        "full_name": payload.full_name,
        "password_hash": hash_password(payload.password),
        "password_history": [],
        "scope": {
            "group_id": _oid(payload.group_id, "group_id"),
            "institution_id": _oid(payload.institution_id, "institution_id") if payload.institution_id else None,
            "campus_id": _oid(payload.campus_id, "campus_id") if payload.campus_id else None,
            "department_id": _oid(payload.department_id, "department_id") if payload.department_id else None,
        },
        "role_ids": [_oid(r, "role_id") for r in payload.role_ids],
        "login_method": payload.login_method.value,
        "must_change_password": payload.must_change_password,
        "status": "active",
        "failed_attempts": 0,
        "locked_until": None,
        "last_login_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return await _load_user_summary(db, doc)


async def _check_not_locked(user: dict) -> None:
    locked_until = user.get("locked_until")
    if locked_until and locked_until > utcnow():
        remaining = int((locked_until - utcnow()).total_seconds())
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"Account is temporarily locked due to repeated failed attempts. Try again in {max(remaining, 1)} seconds.",
        )


async def _lock_user(db: AsyncIOMotorDatabase, user_id: ObjectId, minutes: int) -> None:
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": {"locked_until": utcnow() + timedelta(minutes=minutes), "failed_attempts": 0}},
    )


async def _create_otp_challenge(db: AsyncIOMotorDatabase, user: dict, purpose: str) -> ChallengeResponse:
    config = await get_active_config(db)
    otp_policy = config.otp_policy
    otp = generate_otp(otp_policy.length)
    now = utcnow()
    doc = {
        "user_id": user["_id"],
        "email": user["email"],
        "purpose": purpose,
        "otp_hash": hash_otp(otp),
        "attempts": 0,
        "max_attempts": otp_policy.max_attempts,
        "resend_count": 0,
        "max_resends": otp_policy.max_resends,
        "last_sent_at": now,
        "expires_at": now + timedelta(minutes=otp_policy.validity_minutes),
        "consumed": False,
        "created_at": now,
    }
    result = await db["otp_challenges"].insert_one(doc)
    send_otp_email(user["email"], otp, purpose, otp_policy.validity_minutes)
    await db["login_history"].insert_one(
        {"user_id": user["_id"], "email": user["email"], "event": "otp_sent", "purpose": purpose, "at": now}
    )
    return ChallengeResponse(
        challenge_id=str(result.inserted_id),
        masked_destination=mask_email(user["email"]),
        expires_in_seconds=otp_policy.validity_minutes * 60,
        resend_cooldown_seconds=otp_policy.resend_cooldown_seconds,
    )


async def start_password_login(
    db: AsyncIOMotorDatabase, email: str, password: str, ip_address: str | None, user_agent: str | None
) -> ChallengeResponse | TokenResponse:
    user = await db["users"].find_one({"email": email.lower()})
    generic_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if user is None:
        raise generic_error
    if user.get("status") != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is inactive. Contact your administrator.")

    await _check_not_locked(user)

    config = await get_active_config(db)

    if not verify_password(password, user["password_hash"]):
        attempts = user.get("failed_attempts", 0) + 1
        await db["users"].update_one({"_id": user["_id"]}, {"$set": {"failed_attempts": attempts}})
        await db["login_history"].insert_one(
            {"user_id": user["_id"], "email": user["email"], "event": "login_failed", "reason": "bad_password", "at": utcnow()}
        )
        if attempts >= config.otp_policy.max_attempts:
            await _lock_user(db, user["_id"], config.otp_policy.lockout_duration_minutes)
            raise HTTPException(status.HTTP_423_LOCKED, "Too many failed attempts. Account has been temporarily locked.")
        raise generic_error

    await db["users"].update_one({"_id": user["_id"]}, {"$set": {"failed_attempts": 0}})

    if not config.require_otp_on_login:
        # Global policy currently skips the OTP step after a correct password — configurable
        # in Global Configuration > Login Security, off by default, admin can re-enable.
        return await _issue_tokens_for_user(db, user, ip_address, user_agent)

    return await _create_otp_challenge(db, user, purpose="login")


async def start_otp_only_login(db: AsyncIOMotorDatabase, email: str) -> ChallengeResponse:
    user = await db["users"].find_one({"email": email.lower()})
    if user is None or user.get("status") != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email")
    if user.get("login_method") != LoginMethod.OTP_ONLY.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This account requires password + OTP login")
    await _check_not_locked(user)
    return await _create_otp_challenge(db, user, purpose="login")


async def resend_otp(db: AsyncIOMotorDatabase, challenge_id: str) -> ChallengeResponse:
    challenge = await db["otp_challenges"].find_one({"_id": _oid(challenge_id, "challenge_id")})
    if challenge is None or challenge["consumed"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Challenge not found or already used")

    config = await get_active_config(db)
    otp_policy = config.otp_policy
    seconds_since_send = (utcnow() - challenge["last_sent_at"]).total_seconds()
    if seconds_since_send < otp_policy.resend_cooldown_seconds:
        wait = int(otp_policy.resend_cooldown_seconds - seconds_since_send)
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Please wait {wait} more second(s) before resending")
    if challenge["resend_count"] >= otp_policy.max_resends:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Maximum OTP resend limit reached. Please restart login.")

    user = await db["users"].find_one({"_id": challenge["user_id"]})
    otp = generate_otp(otp_policy.length)
    now = utcnow()
    await db["otp_challenges"].update_one(
        {"_id": challenge["_id"]},
        {
            "$set": {
                "otp_hash": hash_otp(otp),
                "last_sent_at": now,
                "expires_at": now + timedelta(minutes=otp_policy.validity_minutes),
                "attempts": 0,
            },
            "$inc": {"resend_count": 1},
        },
    )
    send_otp_email(user["email"], otp, challenge["purpose"], otp_policy.validity_minutes)
    return ChallengeResponse(
        challenge_id=str(challenge["_id"]),
        masked_destination=mask_email(user["email"]),
        expires_in_seconds=otp_policy.validity_minutes * 60,
        resend_cooldown_seconds=otp_policy.resend_cooldown_seconds,
    )


async def _enforce_session_limit(db: AsyncIOMotorDatabase, user_id: ObjectId, max_sessions: int) -> None:
    sessions = await db["sessions"].find({"user_id": user_id, "revoked": False}).sort("created_at", 1).to_list(length=100)
    excess = len(sessions) - max_sessions + 1
    if excess > 0:
        oldest_ids = [s["_id"] for s in sessions[:excess]]
        await db["sessions"].update_many({"_id": {"$in": oldest_ids}}, {"$set": {"revoked": True, "revoked_at": utcnow()}})


async def _issue_tokens_for_user(
    db: AsyncIOMotorDatabase, user: dict, ip_address: str | None, user_agent: str | None
) -> TokenResponse:
    """Shared final step of every successful login path (OTP-verified or OTP-skipped):
    creates the session, mints tokens, and records login history/audit."""
    config = await get_active_config(db)
    await _enforce_session_limit(db, user["_id"], config.max_concurrent_sessions)

    now = utcnow()
    session_doc = {
        "user_id": user["_id"],
        "user_agent": user_agent,
        "ip_address": ip_address,
        "created_at": now,
        "last_used_at": now,
        "expires_at": now + timedelta(days=7),
        "revoked": False,
        "revoked_at": None,
    }
    session_result = await db["sessions"].insert_one(session_doc)
    sid = str(session_result.inserted_id)

    access_token = create_token(str(user["_id"]), TokenType.ACCESS, {"sid": sid})
    refresh_token = create_token(str(user["_id"]), TokenType.REFRESH, {"sid": sid})

    await db["users"].update_one(
        {"_id": user["_id"]}, {"$set": {"last_login_at": now, "failed_attempts": 0, "locked_until": None}}
    )
    await db["login_history"].insert_one(
        {
            "user_id": user["_id"],
            "email": user["email"],
            "event": "login_success",
            "ip_address": ip_address,
            "user_agent": user_agent,
            "at": now,
        }
    )
    await record_audit_event(
        db,
        actor_id=str(user["_id"]),
        actor_email=user["email"],
        action="login",
        entity_type="user",
        entity_id=str(user["_id"]),
        ip_address=ip_address,
        user_agent=user_agent,
    )

    user["last_login_at"] = now
    user_summary = await _load_user_summary(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=get_settings().access_token_expire_minutes * 60,
        user=user_summary,
    )


async def verify_login_otp(
    db: AsyncIOMotorDatabase, challenge_id: str, otp: str, ip_address: str | None, user_agent: str | None
) -> TokenResponse:
    challenge = await db["otp_challenges"].find_one({"_id": _oid(challenge_id, "challenge_id")})
    if challenge is None or challenge["consumed"] or challenge["purpose"] != "login":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Challenge not found or already used")
    if challenge["expires_at"] < utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP has expired. Please request a new one.")

    user = await db["users"].find_one({"_id": challenge["user_id"]})
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if not verify_otp(otp, challenge["otp_hash"]):
        attempts = challenge["attempts"] + 1
        await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"attempts": attempts}})
        config = await get_active_config(db)
        if attempts >= challenge["max_attempts"]:
            await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"consumed": True}})
            await _lock_user(db, user["_id"], config.otp_policy.lockout_duration_minutes)
            await db["login_history"].insert_one(
                {"user_id": user["_id"], "email": user["email"], "event": "locked", "reason": "otp_max_attempts", "at": utcnow()}
            )
            raise HTTPException(status.HTTP_423_LOCKED, "Too many incorrect OTP attempts. Account has been temporarily locked.")
        await db["login_history"].insert_one(
            {"user_id": user["_id"], "email": user["email"], "event": "login_failed", "reason": "bad_otp", "at": utcnow()}
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect OTP")

    await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"consumed": True}})
    return await _issue_tokens_for_user(db, user, ip_address, user_agent)


async def refresh_access_token(db: AsyncIOMotorDatabase, refresh_token: str):
    try:
        payload = decode_token(refresh_token, TokenType.REFRESH)
    except pyjwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    sid = payload.get("sid")
    session = await db["sessions"].find_one({"_id": _oid(sid, "session_id")}) if sid else None
    if session is None or session.get("revoked") or session["expires_at"] < utcnow():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session has expired or was revoked. Please log in again.")

    user = await db["users"].find_one({"_id": ObjectId(payload["sub"])})
    if user is None or user.get("status") != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    await db["sessions"].update_one({"_id": session["_id"]}, {"$set": {"last_used_at": utcnow()}})
    access_token = create_token(str(user["_id"]), TokenType.ACCESS, {"sid": sid})
    settings = get_settings()
    return access_token, settings.access_token_expire_minutes * 60


async def logout(db: AsyncIOMotorDatabase, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, TokenType.REFRESH)
    except Exception:
        return
    sid = payload.get("sid")
    if sid:
        await db["sessions"].update_one({"_id": _oid(sid, "session_id")}, {"$set": {"revoked": True, "revoked_at": utcnow()}})


async def list_sessions(db: AsyncIOMotorDatabase, user_id: str, current_sid: str | None) -> list[dict]:
    sessions = await db["sessions"].find({"user_id": _oid(user_id, "user_id"), "revoked": False}).sort("last_used_at", -1).to_list(length=50)
    for s in sessions:
        s["id"] = str(s["_id"])
        s["is_current"] = s["id"] == current_sid
    return sessions


async def revoke_session(db: AsyncIOMotorDatabase, user_id: str, session_id: str) -> None:
    result = await db["sessions"].update_one(
        {"_id": _oid(session_id, "session_id"), "user_id": _oid(user_id, "user_id")},
        {"$set": {"revoked": True, "revoked_at": utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")


async def start_forgot_password(db: AsyncIOMotorDatabase, email: str) -> ChallengeResponse:
    user = await db["users"].find_one({"email": email.lower()})
    if user and user.get("status") == "active":
        return await _create_otp_challenge(db, user, purpose="forgot_password")

    # No such account (or inactive): return a same-shaped, same-timing response built from
    # a challenge id that will never resolve in otp_challenges, so the reset step behaves
    # identically to "wrong OTP" instead of leaking whether the email exists.
    config = await get_active_config(db)
    otp_policy = config.otp_policy
    return ChallengeResponse(
        challenge_id=str(ObjectId()),
        masked_destination=mask_email(email),
        expires_in_seconds=otp_policy.validity_minutes * 60,
        resend_cooldown_seconds=otp_policy.resend_cooldown_seconds,
    )


async def reset_password(db: AsyncIOMotorDatabase, challenge_id: str, otp: str, new_password: str) -> None:
    challenge = await db["otp_challenges"].find_one({"_id": _oid(challenge_id, "challenge_id")})
    if challenge is None or challenge["consumed"] or challenge["purpose"] != "forgot_password":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Challenge not found or already used")
    if challenge["expires_at"] < utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP has expired. Please request a new one.")
    if not verify_otp(otp, challenge["otp_hash"]):
        attempts = challenge["attempts"] + 1
        await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"attempts": attempts}})
        if attempts >= challenge["max_attempts"]:
            await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"consumed": True}})
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Too many incorrect attempts. Please request a new OTP.")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect OTP")

    config = await get_active_config(db)
    validate_password_strength(new_password, config.password_policy)

    user = await db["users"].find_one({"_id": challenge["user_id"]})
    await db["users"].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "must_change_password": False,
                "updated_at": utcnow(),
                "failed_attempts": 0,
                "locked_until": None,
            }
        },
    )
    await db["otp_challenges"].update_one({"_id": challenge["_id"]}, {"$set": {"consumed": True}})
    await db["sessions"].update_many({"user_id": user["_id"], "revoked": False}, {"$set": {"revoked": True, "revoked_at": utcnow()}})
    await record_audit_event(
        db, actor_id=str(user["_id"]), actor_email=user["email"], action="password_reset", entity_type="user", entity_id=str(user["_id"])
    )


async def change_password(db: AsyncIOMotorDatabase, user_id: str, current_password: str, new_password: str) -> None:
    user = await db["users"].find_one({"_id": _oid(user_id, "user_id")})
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if not verify_password(current_password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")

    config = await get_active_config(db)
    validate_password_strength(new_password, config.password_policy)

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(new_password), "must_change_password": False, "updated_at": utcnow()}},
    )
    await record_audit_event(
        db, actor_id=str(user["_id"]), actor_email=user["email"], action="password_change", entity_type="user", entity_id=str(user["_id"])
    )
