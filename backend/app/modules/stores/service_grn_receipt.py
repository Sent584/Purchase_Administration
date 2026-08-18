"""Post accepted GRN quantities into campus / division / department stock."""

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.purchase_common.org_scope import copy_org_scope
from app.modules.stores.schemas import StockTxnCreate, StockTxnType
from app.modules.stores.service_txns import post_transaction


async def resolve_receiving_store(
    db: AsyncIOMotorDatabase,
    *,
    institution_id,
    campus_id,
) -> dict:
    base = {"institution_id": institution_id, "status": "active"}
    if campus_id:
        store = await db["stores"].find_one({**base, "campus_id": campus_id, "store_type": "central"})
        if store:
            return store
        store = await db["stores"].find_one({**base, "campus_id": campus_id})
        if store:
            return store
    store = await db["stores"].find_one({**base, "store_type": "central"})
    if store:
        return store
    store = await db["stores"].find_one(base)
    if store is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "No active store found for this campus. Create a store before receiving a GRN.",
        )
    return store


async def post_grn_to_stock(db: AsyncIOMotorDatabase, *, grn: dict, po: dict) -> None:
    """Increase stock for each GRN line with accepted_qty > 0, scoped to GRN org."""
    store = await resolve_receiving_store(
        db,
        institution_id=grn["institution_id"],
        campus_id=grn.get("campus_id"),
    )
    org = copy_org_scope(grn)
    grn_id = str(grn["_id"])

    for line in grn.get("lines", []):
        accepted = float(line.get("accepted_qty") or 0)
        if accepted <= 0:
            continue
        po_line = po["lines"][line["line_index"]]
        item_id = po_line.get("item_id")
        if not item_id:
            continue
        rate = float(po_line.get("rate") or 0)
        await post_transaction(
            db,
            StockTxnCreate(
                store_id=str(store["_id"]),
                txn_type=StockTxnType.GRN_RECEIPT,
                item_id=str(item_id),
                quantity=accepted,
                uom=line.get("uom") or po_line.get("uom") or "Nos",
                rate=rate,
                reference_type="grn",
                reference_id=grn_id,
                remarks=f"GRN {grn.get('grn_number', '')} · {line.get('description', '')}",
                campus_id=str(org["campus_id"]) if org.get("campus_id") else None,
                campus_name=org.get("campus_name") or "",
                division_id=str(org["division_id"]) if org.get("division_id") else None,
                division_name=org.get("division_name") or "",
                department_id=str(org["department_id"]) if org.get("department_id") else None,
                department_name=org.get("department_name") or "",
            ),
        )
