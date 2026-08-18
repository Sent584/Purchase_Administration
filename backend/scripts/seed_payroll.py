"""Idempotent payroll seed — components, structures, one processed month.

Usage:
    cd backend && ./venv/bin/python scripts/seed_payroll.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.core.database import close_db, get_db
from app.main import ensure_indexes
from app.modules.payroll import statutory as st
from app.modules.payroll.run_service import process_run


COMPONENTS = [
    ("BASIC", "Basic Pay", "earning", True, "none", "Fixed monthly basic"),
    ("DA", "Dearness Allowance", "earning", True, "none", "17% of basic (illustrative)"),
    ("HRA", "House Rent Allowance", "earning", True, "none", "24% of basic (metro)"),
    ("EPF_EE", "EPF Employee", "deduction", False, "epf_ee", "12% on wage up to 15000"),
    ("ESI_EE", "ESI Employee", "deduction", False, "esi_ee", "0.75% if gross <= 21000"),
    ("PT", "TN Professional Tax", "deduction", False, "pt", "TN monthly slab"),
    ("TDS", "TDS on Salary", "deduction", False, "tds", "Estimated monthly TDS"),
    ("EPF_ER", "EPF Employer", "employer", False, "epf_er", "12% on wage up to 15000"),
    ("ESI_ER", "ESI Employer", "employer", False, "esi_er", "3.25% if gross <= 21000"),
]


async def _ensure_stub_employees(db: AsyncIOMotorDatabase, institution_id: ObjectId) -> list[dict]:
    # Prefer real seeded staff for demo density (payslips across many employees).
    emps = await db["employees"].find({"institution_id": institution_id, "status": "active"}).limit(80).to_list(length=80)
    if emps:
        return emps
    print("  ! No employees found — creating stub employees for payroll seed")
    stubs = []
    now = utcnow()
    for i, name in enumerate(["Arun Kumar", "Priya Rajan", "Karthik Iyer", "Lakshmi Devi", "Suresh Pandian"], start=1):
        code = f"STUB-PAY-{i:03d}"
        existing = await db["employees"].find_one({"employee_code": code})
        if existing:
            stubs.append(existing)
            continue
        doc = {
            "employee_code": code,
            "institution_id": institution_id,
            "display_name": name,
            "first_name": name.split()[0],
            "last_name": name.split()[-1],
            "official_email": f"stub.pay{i}@sasurie.edu.in",
            "designation": "Assistant Professor" if i < 4 else "Accountant",
            "department_name": "CSE" if i < 4 else "Accounts",
            "bank_account_number": f"123456789{i}",
            "pay_level": "AL-10",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        result = await db["employees"].insert_one(doc)
        doc["_id"] = result.inserted_id
        stubs.append(doc)
    return stubs


async def seed_payroll_data(db: AsyncIOMotorDatabase, institution_id: ObjectId) -> None:
    for code, name, ctype, taxable, statutory, hint in COMPONENTS:
        await db["pay_components"].update_one(
            {"code": code},
            {
                "$set": {
                    "name": name,
                    "type": ctype,
                    "taxable": taxable,
                    "statutory_code": statutory,
                    "formula_hint": hint,
                },
                "$setOnInsert": {"code": code},
            },
            upsert=True,
        )

    employees = await _ensure_stub_employees(db, institution_id)
    for i, emp in enumerate(employees):
        eid = str(emp["_id"])
        if await db["salary_structures"].find_one({"employee_id": eid, "institution_id": institution_id}):
            continue
        teaching = emp.get("employee_category") == "teaching"
        basic = (48000 if teaching else 28000) + (i % 25) * 1500
        await db["salary_structures"].insert_one(
            {
                "employee_id": eid,
                "employee_name": emp.get("display_name", ""),
                "designation": emp.get("designation", ""),
                "department": emp.get("department_name", ""),
                "pay_level": emp.get("pay_level"),
                "components": [
                    {"code": "BASIC", "amount": basic},
                    {"code": "DA", "amount": round(basic * 0.17, 2)},
                    {"code": "HRA", "amount": round(basic * 0.24, 2)},
                ],
                "effective_from": "2025-04-01",
                "institution_id": institution_id,
            }
        )

    # Prefer June 2025; if an older thin run exists, add July 2025 for denser demo payslips.
    for period_year, period_month in ((2025, 6), (2025, 7)):
        existing = await db["payroll_runs"].find_one(
            {"institution_id": institution_id, "period_year": period_year, "period_month": period_month}
        )
        if existing is not None:
            print(f"  ~ {period_month:02d}/{period_year} payroll run already exists, skipping")
            continue
        now = utcnow()
        result = await db["payroll_runs"].insert_one(
            {
                "period_year": period_year,
                "period_month": period_month,
                "institution_id": institution_id,
                "status": "draft",
                "employee_count": 0,
                "gross_total": 0.0,
                "deduction_total": 0.0,
                "net_total": 0.0,
                "employer_contrib_total": 0.0,
                "created_at": now,
                "updated_at": now,
            }
        )
        run = await process_run(db, str(result.inserted_id))
        await db["payroll_runs"].update_one(
            {"_id": result.inserted_id},
            {"$set": {"status": "locked", "updated_at": utcnow()}},
        )
        print(f"  + payroll run {period_month:02d}/{period_year} locked — {run.employee_count} staff, net ₹{run.net_total:,.2f}")
        print(f"    (EPF EE @ {st.EPF_EE_RATE:.0%} / ESI EE @ {st.ESI_EE_RATE:.2%})")
        break


async def main() -> None:
    db = get_db()
    await ensure_indexes()
    inst = await db["institutions"].find_one({})
    if not inst:
        print("No institution found — run scripts/seed.py first.")
        await close_db()
        return
    print("Seeding payroll…")
    await seed_payroll_data(db, inst["_id"])
    print("Done.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
