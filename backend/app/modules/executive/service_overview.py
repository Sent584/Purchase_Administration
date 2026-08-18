"""Cross-function org aggregates for Chairman / Director command centre."""

from __future__ import annotations

from collections import defaultdict

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.dashboard.helpers import count, format_compact, inst_filter
from app.modules.dashboard import metrics as m
from app.modules.executive.schemas import ExecutiveOverview, FunctionPulse, OrgMetricPoint
from app.modules.fees.service import fees_pulse_primary


def _bucket(row: dict, key: str) -> str:
    return (row.get(key) or "").strip() or "Unassigned"


async def _org_spend_buckets(db: AsyncIOMotorDatabase, q: dict) -> tuple[dict, dict, dict]:
    pos = await db["purchase_orders"].find(q).to_list(2000)
    by_c: dict[str, float] = defaultdict(float)
    by_d: dict[str, float] = defaultdict(float)
    by_dept: dict[str, float] = defaultdict(float)
    for p in pos:
        amt = float(p.get("grand_total") or p.get("total_amount") or 0)
        by_c[_bucket(p, "campus_name")] += amt
        by_d[_bucket(p, "division_name")] += amt
        by_dept[_bucket(p, "department_name")] += amt
    return by_c, by_d, by_dept


async def _org_people_buckets(db: AsyncIOMotorDatabase, q: dict) -> tuple[dict, dict, dict]:
    emps = await db["employees"].find(q).to_list(5000)
    by_c: dict[str, int] = defaultdict(int)
    by_d: dict[str, int] = defaultdict(int)
    by_dept: dict[str, int] = defaultdict(int)
    for e in emps:
        by_c[_bucket(e, "campus_name") if e.get("campus_name") else "Campus"] += 1
        by_d[_bucket(e, "division_name") if e.get("division_name") else "Division"] += 1
        by_dept[_bucket(e, "department_name")] += 1
    return by_c, by_d, by_dept


async def _org_stock_buckets(db: AsyncIOMotorDatabase, q: dict) -> tuple[dict, dict, dict]:
    bals = await db["stock_balances"].find(q).to_list(5000)
    by_c: dict[str, float] = defaultdict(float)
    by_d: dict[str, float] = defaultdict(float)
    by_dept: dict[str, float] = defaultdict(float)
    for b in bals:
        val = float(b.get("quantity", 0)) * float(b.get("last_rate", 0))
        by_c[_bucket(b, "campus_name")] += val
        by_d[_bucket(b, "division_name")] += val
        by_dept[_bucket(b, "department_name")] += val
    return by_c, by_d, by_dept


def _merge_points(
    spend: dict[str, float],
    headcount: dict[str, int],
    stock: dict[str, float],
    pending: dict[str, int] | None = None,
    limit: int = 8,
) -> list[OrgMetricPoint]:
    pending = pending or {}
    names = set(spend) | set(headcount) | set(stock) | set(pending)
    points = [
        OrgMetricPoint(
            name=n[:28],
            spend=round(spend.get(n, 0), 2),
            headcount=headcount.get(n, 0),
            stock_value=round(stock.get(n, 0), 2),
            pending_approvals=pending.get(n, 0),
        )
        for n in names
        if n != "Unassigned" or spend.get(n) or headcount.get(n) or stock.get(n)
    ]
    points.sort(key=lambda p: -(p.spend + p.stock_value + p.headcount * 1000))
    return points[:limit]


async def get_executive_overview(
    db: AsyncIOMotorDatabase, institution_id: str | None = None
) -> ExecutiveOverview:
    q = inst_filter(institution_id)
    people = await m.people_snapshot(db, institution_id)
    purchase = await m.purchase_pipeline(db, institution_id)
    finance = await m.finance_snapshot(db, institution_id)
    stores = await m.stores_snapshot(db, institution_id)
    assets = await m.assets_snapshot(db, institution_id)
    att = await m.attendance_today(db, institution_id)
    payroll = await m.payroll_snapshot(db, institution_id)

    spend_c, spend_d, spend_dept = await _org_spend_buckets(db, q)
    hc_c, hc_d, hc_dept = await _org_people_buckets(db, q)
    st_c, st_d, st_dept = await _org_stock_buckets(db, q)

    pending = (
        int(people["leave_pending"])
        + int(purchase["open_indents"])
        + int(purchase["bills_pending"])
        + int(finance["pending_vouchers"])
        + (1 if payroll.get("pending") else 0)
    )

    return ExecutiveOverview(
        institutions=await count(db, "institutions", {}),
        campuses=await count(db, "campuses", q if institution_id else {}),
        divisions=await count(db, "org_units", {**q, "unit_type": "division"} if institution_id else {"unit_type": "division"}),
        departments=await count(
            db, "org_units", {**q, "unit_type": {"$in": ["department", "office", "laboratory"]}} if institution_id else {"unit_type": {"$in": ["department", "office", "laboratory"]}}
        ),
        headcount=int(people["headcount"]),
        po_spend=float(purchase["po_spend"]),
        cash_position=float(finance["cash"]),
        stock_value=float(stores["value"]),
        asset_book=float(assets["book"]),
        pending_approvals=pending,
        attendance_pct=float(att["pct"]),
        budget_pct=float(finance["budget_pct"]),
        by_campus=_merge_points(spend_c, hc_c, st_c),
        by_division=_merge_points(spend_d, hc_d, st_d),
        by_department=_merge_points(spend_dept, hc_dept, st_dept),
        functions=_function_pulses(purchase, people, finance, stores, assets, att, payroll),
    )


def _function_pulses(purchase, people, finance, stores, assets, att, payroll) -> list[FunctionPulse]:
    fees_primary, fees_secondary = fees_pulse_primary()
    return [
        FunctionPulse(key="purchase", label="Purchase", primary=format_compact(float(purchase["po_spend"])), secondary=f"{purchase['open_indents']} open PRs · {purchase['bills_pending']} bills", tone="crimson", href="/purchase"),
        FunctionPulse(key="people", label="People", primary=str(people["headcount"]), secondary=f"{people['leave_pending']} leave pending · {att['pct']}% present", tone="sky", href="/hr"),
        FunctionPulse(key="finance", label="Finance", primary=format_compact(finance["cash"]), secondary=f"{finance['budget_pct']}% budget used · {finance['pending_vouchers']} vouchers", tone="gold", href="/accounts"),
        FunctionPulse(key="fees", label="Student Fees", primary=fees_primary, secondary=fees_secondary, tone="amber", href="/fees"),
        FunctionPulse(key="stores", label="Stores", primary=format_compact(float(stores["value"])), secondary=f"{stores['below_reorder']} below reorder", tone="emerald", href="/stores"),
        FunctionPulse(key="assets", label="Assets", primary=format_compact(float(assets["book"])), secondary=f"{assets['count']} assets on register", tone="amber", href="/assets"),
        FunctionPulse(key="payroll", label="Payroll", primary=str(payroll["status"]).title(), secondary=f"{payroll['period']} · net {format_compact(payroll['net'])}", tone="ink", href="/payroll"),
    ]
