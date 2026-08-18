"""Map fee programmes to campus / division / department and batch."""

from __future__ import annotations

# GraduationTypeName → org placement (demo aligned to SAE / SCAS seed)
PROGRAMME_ORG: dict[str, dict[str, str]] = {
    "B.E Civil Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Civil Engineering",
        "dept_code": "CIVIL",
    },
    "B.E Computer Science & Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Computer Science and Engineering",
        "dept_code": "CSE",
    },
    "B.E Cyber Security": {
        "campus": "SAE Tiruppur Extension",
        "division": "Engineering",
        "department": "Cyber Security",
        "dept_code": "CYBER",
    },
    "B.E Electrical & Electronics Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Electrical and Electronics Engineering",
        "dept_code": "EEE",
    },
    "B.E Electronics & Communication Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Electronics and Communication Engineering",
        "dept_code": "ECE",
    },
    "B.E Mechanical Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Mechanical Engineering",
        "dept_code": "MECH",
    },
    "B.Tech-Artificial Intelligence & Data Science": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Artificial Intelligence & Data Science",
        "dept_code": "AIDS",
    },
    "B.Tech-Information Technology": {
        "campus": "SAE Tiruppur Extension",
        "division": "Engineering",
        "department": "Information Technology",
        "dept_code": "IT",
    },
    "M.E Computer Science & Engineering": {
        "campus": "SAE Coimbatore Main",
        "division": "Engineering",
        "department": "Computer Science and Engineering",
        "dept_code": "CSE",
    },
    "MBA-Master Of Business Administration": {
        "campus": "SCAS Tiruppur Main",
        "division": "Management Studies",
        "department": "Business Administration",
        "dept_code": "MBA",
    },
}

_UG_BATCH = {"I Year": "2025-29", "II Year": "2024-28", "III Year": "2023-27", "IV Year": "2022-26"}
_PG_BATCH = {"I Year": "2025-27", "II Year": "2024-26"}


def resolve_org(programme: str) -> dict[str, str]:
    return PROGRAMME_ORG.get(
        programme.strip(),
        {
            "campus": "SAE Coimbatore Main",
            "division": "Engineering",
            "department": "Unassigned",
            "dept_code": "GEN",
        },
    )


def resolve_batch(programme: str, year: str) -> str:
    pg = programme.strip().startswith(("M.E", "MBA", "M.Tech"))
    table = _PG_BATCH if pg else _UG_BATCH
    return table.get(year.strip(), "2024-28")
