from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.modules.hr.enums import (
    DoctoralStatus,
    EmployeeCategory,
    EmployeeStatus,
    EmploymentType,
    FacultyRank,
)


class EmployeeCreate(BaseModel):
    institution_id: str
    campus_id: str
    division_id: str | None = None
    department_id: str
    department_name: str = ""
    title: str = ""
    first_name: str
    middle_name: str = ""
    last_name: str
    display_name: str = ""
    gender: str = ""
    date_of_birth: datetime | None = None
    official_email: EmailStr
    personal_email: EmailStr | None = None
    mobile: str = ""
    employee_category: EmployeeCategory
    employment_type: EmploymentType = EmploymentType.PERMANENT
    designation: str
    designation_code: str = ""
    grade: str = ""
    pay_level: str = ""
    date_of_joining: datetime | None = None
    confirmation_date: datetime | None = None
    retirement_date: datetime | None = None
    reporting_manager_name: str = ""
    reporting_manager_id: str | None = None
    pan: str = ""
    uan: str = ""
    epf_number: str = ""
    esi_number: str = ""
    bank_account_number: str = ""
    bank_ifsc: str = ""
    bank_name: str = ""
    faculty_rank: FacultyRank | None = None
    doctoral_status: DoctoralStatus | None = None
    specialisation: str = ""
    subjects: list[str] = Field(default_factory=list)
    workload_hours: float | None = None
    photo_url: str | None = None


class EmployeeUpdate(BaseModel):
    campus_id: str | None = None
    division_id: str | None = None
    department_id: str | None = None
    department_name: str | None = None
    title: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    gender: str | None = None
    date_of_birth: datetime | None = None
    personal_email: EmailStr | None = None
    mobile: str | None = None
    employee_category: EmployeeCategory | None = None
    employment_type: EmploymentType | None = None
    designation: str | None = None
    designation_code: str | None = None
    grade: str | None = None
    pay_level: str | None = None
    confirmation_date: datetime | None = None
    retirement_date: datetime | None = None
    reporting_manager_name: str | None = None
    reporting_manager_id: str | None = None
    pan: str | None = None
    uan: str | None = None
    epf_number: str | None = None
    esi_number: str | None = None
    bank_account_number: str | None = None
    bank_ifsc: str | None = None
    bank_name: str | None = None
    faculty_rank: FacultyRank | None = None
    doctoral_status: DoctoralStatus | None = None
    specialisation: str | None = None
    subjects: list[str] | None = None
    workload_hours: float | None = None
    status: EmployeeStatus | None = None
    photo_url: str | None = None
