"""HR schemas facade — re-exports employee and designation models."""

from app.modules.hr.designation_schemas import (
    CategoryCount,
    DepartmentCount,
    DesignationCreate,
    DesignationOut,
    DesignationUpdate,
    HrDashboard,
)
from app.modules.hr.employee_out import EmployeeOut
from app.modules.hr.employee_schemas import EmployeeCreate, EmployeeUpdate
from app.modules.hr.enums import (
    DoctoralStatus,
    EmployeeCategory,
    EmployeeStatus,
    EmploymentType,
    FacultyRank,
)

__all__ = [
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeOut",
    "DesignationCreate",
    "DesignationUpdate",
    "DesignationOut",
    "HrDashboard",
    "CategoryCount",
    "DepartmentCount",
    "EmployeeCategory",
    "EmploymentType",
    "EmployeeStatus",
    "FacultyRank",
    "DoctoralStatus",
]
