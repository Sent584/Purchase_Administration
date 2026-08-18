from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.payroll import master_service, payslip_service, run_service
from app.modules.payroll.schemas import (
    PayComponentOut,
    PayrollDashboard,
    PayrollRunCreate,
    PayrollRunOut,
    PayslipOut,
    SalaryStructureOut,
)

router = APIRouter(prefix="/api/v1/payroll", tags=["Payroll"])

read_dep = require_permission("payroll:read")
write_dep = require_permission("payroll:write")
approve_dep = require_permission("payroll:approve")


@router.get("/dashboard", response_model=PayrollDashboard)
async def dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await payslip_service.get_dashboard(db, institution_id)


@router.get("/components", response_model=list[PayComponentOut])
async def list_components(db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await master_service.list_components(db)


@router.get("/structures", response_model=list[SalaryStructureOut])
async def list_structures(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await master_service.list_structures(db, institution_id)


@router.get("/runs", response_model=list[PayrollRunOut])
async def list_runs(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await run_service.list_runs(db, institution_id)


@router.post("/runs", response_model=PayrollRunOut, status_code=201)
async def create_run(
    payload: PayrollRunCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await run_service.create_run(db, payload)


@router.get("/runs/{run_id}", response_model=PayrollRunOut)
async def get_run(run_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await run_service.get_run(db, run_id)


@router.post("/runs/{run_id}/process", response_model=PayrollRunOut)
async def process_run(run_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)):
    return await run_service.process_run(db, run_id)


@router.post("/runs/{run_id}/approve", response_model=PayrollRunOut)
async def approve_run(run_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(approve_dep)):
    return await payslip_service.approve_run(db, run_id)


@router.post("/runs/{run_id}/lock", response_model=PayrollRunOut)
async def lock_run(run_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(approve_dep)):
    return await payslip_service.lock_run(db, run_id)


@router.get("/payslips", response_model=list[PayslipOut])
async def list_payslips(
    run_id: str | None = Query(default=None),
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await payslip_service.list_payslips(db, run_id, institution_id)


@router.get("/payslips/{payslip_id}", response_model=PayslipOut)
async def get_payslip(payslip_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(read_dep)):
    return await payslip_service.get_payslip(db, payslip_id)
