"""Shared campus / division / department scope for purchase documents."""

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def _str_id(value) -> str | None:
    if value is None:
        return None
    return str(value)


async def resolve_org_scope(
    db: AsyncIOMotorDatabase,
    *,
    campus_id: str | ObjectId | None,
    department_id: str | ObjectId | None,
    division_id: str | ObjectId | None = None,
) -> dict:
    campus_name = ""
    division_name = ""
    department_name = ""
    resolved_division_id: ObjectId | None = ObjectId(division_id) if division_id else None

    if campus_id:
        campus = await db["campuses"].find_one({"_id": ObjectId(str(campus_id))})
        if campus:
            campus_name = campus.get("name", "")

    dept = None
    if department_id:
        dept = await db["org_units"].find_one({"_id": ObjectId(str(department_id))})
        if dept:
            department_name = dept.get("name", "")

    if resolved_division_id is None and dept and dept.get("parent_id"):
        parent = await db["org_units"].find_one({"_id": dept["parent_id"]})
        if parent and parent.get("unit_type") == "division":
            resolved_division_id = parent["_id"]
            division_name = parent.get("name", "")
    elif resolved_division_id is not None:
        div = await db["org_units"].find_one({"_id": resolved_division_id})
        if div:
            division_name = div.get("name", "")

    return {
        "campus_id": ObjectId(str(campus_id)) if campus_id else None,
        "campus_name": campus_name,
        "division_id": resolved_division_id,
        "division_name": division_name,
        "department_id": ObjectId(str(department_id)) if department_id else None,
        "department_name": department_name,
    }


def org_scope_strings(doc: dict) -> dict:
    """Normalize org scope fields for API responses (safe defaults)."""
    return {
        "campus_id": _str_id(doc.get("campus_id")),
        "campus_name": doc.get("campus_name") or "",
        "division_id": _str_id(doc.get("division_id")),
        "division_name": doc.get("division_name") or "",
        "department_id": _str_id(doc.get("department_id")),
        "department_name": doc.get("department_name") or "",
    }


def copy_org_scope(source: dict) -> dict:
    """Copy denormalized org fields from an upstream purchase document."""
    keys = (
        "campus_id",
        "campus_name",
        "division_id",
        "division_name",
        "department_id",
        "department_name",
    )
    return {k: source.get(k) for k in keys if source.get(k) is not None or k.endswith("_name")}
