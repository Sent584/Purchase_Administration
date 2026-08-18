"""Extended Sasurie seed — HR, stores, assets, attendance, payroll, accounts.

Run after the base scripts/seed.py so institutions/campuses/items exist.

Usage:
    ./venv/bin/python scripts/seed_extended.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId

from app.common.base_models import utcnow
from app.core.database import close_db, get_db
from app.main import ensure_indexes
from app.modules.rbac.service import seed_system_roles


def dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


FIRST = ["Arun", "Priya", "Karthik", "Lakshmi", "Suresh", "Meena", "Vijay", "Anitha", "Ravi", "Deepa"]
LAST = ["Kumar", "Rajan", "Subramanian", "Natarajan", "Murugan", "Selvi", "Krishnan", "Devi", "Pandian", "Iyer"]


async def seed_hr(db, institution_id: ObjectId, campus_id: ObjectId, dept_id: ObjectId, dept_name: str) -> list[ObjectId]:
    designations = [
        ("PROF", "Professor", "teaching", "Professor", "AL-14"),
        ("ASSO", "Associate Professor", "teaching", "Associate Professor", "AL-13A"),
        ("ASST", "Assistant Professor", "teaching", "Assistant Professor", "AL-10"),
        ("AO", "Administrative Officer", "non_teaching", "Group A", "Level-10"),
        ("ACC", "Accountant", "non_teaching", "Group B", "Level-6"),
        ("LAB", "Lab Assistant", "non_teaching", "Group C", "Level-4"),
    ]
    for code, name, cat, grade, level in designations:
        await db["designations"].update_one(
            {"code": code, "institution_id": institution_id},
            {
                "$set": {
                    "name": name,
                    "category": cat,
                    "grade": grade,
                    "pay_level": level,
                    "retirement_age": 60,
                    "is_active": True,
                    "updated_at": utcnow(),
                },
                "$setOnInsert": {"created_at": utcnow(), "code": code, "institution_id": institution_id},
            },
            upsert=True,
        )

    emp_ids: list[ObjectId] = []
    for i in range(50):
        email = f"emp{i+1:03d}@sasurie.ac.in"
        existing = await db["employees"].find_one({"official_email": email})
        if existing:
            emp_ids.append(existing["_id"])
            continue
        first, last = FIRST[i % 10], LAST[(i // 10) % 10]
        teaching = i % 3 != 0
        code = f"EMP-{i+1:05d}"
        doc = {
            "employee_code": code,
            "institution_id": institution_id,
            "campus_id": campus_id,
            "department_id": dept_id,
            "department_name": dept_name if teaching else "Administration",
            "title": "Dr." if teaching and i % 5 == 0 else "Mr." if i % 2 == 0 else "Ms.",
            "first_name": first,
            "middle_name": "",
            "last_name": last,
            "display_name": f"{first} {last}",
            "gender": "male" if i % 2 == 0 else "female",
            "date_of_birth": dt(1980 + (i % 15), (i % 12) + 1, 10),
            "official_email": email,
            "personal_email": None,
            "mobile": f"98{i:08d}",
            "employee_category": "teaching" if teaching else "non_teaching",
            "employment_type": "permanent" if i % 7 else "probation",
            "designation": "Assistant Professor" if teaching else "Lab Assistant",
            "designation_code": "ASST" if teaching else "LAB",
            "grade": "Assistant Professor" if teaching else "Group C",
            "pay_level": "AL-10" if teaching else "Level-4",
            "date_of_joining": dt(2018 + (i % 6), 6, 1),
            "confirmation_date": dt(2019 + (i % 6), 6, 1) if i % 7 else None,
            "retirement_date": dt(2040, 6, 1),
            "reporting_manager_name": "Principal",
            "reporting_manager_id": None,
            "pan": f"ABCDE{1000+i:04d}F",
            "uan": f"100{i:09d}",
            "epf_number": f"TN/CBE/{i:06d}",
            "esi_number": "",
            "bank_account_number": f"3{i:011d}",
            "bank_ifsc": "IOBA0001234",
            "bank_name": "Indian Overseas Bank",
            "faculty_rank": "assistant_professor" if teaching else None,
            "doctoral_status": "phd_awarded" if teaching and i % 4 == 0 else "not_applicable",
            "specialisation": "Computer Science" if teaching else "",
            "subjects": ["Programming", "DBMS"] if teaching else [],
            "workload_hours": 16.0 if teaching else None,
            "status": "active",
            "photo_url": None,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        result = await db["employees"].insert_one(doc)
        emp_ids.append(result.inserted_id)
        print(f"  + employee {code} {first} {last}")
    return emp_ids


async def seed_stores(db, institution_id: ObjectId, campus_id: ObjectId) -> None:
    stores = [
        ("STR-CEN", "Central Stores", "central", "Main Block Ground Floor"),
        ("STR-CSE", "CSE Department Store", "department", "CSE Block"),
        ("STR-LAB", "Chemistry Lab Store", "laboratory", "Science Block"),
        ("STR-HST", "Hostel Stores", "hostel", "Boys Hostel A"),
    ]
    store_ids = []
    for code, name, stype, loc in stores:
        existing = await db["stores"].find_one({"code": code})
        if existing:
            store_ids.append(existing["_id"])
            continue
        doc = {
            "code": code,
            "name": name,
            "store_type": stype,
            "institution_id": institution_id,
            "campus_id": campus_id,
            "location": loc,
            "in_charge_name": "Stores Officer",
            "status": "active",
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        r = await db["stores"].insert_one(doc)
        store_ids.append(r.inserted_id)
        print(f"  + store {code}")

    items = await db["items"].find({"institution_id": institution_id}).to_list(length=50)
    if not store_ids or not items:
        print("  ~ skip stock — need stores and catalog items")
        return
    central = store_ids[0]
    for item in items[:15]:
        key = {"store_id": central, "item_id": item["_id"]}
        if await db["stock_balances"].find_one(key):
            continue
        qty = 50.0 + (hash(str(item["_id"])) % 100)
        rate = float(item.get("standard_rate") or item.get("last_purchase_rate") or 100)
        await db["stock_balances"].insert_one(
            {
                **key,
                "institution_id": institution_id,
                "item_code": item.get("code", ""),
                "item_name": item.get("name", ""),
                "store_name": "Central Stores",
                "quantity": qty,
                "uom": item.get("uom", "NOS"),
                "reorder_level": float(item.get("reorder_level") or 10),
                "last_rate": rate,
                "updated_at": utcnow(),
            }
        )
    print(f"  + opening stock for {min(15, len(items))} items")


async def seed_assets(db, institution_id: ObjectId, campus_id: ObjectId, dept_id: ObjectId) -> None:
    samples = [
        ("AST-LAB-001", "lab_equipment", "Digital Oscilloscope 100MHz", 185000),
        ("AST-IT-001", "computers", "Dell OptiPlex Desktop Lab Batch", 420000),
        ("AST-FUR-001", "furniture", "Classroom Dual Desk Set (50)", 275000),
        ("AST-LIB-001", "library_books", "Engineering Reference Collection", 150000),
        ("AST-VEH-001", "vehicles", "College Bus TN 39 N 4521", 1850000),
    ]
    for code, aclass, name, value in samples:
        if await db["assets"].find_one({"asset_code": code}):
            continue
        await db["assets"].insert_one(
            {
                "asset_code": code,
                "institution_id": institution_id,
                "campus_id": campus_id,
                "department_id": dept_id,
                "asset_class": aclass,
                "name": name,
                "description": name,
                "make": "Various",
                "model": "",
                "serial_number": f"SN-{code}",
                "capitalization_date": dt(2023, 4, 1),
                "capitalization_value": value,
                "funding_source": "institution",
                "supplier_name": "Empanelled Vendor",
                "po_id": None,
                "grn_id": None,
                "warranty_expiry": dt(2026, 4, 1),
                "amc_expiry": dt(2026, 3, 31),
                "insurance_expiry": dt(2026, 12, 31),
                "custodian_name": "Lab In-charge",
                "custodian_employee_id": None,
                "location_building": "Main Block",
                "location_floor": "1",
                "location_room": "Lab-101",
                "useful_life_years": 10,
                "depreciation_method": "wdv",
                "depreciation_rate": 15.0,
                "residual_value": value * 0.05,
                "current_book_value": value * 0.85,
                "status": "active",
                "created_at": utcnow(),
                "updated_at": utcnow(),
            }
        )
        print(f"  + asset {code}")


async def seed_attendance(db, institution_id: ObjectId, campus_id: ObjectId, emp_ids: list[ObjectId]) -> None:
    if await db["shifts"].find_one({"code": "GEN", "institution_id": institution_id}) is None:
        await db["shifts"].insert_one(
            {
                "code": "GEN",
                "name": "General Shift",
                "start_time": "09:00",
                "end_time": "17:00",
                "grace_minutes": 15,
                "is_night": False,
                "institution_id": institution_id,
                "created_at": utcnow(),
                "updated_at": utcnow(),
            }
        )
    for code, name, paid, accrual in [
        ("CL", "Casual Leave", True, 12),
        ("EL", "Earned Leave", True, 15),
        ("ML", "Medical Leave", True, 10),
        ("LWP", "Leave Without Pay", False, 0),
    ]:
        await db["leave_types"].update_one(
            {"code": code},
            {
                "$set": {
                    "name": name,
                    "paid": paid,
                    "accrual_per_year": accrual,
                    "max_carry_forward": 30 if code == "EL" else 0,
                    "encashable": code == "EL",
                    "gender_restriction": "",
                    "requires_document": code == "ML",
                },
                "$setOnInsert": {"code": code},
            },
            upsert=True,
        )

    year = utcnow().year
    today = utcnow().date()
    for eid in emp_ids[:40]:
        emp = await db["employees"].find_one({"_id": eid})
        if not emp:
            continue
        await db["leave_balances"].update_one(
            {"employee_id": str(eid), "leave_type_code": "CL", "year": year},
            {
                "$setOnInsert": {
                    "employee_id": str(eid),
                    "leave_type_code": "CL",
                    "year": year,
                    "opening": 12,
                    "accrued": 0,
                    "availed": 2,
                    "balance": 10,
                }
            },
            upsert=True,
        )
        att_date = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
        await db["attendance_records"].update_one(
            {"employee_id": str(eid), "date": att_date},
            {
                "$setOnInsert": {
                    "employee_id": str(eid),
                    "employee_name": emp["display_name"],
                    "date": att_date,
                    "shift_code": "GEN",
                    "in_time": "09:05",
                    "out_time": "17:10",
                    "status": "present",
                    "late_minutes": 5,
                    "early_minutes": 0,
                    "source": "biometric",
                    "campus_id": campus_id,
                    "institution_id": institution_id,
                    "created_at": utcnow(),
                }
            },
            upsert=True,
        )
    print(f"  + attendance & leave for {min(40, len(emp_ids))} employees")


async def seed_payroll(db, institution_id: ObjectId, emp_ids: list[ObjectId]) -> None:
    components = [
        ("BASIC", "Basic Pay", "earning", True, "none"),
        ("DA", "Dearness Allowance", "earning", True, "none"),
        ("HRA", "House Rent Allowance", "earning", True, "none"),
        ("EPF_EE", "EPF Employee", "deduction", False, "epf_ee"),
        ("ESI_EE", "ESI Employee", "deduction", False, "esi_ee"),
        ("PT", "Professional Tax", "deduction", False, "pt"),
        ("EPF_ER", "EPF Employer", "employer", False, "epf_er"),
        ("ESI_ER", "ESI Employer", "employer", False, "esi_er"),
    ]
    for code, name, ctype, taxable, statutory in components:
        await db["pay_components"].update_one(
            {"code": code},
            {
                "$set": {
                    "name": name,
                    "type": ctype,
                    "taxable": taxable,
                    "statutory_code": statutory,
                    "formula_hint": "",
                },
                "$setOnInsert": {"code": code},
            },
            upsert=True,
        )

    for i, eid in enumerate(emp_ids[:30]):
        emp = await db["employees"].find_one({"_id": eid})
        if not emp:
            continue
        if await db["salary_structures"].find_one({"employee_id": str(eid)}):
            continue
        basic = 45000 + (i * 1500)
        await db["salary_structures"].insert_one(
            {
                "employee_id": str(eid),
                "employee_name": emp["display_name"],
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
    print(f"  + salary structures for {min(30, len(emp_ids))} employees")


async def seed_accounts(db, institution_id: ObjectId) -> None:
    accounts = [
        ("1000", "Cash in Hand", "asset"),
        ("1010", "IOB Current Account", "asset"),
        ("1100", "Accounts Receivable", "asset"),
        ("1500", "Fixed Assets", "asset"),
        ("2000", "Accounts Payable", "liability"),
        ("2100", "EPF Payable", "liability"),
        ("2110", "ESI Payable", "liability"),
        ("2120", "TDS Payable", "liability"),
        ("3000", "Corpus Fund", "equity"),
        ("4000", "Tuition Fee Income", "income"),
        ("4100", "Grant Income", "income"),
        ("5000", "Salaries & Wages", "expense"),
        ("5100", "Consumables", "expense"),
        ("5200", "Electricity", "expense"),
        ("5300", "Depreciation", "expense"),
    ]
    for code, name, atype in accounts:
        await db["chart_of_accounts"].update_one(
            {"code": code, "institution_id": institution_id},
            {
                "$set": {"name": name, "account_type": atype, "parent_code": None, "is_control": False},
                "$setOnInsert": {"code": code, "institution_id": institution_id},
            },
            upsert=True,
        )

    await db["cost_centres"].update_one(
        {"code": "CC-CSE", "institution_id": institution_id},
        {"$set": {"name": "Computer Science & Engineering", "campus_id": None}, "$setOnInsert": {"code": "CC-CSE", "institution_id": institution_id}},
        upsert=True,
    )

    for code, name, allocated in [("5000", "Salaries & Wages", 8_50_00_000), ("5100", "Consumables", 45_00_000), ("5200", "Electricity", 28_00_000)]:
        await db["budgets"].update_one(
            {"fy": "2025-26", "account_code": code, "cost_centre_code": "CC-CSE", "institution_id": institution_id},
            {
                "$set": {
                    "account_name": name,
                    "allocated": allocated,
                    "committed": allocated * 0.15,
                    "actual": allocated * 0.42,
                },
                "$setOnInsert": {
                    "fy": "2025-26",
                    "account_code": code,
                    "cost_centre_code": "CC-CSE",
                    "institution_id": institution_id,
                },
            },
            upsert=True,
        )

    if await db["bank_accounts_finance"].find_one({"institution_id": institution_id, "ifsc": "IOBA0001234"}) is None:
        await db["bank_accounts_finance"].insert_one(
            {
                "bank_name": "Indian Overseas Bank",
                "account_number_masked": "****4521",
                "ifsc": "IOBA0001234",
                "account_type": "current",
                "institution_id": institution_id,
                "current_balance": 2_45_67_890.50,
            }
        )

    if await db["vouchers"].find_one({"voucher_number": "JV/2025-26/0001"}) is None:
        now = utcnow()
        await db["vouchers"].insert_one(
            {
                "voucher_number": "JV/2025-26/0001",
                "voucher_type": "journal",
                "date": now - timedelta(days=5),
                "narration": "Salary payable provision — June 2025",
                "lines": [
                    {"account_code": "5000", "cost_centre": "CC-CSE", "debit": 1250000, "credit": 0},
                    {"account_code": "2000", "cost_centre": "CC-CSE", "debit": 0, "credit": 1250000},
                ],
                "status": "posted",
                "total_debit": 1250000,
                "total_credit": 1250000,
                "institution_id": institution_id,
                "created_by_name": "Finance Officer",
                "created_at": now,
                "updated_at": now,
            }
        )
    print("  + COA, budgets, bank, sample voucher")


async def main() -> None:
    db = get_db()
    await ensure_indexes()
    await seed_system_roles(db)

    inst = await db["institutions"].find_one({})
    campus = await db["campuses"].find_one({})
    dept = await db["org_units"].find_one({"unit_type": "department"}) or await db["org_units"].find_one({})
    if not inst or not campus or not dept:
        print("Base org data missing — run scripts/seed.py first.")
        await close_db()
        return

    institution_id = inst["_id"]
    campus_id = campus["_id"]
    dept_id = dept["_id"]
    dept_name = dept.get("name", "Computer Science")

    print("Seeding HR…")
    emp_ids = await seed_hr(db, institution_id, campus_id, dept_id, dept_name)
    print("Seeding stores…")
    await seed_stores(db, institution_id, campus_id)
    print("Seeding assets…")
    await seed_assets(db, institution_id, campus_id, dept_id)
    print("Seeding attendance…")
    await seed_attendance(db, institution_id, campus_id, emp_ids)
    print("Seeding payroll…")
    await seed_payroll(db, institution_id, emp_ids)
    print("Seeding accounts…")
    await seed_accounts(db, institution_id)
    print("Extended seed complete.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
