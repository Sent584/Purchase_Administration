from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.stores.helpers import oid
from app.modules.stores.schemas import StoresDashboard
from app.modules.stores.service_balances import _txn_out, list_stock_balances


async def get_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> StoresDashboard:
    store_query: dict = {"status": "active"}
    bal_query: dict = {}
    txn_query: dict = {}
    if institution_id:
        inst = oid(institution_id, "institution_id")
        store_query["institution_id"] = inst
        bal_query["institution_id"] = inst
        txn_query["institution_id"] = inst

    store_count = await db["stores"].count_documents(store_query)
    balances = await list_stock_balances(db, institution_id)
    item_ids = {b.item_id for b in balances}
    total_stock_value = round(sum(b.valuation for b in balances), 2)
    below_reorder = sum(1 for b in balances if b.reorder_level > 0 and b.quantity <= b.reorder_level)
    pending_issues = await db["stock_transactions"].count_documents({**txn_query, "txn_type": "issue", "status": "posted"})

    recent = await db["stock_transactions"].find(txn_query).sort("created_at", -1).to_list(length=8)
    return StoresDashboard(
        store_count=store_count,
        item_count=len(item_ids),
        total_stock_value=total_stock_value,
        below_reorder=below_reorder,
        pending_issues=pending_issues,
        recent_txns=[_txn_out(d) for d in recent],
    )
