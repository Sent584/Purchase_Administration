import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import close_db, get_db
from app.modules.accounts.router import router as accounts_router
from app.modules.assets.router import router as assets_router
from app.modules.attendance.router import router as attendance_router
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.config_console.router import router as config_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.executive.router import router as executive_router
from app.modules.fees.router import router as fees_router
from app.modules.grn.router import router as grn_router
from app.modules.hr.router import router as hr_router
from app.modules.indents.router import router as indents_router
from app.modules.org.router import router as org_router
from app.modules.payroll.router import router as payroll_router
from app.modules.purchase_bills.router import router as purchase_bills_router
from app.modules.purchase_orders.router import router as purchase_orders_router
from app.modules.quotations.router import router as quotations_router
from app.modules.rbac.router import router as rbac_router
from app.modules.rbac.service import seed_system_roles
from app.modules.stores.router import router as stores_router
from app.modules.vendors.router import router as vendors_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sasurie")


async def ensure_indexes() -> None:
    db = get_db()
    await db["users"].create_index("email", unique=True)
    await db["otp_challenges"].create_index("expires_at", expireAfterSeconds=86400)
    await db["sessions"].create_index("user_id")
    await db["sessions"].create_index("expires_at", expireAfterSeconds=86400)
    await db["login_history"].create_index([("user_id", 1), ("at", -1)])
    await db["audit_logs"].create_index([("entity_type", 1), ("entity_id", 1), ("at", -1)])
    await db["groups"].create_index("org_code", unique=True)
    await db["institutions"].create_index("code", unique=True)
    await db["institutions"].create_index("group_id")
    await db["campuses"].create_index("code", unique=True)
    await db["campuses"].create_index("institution_id")
    await db["org_units"].create_index("code", unique=True)
    await db["org_units"].create_index("campus_id")
    await db["org_units"].create_index("parent_id")
    await db["roles"].create_index("code", unique=True)
    await db["vendors"].create_index("code", unique=True)
    await db["vendors"].create_index("institution_id")
    await db["items"].create_index("code", unique=True)
    await db["items"].create_index("institution_id")
    await db["indents"].create_index("indent_number", unique=True)
    await db["indents"].create_index("institution_id")
    await db["quotations"].create_index("rfq_number", unique=True)
    await db["quotations"].create_index("indent_id")
    await db["purchase_orders"].create_index("po_number", unique=True)
    await db["purchase_orders"].create_index("institution_id")
    await db["purchase_orders"].create_index("quotation_id")
    await db["grns"].create_index("grn_number", unique=True)
    await db["grns"].create_index("po_id")
    await db["purchase_bills"].create_index("bill_number", unique=True)
    await db["purchase_bills"].create_index("grn_id", unique=True)
    await db["stores"].create_index("code", unique=True)
    await db["stores"].create_index("institution_id")
    await db["stock_balances"].create_index([("store_id", 1), ("item_id", 1)], unique=True)
    await db["stock_transactions"].create_index("txn_number", unique=True)
    await db["assets"].create_index("asset_code", unique=True)
    await db["assets"].create_index("institution_id")
    await db["asset_movements"].create_index("asset_id")
    await db["employees"].create_index("employee_code", unique=True)
    await db["employees"].create_index("official_email", unique=True)
    await db["employees"].create_index("institution_id")
    await db["designations"].create_index([("institution_id", 1), ("code", 1)], unique=True)
    await db["shifts"].create_index([("institution_id", 1), ("code", 1)], unique=True)
    await db["attendance_records"].create_index([("employee_id", 1), ("date", 1)], unique=True)
    await db["leave_applications"].create_index("employee_id")
    await db["leave_balances"].create_index([("employee_id", 1), ("leave_type_code", 1), ("year", 1)], unique=True)
    await db["payroll_runs"].create_index([("institution_id", 1), ("period_year", 1), ("period_month", 1)], unique=True)
    await db["payslips"].create_index("payroll_run_id")
    await db["chart_of_accounts"].create_index([("institution_id", 1), ("code", 1)], unique=True)
    await db["vouchers"].create_index("voucher_number", unique=True)
    await db["budgets"].create_index([("institution_id", 1), ("fy", 1), ("account_code", 1), ("cost_centre_code", 1)])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Sasurie ERP API — connecting to MongoDB and ensuring indexes")
    await ensure_indexes()
    await seed_system_roles(get_db())
    yield
    await close_db()


settings = get_settings()

app = FastAPI(
    title="Sasurie ERP API",
    description="Sasurie Group of Institutions — Enterprise Resource Planning platform API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(executive_router)
app.include_router(fees_router)
app.include_router(org_router)
app.include_router(config_router)
app.include_router(rbac_router)
app.include_router(vendors_router)
app.include_router(catalog_router)
app.include_router(indents_router)
app.include_router(quotations_router)
app.include_router(purchase_orders_router)
app.include_router(grn_router)
app.include_router(purchase_bills_router)
app.include_router(stores_router)
app.include_router(assets_router)
app.include_router(hr_router)
app.include_router(attendance_router)
app.include_router(payroll_router)
app.include_router(accounts_router)


@app.get("/api/v1/health", tags=["System"])
async def health():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
