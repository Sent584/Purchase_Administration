import secrets
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def _secret_for(token_type: TokenType) -> str:
    settings = get_settings()
    return settings.jwt_access_secret if token_type is TokenType.ACCESS else settings.jwt_refresh_secret


def create_token(subject: str, token_type: TokenType, extra_claims: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    if token_type is TokenType.ACCESS:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    else:
        expires_delta = timedelta(days=settings.refresh_token_expire_days)

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_urlsafe(16),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, _secret_for(token_type), algorithm=settings.jwt_algorithm)


def decode_token(token: str, token_type: TokenType) -> dict[str, Any]:
    settings = get_settings()
    payload = jwt.decode(token, _secret_for(token_type), algorithms=[settings.jwt_algorithm])
    if payload.get("type") != token_type.value:
        raise jwt.InvalidTokenError("Unexpected token type")
    return payload


def generate_otp(length: int = 6) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def hash_otp(otp: str) -> str:
    return pwd_context.hash(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    return pwd_context.verify(otp, otp_hash)
