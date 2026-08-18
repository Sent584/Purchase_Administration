from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.assets import service
from app.modules.assets.schemas import (
    AssetCreate,
    AssetDisposeRequest,
    AssetOut,
    AssetsDashboard,
    AssetTransferRequest,
    AssetUpdate,
)
from app.modules.assets.service_procurement import AssetProcurementOut, get_asset_procurement

router = APIRouter(prefix="/api/v1/assets", tags=["Assets"])

read_dep = require_permission("assets:read")
write_dep = require_permission("assets:write")
transfer_dep = require_permission("assets:transfer")
dispose_dep = require_permission("assets:dispose")


@router.get("/dashboard", response_model=AssetsDashboard)
async def assets_dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.get_assets_dashboard(db, institution_id)


@router.post("", response_model=AssetOut, status_code=201)
async def create_asset(
    payload: AssetCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(write_dep),
):
    return await service.create_asset(db, payload)


@router.get("", response_model=list[AssetOut])
async def list_assets(
    institution_id: str | None = Query(default=None),
    asset_class: str | None = Query(default=None),
    status: str | None = Query(default=None),
    campus_id: str | None = Query(default=None),
    division_id: str | None = Query(default=None),
    department_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_assets(
        db,
        institution_id,
        asset_class,
        status,
        campus_id=campus_id,
        division_id=division_id,
        department_id=department_id,
    )


@router.get("/{asset_id}/procurement", response_model=AssetProcurementOut)
async def asset_procurement(
    asset_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await get_asset_procurement(db, asset_id)


@router.get("/{asset_id}", response_model=AssetOut)
async def get_asset(asset_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_asset(db, asset_id)


@router.patch("/{asset_id}", response_model=AssetOut)
async def update_asset(
    asset_id: str,
    payload: AssetUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(write_dep),
):
    return await service.update_asset(db, asset_id, payload)


@router.post("/{asset_id}/transfer", response_model=AssetOut)
async def transfer_asset(
    asset_id: str,
    payload: AssetTransferRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(transfer_dep),
):
    return await service.transfer_asset(db, asset_id, payload, user.email)


@router.post("/{asset_id}/dispose", response_model=AssetOut)
async def dispose_asset(
    asset_id: str,
    payload: AssetDisposeRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(dispose_dep),
):
    return await service.dispose_asset(db, asset_id, payload, user.email)
