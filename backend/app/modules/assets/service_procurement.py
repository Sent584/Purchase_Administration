"""Enrich asset with PO, vendor and bill/payment context."""

from __future__ import annotations

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.modules.assets.helpers import oid, str_id


class AssetProcurementOut(BaseModel):
    asset_id: str
    po_id: str | None = None
    po_number: str | None = None
    po_status: str | None = None
    po_grand_total: float | None = None
    payment_terms: str | None = None
    vendor_id: str | None = None
    vendor_name: str | None = None
    vendor_gstin: str | None = None
    vendor_category: str | None = None
    vendor_msme: bool | None = None
    bill_id: str | None = None
    bill_number: str | None = None
    bill_status: str | None = None
    net_payable: float | None = None
    payment_due_date: str | None = None
    payment_status: str = "No linked bill"
    supplier_name: str = ""


def _payment_label(bill_status: str | None) -> str:
    if not bill_status:
        return "No linked bill"
    mapping = {
        "booked": "Pending approval",
        "approved": "Approved / payable",
        "on_hold": "On hold",
        "paid": "Paid",
    }
    return mapping.get(bill_status, bill_status.replace("_", " ").title())


async def get_asset_procurement(db: AsyncIOMotorDatabase, asset_id: str) -> AssetProcurementOut:
    asset = await db["assets"].find_one({"_id": oid(asset_id)})
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")

    po = None
    if asset.get("po_id"):
        po = await db["purchase_orders"].find_one({"_id": asset["po_id"]})
    elif asset.get("grn_id"):
        grn = await db["goods_receipts"].find_one({"_id": asset["grn_id"]})
        if grn and grn.get("po_id"):
            po = await db["purchase_orders"].find_one({"_id": grn["po_id"]})

    vendor = None
    if po and po.get("vendor_id"):
        vendor = await db["vendors"].find_one({"_id": po["vendor_id"]})

    bill = None
    if asset.get("grn_id"):
        bill = await db["purchase_bills"].find_one({"grn_id": asset["grn_id"]})
    if bill is None and po:
        bill = await db["purchase_bills"].find_one({"po_id": po["_id"]})

    due = bill.get("payment_due_date") if bill else None
    due_str = due.isoformat() if hasattr(due, "isoformat") else (str(due) if due else None)
    bill_status = bill.get("status") if bill else None

    return AssetProcurementOut(
        asset_id=str(asset["_id"]),
        po_id=str_id(po["_id"]) if po else str_id(asset.get("po_id")),
        po_number=po.get("po_number") if po else None,
        po_status=po.get("status") if po else None,
        po_grand_total=float(po.get("grand_total") or 0) if po else None,
        payment_terms=po.get("payment_terms") if po else None,
        vendor_id=str_id(vendor["_id"]) if vendor else (str_id(po.get("vendor_id")) if po else None),
        vendor_name=(vendor.get("trade_name") if vendor else None) or (po.get("vendor_name") if po else None) or asset.get("supplier_name") or None,
        vendor_gstin=(vendor.get("gstin") if vendor else None) or (po.get("vendor_gstin") if po else None),
        vendor_category=vendor.get("vendor_category") if vendor else None,
        vendor_msme=bool(vendor.get("msme_registered")) if vendor else None,
        bill_id=str_id(bill["_id"]) if bill else None,
        bill_number=bill.get("bill_number") if bill else None,
        bill_status=bill_status,
        net_payable=float(bill.get("net_payable") or 0) if bill else None,
        payment_due_date=due_str,
        payment_status=_payment_label(bill_status),
        supplier_name=asset.get("supplier_name") or "",
    )
