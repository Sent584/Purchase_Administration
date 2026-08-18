from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.config_console.schemas import GlobalConfig, GlobalConfigOut, GlobalConfigUpdate

CONFIG_SINGLETON_ID = "global"


async def get_active_config(db: AsyncIOMotorDatabase) -> GlobalConfigOut:
    doc = await db["global_config"].find_one({"_id": CONFIG_SINGLETON_ID})
    if doc is None:
        default = GlobalConfig()
        doc = {
            "_id": CONFIG_SINGLETON_ID,
            "version": 1,
            "effective_from": utcnow(),
            "updated_at": utcnow(),
            "updated_by": None,
            **default.model_dump(),
        }
        await db["global_config"].insert_one(doc)
    else:
        # A document-numbering rule added to the code-level defaults after this config was
        # first created wouldn't otherwise appear (Mongo already has a `document_numbering`
        # dict, so the model's default_factory never runs) — merge in any missing entries
        # so admins see the intended prefix instead of a numbering module silently falling
        # back to an auto-abbreviated one.
        default_numbering = GlobalConfig().document_numbering
        missing = {k: v.model_dump() for k, v in default_numbering.items() if k not in doc.get("document_numbering", {})}
        if missing:
            doc["document_numbering"] = {**doc.get("document_numbering", {}), **missing}
            await db["global_config"].update_one({"_id": CONFIG_SINGLETON_ID}, {"$set": {"document_numbering": doc["document_numbering"]}})
    return GlobalConfigOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


async def update_config(
    db: AsyncIOMotorDatabase, patch: GlobalConfigUpdate, updated_by: str | None
) -> GlobalConfigOut:
    current = await get_active_config(db)

    # archive the version being replaced so policy history is never lost
    current_dict = current.model_dump(exclude={"id"})
    await db["global_config_history"].insert_one({**current_dict, "archived_at": utcnow()})

    changes = patch.model_dump(exclude_unset=True, exclude_none=True)
    new_version = {**current_dict, **changes, "version": current.version + 1, "updated_at": utcnow(), "updated_by": updated_by}
    new_version.pop("effective_from", None)
    new_version["effective_from"] = utcnow()

    await db["global_config"].update_one(
        {"_id": CONFIG_SINGLETON_ID},
        {"$set": new_version},
        upsert=True,
    )
    return await get_active_config(db)


async def get_password_policy(db: AsyncIOMotorDatabase):
    config = await get_active_config(db)
    return config.password_policy


async def get_otp_policy(db: AsyncIOMotorDatabase):
    config = await get_active_config(db)
    return config.otp_policy
