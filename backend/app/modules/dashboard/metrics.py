"""Metric collectors used by role home builders."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.dashboard.helpers import count, inst_filter


async def purchase_pipeline(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict[str, int | float]:
    q = inst_filter(institution_id)
    indents = await db["indents"].find(q).to_list(300)
    quotations = await db["quotations"].find(q).to_list(300)
    pos = await db["purchase_orders"].find(q).to_list(300)
    bills = await db["purchase_bills"].find(q).to_list(300)
    open_indents = sum(1 for i in indents if i.get("status") in ("submitted", "approved", "draft"))
    pending_award = sum(1 for r in quotations if r.get("status") in ("open", "quoted", "under_evaluation"))
    awaiting_grn = sum(1 for p in pos if p.get("status") in ("approved", "issued", "partially_received"))
    bills_pending = sum(1 for b in bills if b.get("status") in ("draft", "submitted", "pending_approval"))
    spend = sum(float(p.get("grand_total") or p.get("total_amount") or 0) for p in pos)
    return {
        "vendors": await count(db, "vendors", q),
        "open_indents": open_indents,
        "pending_award": pending_award,
        "awaiting_grn": awaiting_grn,
        "bills_pending": bills_pending,
        "po_spend": spend,
        "po_count": len(pos),
    }


async def people_snapshot(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    q = inst_filter(institution_id)
    emps = await db["employees"].find(q).to_list(5000)
    by_dept: dict[str, int] = {}
    teaching = probation = 0
    for e in emps:
        dept = e.get("department_name") or "Other"
        by_dept[dept] = by_dept.get(dept, 0) + 1
        if e.get("employee_category") == "teaching":
            teaching += 1
        if e.get("employment_type") == "probation":
            probation += 1
    top = sorted(by_dept.items(), key=lambda x: -x[1])[:8]
    leave_pending = await count(db, "leave_applications", {**q, "status": "submitted"})
    return {
        "headcount": len(emps),
        "teaching": teaching,
        "probation": probation,
        "leave_pending": leave_pending,
        "by_dept": top,
    }


async def finance_snapshot(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    q = inst_filter(institution_id)
    banks = await db["bank_accounts_finance"].find(q).to_list(100)
    cash = sum(float(b.get("current_balance", 0)) for b in banks)
    budgets = await db["budgets"].find(q).to_list(1000)
    allocated = sum(float(b.get("allocated", 0)) for b in budgets) or 1.0
    utilised = sum(float(b.get("committed", 0)) + float(b.get("actual", 0)) for b in budgets)
    pending_v = await count(
        db, "vouchers", {**q, "status": {"$in": ["draft", "validated", "approved"]}}
    )
    posted_v = await count(db, "vouchers", {**q, "status": "posted"})
    return {
        "cash": cash,
        "budget_pct": round(100 * utilised / allocated, 1),
        "pending_vouchers": pending_v,
        "posted_vouchers": posted_v,
        "banks": len(banks),
        "budget_rows": [
            (b.get("cost_centre_code") or b.get("account_code") or "CC", float(b.get("allocated", 0)))
            for b in budgets[:8]
        ],
    }


async def stores_snapshot(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    q = inst_filter(institution_id)
    stores = await count(db, "stores", q)
    balances = await db["stock_balances"].find(q).to_list(5000)
    value = sum(float(b.get("quantity", 0)) * float(b.get("last_rate", 0)) for b in balances)
    below = sum(1 for b in balances if float(b.get("quantity", 0)) <= float(b.get("reorder_level", 0) or 0))
    txns = await count(db, "stock_transactions", q)
    by_store: dict[str, float] = {}
    for b in balances:
        key = str(b.get("store_code") or b.get("store_id") or "Store")
        by_store[key] = by_store.get(key, 0) + float(b.get("quantity", 0)) * float(b.get("last_rate", 0))
    return {
        "stores": stores,
        "sku": len(balances),
        "value": value,
        "below_reorder": below,
        "txns": txns,
        "by_store": sorted(by_store.items(), key=lambda x: -x[1])[:8],
    }


async def assets_snapshot(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    q = inst_filter(institution_id)
    assets = await db["assets"].find(q).to_list(5000)
    book = sum(float(a.get("book_value") or a.get("capitalization_value") or 0) for a in assets)
    by_class: dict[str, int] = {}
    for a in assets:
        cls = a.get("asset_class") or a.get("category") or "General"
        by_class[cls] = by_class.get(cls, 0) + 1
    return {
        "count": len(assets),
        "book": book,
        "by_class": sorted(by_class.items(), key=lambda x: -x[1])[:8],
    }


async def payroll_snapshot(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    q = inst_filter(institution_id)
    runs = await db["payroll_runs"].find(q).sort([("period_year", -1), ("period_month", -1)]).to_list(20)
    latest = runs[0] if runs else None
    pending = sum(1 for r in runs if r.get("status") in ("draft", "review"))
    return {
        "runs": len(runs),
        "pending": pending,
        "net": float(latest.get("net_total", 0)) if latest else 0.0,
        "paid_count": int(latest.get("employee_count", 0)) if latest else 0,
        "status": latest.get("status") if latest else "—",
        "period": f"{latest.get('period_month', 0):02d}/{latest.get('period_year', '')}" if latest else "—",
    }


async def attendance_today(db: AsyncIOMotorDatabase, institution_id: str | None) -> dict:
    from datetime import date

    q = {**inst_filter(institution_id), "date": date.today().isoformat()}
    docs = await db["attendance_records"].find(q).to_list(5000)
    present = sum(1 for d in docs if d.get("status") == "present")
    absent = sum(1 for d in docs if d.get("status") == "absent")
    on_leave = sum(1 for d in docs if d.get("status") == "on_leave")
    total = len(docs) or 1
    return {
        "present": present,
        "absent": absent,
        "on_leave": on_leave,
        "pct": round(100 * present / total, 1),
        "total": len(docs),
    }
