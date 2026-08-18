"""Validate and resolve campus / division / department for employees."""

from __future__ import annotations

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.hr.helpers import oid
from app.modules.purchase_common.org_scope import resolve_org_scope


async def resolve_employee_org(
    db: AsyncIOMotorDatabase,
    *,
    institution_id: str,
    campus_id: str,
    department_id: str,
    division_id: str | None = None,
) -> dict:
    inst_oid = oid(institution_id, "institution_id")
    campus_oid = oid(campus_id, "campus_id")
    dept_oid = oid(department_id, "department_id")

    campus = await db["campuses"].find_one({"_id": campus_oid})
    if campus is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Campus not found")
    if campus.get("institution_id") != inst_oid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Campus does not belong to institution")

    dept = await db["org_units"].find_one({"_id": dept_oid})
    if dept is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Department not found")
    if dept.get("campus_id") != campus_oid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Department does not belong to campus")

    if division_id:
        div_oid = oid(division_id, "division_id")
        div = await db["org_units"].find_one({"_id": div_oid})
        if div is None or div.get("unit_type") != "division":
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Division not found")
        if div.get("campus_id") != campus_oid:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Division does not belong to campus")
        if dept.get("parent_id") and dept["parent_id"] != div_oid:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Department is not under the selected division")

    scope = await resolve_org_scope(
        db,
        campus_id=campus_id,
        department_id=department_id,
        division_id=division_id,
    )
    if not scope.get("department_name"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Department name could not be resolved")
    return scope
