"""Student fees overview and student drill-down services."""

from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status

from app.modules.fees.analytics import (
    aggregate_named,
    due_bucket,
    fee_category,
    short_programme,
)
from app.modules.fees.loader import load_fee_rows
from app.modules.fees.programme_org import resolve_batch, resolve_org
from app.modules.fees.schemas import (
    FeeLineOut,
    FeesOverview,
    NamedAmount,
    StudentFeeDetail,
    StudentFeeLine,
    StudentFeeSummary,
)
from app.modules.fees import students as students_mod


def _named(items: list[tuple[str, float, int]], limit: int | None = None) -> list[NamedAmount]:
    sliced = items if limit is None else items[:limit]
    return [NamedAmount(name=n, amount=a, count=c) for n, a, c in sliced]


def _enriched_rows() -> list[dict]:
    rows = []
    for r in load_fee_rows():
        prog = str(r.get("GraduationTypeName") or "").strip()
        year = str(r.get("CourseName") or "").strip()
        org = resolve_org(prog)
        rows.append(
            {
                **r,
                "campus": org["campus"],
                "division": org["division"],
                "department": org["department"],
                "batch": resolve_batch(prog, year),
            }
        )
    return rows


def get_fees_overview(as_of: date | None = None) -> FeesOverview:
    today = as_of or date.today()
    rows = _enriched_rows()
    total = round(sum(float(r.get("TotalAmount") or 0) for r in rows), 2)
    by_cat = aggregate_named(rows, lambda r: fee_category(str(r.get("TypeName") or "")))
    by_prog = aggregate_named(rows, lambda r: short_programme(str(r.get("GraduationTypeName") or "")))
    by_year = aggregate_named(rows, lambda r: str(r.get("CourseName") or "Unknown"))
    by_due = aggregate_named(rows, lambda r: due_bucket(str(r.get("DueDate") or ""), today))
    by_campus = aggregate_named(rows, lambda r: str(r["campus"]))
    by_div = aggregate_named(rows, lambda r: str(r["division"]))
    by_dept = aggregate_named(rows, lambda r: str(r["department"]))
    by_batch = aggregate_named(rows, lambda r: str(r["batch"]))

    overdue = next((a for n, a, _ in by_due if n == "Overdue"), 0.0)
    due_soon = next((a for n, a, _ in by_due if n == "Due in 30 days"), 0.0)
    upcoming = round(total - overdue - due_soon, 2)
    student_count = len({s["student_id"] for s in students_mod.list_student_summaries()})

    ranked = sorted(rows, key=lambda r: -float(r.get("TotalAmount") or 0))[:12]
    top_lines = [
        FeeLineOut(
            payment_status=str(r.get("PaymentStatus") or "Pending"),
            total_amount=float(r.get("TotalAmount") or 0),
            type_name=str(r.get("TypeName") or "").strip(),
            category=fee_category(str(r.get("TypeName") or "")),
            due_date=str(r.get("DueDate") or ""),
            programme=str(r.get("GraduationTypeName") or ""),
            year=str(r.get("CourseName") or ""),
            payment_on=str(r.get("PaymentOn") or "NA"),
            due_bucket=due_bucket(str(r.get("DueDate") or ""), today),
            campus=str(r.get("campus")),
            division=str(r.get("division")),
            department=str(r.get("department")),
            batch=str(r.get("batch")),
        )
        for r in ranked
    ]

    return FeesOverview(
        as_of=today.isoformat(),
        line_count=len(rows),
        total_pending=total,
        overdue_amount=overdue,
        due_soon_amount=due_soon,
        upcoming_amount=max(0.0, upcoming),
        programmes=len(by_prog),
        fee_categories=len(by_cat),
        student_count=student_count,
        by_category=_named(by_cat),
        by_programme=_named(by_prog),
        by_year=_named(by_year),
        by_due_bucket=_named(by_due),
        by_campus=_named(by_campus),
        by_division=_named(by_div),
        by_department=_named(by_dept),
        by_batch=_named(by_batch),
        top_lines=top_lines,
    )


def list_students(
    campus: str | None = None,
    division: str | None = None,
    department: str | None = None,
    batch: str | None = None,
    search: str | None = None,
) -> list[StudentFeeSummary]:
    return [StudentFeeSummary(**s) for s in students_mod.list_student_summaries(campus, division, department, batch, search)]


def get_student(student_id: str, as_of: date | None = None) -> StudentFeeDetail:
    today = as_of or date.today()
    detail = students_mod.get_student_detail(student_id)
    if detail is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student fee record not found")
    lines = [
        StudentFeeLine(
            type_name=str(r.get("TypeName") or "").strip(),
            category=fee_category(str(r.get("TypeName") or "")),
            due_date=str(r.get("DueDate") or ""),
            due_bucket=due_bucket(str(r.get("DueDate") or ""), today),
            total_amount=float(r.get("TotalAmount") or 0),
            payment_status=str(r.get("PaymentStatus") or "Pending"),
        )
        for r in detail["lines"]
    ]
    return StudentFeeDetail(
        student_id=detail["student_id"],
        student_name=detail["student_name"],
        campus=detail["campus"],
        division=detail["division"],
        department=detail["department"],
        batch=detail["batch"],
        programme=detail["programme"],
        year=detail["year"],
        pending_amount=detail["pending_amount"],
        lines=lines,
    )


def fees_pulse_primary() -> tuple[str, str]:
    ov = get_fees_overview()
    if ov.total_pending >= 1_00_00_000:
        primary = f"₹{(ov.total_pending / 1_00_00_000):.2f} Cr"
    elif ov.total_pending >= 1_00_000:
        primary = f"₹{(ov.total_pending / 1_00_000):.2f} L"
    else:
        primary = f"₹{ov.total_pending:,.0f}"
    secondary = f"{ov.student_count} students · ₹{(ov.overdue_amount / 1_00_000):.2f} L overdue"
    return primary, secondary
