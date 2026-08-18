from datetime import timedelta

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.document_numbers import generate_document_number
from app.modules.purchase_bills.schemas import PurchaseBillCreate, PurchaseBillOut
from app.modules.purchase_common.org_scope import copy_org_scope, org_scope_strings

# Placeholder rate table — belongs to the future Statutory Rule Engine (spec §5.4) once
# built, where these become admin-editable, versioned, effective-dated records with
# proper eligibility rules. Vendor-specific lower-deduction certificates already override
# this at the point of use.
TDS_SECTION_RATES: dict[str, float] = {
    "none": 0.0,
    "194C": 2.0,
    "194J": 10.0,
    "194I": 10.0,
    "194Q": 0.1,
}

MSME_PAYMENT_WINDOW_DAYS = 45
DEFAULT_PAYMENT_WINDOW_DAYS = 30


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> PurchaseBillOut:
    data = {
        **doc,
        "id": str(doc["_id"]),
        "po_id": str(doc["po_id"]),
        "grn_id": str(doc["grn_id"]),
        "institution_id": str(doc["institution_id"]),
        "vendor_id": str(doc["vendor_id"]),
        **org_scope_strings(doc),
    }
    data.pop("_id")
    return PurchaseBillOut(**data)


async def create_bill(db: AsyncIOMotorDatabase, payload: PurchaseBillCreate) -> PurchaseBillOut:
    grn = await db["grns"].find_one({"_id": _oid(payload.grn_id, "grn_id")})
    if grn is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "GRN not found")
    if await db["purchase_bills"].find_one({"grn_id": grn["_id"]}):
        raise HTTPException(status.HTTP_409_CONFLICT, "A bill has already been booked against this GRN")

    po = await db["purchase_orders"].find_one({"_id": grn["po_id"]})
    vendor = await db["vendors"].find_one({"_id": grn["vendor_id"]})
    if po is None or vendor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order or vendor not found")

    # Three-way match by construction: bill amounts are derived from GRN-accepted
    # quantities against PO-agreed rates, never re-keyed — so PO/GRN/bill can only ever
    # match. Genuine amount disputes are a debit-note / credit-note flow, not this endpoint.
    bill_lines = []
    taxable_total = cgst_total = sgst_total = igst_total = 0.0
    for grn_line in grn["lines"]:
        po_line = po["lines"][grn_line["line_index"]]
        if po_line["quantity"] == 0:
            continue
        ratio = grn_line["accepted_qty"] / po_line["quantity"]
        taxable = round(po_line["taxable_amount"] * ratio, 2)
        cgst = round(po_line["cgst_amount"] * ratio, 2)
        sgst = round(po_line["sgst_amount"] * ratio, 2)
        igst = round(po_line["igst_amount"] * ratio, 2)
        bill_lines.append(
            {
                "description": po_line["description"],
                "quantity": grn_line["accepted_qty"],
                "uom": po_line["uom"],
                "rate": po_line["rate"],
                "taxable_amount": taxable,
                "gst_rate": po_line["gst_rate"],
                "cgst_amount": cgst,
                "sgst_amount": sgst,
                "igst_amount": igst,
                "line_total": round(taxable + cgst + sgst + igst, 2),
            }
        )
        taxable_total += taxable
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst

    gross_amount = round(taxable_total + cgst_total + sgst_total + igst_total, 2)

    tds_section = vendor.get("tds_section", "none")
    if vendor.get("lower_deduction_certificate_rate") is not None:
        tds_rate = vendor["lower_deduction_certificate_rate"]
    else:
        tds_rate = TDS_SECTION_RATES.get(tds_section, 0.0)
    tds_amount = round(taxable_total * tds_rate / 100, 2)
    net_payable = round(gross_amount - tds_amount, 2)

    msme_registered = bool(vendor.get("msme_registered"))
    window = MSME_PAYMENT_WINDOW_DAYS if msme_registered else DEFAULT_PAYMENT_WINDOW_DAYS
    payment_due_date = payload.vendor_invoice_date + timedelta(days=window)

    bill_number = await generate_document_number(db, "purchase_bill")
    now = utcnow()
    doc = {
        "bill_number": bill_number,
        "po_id": po["_id"],
        "po_number": po["po_number"],
        "grn_id": grn["_id"],
        "grn_number": grn["grn_number"],
        "institution_id": po["institution_id"],
        "vendor_id": vendor["_id"],
        "vendor_name": vendor["trade_name"],
        "vendor_gstin": vendor.get("gstin", ""),
        **copy_org_scope(po),
        "vendor_invoice_number": payload.vendor_invoice_number,
        "vendor_invoice_date": payload.vendor_invoice_date,
        "lines": bill_lines,
        "taxable_amount": round(taxable_total, 2),
        "cgst_amount": round(cgst_total, 2),
        "sgst_amount": round(sgst_total, 2),
        "igst_amount": round(igst_total, 2),
        "gross_amount": gross_amount,
        "tds_section": tds_section,
        "tds_rate": tds_rate,
        "tds_amount": tds_amount,
        "net_payable": net_payable,
        "msme_registered": msme_registered,
        "payment_due_date": payment_due_date,
        "three_way_match_status": "matched",
        "status": "booked",
        "approver_notes": "",
        "approved_by": None,
        "approved_at": None,
        "created_at": now,
    }
    result = await db["purchase_bills"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def list_bills(db: AsyncIOMotorDatabase, institution_id: str | None = None, status_filter: str | None = None) -> list[PurchaseBillOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["purchase_bills"].find(query).sort("created_at", -1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_bill(db: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    doc = await db["purchase_bills"].find_one({"_id": _oid(bill_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase bill not found")
    return _doc_to_out(doc)


async def approve_bill(db: AsyncIOMotorDatabase, bill_id: str, approver_email: str, notes: str) -> PurchaseBillOut:
    oid = _oid(bill_id)
    doc = await db["purchase_bills"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase bill not found")
    if doc["status"] != "booked":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only booked bills can be approved")
    now = utcnow()
    await db["purchase_bills"].update_one(
        {"_id": oid}, {"$set": {"status": "approved", "approver_notes": notes, "approved_by": approver_email, "approved_at": now}}
    )
    return await get_bill(db, bill_id)


async def hold_bill(db: AsyncIOMotorDatabase, bill_id: str, approver_email: str, notes: str) -> PurchaseBillOut:
    oid = _oid(bill_id)
    doc = await db["purchase_bills"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase bill not found")
    if doc["status"] != "booked":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only booked bills can be put on hold")
    now = utcnow()
    await db["purchase_bills"].update_one(
        {"_id": oid}, {"$set": {"status": "on_hold", "approver_notes": notes, "approved_by": approver_email, "approved_at": now}}
    )
    return await get_bill(db, bill_id)
