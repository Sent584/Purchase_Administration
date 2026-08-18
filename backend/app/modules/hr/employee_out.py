from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.modules.hr.enums import (
    DoctoralStatus,
    EmployeeCategory,
    EmployeeStatus,
    EmploymentType,
    FacultyRank,
)


class EmployeeOut(BaseModel):
    id: str
    employee_code: str
    institution_id: str
    campus_id: str
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str
    department_name: str
    title: str
    first_name: str
    middle_name: str
    last_name: str
    display_name: str
    gender: str
    date_of_birth: datetime | None
    official_email: EmailStr
    personal_email: EmailStr | None
    mobile: str
    employee_category: EmployeeCategory
    employment_type: EmploymentType
    designation: str
    designation_code: str
    grade: str
    pay_level: str
    date_of_joining: datetime | None
    confirmation_date: datetime | None
    retirement_date: datetime | None
    reporting_manager_name: str
    reporting_manager_id: str | None
    pan: str
    uan: str
    epf_number: str
    esi_number: str
    bank_account_number: str
    bank_ifsc: str
    bank_name: str
    faculty_rank: FacultyRank | None
    doctoral_status: DoctoralStatus | None
    specialisation: str
    subjects: list[str]
    workload_hours: float | None
    status: EmployeeStatus
    photo_url: str | None
    created_at: datetime
    updated_at: datetime
