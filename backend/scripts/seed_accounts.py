"""Idempotent accounts seed — COA, cost centres, budgets, banks, vouchers.

Usage:
    cd backend && ./venv/bin/python scripts/seed_accounts.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.core.database import close_db, get_db
from app.main import ensure_indexes

COA = [
    ("1000", "Cash in Hand", "asset"),
    ("1010", "IOB Current Account", "asset"),
    ("1100", "Sundry Debtors", "asset"),
    ("1500", "Fixed Assets", "asset"),
    ("2000", "Sundry Creditors", "liability"),
    ("2100", "EPF Payable", "liability"),
    ("2110", "ESI Payable", "liability"),
    ("2120", "TDS Payable", "liability"),
    ("2130", "GST Payable", "liability"),
    ("3000", "Corpus / Capital Fund", "equity"),
    ("4000", "Tuition Fee Income", "income"),
    ("4100", "Grant Income", "income"),
    ("5000", "Salaries & Wages", "expense"),
    ("5100", "Consumables", "expense"),
    ("5200", "Electricity & Utilities", "expense"),
    ("5300", "Depreciation", "expense"),
]


async def seed_accounts_data(db: AsyncIOMotorDatabase, institution_id: ObjectId) -> None:
    for code, name, atype in COA:
        await db["chart_of_accounts"].update_one(
            {"code": code, "institution_id": institution_id},
            {
                "$set": {"name": name, "account_type": atype, "parent_code": None, "is_control": False},
                "$setOnInsert": {"code": code, "institution_id": institution_id},
            },
            upsert=True,
        )

    for code, name in (("CC-CSE", "Computer Science & Engineering"), ("CC-ADMIN", "Central Administration")):
        await db["cost_centres"].update_one(
            {"code": code, "institution_id": institution_id},
            {"$set": {"name": name, "campus_id": None}, "$setOnInsert": {"code": code, "institution_id": institution_id}},
            upsert=True,
        )

    budgets = [
        ("5000", "Salaries & Wages", "CC-CSE", 8_50_00_000, 1_20_00_000, 3_40_00_000),
        ("5100", "Consumables", "CC-CSE", 45_00_000, 8_00_000, 18_50_000),
        ("5200", "Electricity & Utilities", "CC-ADMIN", 28_00_000, 2_00_000, 12_00_000),
    ]
    for code, name, cc, allocated, committed, actual in budgets:
        await db["budgets"].update_one(
            {"fy": "2025-26", "account_code": code, "cost_centre_code": cc, "institution_id": institution_id},
            {
                "$set": {"account_name": name, "allocated": allocated, "committed": committed, "actual": actual},
                "$setOnInsert": {
                    "fy": "2025-26",
                    "account_code": code,
                    "cost_centre_code": cc,
                    "institution_id": institution_id,
                },
            },
            upsert=True,
        )

    if await db["bank_accounts_finance"].find_one({"institution_id": institution_id, "ifsc": "IOBA0001234"}) is None:
        await db["bank_accounts_finance"].insert_one(
            {
                "bank_name": "Indian Overseas Bank",
                "account_number_masked": "****4521",
                "ifsc": "IOBA0001234",
                "account_type": "current",
                "institution_id": institution_id,
                "current_balance": 2_45_67_890.50,
            }
        )
    if await db["bank_accounts_finance"].find_one({"institution_id": institution_id, "ifsc": "SBIN0009876"}) is None:
        await db["bank_accounts_finance"].insert_one(
            {
                "bank_name": "State Bank of India",
                "account_number_masked": "****8812",
                "ifsc": "SBIN0009876",
                "account_type": "savings",
                "institution_id": institution_id,
                "current_balance": 18_45_200.00,
            }
        )

    now = utcnow()
    vouchers = [
        (
            "JV/2025-26/SEED-001",
            "journal",
            "Salary payable provision — June 2025",
            [("5000", 12_50_000, 0), ("2000", 0, 12_50_000)],
            "posted",
        ),
        (
            "PV/2025-26/SEED-001",
            "payment",
            "Electricity bill — TNEB Tiruppur",
            [("5200", 1_85_000, 0), ("1010", 0, 1_85_000)],
            "posted",
        ),
        (
            "RV/2025-26/SEED-001",
            "receipt",
            "Tuition fee collection — CSE II year",
            [("1010", 8_50_000, 0), ("4000", 0, 8_50_000)],
            "posted",
        ),
        (
            "JV/2025-26/SEED-002",
            "payroll",
            "EPF employer contribution — June 2025",
            [("5000", 95_000, 0), ("2100", 0, 95_000)],
            "approved",
        ),
    ]
    for number, vtype, narration, lines, status in vouchers:
        if await db["vouchers"].find_one({"voucher_number": number}):
            continue
        line_docs = [
            {"account_code": c, "cost_centre": "CC-CSE", "debit": float(d), "credit": float(cr)} for c, d, cr in lines
        ]
        debit = round(sum(l["debit"] for l in line_docs), 2)
        credit = round(sum(l["credit"] for l in line_docs), 2)
        await db["vouchers"].insert_one(
            {
                "voucher_number": number,
                "voucher_type": vtype,
                "date": now - timedelta(days=3),
                "narration": narration,
                "lines": line_docs,
                "status": status,
                "total_debit": debit,
                "total_credit": credit,
                "institution_id": institution_id,
                "created_by_name": "Finance Officer",
                "created_at": now,
                "updated_at": now,
            }
        )
    print("  + COA, cost centres, FY 2025-26 budgets, banks, sample vouchers")


async def main() -> None:
    db = get_db()
    await ensure_indexes()
    inst = await db["institutions"].find_one({})
    if not inst:
        print("No institution found — run scripts/seed.py first.")
        await close_db()
        return
    print("Seeding accounts…")
    await seed_accounts_data(db, inst["_id"])
    print("Done.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
