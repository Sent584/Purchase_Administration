from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.document_numbers import generate_document_number
from app.modules.accounts.helpers import oid, str_id
from app.modules.accounts.schemas import (
    TrialBalanceRow,
    VoucherCreate,
    VoucherOut,
    VoucherStatus,
)


def _to_voucher(doc: dict) -> VoucherOut:
    return VoucherOut(**str_id(doc, "institution_id"))


async def create_voucher(db: AsyncIOMotorDatabase, payload: VoucherCreate) -> VoucherOut:
    institution_oid = oid(payload.institution_id, "institution_id")
    now = utcnow()
    number = await generate_document_number(db, "voucher")
    total_debit = round(sum(l.debit for l in payload.lines), 2)
    total_credit = round(sum(l.credit for l in payload.lines), 2)
    doc = {
        "voucher_number": number,
        "voucher_type": payload.voucher_type.value,
        "date": payload.date or now,
        "narration": payload.narration,
        "lines": [l.model_dump() for l in payload.lines],
        "status": VoucherStatus.DRAFT.value,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "institution_id": institution_oid,
        "created_by_name": payload.created_by_name,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["vouchers"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_voucher(doc)


async def list_vouchers(
    db: AsyncIOMotorDatabase, institution_id: str | None = None, status_filter: str | None = None
) -> list[VoucherOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["vouchers"].find(query).sort("date", -1).to_list(length=500)
    return [_to_voucher(d) for d in docs]


async def get_voucher(db: AsyncIOMotorDatabase, voucher_id: str) -> VoucherOut:
    doc = await db["vouchers"].find_one({"_id": oid(voucher_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Voucher not found")
    return _to_voucher(doc)


async def _set_status(db: AsyncIOMotorDatabase, voucher_id: str, from_statuses: set[str], to_status: str) -> VoucherOut:
    doc = await db["vouchers"].find_one({"_id": oid(voucher_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Voucher not found")
    if doc["status"] not in from_statuses:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Cannot transition from {doc['status']} to {to_status}")
    await db["vouchers"].update_one({"_id": doc["_id"]}, {"$set": {"status": to_status, "updated_at": utcnow()}})
    return await get_voucher(db, voucher_id)


async def validate_voucher(db: AsyncIOMotorDatabase, voucher_id: str) -> VoucherOut:
    return await _set_status(db, voucher_id, {VoucherStatus.DRAFT.value}, VoucherStatus.VALIDATED.value)


async def approve_voucher(db: AsyncIOMotorDatabase, voucher_id: str) -> VoucherOut:
    return await _set_status(db, voucher_id, {VoucherStatus.VALIDATED.value}, VoucherStatus.APPROVED.value)


async def post_voucher(db: AsyncIOMotorDatabase, voucher_id: str) -> VoucherOut:
    return await _set_status(db, voucher_id, {VoucherStatus.APPROVED.value}, VoucherStatus.POSTED.value)


async def reverse_voucher(db: AsyncIOMotorDatabase, voucher_id: str) -> VoucherOut:
    """Posted vouchers are immutable — only reversal is allowed."""
    return await _set_status(db, voucher_id, {VoucherStatus.POSTED.value}, VoucherStatus.REVERSED.value)


async def trial_balance(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[TrialBalanceRow]:
    query: dict = {"status": VoucherStatus.POSTED.value}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    vouchers = await db["vouchers"].find(query).to_list(length=5000)
    accounts = {a["code"]: a for a in await db["chart_of_accounts"].find({}).to_list(length=1000)}
    totals: dict[str, dict[str, float]] = {}
    for v in vouchers:
        for line in v.get("lines", []):
            code = line["account_code"]
            bucket = totals.setdefault(code, {"debit": 0.0, "credit": 0.0})
            bucket["debit"] += float(line.get("debit", 0))
            bucket["credit"] += float(line.get("credit", 0))
    rows = []
    for code, amounts in sorted(totals.items()):
        acct = accounts.get(code, {})
        rows.append(
            TrialBalanceRow(
                account_code=code,
                account_name=acct.get("name", code),
                account_type=acct.get("account_type", ""),
                debit=round(amounts["debit"], 2),
                credit=round(amounts["credit"], 2),
            )
        )
    return rows
