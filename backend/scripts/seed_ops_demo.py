"""Operational demo data — leave apps, stock issues, richer attendance."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence


def _today() -> date:
    return date.today()


def _as_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


async def seed_ops_demo(db: AsyncIOMotorDatabase, institution_id: ObjectId, campus_id: ObjectId) -> None:
    employees = await db["employees"].find({"institution_id": institution_id, "status": "active"}).to_list(length=120)
    if not employees:
        print("  ! no employees for ops demo")
        return

    year = _today().year
    now = utcnow()
    today = _today()

    # Broader attendance: present / late / absent / on_leave mix for last 5 working days
    for day_offset in range(5):
        d = today - timedelta(days=day_offset)
        if d.weekday() >= 5:
            continue
        d_str = d.isoformat()
        for idx, emp in enumerate(employees[:60]):
            eid = str(emp["_id"])
            name = emp.get("display_name", "Staff")
            status = "present"
            late = 0
            if idx % 17 == 0:
                status = "absent"
            elif idx % 11 == 0:
                status = "on_leave"
            elif idx % 9 == 0:
                late = 20
            await db["attendance_records"].update_one(
                {"employee_id": eid, "date": d_str},
                {
                    "$setOnInsert": {
                        "employee_id": eid,
                        "employee_name": name,
                        "date": d_str,
                        "shift_code": "GEN",
                        "in_time": None if status != "present" else f"09:{5 + (idx % 20):02d}",
                        "out_time": None if status != "present" else "17:05",
                        "status": status,
                        "late_minutes": late,
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

    # Leave balances for more staff
    for emp in employees[:80]:
        eid = str(emp["_id"])
        for code, opening in (("CL", 12), ("EL", 15), ("RH", 2)):
            await db["leave_balances"].update_one(
                {"employee_id": eid, "leave_type_code": code, "year": year},
                {
                    "$setOnInsert": {
                        "employee_id": eid,
                        "leave_type_code": code,
                        "year": year,
                        "opening": opening,
                        "accrued": 0,
                        "availed": 2 if code == "CL" else 0,
                        "balance": opening - (2 if code == "CL" else 0),
                    }
                },
                upsert=True,
            )

    # Sample leave applications with mix of statuses
    leave_specs = [
        (0, "CL", 2, "submitted", "Temple festival at Tiruppur — family function"),
        (1, "EL", 3, "approved", "Personal travel to Chennai — Anna University conference follow-up"),
        (2, "CL", 1, "submitted", "Medical appointment at KMCH Coimbatore"),
        (3, "EL", 5, "rejected", "Extended vacation — insufficient substitute coverage"),
        (4, "CL", 2, "approved", "On-duty related personal work after NBA visit"),
        (5, "RH", 1, "submitted", "Restricted holiday — regional festival"),
    ]
    for idx, code, days, status, reason in leave_specs:
        if idx >= len(employees):
            break
        emp = employees[idx]
        eid = str(emp["_id"])
        if await db["leave_applications"].find_one({"employee_id": eid, "reason": reason}):
            continue
        start = today + timedelta(days=7 + idx)
        await db["leave_applications"].insert_one(
            {
                "employee_id": eid,
                "leave_type_code": code,
                "from_date": _as_dt(start),
                "to_date": _as_dt(start + timedelta(days=days - 1)),
                "days": days,
                "reason": reason,
                "status": status,
                "approver_name": "Dr. R. Venkatesan" if status in ("approved", "rejected") else "",
                "substitute_name": employees[(idx + 1) % len(employees)].get("display_name", ""),
                "institution_id": institution_id,
                "created_at": now,
                "updated_at": now,
            }
        )
    print(f"  + attendance/leave ops for {min(60, len(employees))} staff + sample applications")

    # Stock issues from central store against CSE department
    store = await db["stores"].find_one({"code": {"$in": ["STR-CENTRAL", "STR-CEN"]}})
    balances = await db["stock_balances"].find({"institution_id": institution_id}).to_list(length=20)
    if store and balances:
        for bal in balances[:5]:
            if float(bal.get("quantity", 0)) < 5:
                continue
            key = f"ISSUE-SEED-{bal['item_id']}"
            if await db["stock_transactions"].find_one({"seed_key": key}):
                continue
            seq = await next_sequence(db, "stock_txn")
            qty = min(5.0, float(bal["quantity"]) * 0.1)
            await db["stock_transactions"].insert_one(
                {
                    "txn_number": f"STX-{seq:06d}",
                    "store_id": store["_id"],
                    "institution_id": institution_id,
                    "txn_type": "issue",
                    "item_id": bal["item_id"],
                    "item_code": bal.get("item_code", ""),
                    "item_name": bal.get("item_name", ""),
                    "quantity": qty,
                    "uom": bal.get("uom", "Nos"),
                    "rate": float(bal.get("last_rate", 0)),
                    "reference_type": "department_indent",
                    "reference_id": "CSE Lab consumables FY26",
                    "remarks": "Issued to CSE programming lab — NBA readiness",
                    "department_id": None,
                    "issued_to": "CSE Lab In-charge",
                    "to_store_id": None,
                    "status": "posted",
                    "seed_key": key,
                    "created_at": now,
                    "updated_at": now,
                }
            )
            await db["stock_balances"].update_one(
                {"_id": bal["_id"]},
                {"$inc": {"quantity": -qty}, "$set": {"updated_at": now}},
            )
        print("  + sample store issues posted against lab indents")
