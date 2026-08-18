"""Unified pending approvals for Chairman / Director desk."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.dashboard.helpers import inst_filter
from app.modules.executive.schemas import ApprovalItem, ApprovalsInbox


def _scope(doc: dict) -> dict:
    return {
        "campus_name": doc.get("campus_name") or "",
        "division_name": doc.get("division_name") or "",
        "department_name": doc.get("department_name") or "",
    }


async def list_pending_approvals(
    db: AsyncIOMotorDatabase, institution_id: str | None = None
) -> ApprovalsInbox:
    q = inst_filter(institution_id)
    items: list[ApprovalItem] = []

    for doc in await db["indents"].find({**q, "status": {"$in": ["submitted", "pending_approval"]}}).sort("created_at", -1).to_list(80):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Purchase Requisition",
            title=doc.get("indent_number") or "PR",
            subtitle=f"{doc.get('requested_by_name') or 'Requester'} · {doc.get('priority', '')}",
            amount=float(doc.get("total_estimated_amount") or 0),
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/purchase/requisitions",
            action="approve",
            permission="indent:approve",
            **_scope(doc),
        ))

    for doc in await db["quotations"].find({**q, "status": {"$in": ["quotes_received", "under_evaluation", "open"]}}).sort("created_at", -1).to_list(40):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Quotation / RFQ",
            title=doc.get("rfq_number") or "RFQ",
            subtitle=f"{len(doc.get('quotes') or [])} quotes · award decision",
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/purchase/quotations",
            action="award",
            permission="quotation:award",
            **_scope(doc),
        ))

    for doc in await db["purchase_orders"].find({**q, "status": "draft"}).sort("created_at", -1).to_list(40):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Purchase Order",
            title=doc.get("po_number") or "PO",
            subtitle=doc.get("vendor_name") or "Vendor",
            amount=float(doc.get("grand_total") or 0),
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/purchase/orders",
            action="issue",
            permission="po:approve",
            **_scope(doc),
        ))

    for doc in await db["purchase_bills"].find({**q, "status": {"$in": ["booked", "pending_approval", "submitted"]}}).sort("created_at", -1).to_list(40):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Purchase Bill",
            title=doc.get("bill_number") or "Bill",
            subtitle=doc.get("vendor_name") or "Vendor",
            amount=float(doc.get("net_payable") or 0),
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/purchase/bills",
            action="approve",
            permission="bill:approve",
            **_scope(doc),
        ))

    for doc in await db["leave_applications"].find({**q, "status": "submitted"}).sort("created_at", -1).to_list(80):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Leave",
            title=f"{doc.get('employee_name') or 'Employee'} · {doc.get('leave_type') or 'Leave'}",
            subtitle=f"{doc.get('from_date') or ''} → {doc.get('to_date') or ''}",
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/attendance/leave",
            action="approve",
            permission="leave:approve",
            **_scope(doc),
        ))

    for doc in await db["payroll_runs"].find({**q, "status": {"$in": ["computed", "pending_approval"]}}).sort("created_at", -1).to_list(20):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Payroll",
            title=doc.get("period_label") or doc.get("period") or "Payroll run",
            subtitle=f"Net {doc.get('net_payable') or doc.get('total_net') or 0}",
            amount=float(doc.get("net_payable") or doc.get("total_net") or 0),
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/payroll/runs",
            action="approve",
            permission="payroll:approve",
        ))

    for doc in await db["vouchers"].find({**q, "status": {"$in": ["draft", "validated"]}}).sort("created_at", -1).to_list(40):
        items.append(ApprovalItem(
            id=str(doc["_id"]),
            domain="Voucher",
            title=doc.get("voucher_number") or "Voucher",
            subtitle=doc.get("narration") or doc.get("voucher_type") or "",
            amount=float(doc.get("amount") or doc.get("total_amount") or 0),
            status=doc.get("status", ""),
            created_at=doc.get("created_at"),
            href="/accounts/vouchers",
            action="approve",
            permission="accounts:approve",
        ))

    items.sort(key=lambda i: i.created_at or 0, reverse=True)
    return ApprovalsInbox(total=len(items), items=items)
