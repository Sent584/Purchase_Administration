from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.rbac import service
from app.modules.rbac.permissions import PERMISSIONS
from app.modules.rbac.schemas import RoleCreate, RoleOut, RoleUpdate

router = APIRouter(prefix="/api/v1/rbac", tags=["Roles & Permissions"])


@router.get("/permissions")
async def list_permissions(_: CurrentUser = Depends(require_permission("role:read"))):
    return PERMISSIONS


@router.get("/roles", response_model=list[RoleOut])
async def list_roles(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(require_permission("role:read")),
):
    return await service.list_roles(db)


@router.post("/roles", response_model=RoleOut, status_code=201)
async def create_role(
    payload: RoleCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(require_permission("role:write")),
):
    return await service.create_role(db, payload)


@router.patch("/roles/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: str,
    payload: RoleUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(require_permission("role:write")),
):
    return await service.update_role(db, role_id, payload)
