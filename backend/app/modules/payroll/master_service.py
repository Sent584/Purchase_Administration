from datetime import date

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.payroll.helpers import oid, str_id
from app.modules.payroll.schemas import PayComponentOut, SalaryStructureOut


def _to_component(doc: dict) -> PayComponentOut:
    return PayComponentOut(**str_id(doc))


def _to_structure(doc: dict) -> SalaryStructureOut:
    data = str_id(doc, "institution_id")
    if isinstance(data.get("effective_from"), str):
        data["effective_from"] = date.fromisoformat(data["effective_from"])
    return SalaryStructureOut(**data)


async def list_components(db: AsyncIOMotorDatabase) -> list[PayComponentOut]:
    docs = await db["pay_components"].find().sort("code", 1).to_list(length=200)
    return [_to_component(d) for d in docs]


async def list_structures(
    db: AsyncIOMotorDatabase, institution_id: str | None = None
) -> list[SalaryStructureOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["salary_structures"].find(query).sort("effective_from", -1).to_list(length=500)
    return [_to_structure(d) for d in docs]
