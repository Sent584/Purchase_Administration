"""Seed Engineering / Arts / Pharmacy / Nursing divisions and link departments."""

import asyncio
import sys
from pathlib import Path

from bson import ObjectId

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import close_db, get_db
from app.modules.org.schemas import OrgUnitCreate, OrgUnitType
from app.modules.org.service import create_org_unit
from app.modules.purchase_common.org_scope import resolve_org_scope


async def get_or_create_unit(db, payload: OrgUnitCreate) -> str:
    existing = await db["org_units"].find_one({"code": payload.code})
    if existing:
        return str(existing["_id"])
    out = await create_org_unit(db, payload)
    print(f"  + division/unit '{out.code}'")
    return out.id


async def seed_divisions(db) -> None:
    print("Seeding academic divisions…")
    campuses = await db["campuses"].find({}).to_list(length=50)
    by_code = {c["code"]: c for c in campuses}
    sae = by_code.get("SAE-CBE")
    scas = by_code.get("SCAS-TUP")
    if not sae:
        print("  ! SAE-CBE campus missing — run seed.py first")
        return

    sae_id = str(sae["_id"])
    eng = await get_or_create_unit(
        db,
        OrgUnitCreate(
            campus_id=sae_id,
            code="SAE-CBE-DIV-ENG",
            name="Engineering",
            unit_type=OrgUnitType.DIVISION,
            is_academic=True,
        ),
    )
    await get_or_create_unit(
        db,
        OrgUnitCreate(
            campus_id=sae_id,
            code="SAE-CBE-DIV-ARTS",
            name="Arts and Science",
            unit_type=OrgUnitType.DIVISION,
            is_academic=True,
        ),
    )
    pharm = await get_or_create_unit(
        db,
        OrgUnitCreate(
            campus_id=sae_id,
            code="SAE-CBE-DIV-PHARM",
            name="Pharmacy",
            unit_type=OrgUnitType.DIVISION,
            is_academic=True,
        ),
    )
    nurs = await get_or_create_unit(
        db,
        OrgUnitCreate(
            campus_id=sae_id,
            code="SAE-CBE-DIV-NURS",
            name="Nursing",
            unit_type=OrgUnitType.DIVISION,
            is_academic=True,
        ),
    )

    for code in ["SAE-CBE-CSE", "SAE-CBE-ECE", "SAE-CBE-EEE", "SAE-CBE-MECH", "SAE-CBE-CIVIL", "SAE-CBE-IT"]:
        await db["org_units"].update_one({"code": code}, {"$set": {"parent_id": ObjectId(eng)}})

    for code, name, parent in [
        ("SAE-CBE-PHARM-BPHARM", "Department of B.Pharmacy", pharm),
        ("SAE-CBE-PHARM-DPHARM", "Department of D.Pharmacy", pharm),
        ("SAE-CBE-NURS-BSC", "Department of B.Sc Nursing", nurs),
        ("SAE-CBE-NURS-GNM", "Department of GNM Nursing", nurs),
    ]:
        await get_or_create_unit(
            db,
            OrgUnitCreate(
                campus_id=sae_id,
                parent_id=parent,
                code=code,
                name=name,
                unit_type=OrgUnitType.DEPARTMENT,
                is_academic=True,
            ),
        )

    if scas:
        scas_id = str(scas["_id"])
        scas_arts = await get_or_create_unit(
            db,
            OrgUnitCreate(
                campus_id=scas_id,
                code="SCAS-TUP-DIV-ARTS",
                name="Arts and Science",
                unit_type=OrgUnitType.DIVISION,
                is_academic=True,
            ),
        )
        for code in ["SCAS-TUP-CS", "SCAS-TUP-COM", "SCAS-TUP-BBA", "SCAS-TUP-ENG", "SCAS-TUP-MATH"]:
            await db["org_units"].update_one({"code": code}, {"$set": {"parent_id": ObjectId(scas_arts)}})

    print("  Divisions ready (Engineering, Arts and Science, Pharmacy, Nursing)")


async def backfill_indent_org(db) -> None:
    print("Backfilling org scope on purchase documents…")
    for doc in await db["indents"].find({}).to_list(length=2000):
        scope = await resolve_org_scope(
            db,
            campus_id=doc.get("campus_id"),
            department_id=doc.get("department_id"),
            division_id=doc.get("division_id"),
        )
        await db["indents"].update_one(
            {"_id": doc["_id"]},
            {"$set": {k: v for k, v in scope.items() if v is not None}},
        )

    for coll in ("quotations", "purchase_orders"):
        for doc in await db[coll].find({}).to_list(length=2000):
            upstream = None
            if doc.get("indent_id"):
                upstream = await db["indents"].find_one({"_id": doc["indent_id"]})
            if not upstream and coll == "purchase_orders" and doc.get("quotation_id"):
                q = await db["quotations"].find_one({"_id": doc["quotation_id"]})
                if q and q.get("indent_id"):
                    upstream = await db["indents"].find_one({"_id": q["indent_id"]})
            if not upstream:
                continue
            patch = {
                "campus_id": upstream.get("campus_id"),
                "campus_name": upstream.get("campus_name", ""),
                "division_id": upstream.get("division_id"),
                "division_name": upstream.get("division_name", ""),
                "department_id": upstream.get("department_id"),
                "department_name": upstream.get("department_name", ""),
            }
            await db[coll].update_one({"_id": doc["_id"]}, {"$set": patch})

    pos = {p["_id"]: p for p in await db["purchase_orders"].find({}).to_list(length=2000)}
    for grn in await db["grns"].find({}).to_list(length=2000):
        po = pos.get(grn.get("po_id"))
        if not po:
            continue
        patch = {
            "campus_id": po.get("campus_id"),
            "campus_name": po.get("campus_name", ""),
            "division_id": po.get("division_id"),
            "division_name": po.get("division_name", ""),
            "department_id": po.get("department_id"),
            "department_name": po.get("department_name", ""),
        }
        await db["grns"].update_one({"_id": grn["_id"]}, {"$set": patch})
        await db["purchase_bills"].update_many({"grn_id": grn["_id"]}, {"$set": patch})

    print("  Org scope backfill complete")


async def main() -> None:
    db = get_db()
    try:
        await seed_divisions(db)
        await backfill_indent_org(db)
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
