from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.rbac.permissions import is_valid_permission
from app.modules.rbac.schemas import RoleCreate, RoleOut, RoleUpdate


def _to_out(doc: dict) -> RoleOut:
    return RoleOut(
        id=str(doc["_id"]),
        name=doc["name"],
        code=doc["code"],
        description=doc.get("description", ""),
        permissions=doc.get("permissions", []),
        scope_type=doc["scope_type"],
        is_system_role=doc.get("is_system_role", False),
        is_active=doc.get("is_active", True),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def _validate_permissions(permissions: list[str]) -> None:
    invalid = [p for p in permissions if not is_valid_permission(p)]
    if invalid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Unknown permission code(s): {invalid}")


async def list_roles(db: AsyncIOMotorDatabase) -> list[RoleOut]:
    docs = await db["roles"].find().sort("name", 1).to_list(length=500)
    return [_to_out(d) for d in docs]


async def get_role(db: AsyncIOMotorDatabase, role_id: str) -> RoleOut:
    try:
        oid = ObjectId(role_id)
    except InvalidId:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    doc = await db["roles"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    return _to_out(doc)


async def create_role(db: AsyncIOMotorDatabase, payload: RoleCreate) -> RoleOut:
    _validate_permissions(payload.permissions)
    existing = await db["roles"].find_one({"code": payload.code})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Role code '{payload.code}' already exists")
    now = utcnow()
    doc = {
        "name": payload.name,
        "code": payload.code,
        "description": payload.description,
        "permissions": payload.permissions,
        "scope_type": payload.scope_type.value,
        "is_system_role": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["roles"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


async def update_role(db: AsyncIOMotorDatabase, role_id: str, payload: RoleUpdate) -> RoleOut:
    try:
        oid = ObjectId(role_id)
    except InvalidId:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    existing = await db["roles"].find_one({"_id": oid})
    if existing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if existing.get("is_system_role") and payload.permissions is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "System role permissions cannot be modified")

    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "permissions" in changes:
        _validate_permissions(changes["permissions"])
    if "scope_type" in changes:
        changes["scope_type"] = changes["scope_type"].value if hasattr(changes["scope_type"], "value") else changes["scope_type"]
    changes["updated_at"] = utcnow()

    await db["roles"].update_one({"_id": oid}, {"$set": changes})
    return await get_role(db, role_id)


PURCHASE_MAKER_PERMS = [
    "vendor:read", "vendor:write", "catalog:read", "catalog:write",
    "indent:read", "indent:write", "quotation:read", "quotation:write",
    "po:read", "po:write", "grn:read", "grn:write", "bill:read", "bill:write",
]
PURCHASE_APPROVER_PERMS = ["indent:approve", "quotation:award", "po:approve", "bill:approve"]
STORES_PERMS = ["stores:read", "stores:write", "stores:issue", "stores:adjust"]
ASSETS_PERMS = ["assets:read", "assets:write", "assets:transfer", "assets:dispose"]
HR_PERMS = [
    "hr:read", "hr:write", "hr:sensitive",
    "attendance:read", "attendance:write", "leave:read", "leave:write", "leave:approve",
]
PAYROLL_PERMS = ["payroll:read", "payroll:write", "payroll:approve", "payroll:sensitive"]
ACCOUNTS_PERMS = [
    "accounts:read", "accounts:write", "accounts:approve", "accounts:post",
    "budget:read", "budget:write",
]
READ_ALL = [
    "stores:read", "assets:read", "hr:read", "attendance:read", "leave:read",
    "payroll:read", "accounts:read", "budget:read", "reports:read",
]


async def seed_system_roles(db: AsyncIOMotorDatabase) -> None:
    system_roles = [
        {
            "name": "Super Administrator",
            "code": "super_admin",
            "description": "Full unrestricted access across the platform",
            "permissions": ["*"],
            "scope_type": "group",
        },
        {
            "name": "Chairman / Group Director",
            "code": "chairman",
            "description": "Group executive — cross-campus dashboards, drill-down and all key approvals",
            "permissions": [
                "org:read", "config:read", "user:read", "audit:read", "role:read",
                "reports:read", "reports:export",
                "vendor:read", "catalog:read", "indent:read", "quotation:read",
                "po:read", "grn:read", "bill:read",
            ]
            + PURCHASE_APPROVER_PERMS
            + [
                "leave:approve", "payroll:approve", "accounts:approve",
            ]
            + READ_ALL,
            "scope_type": "group",
        },
        {
            "name": "Institution Administrator",
            "code": "institution_admin",
            "description": "Administers a single institution across all ERP modules",
            "permissions": [
                "org:read", "org:write", "config:read", "user:read", "user:write",
                "user:lock", "role:read", "audit:read", "reports:read", "reports:export",
            ]
            + PURCHASE_MAKER_PERMS
            + PURCHASE_APPROVER_PERMS
            + STORES_PERMS
            + ASSETS_PERMS
            + HR_PERMS
            + PAYROLL_PERMS
            + ACCOUNTS_PERMS,
            "scope_type": "institution",
        },
        {
            "name": "HR Manager",
            "code": "hr_manager",
            "description": "Manages employee master, attendance and leave",
            "permissions": ["org:read", "user:read", "payroll:read", "reports:read"] + HR_PERMS,
            "scope_type": "institution",
        },
        {
            "name": "Finance Officer",
            "code": "finance_officer",
            "description": "Manages accounts, budgets, payments and payroll",
            "permissions": [
                "org:read", "vendor:read", "catalog:read", "indent:read", "quotation:read",
                "po:read", "grn:read", "bill:read", "bill:write", "bill:approve",
                "stores:read", "assets:read", "reports:read", "reports:export",
            ]
            + ACCOUNTS_PERMS
            + PAYROLL_PERMS,
            "scope_type": "institution",
        },
        {
            "name": "Principal / Director",
            "code": "principal",
            "description": "Institution head with read access and key approvals",
            "permissions": [
                "org:read", "config:read", "user:read", "audit:read", "vendor:read",
                "catalog:read", "indent:read", "indent:approve", "quotation:read",
                "quotation:award", "po:read", "po:approve", "grn:read", "bill:read",
                "bill:approve", "leave:approve", "payroll:approve", "accounts:approve",
            ]
            + READ_ALL,
            "scope_type": "institution",
        },
        {
            "name": "Purchase Officer",
            "code": "purchase_officer",
            "description": "Runs the procure-to-pay cycle",
            "permissions": PURCHASE_MAKER_PERMS + ["stores:read", "assets:read"],
            "scope_type": "institution",
        },
        {
            "name": "Stores Officer",
            "code": "stores_officer",
            "description": "Manages campus stores and stock",
            "permissions": STORES_PERMS + ["catalog:read", "org:read", "assets:read"],
            "scope_type": "institution",
        },
        {
            "name": "Asset Officer",
            "code": "asset_officer",
            "description": "Maintains fixed asset register, transfers custody and processes disposals",
            "permissions": ["org:read"] + ASSETS_PERMS,
            "scope_type": "institution",
        },
        {
            "name": "Payroll Officer",
            "code": "payroll_officer",
            "description": "Processes monthly payroll and statutory contributions",
            "permissions": PAYROLL_PERMS + ["hr:read", "attendance:read", "leave:read", "accounts:read", "org:read"],
            "scope_type": "institution",
        },
        {
            "name": "Employee (Self Service)",
            "code": "employee",
            "description": "Self-service profile, attendance, leave and payslips",
            "permissions": ["leave:read", "leave:write", "attendance:read", "payroll:read", "hr:read"],
            "scope_type": "department",
        },
    ]
    now = utcnow()
    for role in system_roles:
        await db["roles"].update_one(
            {"code": role["code"]},
            {
                "$set": {
                    "name": role["name"],
                    "description": role["description"],
                    "permissions": role["permissions"],
                    "scope_type": role["scope_type"],
                    "is_system_role": True,
                    "updated_at": now,
                },
                "$setOnInsert": {"code": role["code"], "is_active": True, "created_at": now},
            },
            upsert=True,
        )
