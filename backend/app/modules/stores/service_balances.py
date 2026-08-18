from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.common.base_models import utcnow
from app.modules.purchase_common.org_scope import org_scope_strings
from app.modules.stores.helpers import oid
from app.modules.stores.schemas import StockBalanceOut, StockTxnOut, StockTxnStatus


def _txn_out(doc: dict) -> StockTxnOut:
    scope = org_scope_strings(doc)
    return StockTxnOut(
        id=str(doc["_id"]),
        txn_number=doc["txn_number"],
        store_id=str(doc["store_id"]),
        store_name=doc.get("store_name", ""),
        txn_type=doc["txn_type"],
        item_id=str(doc["item_id"]),
        item_code=doc.get("item_code", ""),
        item_name=doc.get("item_name", ""),
        quantity=doc["quantity"],
        uom=doc.get("uom", "Nos"),
        rate=doc.get("rate", 0),
        amount=doc.get("amount", 0),
        reference_type=doc.get("reference_type", ""),
        reference_id=doc.get("reference_id", ""),
        remarks=doc.get("remarks", ""),
        to_store_id=str(doc["to_store_id"]) if doc.get("to_store_id") else None,
        to_store_name=doc.get("to_store_name"),
        campus_id=scope["campus_id"],
        campus_name=scope["campus_name"],
        division_id=scope["division_id"],
        division_name=scope["division_name"],
        department_id=scope["department_id"],
        department_name=scope["department_name"],
        issued_to=doc.get("issued_to", ""),
        status=doc.get("status", StockTxnStatus.POSTED),
        institution_id=str(doc["institution_id"]),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def _balance_out(d: dict) -> StockBalanceOut:
    scope = org_scope_strings(d)
    return StockBalanceOut(
        item_id=str(d["item_id"]),
        item_code=d.get("item_code", ""),
        item_name=d.get("item_name", ""),
        store_id=str(d["store_id"]),
        store_name=d.get("store_name", ""),
        institution_id=str(d["institution_id"]),
        campus_id=scope["campus_id"],
        campus_name=scope["campus_name"],
        division_id=scope["division_id"],
        division_name=scope["division_name"],
        department_id=scope["department_id"],
        department_name=scope["department_name"],
        quantity=d.get("quantity", 0),
        uom=d.get("uom", "Nos"),
        reorder_level=d.get("reorder_level", 0),
        last_rate=d.get("last_rate", 0),
        valuation=round(d.get("quantity", 0) * d.get("last_rate", 0), 2),
    )


def _scope_query(
    *,
    campus_id: str | None = None,
    division_id: str | None = None,
    department_id: str | None = None,
) -> dict:
    query: dict = {}
    if campus_id:
        query["campus_id"] = oid(campus_id, "campus_id")
    if division_id:
        query["division_id"] = oid(division_id, "division_id")
    if department_id:
        query["department_id"] = oid(department_id, "department_id")
    return query


async def list_stock_balances(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    store_id: str | None = None,
    campus_id: str | None = None,
    division_id: str | None = None,
    department_id: str | None = None,
) -> list[StockBalanceOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if store_id:
        query["store_id"] = oid(store_id, "store_id")
    query.update(_scope_query(campus_id=campus_id, division_id=division_id, department_id=department_id))
    docs = await db["stock_balances"].find(query).sort("item_name", 1).to_list(length=2000)
    return [_balance_out(d) for d in docs]


async def list_transactions(
    db: AsyncIOMotorDatabase,
    institution_id: str | None = None,
    store_id: str | None = None,
    txn_type: str | None = None,
    campus_id: str | None = None,
    division_id: str | None = None,
    department_id: str | None = None,
) -> list[StockTxnOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if store_id:
        query["store_id"] = oid(store_id, "store_id")
    if txn_type:
        query["txn_type"] = txn_type
    query.update(_scope_query(campus_id=campus_id, division_id=division_id, department_id=department_id))
    docs = await db["stock_transactions"].find(query).sort("created_at", -1).to_list(length=500)
    return [_txn_out(d) for d in docs]


def balance_key(store_id, item_id, org: dict) -> dict:
    return {
        "store_id": store_id,
        "item_id": item_id,
        "campus_id": org.get("campus_id"),
        "division_id": org.get("division_id"),
        "department_id": org.get("department_id"),
    }


async def _apply_balance(
    db: AsyncIOMotorDatabase,
    *,
    store: dict,
    item: dict,
    delta: float,
    rate: float,
    uom: str,
    allow_negative: bool,
    org: dict | None = None,
) -> None:
    org = org or {}
    store_oid, item_oid = store["_id"], item["_id"]
    key = balance_key(store_oid, item_oid, org)
    bal = await db["stock_balances"].find_one(key)
    current = bal["quantity"] if bal else 0.0
    new_qty = round(current + delta, 4)
    if new_qty < 0 and not allow_negative:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Insufficient stock for {item.get('name')} (available {current})")
    now = utcnow()
    await db["stock_balances"].update_one(
        key,
        {
            "$set": {
                "quantity": new_qty,
                "uom": uom or item.get("uom", "Nos"),
                "last_rate": rate if rate > 0 else (bal.get("last_rate", 0) if bal else item.get("standard_rate", 0)),
                "reorder_level": item.get("reorder_level", 0),
                "item_code": item.get("code", ""),
                "item_name": item.get("name", ""),
                "store_name": store.get("name", ""),
                "institution_id": store["institution_id"],
                "campus_name": org.get("campus_name") or "",
                "division_name": org.get("division_name") or "",
                "department_name": org.get("department_name") or "",
                "updated_at": now,
            },
            "$setOnInsert": {
                **key,
                "created_at": now,
            },
        },
        upsert=True,
    )
