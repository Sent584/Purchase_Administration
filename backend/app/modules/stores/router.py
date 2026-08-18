from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, get_current_user, require_permission
from app.modules.stores import service_balances, service_dashboard, service_stores, service_txns
from app.modules.stores.helpers import permission_for_txn
from app.modules.stores.schemas import (
    StockBalanceOut,
    StockTxnCreate,
    StockTxnOut,
    StoreCreate,
    StoreOut,
    StoresDashboard,
    StoreUpdate,
)

router = APIRouter(prefix="/api/v1/stores", tags=["Stores & Inventory"])

read_dep = require_permission("stores:read")
write_dep = require_permission("stores:write")


@router.post("/stores", response_model=StoreOut, status_code=201)
async def create_store(payload: StoreCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await service_stores.create_store(db, payload)


@router.get("/stores", response_model=list[StoreOut])
async def list_stores(
    institution_id: str | None = Query(default=None),
    campus_id: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service_stores.list_stores(db, institution_id, campus_id, status_filter)


@router.get("/stores/{store_id}", response_model=StoreOut)
async def get_store(store_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await service_stores.get_store(db, store_id)


@router.patch("/stores/{store_id}", response_model=StoreOut)
async def update_store(
    store_id: str, payload: StoreUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await service_stores.update_store(db, store_id, payload)


@router.get("/stock", response_model=list[StockBalanceOut])
async def list_stock(
    institution_id: str | None = Query(default=None),
    store_id: str | None = Query(default=None),
    campus_id: str | None = Query(default=None),
    division_id: str | None = Query(default=None),
    department_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service_balances.list_stock_balances(
        db, institution_id, store_id, campus_id, division_id, department_id
    )


@router.get("/transactions", response_model=list[StockTxnOut])
async def list_transactions(
    institution_id: str | None = Query(default=None),
    store_id: str | None = Query(default=None),
    txn_type: str | None = Query(default=None),
    campus_id: str | None = Query(default=None),
    division_id: str | None = Query(default=None),
    department_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service_balances.list_transactions(
        db, institution_id, store_id, txn_type, campus_id, division_id, department_id
    )


@router.post("/transactions", response_model=StockTxnOut, status_code=201)
async def post_transaction(
    payload: StockTxnCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    required = permission_for_txn(payload.txn_type)
    if not user.has_permission(required):
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Missing required permission: {required}")
    return await service_txns.post_transaction(db, payload)


@router.get("/dashboard", response_model=StoresDashboard)
async def dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await service_dashboard.get_dashboard(db, institution_id)
