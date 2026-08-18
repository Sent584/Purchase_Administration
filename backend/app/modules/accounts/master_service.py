from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.accounts.helpers import oid, str_id
from app.modules.accounts.schemas import AccountOut, BankAccountOut, BudgetOut, CostCentreOut


async def list_accounts(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[AccountOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["chart_of_accounts"].find(query).sort("code", 1).to_list(length=1000)
    return [AccountOut(**str_id(d, "institution_id")) for d in docs]


async def list_cost_centres(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[CostCentreOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["cost_centres"].find(query).sort("code", 1).to_list(length=500)
    return [CostCentreOut(**str_id(d, "institution_id", "campus_id")) for d in docs]


async def list_budgets(db: AsyncIOMotorDatabase, institution_id: str | None = None, fy: str | None = None) -> list[BudgetOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    if fy:
        query["fy"] = fy
    docs = await db["budgets"].find(query).sort("account_code", 1).to_list(length=1000)
    out = []
    for d in docs:
        data = str_id(d, "institution_id")
        allocated = float(data.get("allocated", 0))
        committed = float(data.get("committed", 0))
        actual = float(data.get("actual", 0))
        data["available"] = round(allocated - committed - actual, 2)
        out.append(BudgetOut(**data))
    return out


async def list_banks(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> list[BankAccountOut]:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")
    docs = await db["bank_accounts_finance"].find(query).sort("bank_name", 1).to_list(length=100)
    return [BankAccountOut(**str_id(d, "institution_id")) for d in docs]
