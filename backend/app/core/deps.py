from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import TokenType, decode_token
from app.modules.rbac.permissions import SUPER_ADMIN_CODE

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str
    full_name: str
    group_id: str | None = None
    institution_id: str | None = None
    campus_id: str | None = None
    department_id: str | None = None
    role_codes: list[str] = []
    permissions: list[str] = []
    session_id: str | None = None

    def has_permission(self, code: str) -> bool:
        return SUPER_ADMIN_CODE in self.permissions or code in self.permissions


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(credentials.credentials, TokenType.ACCESS)
        user_oid = ObjectId(payload["sub"])
    except (PyJWTError, InvalidId, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})

    user = await db["users"].find_one({"_id": user_oid})
    if user is None or user.get("status") != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive", headers={"WWW-Authenticate": "Bearer"})

    role_ids = user.get("role_ids", [])
    roles = await db["roles"].find({"_id": {"$in": role_ids}, "is_active": True}).to_list(length=100)
    permissions: set[str] = set()
    for role in roles:
        permissions.update(role.get("permissions", []))

    scope = user.get("scope", {})
    return CurrentUser(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        group_id=str(scope["group_id"]) if scope.get("group_id") else None,
        institution_id=str(scope["institution_id"]) if scope.get("institution_id") else None,
        campus_id=str(scope["campus_id"]) if scope.get("campus_id") else None,
        department_id=str(scope["department_id"]) if scope.get("department_id") else None,
        role_codes=[r["code"] for r in roles],
        permissions=sorted(permissions),
        session_id=payload.get("sid"),
    )


def require_permission(permission: str):
    async def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not current_user.has_permission(permission):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Missing required permission: {permission}")
        return current_user

    return checker


def require_any_permission(*permissions: str):
    async def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(current_user.has_permission(p) for p in permissions):
            needed = " or ".join(permissions)
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Missing required permission: {needed}")
        return current_user

    return checker


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
