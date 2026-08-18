"""Fill missing campus/division names for employee API responses (read-path)."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.purchase_common.org_scope import resolve_org_scope


async def enrich_employee_org_names(db: AsyncIOMotorDatabase, docs: list[dict]) -> list[dict]:
    """Attach denormalized org names when absent (does not persist)."""
    out: list[dict] = []
    for doc in docs:
        if doc.get("campus_name") and (doc.get("division_name") or not doc.get("department_id")):
            out.append(doc)
            continue
        campus_id = doc.get("campus_id")
        department_id = doc.get("department_id")
        if not campus_id or not department_id:
            out.append(doc)
            continue
        scope = await resolve_org_scope(
            db,
            campus_id=campus_id,
            department_id=department_id,
            division_id=doc.get("division_id"),
        )
        enriched = {
            **doc,
            "campus_name": doc.get("campus_name") or scope["campus_name"],
            "division_id": doc.get("division_id") or scope["division_id"],
            "division_name": doc.get("division_name") or scope["division_name"],
            "department_name": doc.get("department_name") or scope["department_name"],
        }
        out.append(enriched)
    return out
