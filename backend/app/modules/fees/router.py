from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, require_any_permission
from app.modules.fees import service
from app.modules.fees.schemas import FeesOverview, StudentFeeDetail, StudentFeeSummary

router = APIRouter(prefix="/api/v1/fees", tags=["Student Fees"])
read_dep = require_any_permission("accounts:read", "reports:read")


@router.get("/overview", response_model=FeesOverview)
async def fees_overview(_: CurrentUser = Depends(read_dep)) -> FeesOverview:
    return service.get_fees_overview()


@router.get("/students", response_model=list[StudentFeeSummary])
async def fees_students(
    campus: str | None = Query(default=None),
    division: str | None = Query(default=None),
    department: str | None = Query(default=None),
    batch: str | None = Query(default=None),
    search: str | None = Query(default=None),
    _: CurrentUser = Depends(read_dep),
) -> list[StudentFeeSummary]:
    return service.list_students(campus, division, department, batch, search)


@router.get("/students/{student_id}", response_model=StudentFeeDetail)
async def fees_student_detail(
    student_id: str,
    _: CurrentUser = Depends(read_dep),
) -> StudentFeeDetail:
    return service.get_student(student_id)
