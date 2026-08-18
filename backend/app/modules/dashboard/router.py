from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, get_current_user
from app.modules.dashboard.schemas import RoleHomeDashboard
from app.modules.dashboard.service import get_role_home

router = APIRouter(prefix="/api/v1/dashboard", tags=["Role Dashboard"])


@router.get("/home", response_model=RoleHomeDashboard)
async def role_home(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> RoleHomeDashboard:
    """Authenticated role-aware home analytics for the signed-in user."""
    return await get_role_home(db, user)
