from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.attendance.helpers import oid, str_id
from app.modules.attendance.schemas import (
    LeaveApplicationCreate,
    LeaveApplicationOut,
    LeaveApplicationUpdate,
    LeaveAppStatus,
    LeaveBalanceOut,
    LeaveDecision,
    LeaveTypeOut,
)


def _to_leave(doc: dict) -> LeaveApplicationOut:
    data = str_id(doc, "institution_id")
    return LeaveApplicationOut(**data)


def _to_balance(doc: dict) -> LeaveBalanceOut:
    return LeaveBalanceOut(**str_id(doc))


def _to_leave_type(doc: dict) -> LeaveTypeOut:
    return LeaveTypeOut(**str_id(doc))


async def list_leave_types(db: AsyncIOMotorDatabase) -> list[LeaveTypeOut]:
    docs = await db["leave_types"].find().sort("code", 1).to_list(length=100)
    return [_to_leave_type(d) for d in docs]


async def list_leave_balances(
    db: AsyncIOMotorDatabase,
    employee_id: str | None = None,
    year: int | None = None,
) -> list[LeaveBalanceOut]:
    query: dict = {}
    if employee_id:
        query["employee_id"] = employee_id
    if year:
        query["year"] = year
    docs = await db["leave_balances"].find(query).sort("leave_type_code", 1).to_list(length=500)
    return [_to_balance(d) for d in docs]


async def create_leave_application(db: AsyncIOMotorDatabase, payload: LeaveApplicationCreate) -> LeaveApplicationOut:
    now = utcnow()
    doc = {
        **payload.model_dump(exclude={"institution_id"}),
        "institution_id": oid(payload.institution_id, "institution_id"),
        "status": LeaveAppStatus.DRAFT.value,
        "approver_name": "",
        "created_at": now,
        "updated_at": now,
    }
    result = await db["leave_applications"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_leave(doc)


async def list_leave_applications(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    status_filter: str | None = None,
) -> list[LeaveApplicationOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["leave_applications"].find(query).sort("created_at", -1).to_list(length=500)
    return [_to_leave(d) for d in docs]


async def get_leave_application(db: AsyncIOMotorDatabase, app_id: str) -> LeaveApplicationOut:
    doc = await db["leave_applications"].find_one({"_id": oid(app_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave application not found")
    return _to_leave(doc)


async def update_leave_application(
    db: AsyncIOMotorDatabase, app_id: str, payload: LeaveApplicationUpdate
) -> LeaveApplicationOut:
    existing = await db["leave_applications"].find_one({"_id": oid(app_id)})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave application not found")
    if existing["status"] not in (LeaveAppStatus.DRAFT.value, LeaveAppStatus.REJECTED.value):
        raise HTTPException(status.HTTP_409_CONFLICT, "Only draft/rejected applications can be edited")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    changes["updated_at"] = utcnow()
    await db["leave_applications"].update_one({"_id": oid(app_id)}, {"$set": changes})
    return await get_leave_application(db, app_id)


async def submit_leave(db: AsyncIOMotorDatabase, app_id: str) -> LeaveApplicationOut:
    existing = await db["leave_applications"].find_one({"_id": oid(app_id)})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave application not found")
    if existing["status"] != LeaveAppStatus.DRAFT.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only draft applications can be submitted")
    await db["leave_applications"].update_one(
        {"_id": oid(app_id)},
        {"$set": {"status": LeaveAppStatus.SUBMITTED.value, "updated_at": utcnow()}},
    )
    return await get_leave_application(db, app_id)


async def approve_leave(db: AsyncIOMotorDatabase, app_id: str, decision: LeaveDecision) -> LeaveApplicationOut:
    existing = await db["leave_applications"].find_one({"_id": oid(app_id)})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave application not found")
    if existing["status"] != LeaveAppStatus.SUBMITTED.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only submitted applications can be approved")
    await db["leave_applications"].update_one(
        {"_id": oid(app_id)},
        {
            "$set": {
                "status": LeaveAppStatus.APPROVED.value,
                "approver_name": decision.approver_name or "Approver",
                "updated_at": utcnow(),
            }
        },
    )
    await db["leave_balances"].update_one(
        {"employee_id": existing["employee_id"], "leave_type_code": existing["leave_type_code"]},
        {"$inc": {"availed": existing["days"], "balance": -existing["days"]}},
    )
    return await get_leave_application(db, app_id)


async def reject_leave(db: AsyncIOMotorDatabase, app_id: str, decision: LeaveDecision) -> LeaveApplicationOut:
    existing = await db["leave_applications"].find_one({"_id": oid(app_id)})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave application not found")
    if existing["status"] != LeaveAppStatus.SUBMITTED.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only submitted applications can be rejected")
    await db["leave_applications"].update_one(
        {"_id": oid(app_id)},
        {
            "$set": {
                "status": LeaveAppStatus.REJECTED.value,
                "approver_name": decision.approver_name or "Approver",
                "updated_at": utcnow(),
            }
        },
    )
    return await get_leave_application(db, app_id)
