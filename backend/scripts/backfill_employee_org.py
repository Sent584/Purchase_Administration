"""Backfill campus_name / division_* on existing employees from org units."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import close_db, get_db
from app.modules.purchase_common.org_scope import resolve_org_scope


async def main() -> None:
    db = get_db()
    updated = 0
    cursor = db["employees"].find({})
    async for emp in cursor:
        campus_id = emp.get("campus_id")
        department_id = emp.get("department_id")
        if not campus_id or not department_id:
            continue
        scope = await resolve_org_scope(
            db,
            campus_id=campus_id,
            department_id=department_id,
            division_id=emp.get("division_id"),
        )
        patch = {
            "campus_name": scope["campus_name"],
            "division_id": scope["division_id"],
            "division_name": scope["division_name"],
            "department_name": scope["department_name"] or emp.get("department_name") or "",
        }
        await db["employees"].update_one({"_id": emp["_id"]}, {"$set": patch})
        updated += 1
        print(f"  ~ {emp.get('employee_code')} → {patch['campus_name']} / {patch['division_name']} / {patch['department_name']}")
    print(f"Backfilled {updated} employees.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
