from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.document_numbers import generate_document_number
from app.modules.purchase_common.org_scope import copy_org_scope, org_scope_strings
from app.modules.quotations.schemas import (
    ComparativeRow,
    ComparativeStatement,
    QuotationCreate,
    QuotationOut,
    VendorQuoteInput,
)


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> QuotationOut:
    data = {
        **doc,
        "id": str(doc["_id"]),
        "institution_id": str(doc["institution_id"]),
        "indent_id": str(doc["indent_id"]),
        **org_scope_strings(doc),
    }
    data.pop("_id")
    return QuotationOut(**data)


async def _get_raw(db: AsyncIOMotorDatabase, quotation_id: str) -> dict:
    doc = await db["quotations"].find_one({"_id": _oid(quotation_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Quotation not found")
    return doc


async def create_quotation(db: AsyncIOMotorDatabase, payload: QuotationCreate) -> QuotationOut:
    indent_oid = _oid(payload.indent_id, "indent_id")
    indent = await db["indents"].find_one({"_id": indent_oid})
    if indent is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Indent not found")
    if indent["status"] != "approved":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only approved indents can go out for quotation")
    if payload.procurement_method.value == "limited_quotation" and len(payload.vendor_ids) < 3:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Limited quotation purchase requires a minimum of three invited vendors (Sasurie Purchase Policy)",
        )

    for vid in payload.vendor_ids:
        vendor = await db["vendors"].find_one({"_id": _oid(vid, "vendor_id")})
        if vendor is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Vendor {vid} not found")
        if vendor["status"] == "blacklisted":
            raise HTTPException(status.HTTP_409_CONFLICT, f"Vendor '{vendor['trade_name']}' is blacklisted and cannot be invited")

    rfq_number = await generate_document_number(db, "rfq")
    now = utcnow()
    doc = {
        "rfq_number": rfq_number,
        "institution_id": _oid(payload.institution_id, "institution_id"),
        "indent_id": indent_oid,
        **copy_org_scope(indent),
        "vendor_ids": payload.vendor_ids,
        "procurement_method": payload.procurement_method.value,
        "lines": [{"item_id": line.get("item_id"), "description": line["description"], "quantity": line["quantity"], "uom": line["uom"]} for line in indent["lines"]],
        "quotes": [],
        "status": "rfq_sent",
        "awarded_vendor_id": None,
        "award_justification": "",
        "created_at": now,
        "updated_at": now,
    }
    result = await db["quotations"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def list_quotations(db: AsyncIOMotorDatabase, institution_id: str | None = None, status_filter: str | None = None) -> list[QuotationOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["quotations"].find(query).sort("created_at", -1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_quotation(db: AsyncIOMotorDatabase, quotation_id: str) -> QuotationOut:
    return _doc_to_out(await _get_raw(db, quotation_id))


async def record_vendor_quote(db: AsyncIOMotorDatabase, quotation_id: str, payload: VendorQuoteInput) -> QuotationOut:
    doc = await _get_raw(db, quotation_id)
    if doc["status"] not in ("rfq_sent", "quotes_received"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Quotes can only be recorded while the RFQ is open")
    if payload.vendor_id not in doc["vendor_ids"]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "This vendor was not invited to this RFQ")

    quote_doc = {**payload.model_dump(), "submitted_at": utcnow()}
    quotes = [q for q in doc["quotes"] if q["vendor_id"] != payload.vendor_id]
    quotes.append(quote_doc)

    await db["quotations"].update_one(
        {"_id": doc["_id"]}, {"$set": {"quotes": quotes, "status": "quotes_received", "updated_at": utcnow()}}
    )
    return await get_quotation(db, quotation_id)


async def get_comparative_statement(db: AsyncIOMotorDatabase, quotation_id: str) -> ComparativeStatement:
    doc = await _get_raw(db, quotation_id)
    rows: list[ComparativeRow] = []
    for quote in doc["quotes"]:
        vendor = await db["vendors"].find_one({"_id": _oid(quote["vendor_id"])})
        vendor_name = vendor["trade_name"] if vendor else "Unknown vendor"
        lines_total = sum(line["rate"] * next(l["quantity"] for l in doc["lines"] if l["description"] == line["description"]) for line in quote["lines"])
        gst_amount = sum(
            line["rate"] * next(l["quantity"] for l in doc["lines"] if l["description"] == line["description"]) * line["gst_rate"] / 100
            for line in quote["lines"]
        )
        rows.append(
            ComparativeRow(
                vendor_id=quote["vendor_id"],
                vendor_name=vendor_name,
                lines_total=round(lines_total, 2),
                freight=quote["freight"],
                installation=quote["installation"],
                other_charges=quote["other_charges"],
                gst_amount=round(gst_amount, 2),
                rank=0,
                is_l1=False,
                delivery_days=quote["delivery_days"],
                remarks=quote["remarks"],
            )
        )

    rows.sort(key=lambda r: r.landed_cost)
    for idx, row in enumerate(rows):
        row.rank = idx + 1
        row.is_l1 = idx == 0

    return ComparativeStatement(
        quotation_id=str(doc["_id"]),
        rfq_number=doc["rfq_number"],
        rows=rows,
        l1_vendor_id=rows[0].vendor_id if rows else None,
    )


async def award_quotation(db: AsyncIOMotorDatabase, quotation_id: str, vendor_id: str, justification: str) -> QuotationOut:
    doc = await _get_raw(db, quotation_id)
    if doc["status"] != "quotes_received":
        raise HTTPException(status.HTTP_409_CONFLICT, "Quotation must have received quotes before it can be awarded")

    comparative = await get_comparative_statement(db, quotation_id)
    if vendor_id not in [row.vendor_id for row in comparative.rows]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "This vendor has not submitted a quote")
    if vendor_id != comparative.l1_vendor_id and not justification.strip():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "A written justification is required to award to a non-L1 vendor (Sasurie Purchase Policy)",
        )

    await db["quotations"].update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "awarded", "awarded_vendor_id": vendor_id, "award_justification": justification, "updated_at": utcnow()}},
    )
    return await get_quotation(db, quotation_id)
