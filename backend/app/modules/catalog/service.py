from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.catalog.schemas import ItemCreate, ItemOut, ItemUpdate


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _doc_to_out(doc: dict) -> ItemOut:
    data = {**doc, "id": str(doc["_id"]), "institution_id": str(doc["institution_id"])}
    data.pop("_id")
    return ItemOut(**data)


async def create_item(db: AsyncIOMotorDatabase, payload: ItemCreate) -> ItemOut:
    institution_oid = _oid(payload.institution_id, "institution_id")
    if await db["institutions"].find_one({"_id": institution_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")

    seq = await next_sequence(db, "item_code")
    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id"}),
        "code": f"ITM-{seq:05d}",
        "institution_id": institution_oid,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    result = await db["items"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def list_items(db: AsyncIOMotorDatabase, institution_id: str | None = None, category: str | None = None) -> list[ItemOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = _oid(institution_id, "institution_id")
    if category:
        query["category"] = category
    docs = await db["items"].find(query).sort("name", 1).to_list(length=1000)
    return [_doc_to_out(d) for d in docs]


async def get_item(db: AsyncIOMotorDatabase, item_id: str) -> ItemOut:
    doc = await db["items"].find_one({"_id": _oid(item_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return _doc_to_out(doc)


async def update_item(db: AsyncIOMotorDatabase, item_id: str, payload: ItemUpdate) -> ItemOut:
    oid = _oid(item_id)
    if await db["items"].find_one({"_id": oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["items"].update_one({"_id": oid}, {"$set": changes})
    return await get_item(db, item_id)
