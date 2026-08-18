from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.vendors.schemas import VendorCreate, VendorOut, VendorStats, VendorUpdate


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> VendorOut:
    data = {**doc, "id": str(doc["_id"]), "institution_id": str(doc["institution_id"])}
    data.pop("_id")
    return VendorOut(**data)


async def create_vendor(db: AsyncIOMotorDatabase, payload: VendorCreate) -> VendorOut:
    institution_oid = _oid(payload.institution_id, "institution_id")
    if await db["institutions"].find_one({"_id": institution_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")

    seq = await next_sequence(db, "vendor_code")
    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id"}),
        "code": f"VEN-{seq:05d}",
        "institution_id": institution_oid,
        "status": "active",
        "rating": {"quality": 0, "delivery": 0, "price": 0, "service": 0},
        "blacklist_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["vendors"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def list_vendors(db: AsyncIOMotorDatabase, institution_id: str | None = None, status_filter: str | None = None) -> list[VendorOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["vendors"].find(query).sort("trade_name", 1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_vendor(db: AsyncIOMotorDatabase, vendor_id: str) -> VendorOut:
    doc = await db["vendors"].find_one({"_id": _oid(vendor_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found")
    return _doc_to_out(doc)


async def update_vendor(db: AsyncIOMotorDatabase, vendor_id: str, payload: VendorUpdate) -> VendorOut:
    oid = _oid(vendor_id)
    if await db["vendors"].find_one({"_id": oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["vendors"].update_one({"_id": oid}, {"$set": changes})
    return await get_vendor(db, vendor_id)


async def blacklist_vendor(db: AsyncIOMotorDatabase, vendor_id: str, reason: str) -> VendorOut:
    oid = _oid(vendor_id)
    if await db["vendors"].find_one({"_id": oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found")
    await db["vendors"].update_one(
        {"_id": oid}, {"$set": {"status": "blacklisted", "blacklist_reason": reason, "updated_at": utcnow()}}
    )
    return await get_vendor(db, vendor_id)


async def reinstate_vendor(db: AsyncIOMotorDatabase, vendor_id: str) -> VendorOut:
    oid = _oid(vendor_id)
    if await db["vendors"].find_one({"_id": oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found")
    await db["vendors"].update_one(
        {"_id": oid}, {"$set": {"status": "active", "blacklist_reason": None, "updated_at": utcnow()}}
    )
    return await get_vendor(db, vendor_id)


async def get_vendor_stats(db: AsyncIOMotorDatabase, vendor_id: str) -> VendorStats:
    oid = _oid(vendor_id)
    if await db["vendors"].find_one({"_id": oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor not found")

    pos = await db["purchase_orders"].find({"vendor_id": oid, "status": {"$ne": "draft"}}).to_list(length=1000)
    grns = await db["grns"].find({"vendor_id": oid}).to_list(length=1000)
    bills = await db["purchase_bills"].find({"vendor_id": oid}).to_list(length=1000)

    total_po_value = round(sum(po["grand_total"] for po in pos), 2)
    total_billed_value = round(sum(b["gross_amount"] for b in bills), 2)

    po_by_id = {po["_id"]: po for po in pos}
    on_time_count = 0
    delivery_grns = 0
    accepted_qty_total = 0.0
    received_qty_total = 0.0
    for grn in grns:
        po = po_by_id.get(grn["po_id"])
        if po and po.get("delivery_date"):
            delivery_grns += 1
            if grn["received_date"] <= po["delivery_date"]:
                on_time_count += 1
        for line in grn["lines"]:
            accepted_qty_total += line["accepted_qty"]
            received_qty_total += line["received_qty"]

    return VendorStats(
        vendor_id=vendor_id,
        total_purchase_orders=len(pos),
        total_po_value=total_po_value,
        total_grns=len(grns),
        total_bills=len(bills),
        total_billed_value=total_billed_value,
        on_time_grn_pct=round(on_time_count / delivery_grns * 100, 1) if delivery_grns else 0.0,
        quality_acceptance_pct=round(accepted_qty_total / received_qty_total * 100, 1) if received_qty_total else 0.0,
    )
