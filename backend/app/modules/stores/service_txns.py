from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.stores.helpers import oid, qty_delta
from app.modules.stores.schemas import StockTxnCreate, StockTxnOut, StockTxnStatus, StockTxnType
from app.modules.stores.service_balances import _apply_balance, _txn_out


def _org_oids(payload: StockTxnCreate) -> dict:
    return {
        "campus_id": oid(payload.campus_id, "campus_id") if payload.campus_id else None,
        "campus_name": payload.campus_name or "",
        "division_id": oid(payload.division_id, "division_id") if payload.division_id else None,
        "division_name": payload.division_name or "",
        "department_id": oid(payload.department_id, "department_id") if payload.department_id else None,
        "department_name": payload.department_name or "",
    }


async def post_transaction(db: AsyncIOMotorDatabase, payload: StockTxnCreate) -> StockTxnOut:
    if payload.quantity == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Quantity cannot be zero")
    if payload.txn_type != StockTxnType.ADJUSTMENT and payload.quantity < 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Quantity must be positive for this txn type")

    store = await db["stores"].find_one({"_id": oid(payload.store_id, "store_id")})
    if store is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Store not found")
    item = await db["items"].find_one({"_id": oid(payload.item_id, "item_id")})
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")

    to_store = None
    if payload.txn_type == StockTxnType.TRANSFER_OUT:
        if not payload.to_store_id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "to_store_id required for transfers")
        to_store = await db["stores"].find_one({"_id": oid(payload.to_store_id, "to_store_id")})
        if to_store is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination store not found")

    org = _org_oids(payload)
    if not org["campus_id"] and store.get("campus_id"):
        campus = await db["campuses"].find_one({"_id": store["campus_id"]})
        org["campus_id"] = store["campus_id"]
        org["campus_name"] = campus.get("name", "") if campus else ""

    delta = qty_delta(payload.txn_type, payload.quantity)
    allow_neg = payload.txn_type == StockTxnType.WRITE_OFF
    rate = payload.rate if payload.rate > 0 else float(item.get("standard_rate", 0))
    await _apply_balance(
        db, store=store, item=item, delta=delta, rate=rate, uom=payload.uom, allow_negative=allow_neg, org=org
    )

    if to_store is not None:
        await _apply_balance(
            db,
            store=to_store,
            item=item,
            delta=payload.quantity,
            rate=rate,
            uom=payload.uom,
            allow_negative=False,
            org=org,
        )

    seq = await next_sequence(db, "stock_txn")
    now = utcnow()
    amount = round(abs(payload.quantity) * rate, 2)
    doc = {
        "txn_number": f"STK-{seq:06d}",
        "store_id": store["_id"],
        "store_name": store.get("name", ""),
        "txn_type": payload.txn_type.value,
        "item_id": item["_id"],
        "item_code": item.get("code", ""),
        "item_name": item.get("name", ""),
        "quantity": payload.quantity,
        "uom": payload.uom or item.get("uom", "Nos"),
        "rate": rate,
        "amount": amount,
        "reference_type": payload.reference_type,
        "reference_id": payload.reference_id,
        "remarks": payload.remarks,
        "to_store_id": to_store["_id"] if to_store else None,
        "to_store_name": to_store.get("name") if to_store else None,
        **org,
        "issued_to": payload.issued_to,
        "status": StockTxnStatus.APPROVED.value if allow_neg else StockTxnStatus.POSTED.value,
        "institution_id": store["institution_id"],
        "created_at": now,
        "updated_at": now,
    }
    result = await db["stock_transactions"].insert_one(doc)
    doc["_id"] = result.inserted_id

    if to_store is not None:
        await _insert_mirror_transfer_in(db, source=doc, to_store=to_store, item=item, rate=rate, now=now)

    return _txn_out(doc)


async def _insert_mirror_transfer_in(
    db: AsyncIOMotorDatabase, *, source: dict, to_store: dict, item: dict, rate: float, now
) -> None:
    seq = await next_sequence(db, "stock_txn")
    mirror = {
        **{k: v for k, v in source.items() if k != "_id"},
        "txn_number": f"STK-{seq:06d}",
        "store_id": to_store["_id"],
        "store_name": to_store.get("name", ""),
        "txn_type": StockTxnType.TRANSFER_IN.value,
        "to_store_id": None,
        "to_store_name": None,
        "reference_type": "transfer",
        "reference_id": source["txn_number"],
        "created_at": now,
        "updated_at": now,
        "rate": rate,
        "item_code": item.get("code", ""),
        "item_name": item.get("name", ""),
    }
    await db["stock_transactions"].insert_one(mirror)
