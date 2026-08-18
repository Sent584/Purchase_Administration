from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.common.base_models import utcnow
from app.modules.assets.asset_org import resolve_asset_org
from app.modules.assets.helpers import oid, optional_oid
from app.modules.assets.schemas import AssetDisposeRequest, AssetOut, AssetTransferRequest
from app.modules.assets.service_crud import get_asset


async def _require_asset(db: AsyncIOMotorDatabase, asset_id: str) -> dict:
    doc = await db["assets"].find_one({"_id": oid(asset_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    return doc


async def transfer_asset(
    db: AsyncIOMotorDatabase,
    asset_id: str,
    payload: AssetTransferRequest,
    performed_by: str,
) -> AssetOut:
    doc = await _require_asset(db, asset_id)
    if doc["status"] in ("disposed", "written_off"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot transfer a disposed or written-off asset")

    now = utcnow()
    changes: dict = {
        "custodian_name": payload.custodian_name,
        "custodian_employee_id": optional_oid(payload.custodian_employee_id, "custodian_employee_id"),
        "location_building": payload.location_building,
        "location_floor": payload.location_floor,
        "location_room": payload.location_room,
        "status": "transferred",
        "updated_at": now,
    }
    if payload.department_id or payload.campus_id or payload.division_id:
        scope = await resolve_asset_org(
            db,
            institution_id=str(doc["institution_id"]),
            campus_id=payload.campus_id or str(doc["campus_id"]),
            department_id=payload.department_id or str(doc["department_id"]),
            division_id=payload.division_id
            or (str(doc["division_id"]) if doc.get("division_id") else None),
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

    await db["assets"].update_one({"_id": doc["_id"]}, {"$set": changes})
    await db["asset_movements"].insert_one(
        {
            "asset_id": doc["_id"],
            "asset_code": doc["asset_code"],
            "movement_type": "transfer",
            "from_custodian": doc.get("custodian_name", ""),
            "to_custodian": payload.custodian_name,
            "from_location": f"{doc.get('location_building', '')}/{doc.get('location_room', '')}",
            "to_location": f"{payload.location_building}/{payload.location_room}",
            "remarks": payload.remarks,
            "performed_by": performed_by,
            "at": now,
        }
    )
    # After transfer, set back to active for operational use
    await db["assets"].update_one({"_id": doc["_id"]}, {"$set": {"status": "active", "updated_at": utcnow()}})
    return await get_asset(db, asset_id)


async def dispose_asset(
    db: AsyncIOMotorDatabase,
    asset_id: str,
    payload: AssetDisposeRequest,
    performed_by: str,
) -> AssetOut:
    doc = await _require_asset(db, asset_id)
    if doc["status"] in ("disposed", "written_off"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Asset already disposed or written off")

    book_value = float(doc.get("current_book_value") or 0)
    gain_loss = round(payload.sale_value - book_value, 2)
    now = payload.disposal_date or utcnow()

    await db["assets"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "status": "disposed",
                "disposal_sale_value": payload.sale_value,
                "disposal_gain_loss": gain_loss,
                "disposal_reason": payload.reason,
                "updated_at": utcnow(),
            }
        },
    )
    await db["asset_movements"].insert_one(
        {
            "asset_id": doc["_id"],
            "asset_code": doc["asset_code"],
            "movement_type": "disposal",
            "sale_value": payload.sale_value,
            "book_value": book_value,
            "gain_loss": gain_loss,
            "remarks": payload.reason,
            "performed_by": performed_by,
            "at": now,
        }
    )
    return await get_asset(db, asset_id)
