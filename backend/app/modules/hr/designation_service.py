from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.hr.designation_schemas import DesignationCreate, DesignationOut, DesignationUpdate
from app.modules.hr.helpers import oid


def _to_out(doc: dict) -> DesignationOut:
    return DesignationOut(
        id=str(doc["_id"]),
        institution_id=str(doc["institution_id"]),
        name=doc["name"],
        code=doc["code"],
        category=doc["category"],
        grade=doc.get("grade", ""),
        pay_level=doc.get("pay_level", ""),
        retirement_age=doc.get("retirement_age", 60),
        is_active=doc.get("is_active", True),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def create_designation(db: AsyncIOMotorDatabase, payload: DesignationCreate) -> DesignationOut:
    if await db["designations"].find_one({"code": payload.code, "institution_id": oid(payload.institution_id)}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Designation code '{payload.code}' already exists")
    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id", "category"}),
        "category": payload.category.value,
        "institution_id": oid(payload.institution_id, "institution_id"),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["designations"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


async def list_designations(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[DesignationOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["designations"].find(query).sort("name", 1).to_list(length=500)
    return [_to_out(d) for d in docs]


async def get_designation(db: AsyncIOMotorDatabase, designation_id: str) -> DesignationOut:
    doc = await db["designations"].find_one({"_id": oid(designation_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    return _to_out(doc)


async def update_designation(db: AsyncIOMotorDatabase, designation_id: str, payload: DesignationUpdate) -> DesignationOut:
    oid_d = oid(designation_id)
    if await db["designations"].find_one({"_id": oid_d}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "category" in changes and hasattr(changes["category"], "value"):
        changes["category"] = changes["category"].value
    changes["updated_at"] = utcnow()
    await db["designations"].update_one({"_id": oid_d}, {"$set": changes})
    doc = await db["designations"].find_one({"_id": oid_d})
    return _to_out(doc)
