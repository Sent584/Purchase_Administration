"""Role home builders — executive, principal, admin."""

from __future__ import annotations

from app.modules.dashboard.helpers import ROLE_LABELS, count, format_compact, format_inr
from app.modules.dashboard import metrics as m
from app.modules.dashboard.schemas import (
    HomeAction,
    HomeInsight,
    HomeKpi,
    HomeQuickLink,
    HomeSeriesPoint,
    RoleHomeDashboard,
)
from motor.motor_asyncio import AsyncIOMotorDatabase


async def build_exec_home(
    db: AsyncIOMotorDatabase,
    *,
    role_code: str,
    name: str,
    institution_id: str | None,
) -> RoleHomeDashboard:
    people = await m.people_snapshot(db, institution_id)
    purchase = await m.purchase_pipeline(db, institution_id)
    finance = await m.finance_snapshot(db, institution_id)
    payroll = await m.payroll_snapshot(db, institution_id)
    stores = await m.stores_snapshot(db, institution_id)
    att = await m.attendance_today(db, institution_id)
    institutions = await count(db, "institutions", {})
    campuses = await count(db, "campuses", {})

    is_super = role_code in ("super_admin", "chairman")
    return RoleHomeDashboard(
        role_code=role_code,
        role_label=ROLE_LABELS.get(role_code, role_code),
        eyebrow="Group command centre" if is_super else "Institution cockpit",
        title="Sasurie Group ERP" if is_super else "Institution Operations",
        subtitle=(
            "Cross-campus control plane — live pulse, org drill-down and executive approvals."
            if is_super
            else "Live view of people, procure-to-pay, payroll and finance for your campus."
        ),
        greeting_name=name,
        kpis=[
            HomeKpi(key="inst", label="Institutions", value=str(institutions), tone="crimson"),
            HomeKpi(key="camp", label="Campuses", value=str(campuses), tone="gold"),
            HomeKpi(key="hc", label="Headcount", value=str(people["headcount"]), tone="sky"),
            HomeKpi(key="spend", label="PO Spend", value=format_compact(float(purchase["po_spend"])), tone="emerald"),
            HomeKpi(key="cash", label="Cash position", value=format_compact(finance["cash"]), tone="amber"),
            HomeKpi(key="att", label="Present today", value=f"{att['pct']}%", sub=f"{att['present']} marked", tone="ink"),
        ],
        series_title="Workforce by department",
        series_unit="staff",
        series=[HomeSeriesPoint(label=k[:22], value=float(v)) for k, v in people["by_dept"]],
        actions=[
            HomeAction(
                title="Executive command centre",
                detail="Campus · division · department pulse across all functions",
                href="/executive",
                urgency="high",
                badge="Exec",
            ),
            HomeAction(
                title="Approvals inbox",
                detail=f"{purchase['open_indents'] + people['leave_pending'] + purchase['bills_pending']} items needing decision",
                href="/executive/approvals",
                urgency="high",
                badge="Approve",
            ),
            HomeAction(
                title="Purchase pipeline",
                detail=f"{purchase['open_indents']} indents · {purchase['pending_award']} RFQs · {purchase['bills_pending']} bills",
                href="/purchase",
                urgency="medium",
                badge="P2P",
            ),
            HomeAction(
                title="Stores health",
                detail=f"{stores['below_reorder']} SKUs at/below reorder · stock {format_compact(stores['value'])}",
                href="/stores",
                urgency="high" if stores["below_reorder"] else "low",
                badge="Stock",
            ),
        ],
        insights=[
            HomeInsight(title="Budget utilisation", description=f"{finance['budget_pct']}% of FY allocations committed/spent.", icon="chart"),
            HomeInsight(title="Teaching strength", description=f"{people['teaching']} teaching staff across departments.", icon="users"),
            HomeInsight(title="Statutory payroll", description="EPF / ESI / TN PT computed on locked runs.", icon="wallet"),
        ],
        quick_links=[
            HomeQuickLink(to="/executive", label="Command centre", hint="Cross-function dashboards"),
            HomeQuickLink(to="/executive/approvals", label="Approvals", hint="Unified inbox"),
            HomeQuickLink(to="/org", label="Organisation", hint="Group · campuses · units"),
            HomeQuickLink(to="/reports", label="Reports", hint="Cross-module analytics"),
        ],
        highlight_label="Net payroll (latest)",
        highlight_value=format_inr(payroll["net"]),
        highlight_hint=f"{payroll['paid_count']} employees · {payroll['period']}",
    )


async def build_principal_home(
    db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None
) -> RoleHomeDashboard:
    people = await m.people_snapshot(db, institution_id)
    purchase = await m.purchase_pipeline(db, institution_id)
    finance = await m.finance_snapshot(db, institution_id)
    payroll = await m.payroll_snapshot(db, institution_id)
    att = await m.attendance_today(db, institution_id)
    assets = await m.assets_snapshot(db, institution_id)

    return RoleHomeDashboard(
        role_code="principal",
        role_label=ROLE_LABELS["principal"],
        eyebrow="Principal desk",
        title="Campus Decision Centre",
        subtitle="Approvals, academic workforce health, and institutional financial pulse for Sasurie.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="hc", label="Active staff", value=str(people["headcount"]), tone="crimson"),
            HomeKpi(key="pres", label="Attendance today", value=f"{att['pct']}%", sub=f"{att['absent']} absent", tone="sky"),
            HomeKpi(key="leave", label="Leave approvals", value=str(people["leave_pending"]), tone="amber"),
            HomeKpi(key="po", label="PO approvals / GRN", value=str(purchase["awaiting_grn"]), tone="gold"),
            HomeKpi(key="pay", label="Payroll status", value=str(payroll["status"]).title(), sub=payroll["period"], tone="emerald"),
            HomeKpi(key="bud", label="Budget used", value=f"{finance['budget_pct']}%", tone="ink"),
        ],
        series_title="Department strength",
        series_unit="staff",
        series=[HomeSeriesPoint(label=k[:22], value=float(v)) for k, v in people["by_dept"]],
        actions=[
            HomeAction(title="Command centre", detail="Campus · division · department pulse", href="/executive", urgency="high", badge="Exec"),
            HomeAction(title="Approvals inbox", detail=f"{people['leave_pending'] + purchase['open_indents']} items awaiting decision", href="/executive/approvals", urgency="high", badge="Approve"),
            HomeAction(title="Approve leave", detail=f"{people['leave_pending']} pending applications", href="/attendance/leave", urgency="high", badge="Leave"),
            HomeAction(title="Award quotations", detail=f"{purchase['pending_award']} RFQs under evaluation", href="/purchase/quotations", urgency="medium", badge="RFQ"),
            HomeAction(title="Approve POs", detail=f"{purchase['open_indents']} open indents in pipeline", href="/purchase/orders", urgency="medium", badge="PO"),
            HomeAction(title="Payroll approve", detail=f"Latest run {payroll['period']} · {payroll['status']}", href="/payroll/runs", urgency="high" if payroll["pending"] else "low", badge="Pay"),
        ],
        insights=[
            HomeInsight(title="Probation watch", description=f"{people['probation']} staff still on probation.", icon="clock"),
            HomeInsight(title="Asset base", description=f"{assets['count']} assets · book {format_compact(assets['book'])}.", icon="server"),
            HomeInsight(title="Cash & banks", description=f"{format_compact(finance['cash'])} across {finance['banks']} accounts.", icon="wallet"),
        ],
        quick_links=[
            HomeQuickLink(to="/executive", label="Command centre", hint="Org drill-down"),
            HomeQuickLink(to="/executive/approvals", label="Approvals", hint="Unified inbox"),
            HomeQuickLink(to="/hr", label="HR overview", hint="Headcount & faculty mix"),
            HomeQuickLink(to="/purchase", label="Purchase", hint="P2P pipeline"),
        ],
        highlight_label="Campus presence",
        highlight_value=f"{att['pct']}%",
        highlight_hint=f"{att['present']} present · {att['on_leave']} on leave · {att['absent']} absent",
    )
