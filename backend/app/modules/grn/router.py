from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.grn import service
from app.modules.grn.schemas import GrnCreate, GrnOut

router = APIRouter(prefix="/api/v1/purchase/grn", tags=["Purchase — GRN"])

read_dep = require_permission("grn:read")
write_dep = require_permission("grn:write")


@router.post("", response_model=GrnOut, status_code=201)
async def create_grn(payload: GrnCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_grn(db, payload)


@router.get("", response_model=list[GrnOut])
async def list_grns(
    institution_id: str | None = Query(default=None),
    po_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_grns(db, institution_id, po_id)


@router.get("/{grn_id}", response_model=GrnOut)
async def get_grn(grn_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_grn(db, grn_id)
