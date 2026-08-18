"""Expand programme fee aggregates into deterministic student dues."""

from __future__ import annotations

import hashlib
from collections import defaultdict
from functools import lru_cache

from app.modules.fees.loader import load_fee_rows
from app.modules.fees.programme_org import resolve_batch, resolve_org

_FIRST = (
    "Arun", "Priya", "Karthik", "Divya", "Suresh", "Anitha", "Vignesh", "Meena",
    "Rahul", "Lakshmi", "Sathish", "Nandhini", "Harish", "Kavya", "Ajith", "Sowmiya",
    "Pradeep", "Deepa", "Gokul", "Janani", "Manoj", "Swathi", "Naveen", "Keerthana",
)
_LAST = (
    "Kumar", "Rajan", "Selvam", "Murugan", "Krishnan", "Palanisamy", "Subramanian",
    "Natarajan", "Venkatesh", "Balaji", "Senthil", "Ganesan", "Pandian", "Iyer",
)


def _stable_int(key: str, mod: int) -> int:
    h = hashlib.sha256(key.encode()).hexdigest()
    return int(h[:8], 16) % mod


def _student_count(programme: str, year: str, total: float) -> int:
    base = 6 + _stable_int(f"{programme}|{year}", 12)
    if total >= 50_00_000:
        return min(36, base + 14)
    if total >= 10_00_000:
        return min(28, base + 8)
    return max(4, min(18, base))


def _split_amount(total: float, n: int, seed: str) -> list[float]:
    if n <= 0:
        return []
    weights = [1 + (_stable_int(f"{seed}|{i}", 7) / 10) for i in range(n)]
    wsum = sum(weights)
    parts = [round(total * w / wsum, 2) for w in weights]
    parts[-1] = round(total - sum(parts[:-1]), 2)
    return parts


@lru_cache(maxsize=1)
def build_student_dues() -> list[dict]:
    """One row per student × fee type, preserving programme totals."""
    raw = load_fee_rows()
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in raw:
        prog = str(row.get("GraduationTypeName") or "").strip()
        year = str(row.get("CourseName") or "").strip()
        groups[(prog, year)].append(row)

    out: list[dict] = []
    for (prog, year), lines in groups.items():
        org = resolve_org(prog)
        batch = resolve_batch(prog, year)
        group_total = sum(float(r.get("TotalAmount") or 0) for r in lines)
        n = _student_count(prog, year, group_total)
        students: list[dict] = []
        for i in range(n):
            fn = _FIRST[_stable_int(f"{prog}|{year}|f|{i}", len(_FIRST))]
            ln = _LAST[_stable_int(f"{prog}|{year}|l|{i}", len(_LAST))]
            roll = f"SAE-{org['dept_code']}-{batch[:4]}-{i + 1:03d}"
            students.append({"student_id": roll, "student_name": f"{fn} {ln}"})

        for line in lines:
            amt = float(line.get("TotalAmount") or 0)
            shares = _split_amount(amt, n, f"{prog}|{year}|{line.get('TypeName')}")
            for i, share in enumerate(shares):
                if share <= 0:
                    continue
                st = students[i]
                out.append(
                    {
                        **line,
                        "TotalAmount": share,
                        "student_id": st["student_id"],
                        "student_name": st["student_name"],
                        "campus": org["campus"],
                        "division": org["division"],
                        "department": org["department"],
                        "batch": batch,
                        "programme": prog,
                        "year": year,
                    }
                )
    return out


def list_student_summaries(
    campus: str | None = None,
    division: str | None = None,
    department: str | None = None,
    batch: str | None = None,
    search: str | None = None,
) -> list[dict]:
    dues = build_student_dues()
    buckets: dict[str, dict] = {}
    q = (search or "").strip().lower()
    for row in dues:
        if campus and row["campus"] != campus:
            continue
        if division and row["division"] != division:
            continue
        if department and row["department"] != department:
            continue
        if batch and row["batch"] != batch:
            continue
        if q and q not in row["student_id"].lower() and q not in row["student_name"].lower():
            continue
        sid = row["student_id"]
        b = buckets.get(sid)
        if not b:
            buckets[sid] = {
                "student_id": sid,
                "student_name": row["student_name"],
                "campus": row["campus"],
                "division": row["division"],
                "department": row["department"],
                "batch": row["batch"],
                "programme": row["programme"],
                "year": row["year"],
                "pending_amount": 0.0,
                "line_count": 0,
            }
            b = buckets[sid]
        b["pending_amount"] = round(b["pending_amount"] + float(row["TotalAmount"]), 2)
        b["line_count"] += 1
    items = sorted(buckets.values(), key=lambda x: -x["pending_amount"])
    return items


def get_student_detail(student_id: str) -> dict | None:
    dues = [r for r in build_student_dues() if r["student_id"] == student_id]
    if not dues:
        return None
    head = dues[0]
    lines = sorted(dues, key=lambda r: -float(r["TotalAmount"]))
    return {
        "student_id": student_id,
        "student_name": head["student_name"],
        "campus": head["campus"],
        "division": head["division"],
        "department": head["department"],
        "batch": head["batch"],
        "programme": head["programme"],
        "year": head["year"],
        "pending_amount": round(sum(float(r["TotalAmount"]) for r in lines), 2),
        "lines": lines,
    }
