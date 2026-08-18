"""Fee analytics helpers — categorisation, due buckets, aggregates."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime


def fee_category(type_name: str) -> str:
    t = (type_name or "").upper()
    if "LATE" in t:
        return "Late Fees"
    if "HOSTEL" in t:
        return "Hostel"
    if "BUS" in t:
        return "Bus"
    if "ADMISSION" in t:
        return "Admission"
    if "APPLICATION" in t:
        return "Application"
    if "TUITION" in t or "TUTION" in t:
        return "Tuition"
    return "Other"


def parse_due(due: str) -> date | None:
    try:
        return datetime.strptime((due or "").strip(), "%d/%m/%Y").date()
    except ValueError:
        return None


def due_bucket(due: str, today: date) -> str:
    d = parse_due(due)
    if d is None:
        return "Unscheduled"
    delta = (d - today).days
    if delta < 0:
        return "Overdue"
    if delta <= 30:
        return "Due in 30 days"
    if delta <= 90:
        return "Due in 90 days"
    return "Later"


def short_programme(name: str) -> str:
    n = (name or "").strip()
    replacements = {
        "B.E Computer Science & Engineering": "B.E CSE",
        "B.E Electronics & Communication Engineering": "B.E ECE",
        "B.E Electrical & Electronics Engineering": "B.E EEE",
        "B.E Mechanical Engineering": "B.E Mech",
        "B.E Civil Engineering": "B.E Civil",
        "B.E Cyber Security": "B.E Cyber",
        "B.Tech-Artificial Intelligence & Data Science": "B.Tech AI&DS",
        "B.Tech-Information Technology": "B.Tech IT",
        "M.E Computer Science & Engineering": "M.E CSE",
        "MBA-Master Of Business Administration": "MBA",
    }
    return replacements.get(n, n[:22])


def aggregate_named(rows: list[dict], key_fn, amount_key: str = "TotalAmount") -> list[tuple[str, float, int]]:
    totals: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        name = key_fn(row)
        totals[name] += float(row.get(amount_key) or 0)
        counts[name] += 1
    items = [(n, round(totals[n], 2), counts[n]) for n in totals]
    items.sort(key=lambda x: -x[1])
    return items
