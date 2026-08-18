from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.modules.hr.employee_out import EmployeeOut


def oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def optional_oid(value: str | None, label: str) -> ObjectId | None:
    return oid(value, label) if value else None


def str_id(value: object | None) -> str | None:
    return str(value) if value is not None else None


def mask_tail(value: str, visible: int = 4) -> str:
    if not value:
        return ""
    if len(value) <= visible:
        return "*" * len(value)
    return ("*" * (len(value) - visible)) + value[-visible:]


def doc_to_employee(doc: dict, *, mask_sensitive: bool = True) -> EmployeeOut:
    pan = doc.get("pan", "")
    bank = doc.get("bank_account_number", "")
    data = {
        **doc,
        "id": str(doc["_id"]),
        "institution_id": str(doc["institution_id"]),
        "campus_id": str(doc["campus_id"]),
        "campus_name": doc.get("campus_name") or "",
        "division_id": str_id(doc.get("division_id")),
        "division_name": doc.get("division_name") or "",
        "department_id": str(doc["department_id"]),
        "department_name": doc.get("department_name") or "",
        "reporting_manager_id": str_id(doc.get("reporting_manager_id")),
        "pan": mask_tail(pan) if mask_sensitive else pan,
        "bank_account_number": mask_tail(bank) if mask_sensitive else bank,
    }
    data.pop("_id", None)
    return EmployeeOut(**data)
