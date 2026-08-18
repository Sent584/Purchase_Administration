"""HR domain service facade."""

from app.modules.hr.dashboard_service import get_hr_dashboard
from app.modules.hr.designation_service import (
    create_designation,
    get_designation,
    list_designations,
    update_designation,
)
from app.modules.hr.employee_service import create_employee, get_employee, list_employees, update_employee

__all__ = [
    "create_employee",
    "list_employees",
    "get_employee",
    "update_employee",
    "create_designation",
    "list_designations",
    "get_designation",
    "update_designation",
    "get_hr_dashboard",
]
