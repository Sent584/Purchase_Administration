from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.accounts.helpers import oid
from app.modules.accounts.schemas import AccountsDashboard, VoucherStatus


async def get_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> AccountsDashboard:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")

    banks = await db["bank_accounts_finance"].find(query).to_list(length=100)
    cash_position = round(sum(float(b.get("current_balance", 0)) for b in banks), 2)

    budgets = await db["budgets"].find(query).to_list(length=1000)
    allocated = sum(float(b.get("allocated", 0)) for b in budgets) or 1.0
    utilised = sum(float(b.get("committed", 0)) + float(b.get("actual", 0)) for b in budgets)

    vouchers = await db["vouchers"].find(query).to_list(length=5000)
    pending = sum(1 for v in vouchers if v["status"] in (VoucherStatus.DRAFT.value, VoucherStatus.VALIDATED.value, VoucherStatus.APPROVED.value))
    posted = sum(1 for v in vouchers if v["status"] == VoucherStatus.POSTED.value)

    return AccountsDashboard(
        cash_position=cash_position,
        budget_utilised_pct=round(100.0 * utilised / allocated, 1),
        pending_vouchers=pending,
        posted_vouchers=posted,
        bank_accounts=len(banks),
        fy_label="2025-26",
    )
