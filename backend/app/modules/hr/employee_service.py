from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.hr.enums import EmployeeStatus
from app.modules.hr.employee_org import resolve_employee_org
from app.modules.hr.employee_org_enrich import enrich_employee_org_names
from app.modules.hr.employee_out import EmployeeOut
from app.modules.hr.employee_schemas import EmployeeCreate, EmployeeUpdate
from app.modules.hr.helpers import doc_to_employee, oid, optional_oid


async def create_employee(db: AsyncIOMotorDatabase, payload: EmployeeCreate) -> EmployeeOut:
    if await db["institutions"].find_one({"_id": oid(payload.institution_id, "institution_id")}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    email = payload.official_email.lower()
    if await db["employees"].find_one({"official_email": email}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Employee with this email already exists")

    scope = await resolve_employee_org(
        db,
        institution_id=payload.institution_id,
        campus_id=payload.campus_id,
        department_id=payload.department_id,
        division_id=payload.division_id,
    )

    seq = await next_sequence(db, "employee_code")
    now = utcnow()
    display = payload.display_name or f"{payload.first_name} {payload.last_name}".strip()
    doc = {
        **payload.model_dump(
            exclude={
                "institution_id",
                "campus_id",
                "division_id",
                "department_id",
                "department_name",
                "reporting_manager_id",
            }
        ),
        "official_email": email,
        "display_name": display,
        "employee_code": f"EMP-{seq:05d}",
        "institution_id": oid(payload.institution_id, "institution_id"),
        "campus_id": scope["campus_id"],
        "campus_name": scope["campus_name"],
        "division_id": scope["division_id"],
        "division_name": scope["division_name"],
        "department_id": scope["department_id"],
        "department_name": scope["department_name"] or payload.department_name,
        "reporting_manager_id": optional_oid(payload.reporting_manager_id, "reporting_manager_id"),
        "status": EmployeeStatus.ACTIVE.value,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["employees"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_employee(doc, mask_sensitive=True)


async def list_employees(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    category: str | None = None,
    status_filter: str | None = None,
    q: str | None = None,
    campus_id: str | None = None,
    division_id: str | None = None,
    department_id: str | None = None,
    *,
    mask_sensitive: bool = True,
) -> list[EmployeeOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if campus_id:
        query["campus_id"] = oid(campus_id, "campus_id")
    if division_id:
        query["division_id"] = oid(division_id, "division_id")
    if department_id:
        query["department_id"] = oid(department_id, "department_id")
    if category:
        query["employee_category"] = category
    if status_filter:
        query["status"] = status_filter
    if q:
        query["$or"] = [
            {"display_name": {"$regex": q, "$options": "i"}},
            {"employee_code": {"$regex": q, "$options": "i"}},
            {"official_email": {"$regex": q, "$options": "i"}},
            {"designation": {"$regex": q, "$options": "i"}},
            {"department_name": {"$regex": q, "$options": "i"}},
            {"campus_name": {"$regex": q, "$options": "i"}},
            {"division_name": {"$regex": q, "$options": "i"}},
        ]
    docs = await db["employees"].find(query).sort("display_name", 1).to_list(length=1000)
    docs = await enrich_employee_org_names(db, docs)
    return [doc_to_employee(d, mask_sensitive=mask_sensitive) for d in docs]


async def get_employee(db: AsyncIOMotorDatabase, employee_id: str, *, mask_sensitive: bool = True) -> EmployeeOut:
    doc = await db["employees"].find_one({"_id": oid(employee_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    enriched = await enrich_employee_org_names(db, [doc])
    return doc_to_employee(enriched[0], mask_sensitive=mask_sensitive)


async def update_employee(db: AsyncIOMotorDatabase, employee_id: str, payload: EmployeeUpdate) -> EmployeeOut:
    oid_emp = oid(employee_id)
    existing = await db["employees"].find_one({"_id": oid_emp})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)

    org_keys = {"campus_id", "division_id", "department_id"}
    if org_keys & changes.keys():
        scope = await resolve_employee_org(
            db,
            institution_id=str(existing["institution_id"]),
            campus_id=str(changes.get("campus_id") or existing["campus_id"]),
            department_id=str(changes.get("department_id") or existing["department_id"]),
            division_id=str(changes["division_id"]) if changes.get("division_id") else (
                str(existing["division_id"]) if existing.get("division_id") else None
            ),
        )
        changes.update(
            {
                "campus_id": scope["campus_id"],
                "campus_name": scope["campus_name"],
                "division_id": scope["division_id"],
                "division_name": scope["division_name"],
                "department_id": scope["department_id"],
                "department_name": scope["department_name"],
            }
        )

    if "reporting_manager_id" in changes and changes["reporting_manager_id"]:
        changes["reporting_manager_id"] = oid(changes["reporting_manager_id"], "reporting_manager_id")
    if "status" in changes and hasattr(changes["status"], "value"):
        changes["status"] = changes["status"].value
    for key in ("employee_category", "employment_type", "faculty_rank", "doctoral_status"):
        if key in changes and hasattr(changes[key], "value"):
            changes[key] = changes[key].value
    changes["updated_at"] = utcnow()
    await db["employees"].update_one({"_id": oid_emp}, {"$set": changes})
    return await get_employee(db, employee_id)
