from motor.motor_asyncio import AsyncIOMotorDatabase


async def next_sequence(db: AsyncIOMotorDatabase, key: str, *, start: int = 1) -> int:
    """Atomically increments and returns the next value for a named counter.

    Used for document numbering (PO-2026-0001 etc.) and short org/employee codes,
    where two concurrent requests must never receive the same number.
    """
    await db["counters"].update_one(
        {"_id": key},
        {"$setOnInsert": {"seq": start - 1}},
        upsert=True,
    )
    doc = await db["counters"].find_one_and_update(
        {"_id": key},
        {"$inc": {"seq": 1}},
        return_document=True,
    )
    return doc["seq"]
