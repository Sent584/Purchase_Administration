from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.catalog import service
from app.modules.catalog.schemas import ItemCreate, ItemOut, ItemUpdate

router = APIRouter(prefix="/api/v1/catalog/items", tags=["Item Catalog"])

read_dep = require_permission("catalog:read")
write_dep = require_permission("catalog:write")


@router.post("", response_model=ItemOut, status_code=201)
async def create_item(payload: ItemCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_item(db, payload)


@router.get("", response_model=list[ItemOut])
async def list_items(
    institution_id: str | None = Query(default=None),
    category: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_items(db, institution_id, category)


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_item(db, item_id)


@router.patch("/{item_id}", response_model=ItemOut)
async def update_item(item_id: str, payload: ItemUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_item(db, item_id, payload)
