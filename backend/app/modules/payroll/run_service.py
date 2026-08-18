from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.payroll import statutory as st
from app.modules.payroll.helpers import oid, str_id
from app.modules.payroll.schemas import PayrollRunCreate, PayrollRunOut, PayrollRunStatus


def _to_run(doc: dict) -> PayrollRunOut:
    return PayrollRunOut(**str_id(doc, "institution_id"))


async def create_run(db: AsyncIOMotorDatabase, payload: PayrollRunCreate) -> PayrollRunOut:
    institution_oid = oid(payload.institution_id, "institution_id")
    existing = await db["payroll_runs"].find_one(
        {
            "institution_id": institution_oid,
            "period_year": payload.period_year,
            "period_month": payload.period_month,
        }
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Payroll run already exists for this period")
    now = utcnow()
    doc = {
        "period_year": payload.period_year,
        "period_month": payload.period_month,
        "institution_id": institution_oid,
        "status": PayrollRunStatus.DRAFT.value,
        "employee_count": 0,
        "gross_total": 0.0,
        "deduction_total": 0.0,
        "net_total": 0.0,
        "employer_contrib_total": 0.0,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["payroll_runs"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_run(doc)


async def list_runs(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[PayrollRunOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["payroll_runs"].find(query).sort([("period_year", -1), ("period_month", -1)]).to_list(length=100)
    return [_to_run(d) for d in docs]


async def get_run(db: AsyncIOMotorDatabase, run_id: str) -> PayrollRunOut:
    doc = await db["payroll_runs"].find_one({"_id": oid(run_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll run not found")
    return _to_run(doc)


async def _resolve_employee(db: AsyncIOMotorDatabase, structure: dict) -> dict | None:
    emp_id = structure.get("employee_id")
    if not emp_id:
        return None
    emp = None
    if ObjectId.is_valid(emp_id):
        emp = await db["employees"].find_one({"_id": ObjectId(emp_id)})
    if emp is None:
        emp = await db["employees"].find_one({"employee_code": emp_id})
    if emp is None:
        emp = await db["employees"].find_one({"employee_id": emp_id})
    if emp is None:
        return {
            "employee_id": emp_id,
            "full_name": structure.get("employee_name", "Employee"),
            "employee_code": emp_id,
            "designation": structure.get("designation", ""),
            "department": structure.get("department", ""),
            "bank_last4": "0000",
        }
    return emp


def _compute_payslip(emp: dict, structure: dict, run: dict) -> dict:
    earnings: dict[str, float] = {c["code"]: float(c["amount"]) for c in structure.get("components", [])}
    basic = earnings.get("BASIC", 0.0)
    gross = round(sum(earnings.values()), 2)
    epf_wage = basic if basic else gross
    deductions = {
        "EPF_EE": st.epf_employee(epf_wage),
        "ESI_EE": st.esi_employee(gross),
        "PT": st.tn_professional_tax(gross),
        "TDS": 0.0,
    }
    employer = {"EPF_ER": st.epf_employer(epf_wage), "ESI_ER": st.esi_employer(gross)}
    total_ded = round(sum(deductions.values()), 2)
    bank = str(emp.get("bank_account_number") or emp.get("bank_last4") or "0000")
    name = emp.get("display_name") or emp.get("full_name") or emp.get("employee_name") or ""
    now = utcnow()
    return {
        "payroll_run_id": run["_id"],
        "employee_id": str(emp.get("_id") or emp.get("employee_id", "")),
        "employee_name": name,
        "employee_code": emp.get("employee_code", emp.get("code", "")),
        "designation": emp.get("designation", ""),
        "department": emp.get("department_name") or emp.get("department", ""),
        "earnings": earnings,
        "deductions": deductions,
        "employer": employer,
        "gross": gross,
        "total_deductions": total_ded,
        "net": round(gross - total_ded, 2),
        "days_paid": 30.0,
        "lop_days": 0.0,
        "ytd_gross": gross,
        "ytd_tax": 0.0,
        "bank_last4": bank[-4:],
        "status": "final",
        "institution_id": run["institution_id"],
        "created_at": now,
        "updated_at": now,
    }


async def process_run(db: AsyncIOMotorDatabase, run_id: str) -> PayrollRunOut:
    run = await db["payroll_runs"].find_one({"_id": oid(run_id)})
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll run not found")
    if run["status"] not in (PayrollRunStatus.DRAFT.value, PayrollRunStatus.REVIEW.value):
        raise HTTPException(status.HTTP_409_CONFLICT, "Run cannot be processed in current status")

    await db["payroll_runs"].update_one(
        {"_id": run["_id"]}, {"$set": {"status": PayrollRunStatus.PROCESSING.value, "updated_at": utcnow()}}
    )
    await db["payslips"].delete_many({"payroll_run_id": run["_id"]})

    structures = await db["salary_structures"].find({"institution_id": run["institution_id"]}).to_list(length=500)
    payslips = []
    for structure in structures:
        emp = await _resolve_employee(db, structure)
        if emp is None:
            continue
        payslips.append(_compute_payslip(emp, structure, run))

    if payslips:
        await db["payslips"].insert_many(payslips)

    await db["payroll_runs"].update_one(
        {"_id": run["_id"]},
        {
            "$set": {
                "status": PayrollRunStatus.REVIEW.value,
                "employee_count": len(payslips),
                "gross_total": round(sum(p["gross"] for p in payslips), 2),
                "deduction_total": round(sum(p["total_deductions"] for p in payslips), 2),
                "net_total": round(sum(p["net"] for p in payslips), 2),
                "employer_contrib_total": round(sum(sum(p["employer"].values()) for p in payslips), 2),
                "updated_at": utcnow(),
            }
        },
    )
    return await get_run(db, run_id)


async def approve_run(db: AsyncIOMotorDatabase, run_id: str) -> PayrollRunOut:
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
    run = await db["payroll_runs"].find_one({"_id": oid(run_id)})
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll run not found")
    if run["status"] != PayrollRunStatus.APPROVED.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only approved runs can be locked")
    await db["payroll_runs"].update_one(
        {"_id": run["_id"]}, {"$set": {"status": PayrollRunStatus.LOCKED.value, "updated_at": utcnow()}}
    )
    return await get_run(db, run_id)
