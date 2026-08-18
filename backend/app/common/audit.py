from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow


async def record_audit_event(
    db: AsyncIOMotorDatabase,
    *,
    actor_id: str | None,
    actor_email: str | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await db["audit_logs"].insert_one(
        {
            "actor_id": actor_id,
            "actor_email": actor_email,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "before": before,
            "after": after,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": metadata or {},
            "at": utcnow(),
        }
    )
