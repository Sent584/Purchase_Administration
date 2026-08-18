from datetime import timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.modules.assets.helpers import oid
from app.modules.assets.schemas import AssetsDashboard, ClassCount, StatusCount


async def get_assets_dashboard(db: AsyncIOMotorDatabase, institution_id: str | None = None) -> AssetsDashboard:
    query: dict = {}
    if institution_id:
        query["institution_id"] = oid(institution_id, "institution_id")

    docs = await db["assets"].find(query).to_list(length=5000)
    total_cap = round(sum(float(d.get("capitalization_value") or 0) for d in docs), 2)
    total_book = round(sum(float(d.get("current_book_value") or 0) for d in docs), 2)

    by_class_map: dict[str, ClassCount] = {}
    by_status_map: dict[str, int] = {}
    for d in docs:
        cls = d.get("asset_class", "unknown")
        entry = by_class_map.get(cls)
        value = float(d.get("capitalization_value") or 0)
        if entry is None:
            by_class_map[cls] = ClassCount(asset_class=cls, count=1, total_value=value)
        else:
            entry.count += 1
            entry.total_value = round(entry.total_value + value, 2)
        st = d.get("status", "active")
        by_status_map[st] = by_status_map.get(st, 0) + 1

    horizon = utcnow() + timedelta(days=30)
    now = utcnow()

    def _expiring(field: str) -> int:
        count = 0
        for d in docs:
            if d.get("status") in ("disposed", "written_off"):
                continue
            expiry = d.get(field)
            if expiry and now <= expiry <= horizon:
                count += 1
        return count

    return AssetsDashboard(
        total_assets=len(docs),
        total_capitalization_value=total_cap,
        total_book_value=total_book,
        active_count=by_status_map.get("active", 0),
        under_repair_count=by_status_map.get("under_repair", 0),
        disposed_count=by_status_map.get("disposed", 0) + by_status_map.get("written_off", 0),
        warranty_expiring_30d=_expiring("warranty_expiry"),
        amc_expiring_30d=_expiring("amc_expiry"),
        by_class=sorted(by_class_map.values(), key=lambda c: c.count, reverse=True),
        by_status=[StatusCount(status=k, count=v) for k, v in sorted(by_status_map.items())],
    )
