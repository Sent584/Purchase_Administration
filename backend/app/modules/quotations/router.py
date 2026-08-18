from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.quotations import service
from app.modules.quotations.schemas import (
    ComparativeStatement,
    QuotationAward,
    QuotationCreate,
    QuotationOut,
    VendorQuoteInput,
)

router = APIRouter(prefix="/api/v1/purchase/quotations", tags=["Purchase — Quotations"])

read_dep = require_permission("quotation:read")
write_dep = require_permission("quotation:write")
award_dep = require_permission("quotation:award")


@router.post("", response_model=QuotationOut, status_code=201)
async def create_quotation(payload: QuotationCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_quotation(db, payload)


@router.get("", response_model=list[QuotationOut])
async def list_quotations(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_quotations(db, institution_id, status)


@router.get("/{quotation_id}", response_model=QuotationOut)
async def get_quotation(quotation_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_quotation(db, quotation_id)


@router.post("/{quotation_id}/quotes", response_model=QuotationOut)
async def record_vendor_quote(
    quotation_id: str, payload: VendorQuoteInput, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await service.record_vendor_quote(db, quotation_id, payload)


@router.get("/{quotation_id}/comparative", response_model=ComparativeStatement)
async def get_comparative_statement(quotation_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_comparative_statement(db, quotation_id)


@router.post("/{quotation_id}/award", response_model=QuotationOut)
async def award_quotation(
    quotation_id: str, payload: QuotationAward, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(award_dep)
):
    return await service.award_quotation(db, quotation_id, payload.vendor_id, payload.justification)
