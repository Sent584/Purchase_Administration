from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.hr import dashboard_service, designation_service, employee_service
from app.modules.hr.schemas import (
    DesignationCreate,
    DesignationOut,
    DesignationUpdate,
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    HrDashboard,
)

router = APIRouter(prefix="/api/v1/hr", tags=["Human Resources"])

read_dep = require_permission("hr:read")
write_dep = require_permission("hr:write")
sensitive_dep = require_permission("hr:sensitive")


@router.get("/dashboard", response_model=HrDashboard)
async def hr_dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await dashboard_service.get_hr_dashboard(db, institution_id)


@router.post("/employees", response_model=EmployeeOut, status_code=201)
async def create_employee(
    payload: EmployeeCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await employee_service.create_employee(db, payload)


@router.get("/employees", response_model=list[EmployeeOut])
async def list_employees(
    institution_id: str | None = Query(default=None),
    campus_id: str | None = Query(default=None),
    division_id: str | None = Query(default=None),
    department_id: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: CurrentUser = Depends(read_dep),
):
    return await employee_service.list_employees(
        db,
        institution_id,
        category,
        status,
        q,
        campus_id=campus_id,
        division_id=division_id,
        department_id=department_id,
        mask_sensitive=not user.has_permission("hr:sensitive"),
    )


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: str, db: AsyncIOMotorDatabase = Depends(get_db), user: CurrentUser = Depends(read_dep)
):
    return await employee_service.get_employee(
        db, employee_id, mask_sensitive=not user.has_permission("hr:sensitive")
    )


@router.patch("/employees/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(write_dep),
):
    return await employee_service.update_employee(db, employee_id, payload)


@router.post("/designations", response_model=DesignationOut, status_code=201)
async def create_designation(
    payload: DesignationCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(write_dep)
):
    return await designation_service.create_designation(db, payload)


@router.get("/designations", response_model=list[DesignationOut])
async def list_designations(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(read_dep),
):
    return await designation_service.list_designations(db, institution_id)


@router.patch("/designations/{designation_id}", response_model=DesignationOut)
async def update_designation(
    designation_id: str,
    payload: DesignationUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(write_dep),
):
    return await designation_service.update_designation(db, designation_id, payload)
