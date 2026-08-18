"""Idempotent attendance & leave seed.

Usage:
    cd backend && ./venv/bin/python scripts/seed_attendance.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.core.database import close_db, get_db
from app.main import ensure_indexes


def _as_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)

LEAVE_TYPES = [
    ("CL", "Casual Leave", True, 12, 0, False, None, False),
    ("EL", "Earned Leave", True, 15, 30, True, None, False),
    ("ML", "Maternity Leave", True, 180, 0, False, "female", True),
    ("RH", "Restricted Holiday", True, 2, 0, False, None, False),
    ("LOP", "Loss of Pay", False, 0, 0, False, None, False),
]


async def _ensure_stub_employees(db: AsyncIOMotorDatabase, institution_id: ObjectId) -> list[dict]:
    emps = await db["employees"].find({"institution_id": institution_id}).to_list(length=20)
    if emps:
        return emps
    print("  ! No employees found — creating stub employees for attendance seed")
    stubs = []
    now = utcnow()
    for i, name in enumerate(["Arun Kumar", "Priya Rajan", "Karthik Iyer", "Lakshmi Devi", "Suresh Pandian"], start=1):
        code = f"STUB-ATT-{i:03d}"
        existing = await db["employees"].find_one({"employee_code": code})
        if existing:
            stubs.append(existing)
            continue
        doc = {
            "employee_code": code,
            "institution_id": institution_id,
            "campus_id": None,
            "department_id": None,
            "department_name": "Administration",
            "display_name": name,
            "first_name": name.split()[0],
            "last_name": name.split()[-1],
            "official_email": f"stub.att{i}@sasurie.edu.in",
            "designation": "Staff",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        result = await db["employees"].insert_one(doc)
        doc["_id"] = result.inserted_id
        stubs.append(doc)
    return stubs


async def seed_attendance_data(db: AsyncIOMotorDatabase, institution_id: ObjectId, campus_id: ObjectId | None = None) -> None:
    for code, name, paid, accrual, carry, encash, gender, needs_doc in LEAVE_TYPES:
        await db["leave_types"].update_one(
            {"code": code},
            {
                "$set": {
                    "name": name,
                    "paid": paid,
                    "accrual_per_year": accrual,
                    "max_carry_forward": carry,
                    "encashable": encash,
                    "gender_restriction": gender,
                    "requires_document": needs_doc,
                },
                "$setOnInsert": {"code": code},
            },
            upsert=True,
        )

    await db["shifts"].update_one(
        {"code": "GEN", "institution_id": institution_id},
        {
            "$set": {
                "name": "General Shift",
                "start_time": "09:00",
                "end_time": "17:00",
                "grace_minutes": 15,
                "is_night": False,
                "updated_at": utcnow(),
            },
            "$setOnInsert": {"code": "GEN", "institution_id": institution_id, "created_at": utcnow()},
        },
        upsert=True,
    )

    employees = await _ensure_stub_employees(db, institution_id)
    year = date.today().year
    today = date.today().isoformat()
    now = utcnow()

    for emp in employees[:15]:
        eid = str(emp["_id"])
        name = emp.get("display_name") or f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
        for lt_code, opening in (("CL", 12), ("EL", 15), ("RH", 2)):
            await db["leave_balances"].update_one(
                {"employee_id": eid, "leave_type_code": lt_code, "year": year},
                {
                    "$setOnInsert": {
                        "employee_id": eid,
                        "leave_type_code": lt_code,
                        "year": year,
                        "opening": opening,
                        "accrued": 0,
                        "availed": 1 if lt_code == "CL" else 0,
                        "balance": opening - (1 if lt_code == "CL" else 0),
                    }
                },
                upsert=True,
            )
        await db["attendance_records"].update_one(
            {"employee_id": eid, "date": today},
            {
                "$setOnInsert": {
                    "employee_id": eid,
                    "employee_name": name,
                    "date": today,
                    "shift_code": "GEN",
                    "in_time": "09:05",
                    "out_time": "17:10",
                    "status": "present",
                    "late_minutes": 5,
                    "early_minutes": 0,
                    "source": "biometric",
                    "campus_id": campus_id,
                    "institution_id": institution_id,
                    "created_at": now,
                    "updated_at": now,
                }
            },
            upsert=True,
        )

    if await db["leave_applications"].find_one({"employee_id": str(employees[0]["_id"]), "status": "submitted"}) is None:
        await db["leave_applications"].insert_one(
            {
                "employee_id": str(employees[0]["_id"]),
                "leave_type_code": "CL",
                "from_date": _as_dt(date(year, 7, 28)),
                "to_date": _as_dt(date(year, 7, 29)),
                "days": 2,
                "reason": "Family function at Coimbatore",
                "status": "submitted",
                "approver_name": "",
                "substitute_name": employees[1].get("display_name", "Colleague") if len(employees) > 1 else "",
                "institution_id": institution_id,
                "created_at": now,
                "updated_at": now,
            }
        )
    print(f"  + attendance/leave seeded for {min(15, len(employees))} employees")


async def main() -> None:
    db = get_db()
    await ensure_indexes()
    inst = await db["institutions"].find_one({})
    campus = await db["campuses"].find_one({})
    if not inst:
        print("No institution found — run scripts/seed.py first.")
        await close_db()
        return
    print("Seeding attendance & leave…")
    await seed_attendance_data(db, inst["_id"], campus["_id"] if campus else None)
    print("Done.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
