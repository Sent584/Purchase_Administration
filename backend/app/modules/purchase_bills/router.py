from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.purchase_bills import service
from app.modules.purchase_bills.schemas import PurchaseBillCreate, PurchaseBillDecision, PurchaseBillOut

router = APIRouter(prefix="/api/v1/purchase/bills", tags=["Purchase — Bills"])

read_dep = require_permission("bill:read")
write_dep = require_permission("bill:write")
approve_dep = require_permission("bill:approve")


@router.post("", response_model=PurchaseBillOut, status_code=201)
async def create_bill(payload: PurchaseBillCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_bill(db, payload)


@router.get("", response_model=list[PurchaseBillOut])
async def list_bills(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_bills(db, institution_id, status)


@router.get("/{bill_id}", response_model=PurchaseBillOut)
async def get_bill(bill_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_bill(db, bill_id)


@router.post("/{bill_id}/approve", response_model=PurchaseBillOut)
async def approve_bill(
    bill_id: str, payload: PurchaseBillDecision, db: AsyncIOMotorDatabase = Depends(get_db), current_user: CurrentUser = Depends(approve_dep)
):
    return await service.approve_bill(db, bill_id, current_user.email, payload.notes)


@router.post("/{bill_id}/hold", response_model=PurchaseBillOut)
async def hold_bill(
    bill_id: str, payload: PurchaseBillDecision, db: AsyncIOMotorDatabase = Depends(get_db), current_user: CurrentUser = Depends(approve_dep)
):
    return await service.hold_bill(db, bill_id, current_user.email, payload.notes)
