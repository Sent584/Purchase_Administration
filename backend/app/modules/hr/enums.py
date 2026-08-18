from enum import Enum


class EmployeeCategory(str, Enum):
    TEACHING = "teaching"
    NON_TEACHING = "non_teaching"


class EmploymentType(str, Enum):
    PERMANENT = "permanent"
    PROBATION = "probation"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    VISITING = "visiting"
    ADJUNCT = "adjunct"
    CONSULTANT = "consultant"
    OUTSOURCED = "outsourced"
    INTERN = "intern"


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    RELIEVED = "relieved"
    RETIRED = "retired"
    TERMINATED = "terminated"


class FacultyRank(str, Enum):
    PROFESSOR = "professor"
    ASSOCIATE_PROFESSOR = "associate_professor"
    ASSISTANT_PROFESSOR = "assistant_professor"
    LECTURER = "lecturer"
    GUEST_FACULTY = "guest_faculty"


class DoctoralStatus(str, Enum):
    PHD_AWARDED = "phd_awarded"
    PHD_PURSUING = "phd_pursuing"
    NOT_APPLICABLE = "not_applicable"
