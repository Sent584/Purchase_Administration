from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.modules.stores.schemas import StockTxnType

INBOUND_TYPES = {
    StockTxnType.OPENING,
    StockTxnType.ISSUE_RETURN,
    StockTxnType.TRANSFER_IN,
    StockTxnType.GRN_RECEIPT,
}
OUTBOUND_TYPES = {
    StockTxnType.ISSUE,
    StockTxnType.TRANSFER_OUT,
    StockTxnType.WRITE_OFF,
}


def oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def qty_delta(txn_type: StockTxnType, quantity: float) -> float:
    """Signed stock change: positive increases on-hand, negative decreases."""
    if txn_type in INBOUND_TYPES:
        return quantity
    if txn_type in OUTBOUND_TYPES:
        return -quantity
    if txn_type == StockTxnType.ADJUSTMENT:
        return quantity
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Unsupported txn type: {txn_type}")


def permission_for_txn(txn_type: StockTxnType) -> str:
    if txn_type in {StockTxnType.ISSUE, StockTxnType.ISSUE_RETURN, StockTxnType.TRANSFER_OUT, StockTxnType.TRANSFER_IN}:
        return "stores:issue"
    if txn_type in {StockTxnType.ADJUSTMENT, StockTxnType.WRITE_OFF}:
        return "stores:adjust"
    return "stores:write"
