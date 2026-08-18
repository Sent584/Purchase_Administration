"""Role home builders — purchase, stores, assets."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.dashboard import metrics as m
from app.modules.dashboard.helpers import ROLE_LABELS, format_compact, format_inr
from app.modules.dashboard.schemas import (
    HomeAction,
    HomeInsight,
    HomeKpi,
    HomeQuickLink,
    HomeSeriesPoint,
    RoleHomeDashboard,
)


async def build_purchase_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    purchase = await m.purchase_pipeline(db, institution_id)
    stores = await m.stores_snapshot(db, institution_id)
    return RoleHomeDashboard(
        role_code="purchase_officer",
        role_label=ROLE_LABELS["purchase_officer"],
        eyebrow="Procure-to-pay",
        title="Purchase Operations Desk",
        subtitle="Indent → RFQ → award → PO → GRN → bill — quotation-based buying for Sasurie labs and offices.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="vend", label="Vendors", value=str(purchase["vendors"]), tone="crimson"),
            HomeKpi(key="ind", label="Open indents", value=str(purchase["open_indents"]), tone="sky"),
            HomeKpi(key="rfq", label="Pending award", value=str(purchase["pending_award"]), tone="gold"),
            HomeKpi(key="grn", label="Awaiting GRN", value=str(purchase["awaiting_grn"]), tone="amber"),
            HomeKpi(key="bill", label="Bills pending", value=str(purchase["bills_pending"]), tone="emerald"),
            HomeKpi(key="spend", label="PO spend", value=format_compact(float(purchase["po_spend"])), tone="ink"),
        ],
        series_title="Pipeline stages",
        series_unit="docs",
        series=[
            HomeSeriesPoint(label="Indents", value=float(purchase["open_indents"])),
            HomeSeriesPoint(label="RFQs", value=float(purchase["pending_award"])),
            HomeSeriesPoint(label="POs", value=float(purchase["po_count"])),
            HomeSeriesPoint(label="Await GRN", value=float(purchase["awaiting_grn"])),
            HomeSeriesPoint(label="Bills", value=float(purchase["bills_pending"])),
        ],
        actions=[
            HomeAction(title="Raise indent", detail="Department / lab consumable demand", href="/purchase/indents", urgency="medium", badge="Indent"),
            HomeAction(title="Compare quotations", detail=f"{purchase['pending_award']} RFQs to evaluate", href="/purchase/quotations", urgency="high", badge="RFQ"),
            HomeAction(title="Issue POs", detail=f"{purchase['awaiting_grn']} orders awaiting receipt", href="/purchase/orders", urgency="medium", badge="PO"),
            HomeAction(title="Record GRN", detail="Link receipts to central stores", href="/purchase/grn", urgency="high" if purchase["awaiting_grn"] else "low", badge="GRN"),
        ],
        insights=[
            HomeInsight(title="MSME clock", description="Udyam vendors tracked for payment SLA.", icon="clock"),
            HomeInsight(title="GST & TDS", description="Vendor masters carry GSTIN and 194Q/194C.", icon="file"),
            HomeInsight(title="Stores link", description=f"Stock value {format_compact(stores['value'])} after issues/receipts.", icon="box"),
        ],
        quick_links=[
            HomeQuickLink(to="/purchase", label="Purchase home", hint="Full P2P analytics"),
            HomeQuickLink(to="/purchase/vendors", label="Vendors", hint="MSME · GST masters"),
            HomeQuickLink(to="/purchase/catalog", label="Catalog", hint="Items & HSN"),
            HomeQuickLink(to="/stores", label="Stores", hint="Stock after GRN"),
        ],
        highlight_label="PO spend",
        highlight_value=format_inr(float(purchase["po_spend"])),
        highlight_hint=f"{purchase['po_count']} purchase orders in register",
    )


async def build_stores_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    stores = await m.stores_snapshot(db, institution_id)
    purchase = await m.purchase_pipeline(db, institution_id)
    return RoleHomeDashboard(
        role_code="stores_officer",
        role_label=ROLE_LABELS["stores_officer"],
        eyebrow="Central stores",
        title="Inventory Command Desk",
        subtitle="Multi-store balances, reorder alerts, issues to labs and GRN put-away for Sasurie.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="st", label="Stores", value=str(stores["stores"]), tone="crimson"),
            HomeKpi(key="sku", label="SKU balances", value=str(stores["sku"]), tone="sky"),
            HomeKpi(key="val", label="Stock value", value=format_compact(stores["value"]), tone="gold"),
            HomeKpi(key="ro", label="Below reorder", value=str(stores["below_reorder"]), tone="amber"),
            HomeKpi(key="txn", label="Stock txns", value=str(stores["txns"]), tone="emerald"),
            HomeKpi(key="grn", label="Awaiting GRN", value=str(purchase["awaiting_grn"]), tone="ink"),
        ],
        series_title="Value by store",
        series_unit="₹",
        series=[HomeSeriesPoint(label=str(k)[:18], value=v) for k, v in stores["by_store"]],
        actions=[
            HomeAction(title="Reorder alerts", detail=f"{stores['below_reorder']} items need replenishment", href="/stores", urgency="high" if stores["below_reorder"] else "low", badge="Alert"),
            HomeAction(title="Issue to dept", detail="Post issues against lab indents", href="/stores", urgency="medium", badge="Issue"),
            HomeAction(title="Put away GRN", detail=f"{purchase['awaiting_grn']} POs awaiting receipt", href="/purchase/grn", urgency="medium", badge="GRN"),
            HomeAction(title="Store masters", detail="Central, CSE lab, hostel, sports…", href="/stores", urgency="low", badge="Master"),
        ],
        insights=[
            HomeInsight(title="FIFO valuation", description="Issues use last rate × qty for demo valuation.", icon="chart"),
            HomeInsight(title="Lab stores", description="CSE / Mech stores hold consumables separately.", icon="box"),
            HomeInsight(title="Purchase handoff", description="GRN posts increase store balances.", icon="cart"),
        ],
        quick_links=[
            HomeQuickLink(to="/stores", label="Stores home", hint="KPIs & alerts"),
            HomeQuickLink(to="/stores", label="Ledger", hint="Issues · receipts"),
            HomeQuickLink(to="/purchase/catalog", label="Catalog", hint="Item masters"),
            HomeQuickLink(to="/assets", label="Assets", hint="Capital items"),
        ],
        highlight_label="Inventory value",
        highlight_value=format_inr(stores["value"]),
        highlight_hint=f"{stores['sku']} SKU lines across {stores['stores']} stores",
    )


async def build_assets_home(db: AsyncIOMotorDatabase, *, name: str, institution_id: str | None) -> RoleHomeDashboard:
    assets = await m.assets_snapshot(db, institution_id)
    return RoleHomeDashboard(
        role_code="asset_officer",
        role_label=ROLE_LABELS["asset_officer"],
        eyebrow="Fixed assets",
        title="Asset Register Desk",
        subtitle="Capitalisation, location transfers, disposal and class-wise book value for Sasurie campuses.",
        greeting_name=name,
        kpis=[
            HomeKpi(key="n", label="Assets", value=str(assets["count"]), tone="crimson"),
            HomeKpi(key="bv", label="Book value", value=format_compact(assets["book"]), tone="gold"),
            HomeKpi(key="cls", label="Classes tracked", value=str(len(assets["by_class"])), tone="sky"),
            HomeKpi(key="top", label="Top class", value=(assets["by_class"][0][0][:14] if assets["by_class"] else "—"), tone="emerald"),
            HomeKpi(key="cnt", label="Top class qty", value=str(assets["by_class"][0][1] if assets["by_class"] else 0), tone="amber"),
            HomeKpi(key="reg", label="Register", value="Live", tone="ink"),
        ],
        series_title="Assets by class",
        series_unit="nos",
        series=[HomeSeriesPoint(label=k[:20], value=float(v)) for k, v in assets["by_class"]],
        actions=[
            HomeAction(title="Asset register", detail="Search, filter and open asset cards", href="/assets/register", urgency="medium", badge="Reg"),
            HomeAction(title="Transfer location", detail="Move assets across labs / blocks", href="/assets", urgency="medium", badge="Move"),
            HomeAction(title="Dispose assets", detail="Write-off with approval trail", href="/assets", urgency="low", badge="Dispose"),
            HomeAction(title="Stores capital", detail="Capital catalog items → asset candidates", href="/stores", urgency="low", badge="Link"),
        ],
        insights=[
            HomeInsight(title="Lab equipment", description="Oscilloscopes, PLC trainers, CNC tracked as assets.", icon="server"),
            HomeInsight(title="Transport & plant", description="College buses and DG sets on register.", icon="building"),
            HomeInsight(title="Verification ready", description="Physical verification workflows from register.", icon="shield"),
        ],
        quick_links=[
            HomeQuickLink(to="/assets", label="Assets home", hint="KPIs & classes"),
            HomeQuickLink(to="/assets/register", label="Register", hint="Full list"),
            HomeQuickLink(to="/stores", label="Stores", hint="Capital stock"),
            HomeQuickLink(to="/purchase", label="Purchase", hint="Capital POs"),
        ],
        highlight_label="Book value",
        highlight_value=format_inr(assets["book"]),
        highlight_hint=f"{assets['count']} capitalised assets on register",
    )
