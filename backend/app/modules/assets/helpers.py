from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.modules.assets.schemas import AssetOut


def oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def optional_oid(value: str | None, label: str) -> ObjectId | None:
    return oid(value, label) if value else None


def str_id(value: object | None) -> str | None:
    return str(value) if value is not None else None


def doc_to_out(doc: dict) -> AssetOut:
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
        "po_id": str_id(doc.get("po_id")),
        "grn_id": str_id(doc.get("grn_id")),
        "custodian_employee_id": str_id(doc.get("custodian_employee_id")),
    }
    data.pop("_id", None)
    return AssetOut(**data)
