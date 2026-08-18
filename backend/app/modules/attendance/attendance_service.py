from datetime import date

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.attendance.helpers import oid, str_id
from app.modules.attendance.schemas import AttendanceBulkCreate, AttendanceCreate, AttendanceOut


def _to_attendance(doc: dict) -> AttendanceOut:
    data = str_id(doc, "institution_id", "campus_id")
    raw_date = data.get("date")
    if isinstance(raw_date, str):
        data["date"] = date.fromisoformat(raw_date[:10])
    elif hasattr(raw_date, "date"):
        data["date"] = raw_date.date() if not isinstance(raw_date, date) else raw_date
    return AttendanceOut(**data)


def _attendance_doc(payload: AttendanceCreate) -> dict:
    now = utcnow()
    return {
        **payload.model_dump(exclude={"institution_id", "campus_id", "date"}),
        "date": payload.date.isoformat(),
        "institution_id": oid(payload.institution_id, "institution_id"),
        "campus_id": oid(payload.campus_id, "campus_id") if payload.campus_id else None,
        "created_at": now,
        "updated_at": now,
    }


async def create_attendance(db: AsyncIOMotorDatabase, payload: AttendanceCreate) -> AttendanceOut:
    doc = _attendance_doc(payload)
    result = await db["attendance_records"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_attendance(doc)


async def bulk_create_attendance(db: AsyncIOMotorDatabase, payload: AttendanceBulkCreate) -> list[AttendanceOut]:
    if not payload.records:
        return []
    docs = [_attendance_doc(r) for r in payload.records]
    result = await db["attendance_records"].insert_many(docs)
    for doc, inserted_id in zip(docs, result.inserted_ids):
        doc["_id"] = inserted_id
    return [_to_attendance(d) for d in docs]


async def list_attendance(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    on_date: date | None = None,
    employee_id: str | None = None,
) -> list[AttendanceOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if on_date:
        from datetime import datetime, timezone

        start = datetime(on_date.year, on_date.month, on_date.day, tzinfo=timezone.utc)
        end = datetime(on_date.year, on_date.month, on_date.day, 23, 59, 59, tzinfo=timezone.utc)
        query["$or"] = [{"date": on_date.isoformat()}, {"date": {"$gte": start, "$lte": end}}]
    if employee_id:
        query["employee_id"] = employee_id
    docs = await db["attendance_records"].find(query).sort("date", -1).to_list(length=1000)
    return [_to_attendance(d) for d in docs]
