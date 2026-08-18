from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.accounts import dashboard_service, master_service, voucher_service
from app.modules.accounts.schemas import (
    AccountOut,
    AccountsDashboard,
    BankAccountOut,
    BudgetOut,
    CostCentreOut,
    TrialBalanceRow,
    VoucherCreate,
    VoucherOut,
)

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts & Finance"])

read_dep = require_permission("accounts:read")
write_dep = require_permission("accounts:write")
approve_dep = require_permission("accounts:approve")
post_dep = require_permission("accounts:post")
budget_read = require_permission("budget:read")


@router.get("/dashboard", response_model=AccountsDashboard)
async def dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await dashboard_service.get_dashboard(db, institution_id)


@router.get("/chart-of-accounts", response_model=list[AccountOut])
async def chart_of_accounts(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await master_service.list_accounts(db, institution_id)


@router.get("/cost-centres", response_model=list[CostCentreOut])
async def cost_centres(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await master_service.list_cost_centres(db, institution_id)


@router.get("/budgets", response_model=list[BudgetOut])
async def budgets(
    institution_id: str | None = Query(default=None),
    fy: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(budget_read),
):
    return await master_service.list_budgets(db, institution_id, fy)


@router.get("/banks", response_model=list[BankAccountOut])
async def banks(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await master_service.list_banks(db, institution_id)


@router.get("/vouchers", response_model=list[VoucherOut])
async def list_vouchers(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await voucher_service.list_vouchers(db, institution_id, status)


@router.post("/vouchers", response_model=VoucherOut, status_code=201)
async def create_voucher(
    payload: VoucherCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await voucher_service.create_voucher(db, payload)


@router.get("/vouchers/{voucher_id}", response_model=VoucherOut)
async def get_voucher(voucher_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await voucher_service.get_voucher(db, voucher_id)


@router.post("/vouchers/{voucher_id}/validate", response_model=VoucherOut)
async def validate_voucher(voucher_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await voucher_service.validate_voucher(db, voucher_id)


@router.post("/vouchers/{voucher_id}/approve", response_model=VoucherOut)
async def approve_voucher(voucher_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(approve_dep)):
    return await voucher_service.approve_voucher(db, voucher_id)


@router.post("/vouchers/{voucher_id}/post", response_model=VoucherOut)
async def post_voucher(voucher_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(post_dep)):
    return await voucher_service.post_voucher(db, voucher_id)


@router.post("/vouchers/{voucher_id}/reverse", response_model=VoucherOut)
async def reverse_voucher(voucher_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(post_dep)):
    return await voucher_service.reverse_voucher(db, voucher_id)


@router.get("/trial-balance", response_model=list[TrialBalanceRow])
async def trial_balance(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await voucher_service.trial_balance(db, institution_id)
