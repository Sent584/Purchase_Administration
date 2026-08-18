from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, get_current_user, require_permission
from app.modules.executive.schemas import ApprovalsInbox, ExecutiveOverview
from app.modules.executive import service_approvals, service_overview

router = APIRouter(prefix="/api/v1/executive", tags=["Executive Command Centre"])

read_dep = require_permission("reports:read")


@router.get("/overview", response_model=ExecutiveOverview)
async def executive_overview(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    _: CurrentUser = Depends(read_dep),
):
    # Institution-scoped users cannot override their own institution.
    scoped = user.institution_id or institution_id
    if user.institution_id:
        scoped = user.institution_id
    return await service_overview.get_executive_overview(db, scoped)


@router.get("/approvals", response_model=ApprovalsInbox)
async def executive_approvals(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
    _: CurrentUser = Depends(read_dep),
):
    scoped = user.institution_id or institution_id
    if user.institution_id:
        scoped = user.institution_id
    return await service_approvals.list_pending_approvals(db, scoped)
