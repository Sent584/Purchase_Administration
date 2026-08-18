from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.org.schemas import (
    CampusCreate,
    CampusOut,
    CampusUpdate,
    GroupCreate,
    GroupOut,
    GroupUpdate,
    InstitutionCreate,
    InstitutionOut,
    InstitutionUpdate,
    OrgUnitCreate,
    OrgUnitOut,
    OrgUnitUpdate,
)


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _not_found(label: str):
    raise HTTPException(status.HTTP_404_NOT_FOUND, f"{label} not found")


def _doc_to_out(doc: dict, model_cls):
    data = {**doc, "id": str(doc["_id"])}
    for key in ("group_id", "institution_id", "campus_id", "parent_id"):
        if key in data and data[key] is not None:
            data[key] = str(data[key])
    data.pop("_id")
    return model_cls(**data)


# --------------------------------------------------------------- Group -----

async def create_group(db: AsyncIOMotorDatabase, payload: GroupCreate) -> GroupOut:
    if await db["groups"].find_one({"org_code": payload.org_code}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Group code '{payload.org_code}' already exists")
    now = utcnow()
    doc = {**payload.model_dump(), "status": "active", "created_at": now, "updated_at": now}
    result = await db["groups"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, GroupOut)


async def list_groups(db: AsyncIOMotorDatabase) -> list[GroupOut]:
    docs = await db["groups"].find().sort("legal_name", 1).to_list(length=100)
    return [_doc_to_out(d, GroupOut) for d in docs]


async def get_group(db: AsyncIOMotorDatabase, group_id: str) -> GroupOut:
    doc = await db["groups"].find_one({"_id": _oid(group_id)})
    if doc is None:
        _not_found("Group")
    return _doc_to_out(doc, GroupOut)


async def update_group(db: AsyncIOMotorDatabase, group_id: str, payload: GroupUpdate) -> GroupOut:
    oid = _oid(group_id)
    if await db["groups"].find_one({"_id": oid}) is None:
        _not_found("Group")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["groups"].update_one({"_id": oid}, {"$set": changes})
    return await get_group(db, group_id)


# --------------------------------------------------------- Institution -----

async def create_institution(db: AsyncIOMotorDatabase, payload: InstitutionCreate) -> InstitutionOut:
    group_oid = _oid(payload.group_id, "group_id")
    if await db["groups"].find_one({"_id": group_oid}) is None:
        _not_found("Group")
    if await db["institutions"].find_one({"code": payload.code}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Institution code '{payload.code}' already exists")

    now = utcnow()
    doc = {**payload.model_dump(exclude={"group_id"}), "group_id": group_oid, "status": "active", "created_at": now, "updated_at": now}
    result = await db["institutions"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, InstitutionOut)


async def list_institutions(db: AsyncIOMotorDatabase, group_id: str | None = None) -> list[InstitutionOut]:
    query = {"group_id": _oid(group_id, "group_id")} if group_id else {}
    docs = await db["institutions"].find(query).sort("name", 1).to_list(length=200)
    return [_doc_to_out(d, InstitutionOut) for d in docs]


async def get_institution(db: AsyncIOMotorDatabase, institution_id: str) -> InstitutionOut:
    doc = await db["institutions"].find_one({"_id": _oid(institution_id)})
    if doc is None:
        _not_found("Institution")
    return _doc_to_out(doc, InstitutionOut)


async def update_institution(db: AsyncIOMotorDatabase, institution_id: str, payload: InstitutionUpdate) -> InstitutionOut:
    oid = _oid(institution_id)
    if await db["institutions"].find_one({"_id": oid}) is None:
        _not_found("Institution")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["institutions"].update_one({"_id": oid}, {"$set": changes})
    return await get_institution(db, institution_id)


# -------------------------------------------------------------- Campus -----

async def create_campus(db: AsyncIOMotorDatabase, payload: CampusCreate) -> CampusOut:
    institution_oid = _oid(payload.institution_id, "institution_id")
    institution = await db["institutions"].find_one({"_id": institution_oid})
    if institution is None:
        _not_found("Institution")
    if await db["campuses"].find_one({"code": payload.code}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Campus code '{payload.code}' already exists")

    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id"}),
        "institution_id": institution_oid,
        "group_id": institution["group_id"],
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    result = await db["campuses"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, CampusOut)


async def list_campuses(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[CampusOut]:
    query = {"institution_id": _oid(institution_id, "institution_id")} if institution_id else {}
    docs = await db["campuses"].find(query).sort("name", 1).to_list(length=200)
    return [_doc_to_out(d, CampusOut) for d in docs]


async def get_campus(db: AsyncIOMotorDatabase, campus_id: str) -> CampusOut:
    doc = await db["campuses"].find_one({"_id": _oid(campus_id)})
    if doc is None:
        _not_found("Campus")
    return _doc_to_out(doc, CampusOut)


async def update_campus(db: AsyncIOMotorDatabase, campus_id: str, payload: CampusUpdate) -> CampusOut:
    oid = _oid(campus_id)
    if await db["campuses"].find_one({"_id": oid}) is None:
        _not_found("Campus")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["campuses"].update_one({"_id": oid}, {"$set": changes})
    return await get_campus(db, campus_id)


# ------------------------------------------------------------ Org Unit -----

async def create_org_unit(db: AsyncIOMotorDatabase, payload: OrgUnitCreate) -> OrgUnitOut:
    campus_oid = _oid(payload.campus_id, "campus_id")
    campus = await db["campuses"].find_one({"_id": campus_oid})
    if campus is None:
        _not_found("Campus")
    if await db["org_units"].find_one({"code": payload.code}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Org unit code '{payload.code}' already exists")

    parent_oid = None
    if payload.parent_id:
        parent_oid = _oid(payload.parent_id, "parent_id")
        if await db["org_units"].find_one({"_id": parent_oid}) is None:
            _not_found("Parent org unit")

    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"campus_id", "parent_id", "unit_type"}),
        "unit_type": payload.unit_type.value,
        "campus_id": campus_oid,
        "institution_id": campus["institution_id"],
        "group_id": campus["group_id"],
        "parent_id": parent_oid,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    result = await db["org_units"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, OrgUnitOut)


async def list_org_units(db: AsyncIOMotorDatabase, campus_id: str | None = None) -> list[OrgUnitOut]:
    query = {"campus_id": _oid(campus_id, "campus_id")} if campus_id else {}
    docs = await db["org_units"].find(query).sort("name", 1).to_list(length=1000)
    return [_doc_to_out(d, OrgUnitOut) for d in docs]


async def get_org_unit(db: AsyncIOMotorDatabase, unit_id: str) -> OrgUnitOut:
    doc = await db["org_units"].find_one({"_id": _oid(unit_id)})
    if doc is None:
        _not_found("Org unit")
    return _doc_to_out(doc, OrgUnitOut)


async def update_org_unit(db: AsyncIOMotorDatabase, unit_id: str, payload: OrgUnitUpdate) -> OrgUnitOut:
    oid = _oid(unit_id)
    if await db["org_units"].find_one({"_id": oid}) is None:
        _not_found("Org unit")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "parent_id" in changes and changes["parent_id"]:
        changes["parent_id"] = _oid(changes["parent_id"], "parent_id")
    changes["updated_at"] = utcnow()
    await db["org_units"].update_one({"_id": oid}, {"$set": changes})
    return await get_org_unit(db, unit_id)
