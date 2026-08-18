from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.core.deps import CurrentUser
from app.modules.indents.schemas import IndentCreate, IndentOut, IndentUpdate
from app.modules.purchase_common.org_scope import org_scope_strings, resolve_org_scope
from app.modules.rbac.permissions import SUPER_ADMIN_CODE

APPROVAL_LEVELS = [
    {"level": 1, "level_name": "Department / HoD Approval"},
    {"level": 2, "level_name": "Principal / Finance Approval"},
]


def _oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def _normalize_line(line: dict) -> dict:
    spec = line.get("specification") or ""
    desc = line.get("description") or spec
    name = line.get("item_name") or (desc[:80] if desc else "Item")
    return {
        "item_id": line.get("item_id"),
        "item_name": name,
        "description": desc,
        "specification": spec or desc,
        "quantity": float(line.get("quantity", 0)),
        "uom": line.get("uom") or "Nos",
        "estimated_rate": float(line.get("estimated_rate", 0)),
    }


def _doc_to_out(doc: dict) -> IndentOut:
    lines = [_normalize_line(l) for l in doc.get("lines", [])]
    scope = org_scope_strings(doc)
    data = {
        **doc,
        "id": str(doc["_id"]),
        "institution_id": str(doc["institution_id"]),
        **scope,
        "campus_id": scope["campus_id"] or str(doc.get("campus_id") or ""),
        "department_id": scope["department_id"] or str(doc.get("department_id") or ""),
        "delivery_location": doc.get("delivery_location") or "",
        "justification": doc.get("justification") or doc.get("remarks") or "",
        "requisition_date": doc.get("requisition_date") or doc.get("created_at"),
        "lines": lines,
    }
    data.pop("_id", None)
    return IndentOut(**data)


async def _next_pr_number(db: AsyncIOMotorDatabase) -> str:
    year = utcnow().year
    seq = await next_sequence(db, f"pr:{year}")
    return f"PR-{year}-{seq:05d}"


def ensure_indent_access(doc: dict, user: CurrentUser) -> None:
    if SUPER_ADMIN_CODE in user.permissions:
        return
    if not user.institution_id:
        return
    if str(doc.get("institution_id")) != user.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase requisition not found")


def resolve_institution_id(payload_institution_id: str, user: CurrentUser) -> str:
    if SUPER_ADMIN_CODE in user.permissions:
        return payload_institution_id
    if not user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Institution scope required")
    if payload_institution_id != user.institution_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot create requisition for another institution")
    return user.institution_id


async def create_indent(db: AsyncIOMotorDatabase, payload: IndentCreate, user: CurrentUser) -> IndentOut:
    institution_id = resolve_institution_id(payload.institution_id, user)
    campus_oid = _oid(payload.campus_id, "campus_id")
    department_oid = _oid(payload.department_id, "department_id")
    if await db["campuses"].find_one({"_id": campus_oid}) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campus not found")
    dept = await db["org_units"].find_one({"_id": department_oid})
    if dept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department/org unit not found")

    now = utcnow()
    lines = [_normalize_line(line.model_dump()) for line in payload.lines]
    scope = await resolve_org_scope(
        db,
        campus_id=payload.campus_id,
        department_id=payload.department_id,
        division_id=payload.division_id,
    )
    doc = {
        **payload.model_dump(
            exclude={
                "institution_id",
                "campus_id",
                "department_id",
                "division_id",
                "lines",
                "attachments",
                "requisition_date",
            }
        ),
        "lines": lines,
        "attachments": [a.model_dump() for a in payload.attachments],
        "indent_number": await _next_pr_number(db),
        "institution_id": _oid(institution_id, "institution_id"),
        **scope,
        "requisition_date": payload.requisition_date or now,
        "status": "draft",
        "approval_chain": [],
        "approver_notes": "",
        "approved_by": None,
        "approved_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["indents"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def list_indents(
    db: AsyncIOMotorDatabase,
    user: CurrentUser,
    institution_id: str | None = None,
    status_filter: str | None = None,
) -> list[IndentOut]:
    query: dict = {}
    scoped = institution_id
    if SUPER_ADMIN_CODE not in user.permissions and user.institution_id:
        scoped = user.institution_id
    if scoped:
        query["institution_id"] = _oid(scoped, "institution_id")
    if status_filter:
        query["status"] = status_filter
    docs = await db["indents"].find(query).sort("created_at", -1).to_list(length=500)
    return [_doc_to_out(d) for d in docs]


async def get_indent(db: AsyncIOMotorDatabase, indent_id: str, user: CurrentUser | None = None) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    if user is not None:
        ensure_indent_access(doc, user)
    return _doc_to_out(doc)


async def _get_raw(db: AsyncIOMotorDatabase, indent_id: str) -> dict:
    doc = await db["indents"].find_one({"_id": _oid(indent_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase requisition not found")
    return doc


async def update_indent(
    db: AsyncIOMotorDatabase, indent_id: str, payload: IndentUpdate, user: CurrentUser
) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    ensure_indent_access(doc, user)
    if doc["status"] != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only draft requisitions can be edited")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "lines" in changes and changes["lines"] is not None:
        changes["lines"] = [_normalize_line(l) for l in changes["lines"]]
    campus_id = changes.get("campus_id", str(doc["campus_id"]))
    department_id = changes.get("department_id", str(doc["department_id"]))
    division_id = changes.get("division_id", str(doc["division_id"]) if doc.get("division_id") else None)
    if any(k in changes for k in ("campus_id", "department_id", "division_id")):
        scope = await resolve_org_scope(
            db, campus_id=campus_id, department_id=department_id, division_id=division_id
        )
        changes.update({k: v for k, v in scope.items() if v is not None})
        changes.update({k: (v or "") for k, v in scope.items() if k.endswith("_name")})
    changes["updated_at"] = utcnow()
    await db["indents"].update_one({"_id": doc["_id"]}, {"$set": changes})
    return await get_indent(db, indent_id, user)
