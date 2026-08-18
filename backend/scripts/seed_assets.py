"""Seed fixed assets for Sasurie Engineering College.

Idempotent by asset_code. Safe to re-run.

Usage (from backend/):
    ./venv/bin/python scripts/seed_assets.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import close_db, get_db
from app.modules.assets.enums import AssetClass, FundingSource
from app.modules.assets.schemas import AssetCreate
from app.modules.assets.service import create_asset


def dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


ASSET_SPECS: list[dict] = [
    {"code": "AST-SEED-01", "asset_class": AssetClass.COMPUTERS, "name": "Dell OptiPlex Lab Desktop Batch A", "make": "Dell", "model": "OptiPlex 7090", "value": 1850000, "building": "CSE Block", "room": "Lab-1", "dept": "SAE-CBE-CSE"},
    {"code": "AST-SEED-02", "asset_class": AssetClass.COMPUTERS, "name": "HP ProBook Faculty Laptops", "make": "HP", "model": "ProBook 450 G9", "value": 960000, "building": "CSE Block", "room": "Faculty Bay", "dept": "SAE-CBE-CSE"},
    {"code": "AST-SEED-03", "asset_class": AssetClass.LAB_EQUIPMENT, "name": "Digital Storage Oscilloscope Set", "make": "Keysight", "model": "DSOX1204G", "value": 720000, "building": "ECE Block", "room": "EDC Lab", "dept": "SAE-CBE-ECE"},
    {"code": "AST-SEED-04", "asset_class": AssetClass.LAB_EQUIPMENT, "name": "PLC Trainer Kits", "make": "Siemens", "model": "S7-1200 Kit", "value": 540000, "building": "EEE Block", "room": "PLC Lab", "dept": "SAE-CBE-EEE"},
    {"code": "AST-SEED-05", "asset_class": AssetClass.PLANT_MACHINERY, "name": "CNC Lathe — Mechanical Workshop", "make": "Ace Designers", "model": "Jobber XL", "value": 2850000, "building": "Workshop", "room": "CNC Bay", "dept": "SAE-CBE-MECH"},
    {"code": "AST-SEED-06", "asset_class": AssetClass.FURNITURE, "name": "Classroom Dual Desks (CSE)", "make": "Godrej", "model": "Edu-Desk", "value": 420000, "building": "CSE Block", "room": "CR-201", "dept": "SAE-CBE-CSE"},
    {"code": "AST-SEED-07", "asset_class": AssetClass.LIBRARY_BOOKS, "name": "Engineering Reference Collection FY25", "make": "", "model": "", "value": 380000, "building": "Central Library", "room": "Stack-A", "dept": "SAE-CBE-LIB"},
    {"code": "AST-SEED-08", "asset_class": AssetClass.VEHICLES, "name": "College Bus — Coimbatore Route", "make": "Ashok Leyland", "model": "Lynx", "value": 3200000, "building": "Transport Yard", "room": "Bay-2", "dept": "SAE-CBE-STORE"},
    {"code": "AST-SEED-09", "asset_class": AssetClass.ELECTRICAL, "name": "125 kVA Diesel Generator", "make": "Cummins", "model": "C125D5", "value": 1450000, "building": "Utility", "room": "DG Room", "dept": "SAE-CBE-EEE"},
    {"code": "AST-SEED-10", "asset_class": AssetClass.SPORTS, "name": "Indoor Badminton Court Equipment", "make": "Yonex", "model": "Pro Court Set", "value": 185000, "building": "Indoor Stadium", "room": "Court-1", "dept": "SAE-CBE-CSE"},
    {"code": "AST-SEED-11", "asset_class": AssetClass.BUILDING, "name": "IT Block Annexe Fit-out", "make": "", "model": "", "value": 8500000, "building": "IT Block", "room": "Annexe", "dept": "SAE-CBE-IT", "funding": FundingSource.GRANT},
    {"code": "AST-SEED-12", "asset_class": AssetClass.LAB_EQUIPMENT, "name": "Concrete Compression Testing Machine", "make": "AIMIL", "model": "CTM-2000", "value": 610000, "building": "Civil Block", "room": "SM Lab", "dept": "SAE-CBE-CIVIL"},
]


async def seed_assets_data(
    db: AsyncIOMotorDatabase,
    *,
    institution_id: str,
    campus_id: str,
    department_ids: dict[str, str],
) -> int:
    """Creates sample assets. `department_ids` maps org unit code → id. Returns count created."""
    created = 0
    for spec in ASSET_SPECS:
        existing = await db["assets"].find_one({"seed_key": spec["code"]})
        if existing:
            print(f"  ~ asset '{spec['code']}' already exists, skipping")
            continue
        dept_id = department_ids.get(spec["dept"])
        if not dept_id:
            print(f"  ! skip '{spec['code']}' — department {spec['dept']} not found")
            continue
        payload = AssetCreate(
            institution_id=institution_id,
            campus_id=campus_id,
            department_id=dept_id,
            asset_class=spec["asset_class"],
            name=spec["name"],
            make=spec.get("make", ""),
            model=spec.get("model", ""),
            serial_number=f"SN-{spec['code'][-2:]}-2025",
            capitalization_date=dt(2025, 6, 15),
            capitalization_value=float(spec["value"]),
            funding_source=spec.get("funding", FundingSource.INSTITUTION),
            supplier_name="Empanelled Vendor — Coimbatore",
            custodian_name="Lab / Store In-charge",
            location_building=spec["building"],
            location_floor="Ground",
            location_room=spec["room"],
            useful_life_years=8,
            depreciation_rate=15.0,
            residual_value=round(spec["value"] * 0.05, 2),
        )
        out = await create_asset(db, payload)
        await db["assets"].update_one({"_id": ObjectId(out.id)}, {"$set": {"seed_key": spec["code"]}})
        print(f"  + asset '{out.asset_code}' — {out.name}")
        created += 1
    return created


async def _standalone() -> None:
    db = get_db()
    inst = await db["institutions"].find_one({"code": "SAE"})
    campus = await db["campuses"].find_one({"code": "SAE-CBE"})
    if not inst or not campus:
        print("SAE / SAE-CBE not found — run scripts/seed.py first.")
        await close_db()
        return
    units = await db["org_units"].find({"campus_id": campus["_id"]}).to_list(length=100)
    dept_ids = {u["code"]: str(u["_id"]) for u in units}
    print("Seeding assets…")
    n = await seed_assets_data(db, institution_id=str(inst["_id"]), campus_id=str(campus["_id"]), department_ids=dept_ids)
    print(f"Done. Created {n} assets.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(_standalone())
