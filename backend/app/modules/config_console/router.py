from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.config_console import service
from app.modules.config_console.schemas import GlobalConfigOut, GlobalConfigUpdate

router = APIRouter(prefix="/api/v1/config", tags=["Global Configuration"])


@router.get("", response_model=GlobalConfigOut)
async def read_config(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(require_permission("config:read")),
):
    return await service.get_active_config(db)


@router.put("", response_model=GlobalConfigOut)
async def write_config(
    payload: GlobalConfigUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("config:write")),
):
    return await service.update_config(db, payload, updated_by=current_user.id)
