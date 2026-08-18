"""Extra catalog items for Sasurie Engineering College stores & labs."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.catalog.schemas import ItemCategory, ItemCreate
from app.modules.catalog.service import create_item

ITEMS: list[dict] = [
    {"name": "A4 Copier Paper — 75 GSM (ream)", "category": "stationery", "uom": "Ream", "hsn": "4802", "rate": 280, "reorder": 40},
    {"name": "Whiteboard Marker — Blue (box of 10)", "category": "stationery", "uom": "Box", "hsn": "9608", "rate": 185, "reorder": 20},
    {"name": "Sulphuric Acid AR Grade 500ml", "category": "lab_chemical", "uom": "Bottle", "hsn": "2807", "rate": 320, "reorder": 15},
    {"name": "Borosilicate Beaker 250ml", "category": "glassware", "uom": "Nos", "hsn": "7017", "rate": 145, "reorder": 30},
    {"name": "Cat-6 Network Cable — 305m box", "category": "it_consumable", "uom": "Box", "hsn": "8544", "rate": 7800, "reorder": 5},
    {"name": "LED Tube Light 20W", "category": "electrical", "uom": "Nos", "hsn": "8539", "rate": 220, "reorder": 50},
    {"name": "Housekeeping Disinfectant 5L", "category": "housekeeping", "uom": "Can", "hsn": "3808", "rate": 450, "reorder": 25},
    {"name": "Cricket Bat — Kashmir Willow", "category": "sports", "uom": "Nos", "hsn": "9506", "rate": 1850, "reorder": 8},
    {"name": "First Aid Kit — Lab Standard", "category": "medical", "uom": "Kit", "hsn": "3006", "rate": 980, "reorder": 10},
    {"name": "Student Dual Desk — Mild Steel", "category": "furniture", "uom": "Nos", "hsn": "9403", "rate": 4200, "reorder": 10, "capital": True},
    {"name": "Arduino Uno R3 Development Board", "category": "it_consumable", "uom": "Nos", "hsn": "8542", "rate": 650, "reorder": 25},
    {"name": "Oscilloscope Probe Set", "category": "consumable", "uom": "Set", "hsn": "9030", "rate": 2400, "reorder": 12},
    {"name": "Printer Toner — HP 88A Compatible", "category": "it_consumable", "uom": "Nos", "hsn": "8443", "rate": 1850, "reorder": 15},
    {"name": "Nitrile Examination Gloves (box 100)", "category": "medical", "uom": "Box", "hsn": "4015", "rate": 420, "reorder": 20},
    {"name": "Projection Screen — 8ft Motorised", "category": "electrical", "uom": "Nos", "hsn": "9010", "rate": 18500, "reorder": 2, "capital": True},
    {"name": "Workshop Cutting Oil 20L", "category": "consumable", "uom": "Can", "hsn": "2710", "rate": 3200, "reorder": 8},
    {"name": "Library Barcode Labels (roll 2000)", "category": "stationery", "uom": "Roll", "hsn": "4821", "rate": 650, "reorder": 6},
    {"name": "Multimeter Digital — Fluke Style", "category": "consumable", "uom": "Nos", "hsn": "9030", "rate": 4500, "reorder": 10},
]


async def seed_catalog_extra(db: AsyncIOMotorDatabase, institution_id: str) -> int:
    created = 0
    for spec in ITEMS:
        existing = await db["items"].find_one({"name": spec["name"]})
        if existing:
            continue
        await create_item(
            db,
            ItemCreate(
                institution_id=institution_id,
                name=spec["name"],
                category=ItemCategory(spec["category"]),
                uom=spec["uom"],
                hsn_code=spec["hsn"],
                gst_rate=18.0,
                standard_rate=float(spec["rate"]),
                specification=f"Sasurie SAE stores standard — {spec['name']}",
                reorder_level=float(spec["reorder"]),
                is_capital_item=bool(spec.get("capital", False)),
                lead_time_days=10,
            ),
        )
        print(f"  + catalog item — {spec['name']}")
        created += 1
    return created
