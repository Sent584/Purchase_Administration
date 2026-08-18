"""Bulk Sasurie staff generator — ~160 additional employees across SAE & SCAS.

Idempotent by official_email. Designed for demo density (200+ total with seed_hr).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence

FIRST = [
    "Arun", "Priya", "Karthik", "Lakshmi", "Suresh", "Meena", "Vijay", "Anitha",
    "Ravi", "Deepa", "Ganesh", "Kavitha", "Murugan", "Shanthi", "Balaji", "Revathi",
    "Senthil", "Nithya", "Prakash", "Hemalatha", "Vignesh", "Kalpana", "Saravanan", "Divya",
]
LAST = [
    "Kumar", "Rajan", "Subramanian", "Natarajan", "Murugan", "Selvi", "Krishnan",
    "Devi", "Pandian", "Iyer", "Ganesan", "Palanisamy", "Thangavel", "Manikandan",
]
SAE_DEPTS = [
    ("SAE-CBE-CSE", "Computer Science and Engineering", True),
    ("SAE-CBE-ECE", "Electronics and Communication Engineering", True),
    ("SAE-CBE-EEE", "Electrical and Electronics Engineering", True),
    ("SAE-CBE-MECH", "Mechanical Engineering", True),
    ("SAE-CBE-CIVIL", "Civil Engineering", True),
    ("SAE-CBE-IT", "Information Technology", True),
    ("SAE-CBE-FIN", "Finance Office", False),
    ("SAE-CBE-HR", "Human Resources Office", False),
    ("SAE-CBE-STORE", "Central Stores", False),
    ("SAE-CBE-LIB", "Central Library", False),
]
SCAS_DEPTS = [
    ("SCAS-TUP-CS", "Department of Computer Science", True),
    ("SCAS-TUP-COM", "Department of Commerce", True),
    ("SCAS-TUP-BBA", "Department of Business Administration", True),
    ("SCAS-TUP-ENG", "Department of English", True),
    ("SCAS-TUP-MATH", "Department of Mathematics", True),
    ("SCAS-TUP-FIN", "Finance Office", False),
    ("SCAS-TUP-LIB", "Central Library", False),
]


def _dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


async def seed_bulk_staff(
    db: AsyncIOMotorDatabase,
    *,
    institution_id: ObjectId,
    campus_id: ObjectId,
    department_ids: dict[str, ObjectId],
    dept_list: list[tuple[str, str, bool]],
    email_prefix: str,
    count: int,
    code_prefix: str,
) -> int:
    created = 0
    for i in range(count):
        email = f"{email_prefix}{i + 1:03d}@sasurie.edu.in"
        if await db["employees"].find_one({"official_email": email}):
            continue
        dept_code, dept_name, academic = dept_list[i % len(dept_list)]
        dept_id = department_ids.get(dept_code)
        if not dept_id:
            continue
        first, last = FIRST[i % len(FIRST)], LAST[(i // len(FIRST)) % len(LAST)]
        teaching = academic and (i % 4 != 0)
        seq = await next_sequence(db, "employee_code")
        join = _dt(2016 + (i % 8), 6, 1 + (i % 20))
        doc = {
            "employee_code": f"{code_prefix}-{seq:05d}",
            "institution_id": institution_id,
            "campus_id": campus_id,
            "department_id": dept_id,
            "department_name": dept_name,
            "title": "Dr." if teaching and i % 6 == 0 else ("Ms." if i % 2 else "Mr."),
            "first_name": first,
            "middle_name": "",
            "last_name": last,
            "display_name": f"{first} {last}",
            "gender": "female" if i % 2 else "male",
            "date_of_birth": _dt(1978 + (i % 18), (i % 12) + 1, 12),
            "official_email": email,
            "personal_email": None,
            "mobile": f"9{800000000 + i:09d}"[:10],
            "employee_category": "teaching" if teaching else "non_teaching",
            "employment_type": "probation" if i % 9 == 0 else "permanent",
            "designation": "Assistant Professor" if teaching else ("Accountant" if "FIN" in dept_code else "Lab Assistant"),
            "designation_code": "ASST-PROF" if teaching else "LAB-TECH",
            "grade": "AGP-6000" if teaching else "Level-5",
            "pay_level": "10" if teaching else "5",
            "date_of_joining": join,
            "confirmation_date": join + timedelta(days=365) if i % 9 == 0 else join + timedelta(days=180),
            "retirement_date": _dt(2038 + (i % 5), 5, 31),
            "reporting_manager_name": "Principal / HoD",
            "reporting_manager_id": None,
            "pan": f"BLMDE{(2000 + i):04d}K",
            "uan": f"101{300000000 + i}",
            "epf_number": f"TN/TPR/{40000 + i}",
            "esi_number": "",
            "bank_account_number": f"60200{5000000 + i}",
            "bank_ifsc": "IOBA0001234",
            "bank_name": "Indian Overseas Bank",
            "faculty_rank": "assistant_professor" if teaching else None,
            "doctoral_status": "phd_awarded" if teaching and i % 5 == 0 else ("phd_pursuing" if teaching else "not_applicable"),
            "specialisation": dept_name.split()[-1] if teaching else "",
            "subjects": [dept_name] if teaching else [],
            "workload_hours": 16.0 if teaching else None,
            "status": "active",
            "photo_url": None,
            "created_at": utcnow(),
            "updated_at": utcnow(),
        }
        await db["employees"].insert_one(doc)
        created += 1
    return created
