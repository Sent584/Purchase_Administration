from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.document_numbers import generate_document_number
from app.modules.grn.schemas import GrnCreate, GrnOut
from app.modules.purchase_common.org_scope import copy_org_scope, org_scope_strings
from app.modules.stores.service_grn_receipt import post_grn_to_stock


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> GrnOut:
    data = {
        **doc,
        "id": str(doc["_id"]),
        "po_id": str(doc["po_id"]),
        "institution_id": str(doc["institution_id"]),
        "vendor_id": str(doc["vendor_id"]),
        **org_scope_strings(doc),
    }
    data.pop("_id")
    return GrnOut(**data)


async def create_grn(db: AsyncIOMotorDatabase, payload: GrnCreate) -> GrnOut:
    po = await db["purchase_orders"].find_one({"_id": _oid(payload.po_id, "po_id")})
    if po is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order not found")
    if po["status"] not in ("issued", "amended"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Goods can only be received against an issued purchase order")

    lines: list[dict] = []
    all_fully_received = True
    any_rejected = False
    for line_input in payload.lines:
        if line_input.line_index < 0 or line_input.line_index >= len(po["lines"]):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid PO line index {line_input.line_index}")
        po_line = po["lines"][line_input.line_index]
        if line_input.accepted_qty + line_input.rejected_qty > line_input.received_qty + 0.001:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Accepted + rejected quantity cannot exceed received quantity")
        if line_input.received_qty > po_line["quantity"] + 0.001:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Received quantity exceeds ordered quantity for '{po_line['description']}'")
        lines.append(
            {
                **line_input.model_dump(),
                "description": po_line["description"],
                "uom": po_line["uom"],
                "ordered_qty": po_line["quantity"],
                "item_id": po_line.get("item_id"),
            }
        )
        if line_input.received_qty < po_line["quantity"] - 0.001:
            all_fully_received = False
        if line_input.rejected_qty > 0:
            any_rejected = True

    quality_status = "rejected" if all(l["accepted_qty"] == 0 for l in lines) else ("partial" if any_rejected or not all_fully_received else "accepted")

    grn_number = await generate_document_number(db, "grn")
    now = utcnow()
    doc = {
        "grn_number": grn_number,
        "po_id": po["_id"],
        "po_number": po["po_number"],
        "institution_id": po["institution_id"],
        "vendor_id": po["vendor_id"],
        "vendor_name": po["vendor_name"],
        **copy_org_scope(po),
        "received_date": now,
        "vendor_invoice_number": payload.vendor_invoice_number,
        "vendor_invoice_date": payload.vendor_invoice_date,
        "lines": lines,
        "quality_status": quality_status,
        "remarks": payload.remarks,
        "created_at": now,
    }
    result = await db["grns"].insert_one(doc)
    doc["_id"] = result.inserted_id

    if any(float(l.get("accepted_qty") or 0) > 0 for l in lines):
        await post_grn_to_stock(db, grn=doc, po=po)

    if all_fully_received and not any_rejected:
        await db["purchase_orders"].update_one({"_id": po["_id"]}, {"$set": {"status": "closed", "updated_at": now}})

    return _doc_to_out(doc)


async def list_grns(db: AsyncIOMotorDatabase, institution_id: str | None = None, po_id: str | None = None) -> list[GrnOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if po_id:
        query["po_id"] = _oid(po_id, "po_id")
    docs = await db["grns"].find(query).sort("created_at", -1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_grn(db: AsyncIOMotorDatabase, grn_id: str) -> GrnOut:
    doc = await db["grns"].find_one({"_id": _oid(grn_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GRN not found")
    return _doc_to_out(doc)
