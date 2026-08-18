from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.payroll.helpers import oid, str_id
from app.modules.payroll.schemas import PayrollDashboard, PayrollRunOut, PayrollRunStatus, PayslipOut


def _to_payslip(doc: dict) -> PayslipOut:
    data = str_id(doc, "institution_id", "payroll_run_id")
    if hasattr(data.get("payroll_run_id"), "__str__") and not isinstance(data["payroll_run_id"], str):
        data["payroll_run_id"] = str(doc["payroll_run_id"])
    return PayslipOut(**data)


async def list_payslips(
    db: AsyncIOMotorDatabase, run_id: str | None = None, institution_id: str | None = None
) -> list[PayslipOut]:
    query: dict = {}
    if run_id:
        query["payroll_run_id"] = oid(run_id)
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["payslips"].find(query).sort("employee_name", 1).to_list(length=2000)
    return [_to_payslip(d) for d in docs]


async def get_payslip(db: AsyncIOMotorDatabase, payslip_id: str) -> PayslipOut:
    doc = await db["payslips"].find_one({"_id": oid(payslip_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payslip not found")
    return _to_payslip(doc)


async def approve_run(db: AsyncIOMotorDatabase, run_id: str) -> PayrollRunOut:
    from app.modules.payroll.run_service import get_run

    run = await db["payroll_runs"].find_one({"_id": oid(run_id)})
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll run not found")
    if run["status"] != PayrollRunStatus.REVIEW.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only runs in review can be approved")
    await db["payroll_runs"].update_one(
        {"_id": run["_id"]}, {"$set": {"status": PayrollRunStatus.APPROVED.value, "updated_at": utcnow()}}
    )
    return await get_run(db, run_id)


async def lock_run(db: AsyncIOMotorDatabase, run_id: str) -> PayrollRunOut:
    from app.modules.payroll.run_service import get_run

    run = await db["payroll_runs"].find_one({"_id": oid(run_id)})
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll run not found")
    if run["status"] != PayrollRunStatus.APPROVED.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only approved runs can be locked")
    await db["payroll_runs"].update_one(
        {"_id": run["_id"]}, {"$set": {"status": PayrollRunStatus.LOCKED.value, "updated_at": utcnow()}}
    )
    return await get_run(db, run_id)


async def get_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> PayrollDashboard:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    runs = await db["payroll_runs"].find(query).sort([("period_year", -1), ("period_month", -1)]).to_list(length=50)
    latest = runs[0] if runs else None
    pending = sum(1 for r in runs if r["status"] in (PayrollRunStatus.REVIEW.value, PayrollRunStatus.DRAFT.value))
    return PayrollDashboard(
        runs_this_fy=len(runs),
        latest_run_status=latest["status"] if latest else None,
        employees_paid_last_run=latest["employee_count"] if latest else 0,
        net_paid_last_run=latest["net_total"] if latest else 0.0,
        pending_approval=pending,
    )
