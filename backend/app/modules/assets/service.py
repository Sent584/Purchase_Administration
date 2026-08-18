"""Assets domain service facade — re-exports CRUD, transfer/dispose and dashboard."""

from app.modules.assets.service_actions import dispose_asset, transfer_asset
from app.modules.assets.service_crud import create_asset, get_asset, list_assets, update_asset
from app.modules.assets.service_dashboard import get_assets_dashboard
from app.modules.assets.service_procurement import get_asset_procurement

__all__ = [
    "create_asset",
    "list_assets",
    "get_asset",
    "update_asset",
    "transfer_asset",
    "dispose_asset",
    "get_assets_dashboard",
    "get_asset_procurement",
]
