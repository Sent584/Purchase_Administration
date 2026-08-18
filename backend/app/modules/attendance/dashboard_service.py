from datetime import date, datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.attendance.helpers import oid
from app.modules.attendance.schemas import AttendanceDashboard, LeaveAppStatus


def _today_date_filter() -> dict:
    today = date.today()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc)
    return {"$or": [{"date": today.isoformat()}, {"date": {"$gte": start, "$lte": end}}]}


async def get_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> AttendanceDashboard:
    clauses: list[dict] = [_today_date_filter()]
    leave_query: dict = {"status": LeaveAppStatus.SUBMITTED.value}
    if institution_id:
        inst = oid(institution_id, "institution_id")
        clauses.append({"institution_id": inst})
        leave_query["institution_id"] = inst

    base = {"$and": clauses}

    present = await db["attendance_records"].count_documents({"$and": [base, {"status": "present"}]})
    absent = await db["attendance_records"].count_documents({"$and": [base, {"status": "absent"}]})
    on_leave = await db["attendance_records"].count_documents({"$and": [base, {"status": "leave"}]})
    pending = await db["leave_applications"].count_documents(leave_query)
    return AttendanceDashboard(
        present_today=present,
        absent_today=absent,
        on_leave_today=on_leave,
        pending_regularisations=pending,
    )
