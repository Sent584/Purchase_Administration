from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status


def oid(value: str, label: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid {label}: {value}")


def str_id(doc: dict, *oid_fields: str) -> dict:
    data = {**doc, "id": str(doc["_id"])}
    data.pop("_id")
    for field in oid_fields:
        if field in data and data[field] is not None:
            data[field] = str(data[field])
    return data
