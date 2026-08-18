from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.assets.asset_org import resolve_asset_org
from app.modules.assets.asset_org_enrich import enrich_asset_org_names
from app.modules.assets.helpers import doc_to_out, oid, optional_oid
from app.modules.assets.schemas import AssetCreate, AssetOut, AssetUpdate


async def create_asset(db: AsyncIOMotorDatabase, payload: AssetCreate) -> AssetOut:
    if await db["institutions"].find_one({"_id": oid(payload.institution_id, "institution_id")}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")

    scope = await resolve_asset_org(
        db,
        institution_id=payload.institution_id,
        campus_id=payload.campus_id,
        department_id=payload.department_id,
        division_id=payload.division_id,
    )
    seq = await next_sequence(db, "asset_code")
    now = utcnow()
    book_value = (
        payload.current_book_value
        if payload.current_book_value is not None
        else payload.capitalization_value
    )
    doc = {
        **payload.model_dump(
            exclude={
                "institution_id",
                "campus_id",
                "division_id",
                "department_id",
                "po_id",
                "grn_id",
                "custodian_employee_id",
                "current_book_value",
            }
        ),
        "asset_code": f"AST-{seq:05d}",
        "institution_id": oid(payload.institution_id, "institution_id"),
        "campus_id": scope["campus_id"],
        "campus_name": scope["campus_name"],
        "division_id": scope["division_id"],
        "division_name": scope["division_name"],
        "department_id": scope["department_id"],
        "department_name": scope["department_name"],
        "po_id": optional_oid(payload.po_id, "po_id"),
        "grn_id": optional_oid(payload.grn_id, "grn_id"),
        "custodian_employee_id": optional_oid(payload.custodian_employee_id, "custodian_employee_id"),
        "current_book_value": book_value,
        "status": "active",
        "disposal_sale_value": None,
        "disposal_gain_loss": None,
        "disposal_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["assets"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_out(doc)


async def list_assets(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    asset_class: str | None = None,
    status_filter: str | None = None,
    campus_id: str | None = None,
    division_id: str | None = None,
    department_id: str | None = None,
) -> list[AssetOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if asset_class:
        query["asset_class"] = asset_class
    if status_filter:
        query["status"] = status_filter
    if campus_id:
        query["campus_id"] = oid(campus_id, "campus_id")
    if division_id:
        query["division_id"] = oid(division_id, "division_id")
    if department_id:
        query["department_id"] = oid(department_id, "department_id")
    docs = await db["assets"].find(query).sort("asset_code", 1).to_list(length=1000)
    enriched = await enrich_asset_org_names(db, docs)
    return [doc_to_out(d) for d in enriched]


async def get_asset(db: AsyncIOMotorDatabase, asset_id: str) -> AssetOut:
    doc = await db["assets"].find_one({"_id": oid(asset_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    enriched = await enrich_asset_org_names(db, [doc])
    return doc_to_out(enriched[0])


async def update_asset(db: AsyncIOMotorDatabase, asset_id: str, payload: AssetUpdate) -> AssetOut:
    asset_oid = oid(asset_id)
    if await db["assets"].find_one({"_id": asset_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "custodian_employee_id" in changes and changes["custodian_employee_id"]:
        changes["custodian_employee_id"] = oid(changes["custodian_employee_id"], "custodian_employee_id")
    if "status" in changes and hasattr(changes["status"], "value"):
        changes["status"] = changes["status"].value
    for enum_key in ("funding_source", "depreciation_method"):
        if enum_key in changes and hasattr(changes[enum_key], "value"):
            changes[enum_key] = changes[enum_key].value
    changes["updated_at"] = utcnow()
    await db["assets"].update_one({"_id": asset_oid}, {"$set": changes})
    return await get_asset(db, asset_id)
