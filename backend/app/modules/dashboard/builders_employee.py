"""Employee self-service role home."""

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


async def build_employee_home(
    db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None, email: str
) -> RoleHomeDashboard:
    emp = await db["employees"].find_one({"official_email": email.lower()})
    eid = str(emp["_id"]) if emp else None
    leave_bal: list = []
    my_apps = 0
    if eid:
        leave_bal = await db["leave_balances"].find({"employee_id": eid}).to_list(20)
        my_apps = await db["leave_applications"].count_documents({"employee_id": eid, "status": "submitted"})
    payslip = None
    if eid:
        payslip = await db["payslips"].find_one({"employee_id": eid}, sort=[("_id", -1)])
    if not payslip and emp:
        payslip = await db["payslips"].find_one({"employee_name": emp.get("display_name")}, sort=[("_id", -1)])
    att = await m.attendance_today(db, institution_id)
    bal_series = [(b.get("leave_type_code", "LV"), float(b.get("balance", 0))) for b in leave_bal[:6]]
    if not bal_series:
        bal_series = [("CL", 10), ("EL", 15), ("RH", 2)]
    net = float(payslip.get("net", 0)) if payslip else 0.0
    return RoleHomeDashboard(
        role_code="employee",
        role_label=ROLE_LABELS["employee"],
        eyebrow="My workspace",
        title="Self-Service Desk",
        subtitle="Your leave, attendance and payslip — quick actions for day-to-day campus life.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="dept", label="Department", value=(emp or {}).get("department_name", "—")[:18], tone="crimson"),
            HomeKpi(key="desig", label="Designation", value=(emp or {}).get("designation", "Staff")[:18], tone="gold"),
            HomeKpi(key="apps", label="My leave apps", value=str(my_apps), tone="amber"),
            HomeKpi(key="cl", label="CL balance", value=str(next((int(v) for k, v in bal_series if k == "CL"), 0)), tone="sky"),
            HomeKpi(key="net", label="Last net pay", value=format_compact(net) if net else "—", tone="emerald"),
            HomeKpi(key="campus", label="Campus presence", value=f"{att['pct']}%", tone="ink"),
        ],
        series_title="My leave balances",
        series_unit="days",
        series=[HomeSeriesPoint(label=k, value=v) for k, v in bal_series],
        actions=[
            HomeAction(title="Apply leave", detail="Casual / earned / restricted holiday", href="/attendance/leave", urgency="medium", badge="Leave"),
            HomeAction(title="View attendance", detail="Check today's biometric mark", href="/attendance/daily", urgency="low", badge="Att"),
            HomeAction(title="My payslips", detail="Download latest salary slip", href="/payroll/payslips", urgency="low", badge="Pay"),
            HomeAction(title="Update profile", detail="View HR employee record", href="/hr/employees", urgency="low", badge="HR"),
        ],
        insights=[
            HomeInsight(title="Approvals", description="Leave goes to HoD / Principal before debit.", icon="clock"),
            HomeInsight(title="Payslip privacy", description="Only your slips are visible with payroll:read.", icon="shield"),
            HomeInsight(title="Campus pulse", description=f"{att['present']} colleagues present today.", icon="users"),
        ],
        quick_links=[
            HomeQuickLink(to="/attendance/leave", label="Leave", hint="Apply & track"),
            HomeQuickLink(to="/attendance", label="Attendance", hint="Daily status"),
            HomeQuickLink(to="/payroll/payslips", label="Payslips", hint="Salary history"),
            HomeQuickLink(to="/hr", label="Directory", hint="People overview"),
        ],
        highlight_label="Latest net pay",
        highlight_value=format_inr(net) if net else "—",
        highlight_hint=(emp or {}).get("display_name") or name,
    )
