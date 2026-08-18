from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.core.deps import CurrentUser
from app.modules.indents.schemas import IndentAttachmentAdd, IndentOut
from app.modules.indents.service import APPROVAL_LEVELS, _get_raw, ensure_indent_access, get_indent


def _next_pending_level(doc: dict) -> dict:
    for level in doc.get("approval_chain", []):
        if level["status"] == "pending":
            return level
    raise HTTPException(status.HTTP_409_CONFLICT, "No pending approval level on this requisition")


async def submit_indent(db: AsyncIOMotorDatabase, indent_id: str, user: CurrentUser) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    ensure_indent_access(doc, user)
    if doc["status"] != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only draft requisitions can be submitted")
    if not doc.get("lines"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot submit without line items")
    chain = [
        {**lvl, "status": "pending", "approver_email": None, "notes": "", "decided_at": None}
        for lvl in APPROVAL_LEVELS
    ]
    await db["indents"].update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "submitted", "approval_chain": chain, "updated_at": utcnow()}},
    )
    return await get_indent(db, indent_id, user)


async def approve_indent(
    db: AsyncIOMotorDatabase, indent_id: str, user: CurrentUser, notes: str
) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    ensure_indent_access(doc, user)
    if doc["status"] != "submitted":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only submitted requisitions can be approved")
    level = _next_pending_level(doc)
    now = utcnow()
    chain = doc["approval_chain"]
    for lvl in chain:
        if lvl["level"] == level["level"]:
            lvl.update(status="approved", approver_email=user.email, notes=notes, decided_at=now)
    is_final = all(lvl["status"] == "approved" for lvl in chain)
    changes: dict = {"approval_chain": chain, "updated_at": now}
    if is_final:
        changes.update(
            status="approved", approver_notes=notes, approved_by=user.email, approved_at=now
        )
    await db["indents"].update_one({"_id": doc["_id"]}, {"$set": changes})
    return await get_indent(db, indent_id, user)


async def reject_indent(
    db: AsyncIOMotorDatabase, indent_id: str, user: CurrentUser, notes: str
) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    ensure_indent_access(doc, user)
    if doc["status"] != "submitted":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only submitted requisitions can be rejected")
    level = _next_pending_level(doc)
    now = utcnow()
    chain = doc["approval_chain"]
    for lvl in chain:
        if lvl["level"] == level["level"]:
            lvl.update(status="rejected", approver_email=user.email, notes=notes, decided_at=now)
    await db["indents"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "approval_chain": chain,
                "status": "rejected",
                "approver_notes": notes,
                "approved_by": user.email,
                "approved_at": now,
                "updated_at": now,
            }
        },
    )
    return await get_indent(db, indent_id, user)


async def add_attachment(
    db: AsyncIOMotorDatabase, indent_id: str, payload: IndentAttachmentAdd, user: CurrentUser
) -> IndentOut:
    doc = await _get_raw(db, indent_id)
    ensure_indent_access(doc, user)
    attachment = {
        "name": payload.name,
        "doc_type": payload.doc_type,
        "uploaded_by": user.email,
        "uploaded_at": utcnow(),
    }
    await db["indents"].update_one(
        {"_id": doc["_id"]},
        {"$push": {"attachments": attachment}, "$set": {"updated_at": utcnow()}},
    )
    return await get_indent(db, indent_id, user)
