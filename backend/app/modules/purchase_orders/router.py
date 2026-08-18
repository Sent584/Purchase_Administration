from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.purchase_orders import service
from app.modules.purchase_orders.schemas import (
    PurchaseOrderDirectCreate,
    PurchaseOrderFromQuotation,
    PurchaseOrderOut,
)

router = APIRouter(prefix="/api/v1/purchase/orders", tags=["Purchase — Orders"])

read_dep = require_permission("po:read")
write_dep = require_permission("po:write")
approve_dep = require_permission("po:approve")


class CancelPoRequest(BaseModel):
    reason: str


@router.post("/from-quotation/{quotation_id}", response_model=PurchaseOrderOut, status_code=201)
async def create_po_from_quotation(
    quotation_id: str, payload: PurchaseOrderFromQuotation, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await service.create_po_from_quotation(db, quotation_id, payload)


@router.post("", response_model=PurchaseOrderOut, status_code=201)
async def create_po_direct(payload: PurchaseOrderDirectCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_po_direct(db, payload)


@router.get("", response_model=list[PurchaseOrderOut])
async def list_purchase_orders(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_purchase_orders(db, institution_id, status)


@router.get("/{po_id}", response_model=PurchaseOrderOut)
async def get_purchase_order(po_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_purchase_order(db, po_id)


@router.post("/{po_id}/issue", response_model=PurchaseOrderOut)
async def issue_purchase_order(po_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(approve_dep)):
    return await service.issue_purchase_order(db, po_id)


@router.post("/{po_id}/cancel", response_model=PurchaseOrderOut)
async def cancel_purchase_order(
    po_id: str, payload: CancelPoRequest, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(approve_dep)
):
    return await service.cancel_purchase_order(db, po_id, payload.reason)
