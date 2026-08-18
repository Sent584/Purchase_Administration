from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.document_numbers import generate_document_number
from app.modules.purchase_common.org_scope import copy_org_scope, org_scope_strings
from app.modules.purchase_orders.schemas import (
    PoLineInput,
    PurchaseOrderDirectCreate,
    PurchaseOrderFromQuotation,
    PurchaseOrderOut,
)


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> PurchaseOrderOut:
    data = {
        **doc,
        "id": str(doc["_id"]),
        "institution_id": str(doc["institution_id"]),
        "vendor_id": str(doc["vendor_id"]),
        "quotation_id": str(doc["quotation_id"]) if doc.get("quotation_id") else None,
        "indent_id": str(doc["indent_id"]) if doc.get("indent_id") else None,
        **org_scope_strings(doc),
    }
    data.pop("_id")
    return PurchaseOrderOut(**data)


def _compute_lines(lines: list[PoLineInput], is_intra_state: bool) -> tuple[list[dict], float, float, float]:
    computed: list[dict] = []
    subtotal = 0.0
    total_gst = 0.0
    for line in lines:
        taxable = round(line.quantity * line.rate, 2)
        gst_amount = round(taxable * line.gst_rate / 100, 2)
        cgst = round(gst_amount / 2, 2) if is_intra_state else 0.0
        sgst = round(gst_amount / 2, 2) if is_intra_state else 0.0
        igst = round(gst_amount, 2) if not is_intra_state else 0.0
        computed.append(
            {
                **line.model_dump(),
                "taxable_amount": taxable,
                "cgst_amount": cgst,
                "sgst_amount": sgst,
                "igst_amount": igst,
                "line_total": round(taxable + gst_amount, 2),
            }
        )
        subtotal += taxable
        total_gst += gst_amount
    return computed, round(subtotal, 2), round(total_gst, 2), round(subtotal + total_gst, 2)


async def _issue_purchase_order(
    db: AsyncIOMotorDatabase,
    *,
    institution: dict,
    vendor: dict,
    lines: list[PoLineInput],
    procurement_method: str,
    proprietary_certificate_reason: str,
    delivery_date,
    payment_terms: str,
    warranty_terms: str,
    penalty_clause: str,
    quotation_id: ObjectId | None,
    indent_id: ObjectId | None,
    org_scope: dict | None = None,
) -> PurchaseOrderOut:
    institution_state = institution.get("address", {}).get("state", "")
    vendor_state = vendor.get("address", {}).get("state", "")
    is_intra_state = bool(institution_state) and institution_state == vendor_state

    computed_lines, subtotal, total_gst, grand_total = _compute_lines(lines, is_intra_state)
    po_number = await generate_document_number(db, "purchase_order")
    now = utcnow()

    doc = {
        "po_number": po_number,
        "version": 1,
        "institution_id": institution["_id"],
        "vendor_id": vendor["_id"],
        "vendor_name": vendor["trade_name"],
        "vendor_gstin": vendor.get("gstin", ""),
        "quotation_id": quotation_id,
        "indent_id": indent_id,
        **(org_scope or {}),
        "procurement_method": procurement_method,
        "proprietary_certificate_reason": proprietary_certificate_reason,
        "place_of_supply": institution_state,
        "lines": computed_lines,
        "subtotal": subtotal,
        "total_gst": total_gst,
        "grand_total": grand_total,
        "delivery_date": delivery_date,
        "payment_terms": payment_terms,
        "warranty_terms": warranty_terms,
        "penalty_clause": penalty_clause,
        "status": "draft",
        "cancellation_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["purchase_orders"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def create_po_from_quotation(db: AsyncIOMotorDatabase, quotation_id: str, payload: PurchaseOrderFromQuotation) -> PurchaseOrderOut:
    quotation = await db["quotations"].find_one({"_id": _oid(quotation_id, "quotation_id")})
    if quotation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Quotation not found")
    if quotation["status"] != "awarded":
        raise HTTPException(status.HTTP_409_CONFLICT, "Quotation must be awarded before a purchase order can be generated")
    if await db["purchase_orders"].find_one({"quotation_id": quotation["_id"]}):
        raise HTTPException(status.HTTP_409_CONFLICT, "A purchase order has already been generated for this quotation")

    vendor = await db["vendors"].find_one({"_id": _oid(quotation["awarded_vendor_id"])})
    institution = await db["institutions"].find_one({"_id": quotation["institution_id"]})
    if vendor is None or institution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor or institution not found")

    awarded_quote = next(q for q in quotation["quotes"] if q["vendor_id"] == quotation["awarded_vendor_id"])
    rfq_lines_by_desc = {line["description"]: line for line in quotation["lines"]}
    po_lines = [
        PoLineInput(
            item_id=rfq_lines_by_desc[qline["description"]].get("item_id"),
            description=qline["description"],
            quantity=rfq_lines_by_desc[qline["description"]]["quantity"],
            uom=rfq_lines_by_desc[qline["description"]]["uom"],
            rate=qline["rate"],
            gst_rate=qline["gst_rate"],
        )
        for qline in awarded_quote["lines"]
    ]
    if awarded_quote["freight"] or awarded_quote["installation"] or awarded_quote["other_charges"]:
        for label, amount in (("Freight & Forwarding", awarded_quote["freight"]), ("Installation & Commissioning", awarded_quote["installation"]), ("Other Charges", awarded_quote["other_charges"])):
            if amount:
                po_lines.append(PoLineInput(description=label, quantity=1, uom="Lot", rate=amount, gst_rate=18.0))

    return await _issue_purchase_order(
        db,
        institution=institution,
        vendor=vendor,
        lines=po_lines,
        procurement_method=quotation["procurement_method"],
        proprietary_certificate_reason="",
        delivery_date=payload.delivery_date,
        payment_terms=payload.payment_terms,
        warranty_terms=payload.warranty_terms,
        penalty_clause=payload.penalty_clause,
        quotation_id=quotation["_id"],
        indent_id=quotation["indent_id"],
        org_scope=copy_org_scope(quotation),
    )


async def create_po_direct(db: AsyncIOMotorDatabase, payload: PurchaseOrderDirectCreate) -> PurchaseOrderOut:
    if payload.procurement_method == "proprietary" and not payload.proprietary_certificate_reason.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Proprietary purchases require a proprietary article certificate reason")

    vendor = await db["vendors"].find_one({"_id": _oid(payload.vendor_id, "vendor_id")})
    institution = await db["institutions"].find_one({"_id": _oid(payload.institution_id, "institution_id")})
    if vendor is None or institution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendor or institution not found")
    if vendor["status"] == "blacklisted":
        raise HTTPException(status.HTTP_409_CONFLICT, f"Vendor '{vendor['trade_name']}' is blacklisted")

    return await _issue_purchase_order(
        db,
        institution=institution,
        vendor=vendor,
        lines=payload.lines,
        procurement_method=payload.procurement_method.value,
        proprietary_certificate_reason=payload.proprietary_certificate_reason,
        delivery_date=payload.delivery_date,
        payment_terms=payload.payment_terms,
        warranty_terms=payload.warranty_terms,
        penalty_clause=payload.penalty_clause,
        quotation_id=None,
        indent_id=None,
    )


async def list_purchase_orders(db: AsyncIOMotorDatabase, institution_id: str | None = None, status_filter: str | None = None) -> list[PurchaseOrderOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["purchase_orders"].find(query).sort("created_at", -1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_purchase_order(db: AsyncIOMotorDatabase, po_id: str) -> PurchaseOrderOut:
    doc = await db["purchase_orders"].find_one({"_id": _oid(po_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order not found")
    return _doc_to_out(doc)


async def issue_purchase_order(db: AsyncIOMotorDatabase, po_id: str) -> PurchaseOrderOut:
    oid = _oid(po_id)
    doc = await db["purchase_orders"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order not found")
    if doc["status"] != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only draft purchase orders can be issued")
    await db["purchase_orders"].update_one({"_id": oid}, {"$set": {"status": "issued", "updated_at": utcnow()}})
    return await get_purchase_order(db, po_id)


async def cancel_purchase_order(db: AsyncIOMotorDatabase, po_id: str, reason: str) -> PurchaseOrderOut:
    oid = _oid(po_id)
    doc = await db["purchase_orders"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order not found")
    if doc["status"] in ("cancelled", "closed"):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Purchase order is already {doc['status']}")
    if not reason.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "A cancellation reason is required")
    await db["purchase_orders"].update_one(
        {"_id": oid}, {"$set": {"status": "cancelled", "cancellation_reason": reason, "updated_at": utcnow()}}
    )
    return await get_purchase_order(db, po_id)
