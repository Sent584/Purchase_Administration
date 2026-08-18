from datetime import date

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.attendance import attendance_service, dashboard_service, leave_service, shift_service
from app.modules.attendance.schemas import (
    AttendanceBulkCreate,
    AttendanceCreate,
    AttendanceDashboard,
    AttendanceOut,
    LeaveApplicationCreate,
    LeaveApplicationOut,
    LeaveApplicationUpdate,
    LeaveBalanceOut,
    LeaveDecision,
    LeaveTypeOut,
    ShiftCreate,
    ShiftOut,
    ShiftUpdate,
)

router = APIRouter(prefix="/api/v1/attendance", tags=["Attendance & Leave"])

att_read = require_permission("attendance:read")
att_write = require_permission("attendance:write")
leave_read = require_permission("leave:read")
leave_write = require_permission("leave:write")
leave_approve = require_permission("leave:approve")


@router.get("/dashboard", response_model=AttendanceDashboard)
async def dashboard(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(att_read),
):
    return await dashboard_service.get_dashboard(db, institution_id)


@router.get("/shifts", response_model=list[ShiftOut])
async def list_shifts(
    institution_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(att_read),
):
    return await shift_service.list_shifts(db, institution_id)


@router.post("/shifts", response_model=ShiftOut, status_code=201)
async def create_shift(payload: ShiftCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_write)):
    return await shift_service.create_shift(db, payload)


@router.get("/shifts/{shift_id}", response_model=ShiftOut)
async def get_shift(shift_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_read)):
    return await shift_service.get_shift(db, shift_id)


@router.patch("/shifts/{shift_id}", response_model=ShiftOut)
async def update_shift(
    shift_id: str, payload: ShiftUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_write)
):
    return await shift_service.update_shift(db, shift_id, payload)


@router.delete("/shifts/{shift_id}", status_code=204)
async def delete_shift(shift_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_write)):
    await shift_service.delete_shift(db, shift_id)


@router.get("/records", response_model=list[AttendanceOut])
async def list_attendance(
    institution_id: str | None = Query(default=None),
    on_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(att_read),
):
    return await attendance_service.list_attendance(db, institution_id, on_date, employee_id)


@router.post("/records", response_model=AttendanceOut, status_code=201)
async def create_attendance(
    payload: AttendanceCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_write)
):
    return await attendance_service.create_attendance(db, payload)


@router.post("/records/bulk", response_model=list[AttendanceOut], status_code=201)
async def bulk_attendance(
    payload: AttendanceBulkCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(att_write)
):
    return await attendance_service.bulk_create_attendance(db, payload)


@router.get("/leave-types", response_model=list[LeaveTypeOut])
async def list_leave_types(db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(leave_read)):
    return await leave_service.list_leave_types(db)


@router.get("/leave-balances", response_model=list[LeaveBalanceOut])
async def list_leave_balances(
    employee_id: str | None = Query(default=None),
    year: int | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(leave_read),
):
    return await leave_service.list_leave_balances(db, employee_id, year)


@router.get("/leave-applications", response_model=list[LeaveApplicationOut])
async def list_leave_apps(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(leave_read),
):
    return await leave_service.list_leave_applications(db, institution_id, status)


@router.post("/leave-applications", response_model=LeaveApplicationOut, status_code=201)
async def create_leave_app(
    payload: LeaveApplicationCreate, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(leave_write)
):
    return await leave_service.create_leave_application(db, payload)


@router.patch("/leave-applications/{app_id}", response_model=LeaveApplicationOut)
async def update_leave_app(
    app_id: str,
    payload: LeaveApplicationUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: CurrentUser = Depends(leave_write),
):
    return await leave_service.update_leave_application(db, app_id, payload)


@router.post("/leave-applications/{app_id}/submit", response_model=LeaveApplicationOut)
async def submit_leave(app_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(leave_write)):
    return await leave_service.submit_leave(db, app_id)


@router.post("/leave-applications/{app_id}/approve", response_model=LeaveApplicationOut)
async def approve_leave(
    app_id: str, payload: LeaveDecision, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(leave_approve)
):
    return await leave_service.approve_leave(db, app_id, payload)


@router.post("/leave-applications/{app_id}/reject", response_model=LeaveApplicationOut)
async def reject_leave(
    app_id: str, payload: LeaveDecision, db: AsyncIOMotorDatabase = Depends(get_db), _: CurrentUser = Depends(leave_approve)
):
    return await leave_service.reject_leave(db, app_id, payload)
