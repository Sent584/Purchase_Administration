"""Orchestrates role-specific home dashboards."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import CurrentUser
from app.modules.dashboard.builders_exec import build_exec_home, build_principal_home
from app.modules.dashboard.builders_ops import build_assets_home, build_purchase_home, build_stores_home
from app.modules.dashboard.builders_employee import build_employee_home
from app.modules.dashboard.builders_people import build_finance_home, build_hr_home, build_payroll_home
from app.modules.dashboard.helpers import resolve_primary_role
from app.modules.dashboard.schemas import RoleHomeDashboard


async def get_role_home(db: AsyncIOMotorDatabase, user: CurrentUser) -> RoleHomeDashboard:
    role = resolve_primary_role(user.role_codes)
    inst = user.institution_id
    name = user.full_name or user.email

    if role in ("super_admin", "chairman", "institution_admin"):
        return await build_exec_home(db, role_code=role, name=name, institution_id=inst)
    if role == "principal":
        return await build_principal_home(db, name=name, institution_id=inst)
    if role == "finance_officer":
        return await build_finance_home(db, name=name, institution_id=inst)
    if role == "hr_manager":
        return await build_hr_home(db, name=name, institution_id=inst)
    if role == "payroll_officer":
        return await build_payroll_home(db, name=name, institution_id=inst)
    if role == "purchase_officer":
        return await build_purchase_home(db, name=name, institution_id=inst)
    if role == "stores_officer":
        return await build_stores_home(db, name=name, institution_id=inst)
    if role == "asset_officer":
        return await build_assets_home(db, name=name, institution_id=inst)
    return await build_employee_home(db, name=name, institution_id=inst, email=user.email)
