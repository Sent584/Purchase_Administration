from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.attendance.helpers import oid, str_id
from app.modules.attendance.schemas import ShiftCreate, ShiftOut, ShiftUpdate


def _to_shift(doc: dict) -> ShiftOut:
    return ShiftOut(**str_id(doc, "institution_id"))


async def create_shift(db: AsyncIOMotorDatabase, payload: ShiftCreate) -> ShiftOut:
    institution_oid = oid(payload.institution_id, "institution_id")
    if await db["institutions"].find_one({"_id": institution_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    if await db["shifts"].find_one({"code": payload.code, "institution_id": institution_oid}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Shift code '{payload.code}' already exists")
    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id"}),
        "institution_id": institution_oid,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["shifts"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_shift(doc)


async def list_shifts(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[ShiftOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["shifts"].find(query).sort("code", 1).to_list(length=200)
    return [_to_shift(d) for d in docs]


async def get_shift(db: AsyncIOMotorDatabase, shift_id: str) -> ShiftOut:
    doc = await db["shifts"].find_one({"_id": oid(shift_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shift not found")
    return _to_shift(doc)


async def update_shift(db: AsyncIOMotorDatabase, shift_id: str, payload: ShiftUpdate) -> ShiftOut:
    sid = oid(shift_id)
    if await db["shifts"].find_one({"_id": sid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shift not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["shifts"].update_one({"_id": sid}, {"$set": changes})
    return await get_shift(db, shift_id)


async def delete_shift(db: AsyncIOMotorDatabase, shift_id: str) -> None:
    result = await db["shifts"].delete_one({"_id": oid(shift_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shift not found")
