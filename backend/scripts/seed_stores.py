"""Idempotent stores & opening-stock seed helper.

Importable from the main seed script:

    from scripts.seed_stores import seed_stores_data
    await seed_stores_data(db, institution_id, campus_id)

Or run standalone (uses first institution + campus found):

    ./venv/bin/python scripts/seed_stores.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import close_db, get_db
from app.main import ensure_indexes
from app.modules.stores.schemas import StockTxnCreate, StockTxnType, StoreCreate, StoreType
from app.modules.stores.service_stores import create_store
from app.modules.stores.service_txns import post_transaction

STORE_DEFS: list[dict] = [
    {"code": "STR-CENTRAL", "name": "Central Stores", "store_type": StoreType.CENTRAL, "location": "Admin Block Basement", "in_charge_name": "R. Murugan"},
    {"code": "STR-CSE-LAB", "name": "CSE Laboratory Store", "store_type": StoreType.LABORATORY, "location": "CSE Block – Lab Wing", "in_charge_name": "K. Priya"},
    {"code": "STR-HOSTEL", "name": "Boys Hostel Store", "store_type": StoreType.HOSTEL, "location": "Hostel A Ground Floor", "in_charge_name": "S. Karthik"},
    {"code": "STR-SPORTS", "name": "Sports Store", "store_type": StoreType.SPORTS, "location": "Sports Complex", "in_charge_name": "M. Anitha"},
    {"code": "STR-MAINT", "name": "Maintenance Store", "store_type": StoreType.MAINTENANCE, "location": "Works Yard", "in_charge_name": "V. Suresh"},
    {"code": "STR-MECH", "name": "Mechanical Dept Store", "store_type": StoreType.DEPARTMENT, "location": "Mechanical Block", "in_charge_name": "P. Devi"},
]

# Opening qty keyed loosely by item category preference; applied to central + matching store.
OPENING_QTY = {
    "consumable": 200,
    "stationery": 500,
    "electrical": 80,
    "it_consumable": 60,
    "lab_chemical": 40,
    "glassware": 100,
    "housekeeping": 150,
    "sports": 30,
    "medical": 50,
    "furniture": 10,
}


async def _get_or_create_store(db: AsyncIOMotorDatabase, institution_id: str, campus_id: str, spec: dict) -> str:
    existing = await db["stores"].find_one({"code": spec["code"]})
    if existing:
        print(f"  ~ store '{spec['code']}' already exists, reusing")
        return str(existing["_id"])
    out = await create_store(
        db,
        StoreCreate(
            institution_id=institution_id,
            campus_id=campus_id,
            code=spec["code"],
            name=spec["name"],
            store_type=spec["store_type"],
            location=spec["location"],
            in_charge_name=spec["in_charge_name"],
        ),
    )
    print(f"  + created store '{out.code}' — {out.name}")
    return out.id


async def _opening_exists(db: AsyncIOMotorDatabase, store_id: str, item_id: str) -> bool:
    from bson import ObjectId

    return (
        await db["stock_transactions"].find_one(
            {"store_id": ObjectId(store_id), "item_id": ObjectId(item_id), "txn_type": StockTxnType.OPENING.value}
        )
        is not None
    )


async def seed_stores_data(db: AsyncIOMotorDatabase, institution_id: str, campus_id: str) -> None:
    """Seeds 4–6 stores and opening stock for existing catalog items. Idempotent."""
    print("Seeding stores & opening stock…")
    store_ids: dict[str, str] = {}
    for spec in STORE_DEFS:
        store_ids[spec["code"]] = await _get_or_create_store(db, institution_id, campus_id, spec)

    from bson import ObjectId

    items = await db["items"].find({"institution_id": ObjectId(institution_id), "status": "active"}).to_list(length=200)
    if not items:
        print("  ! no catalog items found — skip opening stock")
        return

    central_id = store_ids["STR-CENTRAL"]
    sports_id = store_ids["STR-SPORTS"]
    lab_id = store_ids["STR-CSE-LAB"]
    posted = 0
    for item in items:
        category = item.get("category", "consumable")
        qty = float(OPENING_QTY.get(category, 25))
        target = central_id
        if category == "sports":
            target = sports_id
        elif category in {"lab_chemical", "glassware"}:
            target = lab_id

        if await _opening_exists(db, target, str(item["_id"])):
            continue
        await post_transaction(
            db,
            StockTxnCreate(
                store_id=target,
                txn_type=StockTxnType.OPENING,
                item_id=str(item["_id"]),
                quantity=qty,
                uom=item.get("uom", "Nos"),
                rate=float(item.get("standard_rate", 0)),
                remarks="Seed opening balance",
            ),
        )
        posted += 1
    print(f"  + posted {posted} opening stock transaction(s)")


async def main() -> None:
    await ensure_indexes()
    db = get_db()
    inst = await db["institutions"].find_one()
    campus = await db["campuses"].find_one({"institution_id": inst["_id"]}) if inst else None
    if not inst or not campus:
        print("No institution/campus found — run scripts/seed.py first.")
        await close_db()
        return
    await seed_stores_data(db, str(inst["_id"]), str(campus["_id"]))
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
