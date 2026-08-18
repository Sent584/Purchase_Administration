"""Fill missing campus/division names on asset responses (read-path)."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.purchase_common.org_scope import resolve_org_scope


async def enrich_asset_org_names(db: AsyncIOMotorDatabase, docs: list[dict]) -> list[dict]:
    out: list[dict] = []
    for doc in docs:
        if doc.get("campus_name") and (doc.get("division_name") or not doc.get("department_id")):
            out.append(doc)
            continue
        if not doc.get("campus_id") or not doc.get("department_id"):
            out.append(doc)
            continue
        scope = await resolve_org_scope(
            db,
            campus_id=doc["campus_id"],
            department_id=doc["department_id"],
            division_id=doc.get("division_id"),
        )
        out.append(
            {
                **doc,
                "campus_name": doc.get("campus_name") or scope["campus_name"],
                "division_id": doc.get("division_id") or scope["division_id"],
                "division_name": doc.get("division_name") or scope["division_name"],
                "department_name": doc.get("department_name") or scope["department_name"],
            }
        )
    return out
