"""Seed HR designations and employees for Sasurie Engineering College.

Idempotent by official_email / designation code. Safe to re-run.

Usage (from backend/):
    ./venv/bin/python scripts/seed_hr.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import close_db, get_db
from app.modules.hr.enums import DoctoralStatus, EmployeeCategory, EmploymentType, FacultyRank
from app.modules.hr.schemas import DesignationCreate, EmployeeCreate
from app.modules.hr.service import create_designation, create_employee
from seed_hr_data import DESIGNATIONS, EMPLOYEES
from seed_hr_more import MORE_EMPLOYEES


def dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


async def seed_hr_data(
    db: AsyncIOMotorDatabase,
    *,
    institution_id: str,
    campus_id: str,
    department_ids: dict[str, str],
    department_names: dict[str, str],
) -> tuple[int, int]:
    """Seeds designations + ~45 employees. Returns (designations_created, employees_created)."""
    desig_created = 0
    desig_by_code: dict[str, dict] = {}

    for d in DESIGNATIONS:
        existing = await db["designations"].find_one({"code": d["code"], "institution_id": ObjectId(institution_id)})
        if existing:
            desig_by_code[d["code"]] = existing
            print(f"  ~ designation '{d['code']}' exists")
            continue
        out = await create_designation(
            db,
            DesignationCreate(
                institution_id=institution_id,
                name=d["name"],
                code=d["code"],
                category=EmployeeCategory(d["category"]),
                grade=d["grade"],
                pay_level=d["pay_level"],
                retirement_age=d["retirement_age"],
            ),
        )
        doc = await db["designations"].find_one({"code": d["code"], "institution_id": ObjectId(institution_id)})
        desig_by_code[d["code"]] = doc or {"code": out.code, "name": out.name, "grade": out.grade, "pay_level": out.pay_level}
        print(f"  + designation '{out.code}' — {out.name}")
        desig_created += 1

    emp_created = 0
    all_emps = EMPLOYEES + MORE_EMPLOYEES
    for i, spec in enumerate(all_emps):
        email = spec["email"].lower()
        existing = await db["employees"].find_one({"official_email": email})
        if existing:
            print(f"  ~ employee '{email}' exists")
            continue
        dept_code = spec["dept"]
        dept_id = department_ids.get(dept_code)
        if not dept_id:
            print(f"  ! skip {email} — dept {dept_code} missing")
            continue
        desig = desig_by_code.get(spec["desig"], {})
        join = dt(2018 + (i % 7), 6 + (i % 5), 1 + (i % 25))
        conf = join + timedelta(days=365) if spec["type"] == "probation" else join + timedelta(days=180)
        payload = EmployeeCreate(
            institution_id=institution_id,
            campus_id=campus_id,
            department_id=dept_id,
            department_name=department_names.get(dept_code, dept_code),
            title=spec["title"],
            first_name=spec["first"],
            last_name=spec["last"],
            gender=spec["gender"],
            official_email=email,
            mobile=f"98{10000000 + i:08d}"[:10],
            employee_category=EmployeeCategory(spec["cat"]),
            employment_type=EmploymentType(spec["type"]),
            designation=desig.get("name", spec["desig"]),
            designation_code=spec["desig"],
            grade=desig.get("grade", ""),
            pay_level=desig.get("pay_level", ""),
            date_of_joining=join,
            confirmation_date=conf if spec["type"] == "probation" else None,
            pan=f"ABCDE{1000 + i:04d}F",
            uan=f"100{200000000 + i}",
            epf_number=f"TN/CBE/{30000 + i}",
            bank_account_number=f"50100{4000000 + i}",
            bank_ifsc="SBIN0001234",
            bank_name="State Bank of India",
            faculty_rank=FacultyRank(spec["rank"]) if spec.get("rank") else None,
            doctoral_status=DoctoralStatus(spec["phd"]) if spec.get("phd") else None,
            specialisation=spec.get("spec", ""),
            subjects=[spec["spec"]] if spec.get("spec") else [],
            workload_hours=16.0 if spec["cat"] == "teaching" else None,
        )
        out = await create_employee(db, payload)
        print(f"  + employee '{out.employee_code}' — {out.display_name}")
        emp_created += 1

    return desig_created, emp_created


async def _standalone() -> None:
    db = get_db()
    inst = await db["institutions"].find_one({"code": "SAE"})
    campus = await db["campuses"].find_one({"code": "SAE-CBE"})
    if not inst or not campus:
        print("SAE / SAE-CBE not found — run scripts/seed.py first.")
        await close_db()
        return
    units = await db["org_units"].find({"campus_id": campus["_id"]}).to_list(length=100)
    dept_ids = {u["code"]: str(u["_id"]) for u in units}
    dept_names = {u["code"]: u["name"] for u in units}
    print("Seeding HR…")
    d, e = await seed_hr_data(
        db,
        institution_id=str(inst["_id"]),
        campus_id=str(campus["_id"]),
        department_ids=dept_ids,
        department_names=dept_names,
    )
    print(f"Done. Designations +{d}, employees +{e}.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(_standalone())
