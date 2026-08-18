"""Role home builders — finance, HR, payroll."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.dashboard import metrics as m
from app.modules.dashboard.helpers import ROLE_LABELS, format_compact, format_inr
from app.modules.dashboard.schemas import (
    HomeAction,
    HomeInsight,
    HomeKpi,
    HomeQuickLink,
    HomeSeriesPoint,
    RoleHomeDashboard,
)


async def build_finance_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    finance = await m.finance_snapshot(db, institution_id)
    payroll = await m.payroll_snapshot(db, institution_id)
    purchase = await m.purchase_pipeline(db, institution_id)
    return RoleHomeDashboard(
        role_code="finance_officer",
        role_label=ROLE_LABELS["finance_officer"],
        eyebrow="Finance office",
        title="Treasury & Compliance Desk",
        subtitle="Cash, budgets, vouchers, purchase bills and statutory payroll for Sasurie campuses.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="cash", label="Cash position", value=format_compact(finance["cash"]), tone="crimson"),
            HomeKpi(key="bud", label="Budget utilised", value=f"{finance['budget_pct']}%", tone="gold"),
            HomeKpi(key="pv", label="Pending vouchers", value=str(finance["pending_vouchers"]), tone="amber"),
            HomeKpi(key="post", label="Posted vouchers", value=str(finance["posted_vouchers"]), tone="emerald"),
            HomeKpi(key="bill", label="Bills approval", value=str(purchase["bills_pending"]), tone="sky"),
            HomeKpi(key="net", label="Latest net pay", value=format_compact(payroll["net"]), sub=payroll["period"], tone="ink"),
        ],
        series_title="Budget allocations",
        series_unit="₹",
        series=[HomeSeriesPoint(label=str(k)[:18], value=v) for k, v in finance["budget_rows"]],
        actions=[
            HomeAction(title="Post vouchers", detail=f"{finance['pending_vouchers']} in draft/validated/approved", href="/accounts/vouchers", urgency="high", badge="GL"),
            HomeAction(title="Review budgets", detail=f"{finance['budget_pct']}% utilised this FY", href="/accounts/budgets", urgency="medium", badge="Budget"),
            HomeAction(title="Purchase bills", detail=f"{purchase['bills_pending']} bills pending finance action", href="/purchase/bills", urgency="high" if purchase["bills_pending"] else "low", badge="Bill"),
            HomeAction(title="Payroll lock", detail=f"Run {payroll['period']} · {payroll['status']}", href="/payroll/runs", urgency="medium", badge="Pay"),
        ],
        insights=[
            HomeInsight(title="Bank accounts", description=f"{finance['banks']} linked accounts feeding cash position.", icon="wallet"),
            HomeInsight(title="Immutable postings", description="Posted vouchers can only be reversed — never edited.", icon="shield"),
            HomeInsight(title="TDS / MSME", description="Purchase bills carry TDS section and MSME clocks.", icon="file"),
        ],
        quick_links=[
            HomeQuickLink(to="/accounts", label="Accounts home", hint="Cash & voucher KPIs"),
            HomeQuickLink(to="/accounts/trial-balance", label="Trial balance", hint="FY ledger view"),
            HomeQuickLink(to="/payroll", label="Payroll", hint="Statutory runs"),
            HomeQuickLink(to="/purchase/bills", label="Bills", hint="Vendor invoices"),
        ],
        highlight_label="Cash on hand",
        highlight_value=format_inr(finance["cash"]),
        highlight_hint=f"Across {finance['banks']} bank accounts · FY 2025-26",
    )


async def build_hr_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    people = await m.people_snapshot(db, institution_id)
    att = await m.attendance_today(db, institution_id)
    payroll = await m.payroll_snapshot(db, institution_id)
    return RoleHomeDashboard(
        role_code="hr_manager",
        role_label=ROLE_LABELS["hr_manager"],
        eyebrow="People operations",
        title="HR Command Desk",
        subtitle="Headcount, probation, leave desk and attendance pulse for Sasurie Engineering & Arts.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="hc", label="Headcount", value=str(people["headcount"]), tone="crimson"),
            HomeKpi(key="teach", label="Teaching", value=str(people["teaching"]), tone="sky"),
            HomeKpi(key="prob", label="On probation", value=str(people["probation"]), tone="amber"),
            HomeKpi(key="leave", label="Leave queue", value=str(people["leave_pending"]), tone="gold"),
            HomeKpi(key="pres", label="Present today", value=f"{att['pct']}%", tone="emerald"),
            HomeKpi(key="pay", label="Last paid", value=str(payroll["paid_count"]), sub=payroll["period"], tone="ink"),
        ],
        series_title="Staff by department",
        series_unit="staff",
        series=[HomeSeriesPoint(label=k[:22], value=float(v)) for k, v in people["by_dept"]],
        actions=[
            HomeAction(title="Leave approvals", detail=f"{people['leave_pending']} submitted applications", href="/attendance/leave", urgency="high", badge="Leave"),
            HomeAction(title="Probation list", detail=f"{people['probation']} employees on probation", href="/hr/employees", urgency="medium", badge="HR"),
            HomeAction(title="Attendance exceptions", detail=f"{att['absent']} absent · {att['on_leave']} on leave", href="/attendance/daily", urgency="medium", badge="Att"),
            HomeAction(title="Designations", detail="Maintain UGC/pay levels and grades", href="/hr/designations", urgency="low", badge="Master"),
        ],
        insights=[
            HomeInsight(title="Masked PII", description="PAN and bank tails masked unless hr:sensitive.", icon="shield"),
            HomeInsight(title="Faculty mix", description=f"{people['teaching']} teaching of {people['headcount']} total.", icon="users"),
            HomeInsight(title="Attendance feed", description="Biometric-style daily marks ready for payroll.", icon="clock"),
        ],
        quick_links=[
            HomeQuickLink(to="/hr", label="HR dashboard", hint="Workforce KPIs"),
            HomeQuickLink(to="/hr/employees", label="Employees", hint="360° profiles"),
            HomeQuickLink(to="/attendance", label="Attendance", hint="Daily presence"),
            HomeQuickLink(to="/payroll", label="Payroll read", hint="Payslip status"),
        ],
        highlight_label="Leave desk",
        highlight_value=str(people["leave_pending"]),
        highlight_hint="Applications awaiting HoD / Principal action",
    )


async def build_payroll_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    payroll = await m.payroll_snapshot(db, institution_id)
    people = await m.people_snapshot(db, institution_id)
    att = await m.attendance_today(db, institution_id)
    return RoleHomeDashboard(
        role_code="payroll_officer",
        role_label=ROLE_LABELS["payroll_officer"],
        eyebrow="Payroll cycle",
        title="Statutory Payroll Desk",
        subtitle="Process, review, approve and lock monthly runs with EPF, ESI and TN professional tax.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="runs", label="Runs this FY", value=str(payroll["runs"]), tone="crimson"),
            HomeKpi(key="st", label="Latest status", value=str(payroll["status"]).title(), sub=payroll["period"], tone="gold"),
            HomeKpi(key="paid", label="Employees paid", value=str(payroll["paid_count"]), tone="sky"),
            HomeKpi(key="net", label="Net disbursed", value=format_compact(payroll["net"]), tone="emerald"),
            HomeKpi(key="pend", label="Pending runs", value=str(payroll["pending"]), tone="amber"),
            HomeKpi(key="att", label="Attendance %", value=f"{att['pct']}%", tone="ink"),
        ],
        series_title="Department headcount (pay base)",
        series_unit="staff",
        series=[HomeSeriesPoint(label=k[:22], value=float(v)) for k, v in people["by_dept"]],
        actions=[
            HomeAction(title="Open payroll runs", detail=f"{payroll['pending']} draft/review runs", href="/payroll/runs", urgency="high", badge="Run"),
            HomeAction(title="Payslips", detail=f"{payroll['paid_count']} slips in latest locked month", href="/payroll/payslips", urgency="medium", badge="Slip"),
            HomeAction(title="Attendance transfer", detail="Confirm biometric marks before process", href="/attendance/daily", urgency="medium", badge="Att"),
            HomeAction(title="Salary structures", detail="Verify component masters before cycle", href="/payroll", urgency="low", badge="Master"),
        ],
        insights=[
            HomeInsight(title="EPF wage ceiling", description="Employee & employer PF on wage up to ₹15,000.", icon="wallet"),
            HomeInsight(title="ESI threshold", description="ESI applies when gross ≤ ₹21,000.", icon="file"),
            HomeInsight(title="TN PT slabs", description="Professional tax deducted per TN monthly slabs.", icon="chart"),
        ],
        quick_links=[
            HomeQuickLink(to="/payroll", label="Payroll home", hint="Cycle KPIs"),
            HomeQuickLink(to="/payroll/runs", label="Runs", hint="Process · approve · lock"),
            HomeQuickLink(to="/payroll/payslips", label="Payslips", hint="Employee-wise"),
            HomeQuickLink(to="/hr", label="HR", hint="Employee masters"),
        ],
        highlight_label="Latest net pay",
        highlight_value=format_inr(payroll["net"]),
        highlight_hint=f"{payroll['period']} · {payroll['status']} · {payroll['paid_count']} staff",
    )
