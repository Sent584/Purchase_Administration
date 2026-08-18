from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.base_models import utcnow
from app.common.sequences import next_sequence
from app.modules.config_console.service import get_active_config


def _current_financial_year_label(month: int, year: int, fy_start_month: int) -> str:
    if month >= fy_start_month:
        start, end = year, year + 1
    else:
        start, end = year - 1, year
    return f"{start}-{str(end)[-2:]}"


async def generate_document_number(db: AsyncIOMotorDatabase, doc_type: str) -> str:
    """Builds a document number (PO/GRN/bill/etc.) from Global Configuration's document
    numbering policy — prefix, financial-year segment and zero-padding are all
    admin-configurable, never hardcoded into the module issuing the number."""
    config = await get_active_config(db)
    rule = config.document_numbering.get(doc_type)
    if rule is None:
        rule_prefix, use_fy, padding, separator = doc_type.upper()[:4], True, 4, "/"
    else:
        rule_prefix, use_fy, padding, separator = rule.prefix, rule.use_financial_year, rule.padding, rule.separator

    now = utcnow()
    seq_key = f"docnum:{doc_type}"
    if use_fy:
        fy_label = _current_financial_year_label(now.month, now.year, config.financial_year_start_month)
        seq_key = f"{seq_key}:{fy_label}"

    seq = await next_sequence(db, seq_key)

    parts = [rule_prefix]
    if use_fy:
        parts.append(fy_label)
    parts.append(str(seq).zfill(padding))
    return separator.join(parts)
