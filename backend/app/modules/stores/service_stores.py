from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.common.base_models import utcnow
from app.modules.stores.helpers import oid
from app.modules.stores.schemas import StoreCreate, StoreOut, StoreStatus, StoreUpdate


def _store_out(doc: dict) -> StoreOut:
    return StoreOut(
        id=str(doc["_id"]),
        institution_id=str(doc["institution_id"]),
        campus_id=str(doc["campus_id"]),
        code=doc["code"],
        name=doc["name"],
        store_type=doc["store_type"],
        location=doc.get("location", ""),
        in_charge_name=doc.get("in_charge_name", ""),
        status=doc.get("status", StoreStatus.ACTIVE),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def create_store(db: AsyncIOMotorDatabase, payload: StoreCreate) -> StoreOut:
    institution_oid = oid(payload.institution_id, "institution_id")
    campus_oid = oid(payload.campus_id, "campus_id")
    if await db["institutions"].find_one({"_id": institution_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    if await db["campuses"].find_one({"_id": campus_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campus not found")
    if await db["stores"].find_one({"code": payload.code}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Store code '{payload.code}' already exists")

    now = utcnow()
    doc = {
        "institution_id": institution_oid,
        "campus_id": campus_oid,
        "code": payload.code.strip().upper(),
        "name": payload.name.strip(),
        "store_type": payload.store_type.value,
        "location": payload.location,
        "in_charge_name": payload.in_charge_name,
        "status": StoreStatus.ACTIVE.value,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["stores"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _store_out(doc)


async def list_stores(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    campus_id: str | None = None,
    status_filter: str | None = None,
) -> list[StoreOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if campus_id:
        query["campus_id"] = oid(campus_id, "campus_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["stores"].find(query).sort("name", 1).to_list(length=500)
    return [_store_out(d) for d in docs]


async def get_store(db: AsyncIOMotorDatabase, store_id: str) -> StoreOut:
    doc = await db["stores"].find_one({"_id": oid(store_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    return _store_out(doc)


async def update_store(db: AsyncIOMotorDatabase, store_id: str, payload: StoreUpdate) -> StoreOut:
    store_oid = oid(store_id)
    if await db["stores"].find_one({"_id": store_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "store_type" in changes and hasattr(changes["store_type"], "value"):
        changes["store_type"] = changes["store_type"].value
    if "status" in changes and hasattr(changes["status"], "value"):
        changes["status"] = changes["status"].value
    changes["updated_at"] = utcnow()
    await db["stores"].update_one({"_id": store_oid}, {"$set": changes})
    return await get_store(db, store_id)
