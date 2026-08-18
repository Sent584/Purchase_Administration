from datetime import timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.hr.designation_schemas import CategoryCount, DepartmentCount, HrDashboard
from app.modules.hr.enums import EmployeeCategory, EmployeeStatus, EmploymentType
from app.modules.hr.helpers import oid


async def get_hr_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> HrDashboard:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")

    docs = await db["employees"].find(query).to_list(length=5000)
    now = utcnow()
    join_cutoff = now - timedelta(days=90)
    probation_cutoff = now + timedelta(days=30)

    by_cat: dict[str, int] = {}
    by_dept: dict[str, int] = {}
    teaching = non_teaching = on_probation = on_leave = new_joiners = probation_ending = active = 0

    for emp in docs:
        cat = emp.get("employee_category", "unknown")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        dept = emp.get("department_name") or "Unassigned"
        by_dept[dept] = by_dept.get(dept, 0) + 1
        if emp.get("status") == EmployeeStatus.ACTIVE.value:
            active += 1
        if emp.get("status") == EmployeeStatus.ON_LEAVE.value:
            on_leave += 1
        if cat == EmployeeCategory.TEACHING.value:
            teaching += 1
        elif cat == EmployeeCategory.NON_TEACHING.value:
            non_teaching += 1
        if emp.get("employment_type") == EmploymentType.PROBATION.value:
            on_probation += 1
            conf = emp.get("confirmation_date")
            if conf and now <= conf <= probation_cutoff:
                probation_ending += 1
        doj = emp.get("date_of_joining")
        if doj and doj >= join_cutoff:
            new_joiners += 1

    top_depts = sorted(by_dept.items(), key=lambda x: -x[1])[:10]
    return HrDashboard(
        total_employees=len(docs),
        active_count=active,
        teaching_count=teaching,
        non_teaching_count=non_teaching,
        on_probation=on_probation,
        on_leave=on_leave,
        new_joiners_90d=new_joiners,
        probation_ending_30d=probation_ending,
        by_category=[CategoryCount(category=k, count=v) for k, v in sorted(by_cat.items())],
        by_department=[DepartmentCount(department_name=k, count=v) for k, v in top_depts],
    )
