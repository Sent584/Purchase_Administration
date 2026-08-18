"""Shared helpers for role home dashboards."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

ROLE_PRIORITY = [
    "super_admin",
    "chairman",
    "institution_admin",
    "principal",
    "finance_officer",
    "hr_manager",
    "payroll_officer",
    "purchase_officer",
    "stores_officer",
    "asset_officer",
    "employee",
]

ROLE_LABELS = {
    "super_admin": "Super Administrator",
    "chairman": "Chairman / Group Director",
    "institution_admin": "Institution Administrator",
    "principal": "Principal / Director",
    "finance_officer": "Finance Officer",
    "hr_manager": "HR Manager",
    "payroll_officer": "Payroll Officer",
    "purchase_officer": "Purchase Officer",
    "stores_officer": "Stores Officer",
    "asset_officer": "Asset Officer",
    "employee": "Employee Self-Service",
}


def resolve_primary_role(role_codes: list[str]) -> str:
    for code in ROLE_PRIORITY:
        if code in role_codes:
            return code
    return role_codes[0] if role_codes else "employee"


def inst_filter(institution_id: str | None) -> dict:
    if not institution_id:
        return {}
    try:
        return {"institution_id": ObjectId(institution_id)}
    except Exception:
        return {}


def format_inr(amount: float) -> str:
    return f"₹{amount:,.0f}"


def format_compact(amount: float) -> str:
    if amount >= 1_00_00_000:
        return f"₹{amount / 1_00_00_000:.2f} Cr"
    if amount >= 1_00_000:
        return f"₹{amount / 1_00_000:.2f} L"
    return format_inr(amount)


async def count(db: AsyncIOMotorDatabase, collection: str, query: dict) -> int:
    return await db[collection].count_documents(query)
