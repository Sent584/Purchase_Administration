"""Resolve campus / division / department for assets (reuse HR validator)."""

from app.modules.hr.employee_org import resolve_employee_org

resolve_asset_org = resolve_employee_org
