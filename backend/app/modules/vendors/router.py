from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.vendors import service
from app.modules.vendors.schemas import VendorBlacklistRequest, VendorCreate, VendorOut, VendorStats, VendorUpdate

router = APIRouter(prefix="/api/v1/purchase/vendors", tags=["Purchase — Vendors"])

read_dep = require_permission("vendor:read")
write_dep = require_permission("vendor:write")


@router.post("", response_model=VendorOut, status_code=201)
async def create_vendor(payload: VendorCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.create_vendor(db, payload)


@router.get("", response_model=list[VendorOut])
async def list_vendors(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service.list_vendors(db, institution_id, status)


@router.get("/{vendor_id}", response_model=VendorOut)
async def get_vendor(vendor_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_vendor(db, vendor_id)


@router.get("/{vendor_id}/stats", response_model=VendorStats)
async def get_vendor_stats(vendor_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service.get_vendor_stats(db, vendor_id)


@router.patch("/{vendor_id}", response_model=VendorOut)
async def update_vendor(vendor_id: str, payload: VendorUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.update_vendor(db, vendor_id, payload)


@router.post("/{vendor_id}/blacklist", response_model=VendorOut)
async def blacklist_vendor(vendor_id: str, payload: VendorBlacklistRequest, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.blacklist_vendor(db, vendor_id, payload.reason)


@router.post("/{vendor_id}/reinstate", response_model=VendorOut)
async def reinstate_vendor(vendor_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service.reinstate_vendor(db, vendor_id)
