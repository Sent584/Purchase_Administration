from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.deps import CurrentUser, require_permission
from app.modules.indents import service, workflow
from app.modules.indents.schemas import IndentAttachmentAdd, IndentCreate, IndentDecision, IndentOut, IndentUpdate

router = APIRouter(prefix="/api/v1/purchase/indents", tags=["Purchase — Requisitions"])

read_dep = require_permission("indent:read")
write_dep = require_permission("indent:write")
approve_dep = require_permission("indent:approve")


@router.post("", response_model=IndentOut, status_code=201)
async def create_indent(
    payload: IndentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(write_dep),
):
    return await service.create_indent(db, payload, current_user)


@router.get("", response_model=list[IndentOut])
async def list_indents(
    institution_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(read_dep),
):
    return await service.list_indents(db, current_user, institution_id, status)


@router.get("/{indent_id}", response_model=IndentOut)
async def get_indent(
    indent_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(read_dep),
):
    return await service.get_indent(db, indent_id, current_user)


@router.patch("/{indent_id}", response_model=IndentOut)
async def update_indent(
    indent_id: str,
    payload: IndentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(write_dep),
):
    return await service.update_indent(db, indent_id, payload, current_user)


@router.post("/{indent_id}/submit", response_model=IndentOut)
async def submit_indent(
    indent_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(write_dep),
):
    return await workflow.submit_indent(db, indent_id, current_user)


@router.post("/{indent_id}/approve", response_model=IndentOut)
async def approve_indent(
    indent_id: str,
    payload: IndentDecision,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(approve_dep),
):
    return await workflow.approve_indent(db, indent_id, current_user, payload.notes)


@router.post("/{indent_id}/reject", response_model=IndentOut)
async def reject_indent(
    indent_id: str,
    payload: IndentDecision,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(approve_dep),
):
    return await workflow.reject_indent(db, indent_id, current_user, payload.notes)


@router.post("/{indent_id}/attachments", response_model=IndentOut)
async def add_attachment(
    indent_id: str,
    payload: IndentAttachmentAdd,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: CurrentUser = Depends(write_dep),
):
    return await workflow.add_attachment(db, indent_id, payload, current_user)
