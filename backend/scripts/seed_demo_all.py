"""Master demo seed for Sasurie ERP — populates every module for Principal/FO demos.

Prerequisites: MongoDB reachable via backend/.env

Usage:
    cd backend
    ./venv/bin/python scripts/seed.py              # org, users, purchase cycle (once)
    ./venv/bin/python scripts/seed_demo_all.py     # all modules + dense sample data
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from bson import ObjectId

from app.core.database import close_db, get_db
from app.main import ensure_indexes
from app.modules.rbac.service import seed_system_roles
from seed_assets import seed_assets_data
from seed_attendance import seed_attendance_data
from seed_accounts import seed_accounts_data
from seed_bulk_staff import SAE_DEPTS, SCAS_DEPTS, seed_bulk_staff
from seed_catalog_extra import seed_catalog_extra
from seed_hr import seed_hr_data
from seed_ops_demo import seed_ops_demo
from seed_payroll import seed_payroll_data
from seed_stores import seed_stores_data


async def _dept_maps(db, campus_id: ObjectId) -> tuple[dict[str, str], dict[str, str], dict[str, ObjectId]]:
    units = await db["org_units"].find({"campus_id": campus_id}).to_list(length=200)
    ids = {u["code"]: str(u["_id"]) for u in units}
    names = {u["code"]: u["name"] for u in units}
    oids = {u["code"]: u["_id"] for u in units}
    return ids, names, oids


async def _sync_employee_counter(db) -> None:
    """Align counters.employee_code with max EMP-/SAE-/SCAS- suffixes already in DB."""
    import re

    max_n = 0
    async for emp in db["employees"].find({}, {"employee_code": 1}):
        code = emp.get("employee_code") or ""
        match = re.search(r"(\d+)$", code)
        if match:
            max_n = max(max_n, int(match.group(1)))
    if max_n <= 0:
        return
    await db["counters"].update_one(
        {"_id": "employee_code"},
        {"$max": {"seq": max_n}},
        upsert=True,
    )
    print(f"  synced employee_code counter ≥ {max_n}")


async def main() -> None:
    db = get_db()
    await ensure_indexes()
    await seed_system_roles(db)
    await _sync_employee_counter(db)

    sae = await db["institutions"].find_one({"code": "SAE"})
    scas = await db["institutions"].find_one({"code": "SCAS"})
    sae_cbe = await db["campuses"].find_one({"code": "SAE-CBE"})
    scas_tup = await db["campuses"].find_one({"code": "SCAS-TUP"})
    if not sae or not sae_cbe:
        print("Base org missing. Run scripts/seed.py first, then re-run this script.")
        await close_db()
        return

    sae_id, sae_campus = sae["_id"], sae_cbe["_id"]
    dept_ids, dept_names, dept_oids = await _dept_maps(db, sae_campus)

    print("\n=== SAE — catalog extras ===")
    n = await seed_catalog_extra(db, str(sae_id))
    print(f"  catalog items created: {n}")

    print("\n=== SAE — named HR faculty/staff ===")
    d, e = await seed_hr_data(
        db,
        institution_id=str(sae_id),
        campus_id=str(sae_campus),
        department_ids=dept_ids,
        department_names=dept_names,
    )
    print(f"  designations +{d}, named employees +{e}")

    print("\n=== SAE — bulk staff (demo density) ===")
    bulk = await seed_bulk_staff(
        db,
        institution_id=sae_id,
        campus_id=sae_campus,
        department_ids=dept_oids,
        dept_list=SAE_DEPTS,
        email_prefix="sae.staff",
        count=120,
        code_prefix="SAE",
    )
    print(f"  bulk SAE employees +{bulk}")

    if scas and scas_tup:
        print("\n=== SCAS Tiruppur — bulk staff ===")
        _, _, scas_oids = await _dept_maps(db, scas_tup["_id"])
        from seed_hr_data import DESIGNATIONS
        from app.modules.hr.enums import EmployeeCategory
        from app.modules.hr.schemas import DesignationCreate
        from app.modules.hr.service import create_designation

        for dspec in DESIGNATIONS:
            if await db["designations"].find_one({"code": dspec["code"], "institution_id": scas["_id"]}):
                continue
            await create_designation(
                db,
                DesignationCreate(
                    institution_id=str(scas["_id"]),
                    name=dspec["name"],
                    code=dspec["code"],
                    category=EmployeeCategory(dspec["category"]),
                    grade=dspec["grade"],
                    pay_level=dspec["pay_level"],
                    retirement_age=dspec["retirement_age"],
                ),
            )
        scas_bulk = await seed_bulk_staff(
            db,
            institution_id=scas["_id"],
            campus_id=scas_tup["_id"],
            department_ids=scas_oids,
            dept_list=SCAS_DEPTS,
            email_prefix="scas.staff",
            count=80,
            code_prefix="SCAS",
        )
        print(f"  bulk SCAS employees +{scas_bulk}")

    print("\n=== SAE — stores & opening stock ===")
    await seed_stores_data(db, str(sae_id), str(sae_campus))

    print("\n=== SAE — fixed assets ===")
    created_assets = await seed_assets_data(
        db, institution_id=str(sae_id), campus_id=str(sae_campus), department_ids=dept_ids
    )
    print(f"  assets created: {created_assets}")

    print("\n=== SAE — attendance & leave masters ===")
    await seed_attendance_data(db, sae_id, sae_campus)

    print("\n=== SAE — ops demo (attendance mix, leave apps, issues) ===")
    await seed_ops_demo(db, sae_id, sae_campus)

    print("\n=== SAE — payroll (structures + June 2025 locked run) ===")
    await seed_payroll_data(db, sae_id)

    print("\n=== SAE — accounts (COA, budgets, vouchers) ===")
    await seed_accounts_data(db, sae_id)

    if scas:
        print("\n=== SCAS — accounts snapshot ===")
        await seed_accounts_data(db, scas["_id"])

    emp_count = await db["employees"].count_documents({})
    asset_count = await db["assets"].count_documents({})
    item_count = await db["items"].count_documents({})
    leave_count = await db["leave_applications"].count_documents({})
    payslip_count = await db["payslips"].count_documents({})
    voucher_count = await db["vouchers"].count_documents({})

    print("\n========== Sasurie demo seed summary ==========")
    print(f"  Employees          : {emp_count}")
    print(f"  Catalog items      : {item_count}")
    print(f"  Fixed assets       : {asset_count}")
    print(f"  Leave applications : {leave_count}")
    print(f"  Payslips           : {payslip_count}")
    print(f"  Vouchers           : {voucher_count}")
    print("  Login: superadmin@sasurie.edu.in / Sasurie@123")
    print("================================================\n")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
