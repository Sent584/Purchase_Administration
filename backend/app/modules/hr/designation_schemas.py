from datetime import datetime

from pydantic import BaseModel

from app.modules.hr.enums import EmployeeCategory


class DesignationCreate(BaseModel):
    institution_id: str
    name: str
    code: str
    category: EmployeeCategory
    grade: str = ""
    pay_level: str = ""
    retirement_age: int = 60


class DesignationUpdate(BaseModel):
    name: str | None = None
    category: EmployeeCategory | None = None
    grade: str | None = None
    pay_level: str | None = None
    retirement_age: int | None = None
    is_active: bool | None = None


class DesignationOut(BaseModel):
    id: str
    institution_id: str
    name: str
    code: str
    category: EmployeeCategory
    grade: str
    pay_level: str
    retirement_age: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryCount(BaseModel):
    category: str
    count: int


class DepartmentCount(BaseModel):
    department_name: str
    count: int


class HrDashboard(BaseModel):
    total_employees: int
    active_count: int
    teaching_count: int
    non_teaching_count: int
    on_probation: int
    on_leave: int
    new_joiners_90d: int
    probation_ending_30d: int
    by_category: list[CategoryCount]
    by_department: list[DepartmentCount]
