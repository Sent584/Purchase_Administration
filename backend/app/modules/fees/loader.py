"""Load pending fee dues from the bundled dataset."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent / "data" / "fee_dues.json"


@lru_cache(maxsize=1)
def load_fee_rows() -> list[dict]:
    raw = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    table = raw.get("ds", {}).get("Table", [])
    if not isinstance(table, list):
        return []
    return [row for row in table if isinstance(row, dict)]
