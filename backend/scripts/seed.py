"""Seeds realistic Sasurie Group of Institutions sample data.

Safe to re-run: every create step first checks whether the record already
exists (by its unique code) and reuses it instead of failing, so this script
can be run again after adding more seed data later without duplicating
everything created so far.

Usage:
    ./venv/bin/python scripts/seed.py
"""

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from fastapi import HTTPException

from app.core.database import close_db, get_db
from app.main import ensure_indexes
from app.modules.auth.schemas import LoginMethod, UserCreate
from app.modules.auth.service import create_user
from app.modules.catalog.schemas import ItemCreate
from app.modules.catalog.service import create_item
from app.modules.grn.schemas import GrnCreate, GrnLineInput
from app.modules.grn.service import create_grn
from app.modules.indents.schemas import IndentAttachment, IndentCreate, IndentLine, IndentPriority, IndentPurpose
from app.modules.indents.service import approve_indent, create_indent, submit_indent
from app.modules.org.schemas import (
    Address,
    CampusContacts,
    CampusCreate,
    GroupCreate,
    InstitutionCreate,
    OrgUnitCreate,
    OrgUnitType,
)
from app.modules.org.service import create_campus, create_group, create_institution, create_org_unit
from app.modules.purchase_bills.schemas import PurchaseBillCreate
from app.modules.purchase_bills.service import approve_bill, create_bill
from app.modules.purchase_orders.schemas import PurchaseOrderFromQuotation
from app.modules.purchase_orders.service import create_po_from_quotation, issue_purchase_order
from app.modules.quotations.schemas import ProcurementMethod, QuotationCreate, QuoteLine, VendorQuoteInput
from app.modules.quotations.service import award_quotation, create_quotation, get_comparative_statement, record_vendor_quote
from app.modules.rbac.service import seed_system_roles
from app.modules.vendors.schemas import (
    Address as VendorAddress,
    BankAccount,
    GstRegistrationType,
    TdsSection,
    VendorCategory,
    VendorCreate,
    VendorDocument,
)
from app.modules.vendors.service import create_vendor


def dt(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, tzinfo=timezone.utc)


async def get_or_create_group(db, payload: GroupCreate):
    existing = await db["groups"].find_one({"org_code": payload.org_code})
    if existing:
        print(f"  ~ group '{payload.org_code}' already exists, reusing")
        return str(existing["_id"])
    out = await create_group(db, payload)
    print(f"  + created group '{out.org_code}'")
    return out.id


async def get_or_create_institution(db, payload: InstitutionCreate):
    existing = await db["institutions"].find_one({"code": payload.code})
    if existing:
        print(f"  ~ institution '{payload.code}' already exists, reusing")
        return str(existing["_id"])
    out = await create_institution(db, payload)
    print(f"  + created institution '{out.code}' — {out.name}")
    return out.id


async def get_or_create_campus(db, payload: CampusCreate):
    existing = await db["campuses"].find_one({"code": payload.code})
    if existing:
        print(f"  ~ campus '{payload.code}' already exists, reusing")
        return str(existing["_id"])
    out = await create_campus(db, payload)
    print(f"  + created campus '{out.code}' — {out.name}")
    return out.id


async def get_or_create_unit(db, payload: OrgUnitCreate):
    existing = await db["org_units"].find_one({"code": payload.code})
    if existing:
        return str(existing["_id"])
    out = await create_org_unit(db, payload)
    print(f"  + created org unit '{out.code}' — {out.name}")
    return out.id


async def get_or_create_vendor(db, payload: VendorCreate):
    existing = await db["vendors"].find_one({"gstin": payload.gstin, "institution_id": {"$exists": True}}) if payload.gstin else None
    if existing is None:
        existing = await db["vendors"].find_one({"trade_name": payload.trade_name})
    if existing:
        print(f"  ~ vendor '{payload.trade_name}' already exists, reusing")
        return str(existing["_id"])
    out = await create_vendor(db, payload)
    print(f"  + created vendor '{out.code}' — {out.trade_name}")
    return out.id


async def get_or_create_item(db, payload: ItemCreate):
    existing = await db["items"].find_one({"name": payload.name, "institution_id": {"$exists": True}})
    if existing:
        print(f"  ~ item '{payload.name}' already exists, reusing")
        return str(existing["_id"])
    out = await create_item(db, payload)
    print(f"  + created item '{out.code}' — {out.name}")
    return out.id


async def get_or_create_user(db, payload: UserCreate, role_code: str):
    existing = await db["users"].find_one({"email": payload.email.lower()})
    if existing:
        print(f"  ~ user '{payload.email}' already exists, reusing")
        return
    role = await db["roles"].find_one({"code": role_code})
    payload.role_ids = [str(role["_id"])] if role else []
    try:
        out = await create_user(db, payload)
        print(f"  + created user '{out.email}' [{role_code}]")
    except HTTPException as exc:
        print(f"  ! failed to create user '{payload.email}': {exc.detail}")


async def main():
    db = get_db()
    await ensure_indexes()
    await seed_system_roles(db)
    print("System roles ensured.")

    # ---------------------------------------------------------------- Group
    group_id = await get_or_create_group(
        db,
        GroupCreate(
            legal_name="Sasurie Educational Trust",
            trade_name="Sasurie Group of Institutions",
            org_code="SASURIE",
            org_type="trust",
            registration_number="TN/EDU/TRUST/1998/00214",
            registration_date=dt(1998, 4, 1),
            pan="AABTS1234C",
            tan="CHES12345D",
            gstins=["33AABTS1234C1Z5"],
            address=Address(
                line1="Sasurie Campus, Vijayamangalam Road",
                line2="Sasurie Nagar",
                city="Tiruppur",
                district="Tiruppur",
                state="Tamil Nadu",
                pincode="638056",
            ),
            website="https://www.sasurie.edu.in",
            established_date=dt(1998, 6, 1),
        ),
    )

    # --------------------------------------------------------- Institutions
    sae_id = await get_or_create_institution(
        db,
        InstitutionCreate(
            group_id=group_id,
            code="SAE",
            name="Sasurie Academy of Engineering",
            short_name="SAE",
            institution_type="engineering_college",
            university_affiliation="Anna University, Chennai",
            autonomous_status=True,
            aicte_approved=True,
            ugc_recognized=True,
            naac_grade="A",
            naac_cycle="3rd Cycle (2023-2028)",
            nba_programmes=["Computer Science and Engineering", "Electronics and Communication Engineering", "Mechanical Engineering"],
            establishment_date=dt(1999, 7, 15),
            principal_name="Dr. R. Venkatesan",
            address=Address(
                line1="Sasurie Academy of Engineering Campus",
                line2="NH-544, Vijayamangalam",
                city="Coimbatore",
                district="Coimbatore",
                state="Tamil Nadu",
                pincode="641062",
            ),
            gstin="33AABTS1234C1Z5",
            pan="AABTS1234C",
            tan="CHES12345D",
            website="https://www.sae.sasurie.edu.in",
        ),
    )

    scas_id = await get_or_create_institution(
        db,
        InstitutionCreate(
            group_id=group_id,
            code="SCAS",
            name="Sasurie College of Arts and Science",
            short_name="SCAS",
            institution_type="arts_science_college",
            university_affiliation="Bharathiar University, Coimbatore",
            autonomous_status=False,
            aicte_approved=False,
            ugc_recognized=True,
            naac_grade="B++",
            naac_cycle="2nd Cycle (2022-2027)",
            establishment_date=dt(2005, 6, 1),
            principal_name="Dr. K. Meenakshi",
            address=Address(
                line1="Sasurie College of Arts and Science Campus",
                line2="Palladam Road",
                city="Tiruppur",
                district="Tiruppur",
                state="Tamil Nadu",
                pincode="641652",
            ),
            gstin="33AABTS1234C2Z4",
            pan="AABTS1234C",
            tan="CHES12345D",
            website="https://www.scas.sasurie.edu.in",
        ),
    )

    # -------------------------------------------------------------- Campuses
    sae_cbe_id = await get_or_create_campus(
        db,
        CampusCreate(
            institution_id=sae_id,
            code="SAE-CBE",
            name="SAE Coimbatore Main Campus",
            campus_type="main",
            address=Address(line1="NH-544, Vijayamangalam", city="Coimbatore", district="Coimbatore", state="Tamil Nadu", pincode="641062"),
            geo_lat=11.0168,
            geo_lng=76.9558,
            geo_fence_radius_m=500,
            contacts=CampusContacts(
                head="Dr. R. Venkatesan",
                admin_officer="Mr. S. Kumaresan",
                finance_officer="Mrs. P. Lakshmi",
                hr_officer="Mr. A. Rajendran",
                purchase_officer="Mr. T. Selvam",
                stores_officer="Mr. M. Karthik",
            ),
        ),
    )

    sae_tup_id = await get_or_create_campus(
        db,
        CampusCreate(
            institution_id=sae_id,
            code="SAE-TUP",
            name="SAE Tiruppur Extension Campus",
            campus_type="satellite",
            address=Address(line1="Avinashi Road", city="Tiruppur", district="Tiruppur", state="Tamil Nadu", pincode="641602"),
            geo_lat=11.1085,
            geo_lng=77.3411,
            geo_fence_radius_m=300,
            contacts=CampusContacts(head="Dr. N. Balasubramaniam"),
        ),
    )

    scas_tup_id = await get_or_create_campus(
        db,
        CampusCreate(
            institution_id=scas_id,
            code="SCAS-TUP",
            name="SCAS Tiruppur Main Campus",
            campus_type="main",
            address=Address(line1="Palladam Road", city="Tiruppur", district="Tiruppur", state="Tamil Nadu", pincode="641652"),
            geo_lat=11.0940,
            geo_lng=77.3152,
            geo_fence_radius_m=400,
            contacts=CampusContacts(
                head="Dr. K. Meenakshi",
                admin_officer="Mr. V. Saravanan",
                finance_officer="Mrs. R. Gowri",
                hr_officer="Mrs. S. Anitha",
            ),
        ),
    )

    # ------------------------------------------------------------ Org Units
    sae_departments = [
        ("SAE-CBE-CSE", "Department of Computer Science and Engineering", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-ECE", "Department of Electronics and Communication Engineering", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-EEE", "Department of Electrical and Electronics Engineering", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-MECH", "Department of Mechanical Engineering", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-CIVIL", "Department of Civil Engineering", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-IT", "Department of Information Technology", OrgUnitType.DEPARTMENT, True),
        ("SAE-CBE-FIN", "Finance Office", OrgUnitType.OFFICE, False),
        ("SAE-CBE-HR", "Human Resources Office", OrgUnitType.OFFICE, False),
        ("SAE-CBE-PUR", "Purchase Office", OrgUnitType.OFFICE, False),
        ("SAE-CBE-STORE", "Central Stores", OrgUnitType.STORE, False),
        ("SAE-CBE-LIB", "Central Library", OrgUnitType.LIBRARY, False),
        ("SAE-CBE-HOSTEL-B", "Boys Hostel", OrgUnitType.HOSTEL, False),
        ("SAE-CBE-HOSTEL-G", "Girls Hostel", OrgUnitType.HOSTEL, False),
        ("SAE-CBE-PLACE", "Training and Placement Cell", OrgUnitType.CELL, False),
    ]
    for code, name, unit_type, is_academic in sae_departments:
        await get_or_create_unit(
            db,
            OrgUnitCreate(campus_id=sae_cbe_id, code=code, name=name, unit_type=unit_type, is_academic=is_academic),
        )
    cse_unit_id = await get_or_create_unit(
        db,
        OrgUnitCreate(campus_id=sae_cbe_id, code="SAE-CBE-CSE", name="Department of Computer Science and Engineering", unit_type=OrgUnitType.DEPARTMENT, is_academic=True),
    )

    scas_departments = [
        ("SCAS-TUP-CS", "Department of Computer Science", OrgUnitType.DEPARTMENT, True),
        ("SCAS-TUP-COM", "Department of Commerce", OrgUnitType.DEPARTMENT, True),
        ("SCAS-TUP-BBA", "Department of Business Administration", OrgUnitType.DEPARTMENT, True),
        ("SCAS-TUP-ENG", "Department of English", OrgUnitType.DEPARTMENT, True),
        ("SCAS-TUP-MATH", "Department of Mathematics", OrgUnitType.DEPARTMENT, True),
        ("SCAS-TUP-FIN", "Finance Office", OrgUnitType.OFFICE, False),
        ("SCAS-TUP-HR", "Human Resources Office", OrgUnitType.OFFICE, False),
        ("SCAS-TUP-LIB", "Central Library", OrgUnitType.LIBRARY, False),
        ("SCAS-TUP-HOSTEL-G", "Girls Hostel", OrgUnitType.HOSTEL, False),
    ]
    for code, name, unit_type, is_academic in scas_departments:
        await get_or_create_unit(
            db,
            OrgUnitCreate(campus_id=scas_tup_id, code=code, name=name, unit_type=unit_type, is_academic=is_academic),
        )

    # ------------------------------------------------------------- Users
    demo_password = "Sasurie@123"

    await get_or_create_user(
        db,
        UserCreate(
            email="superadmin@sasurie.edu.in",
            full_name="System Administrator",
            password=demo_password,
            group_id=group_id,
            must_change_password=False,
        ),
        role_code="super_admin",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="chairman@sasurie.edu.in",
            full_name="Chairman — Sasurie Group",
            password=demo_password,
            group_id=group_id,
            must_change_password=False,
        ),
        role_code="chairman",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="admin.sae@sasurie.edu.in",
            full_name="S. Kumaresan",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="institution_admin",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="principal.sae@sasurie.edu.in",
            full_name="Dr. R. Venkatesan",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="principal",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="hr.sae@sasurie.edu.in",
            full_name="A. Rajendran",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="hr_manager",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="finance.sae@sasurie.edu.in",
            full_name="P. Lakshmi",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="finance_officer",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="admin.scas@sasurie.edu.in",
            full_name="V. Saravanan",
            password=demo_password,
            group_id=group_id,
            institution_id=scas_id,
            must_change_password=False,
        ),
        role_code="institution_admin",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="principal.scas@sasurie.edu.in",
            full_name="Dr. K. Meenakshi",
            password=demo_password,
            group_id=group_id,
            institution_id=scas_id,
            must_change_password=False,
        ),
        role_code="principal",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="employee.demo@sasurie.edu.in",
            full_name="Priya Ramasamy",
            password="Welcome@2026",
            group_id=group_id,
            institution_id=sae_id,
            campus_id=sae_cbe_id,
            department_id=cse_unit_id,
            login_method=LoginMethod.OTP_ONLY,
            must_change_password=True,
        ),
        role_code="employee",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="purchase.sae@sasurie.edu.in",
            full_name="T. Selvam",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="purchase_officer",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="stores.sae@sasurie.edu.in",
            full_name="K. Murugan",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="stores_officer",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="assets.sae@sasurie.edu.in",
            full_name="S. Kalpana",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="asset_officer",
    )

    await get_or_create_user(
        db,
        UserCreate(
            email="payroll.sae@sasurie.edu.in",
            full_name="R. Natarajan",
            password=demo_password,
            group_id=group_id,
            institution_id=sae_id,
            must_change_password=False,
        ),
        role_code="payroll_officer",
    )

    # --------------------------------------------------- Purchase & Procurement
    print("\nSeeding Purchase & Procurement demo cycle...")
    if await db["purchase_orders"].count_documents({"institution_id": ObjectId(sae_id)}) > 0:
        print("  ~ SAE already has purchase orders, skipping procurement demo cycle")
    else:
        vendor_a_id = await get_or_create_vendor(
            db,
            VendorCreate(
                institution_id=sae_id,
                legal_name="Chennai Computers Private Limited",
                trade_name="Chennai Computers Pvt Ltd",
                vendor_category=VendorCategory.GOODS,
                gst_registration_type=GstRegistrationType.REGULAR,
                gstin="33AAFCC1234D1Z8",
                pan="AAFCC1234D",
                msme_registered=True,
                udyam_number="UDYAM-TN-27-0012345",
                tds_section=TdsSection.S194Q,
                address=VendorAddress(line1="No. 45, Anna Salai", city="Chennai", state="Tamil Nadu", pincode="600002"),
                contact_person="Mr. R. Suresh",
                contact_phone="+91-98400-12345",
                contact_email="sales@chennaicomputers.example",
                secondary_contact_person="Ms. P. Vaishnavi",
                secondary_contact_phone="+91-98400-54321",
                credit_period_days=30,
                delivery_lead_time_days=15,
                quality_certifications=["ISO 9001:2015", "Authorised Dell Partner"],
                bank_account=BankAccount(account_holder="Chennai Computers Pvt Ltd", account_number="0123456789012", ifsc_code="HDFC0001234", bank_name="HDFC Bank", branch="Anna Salai"),
                product_categories=["Computers", "IT Peripherals", "Networking"],
                documents=[
                    VendorDocument(name="GST Registration Certificate", doc_type="gst_certificate", reference_number="33AAFCC1234D1Z8", issued_date=dt(2019, 7, 1)),
                    VendorDocument(name="Udyam MSME Certificate", doc_type="udyam_certificate", reference_number="UDYAM-TN-27-0012345", issued_date=dt(2021, 3, 15)),
                ],
                empanelment_valid_from=dt(2024, 4, 1),
                empanelment_valid_to=dt(2027, 3, 31),
            ),
        )
        vendor_b_id = await get_or_create_vendor(
            db,
            VendorCreate(
                institution_id=sae_id,
                legal_name="Kovai Systems and Solutions",
                trade_name="Kovai Systems & Solutions",
                vendor_category=VendorCategory.GOODS,
                gst_registration_type=GstRegistrationType.REGULAR,
                gstin="33AABFK5678E1Z2",
                pan="AABFK5678E",
                msme_registered=True,
                udyam_number="UDYAM-TN-27-0067890",
                tds_section=TdsSection.S194Q,
                address=VendorAddress(line1="Trichy Road", city="Coimbatore", state="Tamil Nadu", pincode="641018"),
                contact_person="Mrs. K. Deepa",
                contact_phone="+91-98430-67890",
                contact_email="quotes@kovaisystems.example",
                secondary_contact_person="Mr. M. Balaji",
                secondary_contact_phone="+91-98430-11122",
                credit_period_days=45,
                delivery_lead_time_days=20,
                quality_certifications=["ISO 9001:2015"],
                bank_account=BankAccount(account_holder="Kovai Systems and Solutions", account_number="9876543210987", ifsc_code="ICIC0002345", bank_name="ICICI Bank", branch="Trichy Road"),
                product_categories=["Computers", "IT Peripherals"],
                documents=[
                    VendorDocument(name="GST Registration Certificate", doc_type="gst_certificate", reference_number="33AABFK5678E1Z2", issued_date=dt(2018, 11, 1)),
                    VendorDocument(name="Udyam MSME Certificate", doc_type="udyam_certificate", reference_number="UDYAM-TN-27-0067890", issued_date=dt(2020, 6, 10)),
                ],
                empanelment_valid_from=dt(2024, 4, 1),
                empanelment_valid_to=dt(2027, 3, 31),
            ),
        )
        vendor_c_id = await get_or_create_vendor(
            db,
            VendorCreate(
                institution_id=sae_id,
                legal_name="Nilgiri Office Automation",
                trade_name="Nilgiri Office Automation",
                vendor_category=VendorCategory.GOODS,
                gst_registration_type=GstRegistrationType.REGULAR,
                gstin="33AACFN9012F1Z6",
                pan="AACFN9012F",
                msme_registered=False,
                tds_section=TdsSection.S194Q,
                address=VendorAddress(line1="Race Course Road", city="Coimbatore", state="Tamil Nadu", pincode="641018"),
                contact_person="Mr. S. Elango",
                contact_phone="+91-98450-11223",
                contact_email="sales@nilgirioffice.example",
                secondary_contact_person="Mrs. R. Kalaivani",
                secondary_contact_phone="+91-98450-99887",
                credit_period_days=15,
                delivery_lead_time_days=10,
                quality_certifications=[],
                bank_account=BankAccount(account_holder="Nilgiri Office Automation", account_number="1122334455667", ifsc_code="SBIN0003456", bank_name="State Bank of India", branch="Race Course Road"),
                product_categories=["Computers", "Office Equipment"],
                documents=[
                    VendorDocument(name="GST Registration Certificate", doc_type="gst_certificate", reference_number="33AACFN9012F1Z6", issued_date=dt(2020, 2, 1)),
                ],
                empanelment_valid_from=dt(2024, 4, 1),
                empanelment_valid_to=dt(2027, 3, 31),
            ),
        )

        item_id = await get_or_create_item(
            db,
            ItemCreate(
                institution_id=sae_id,
                name="Desktop Computer — Intel i5, 8GB RAM, 512GB SSD",
                category="it_consumable",
                uom="Nos",
                hsn_code="8471",
                gst_rate=18.0,
                standard_rate=42000,
                specification="Intel Core i5 12th Gen, 8GB DDR4 RAM, 512GB NVMe SSD, 21.5-inch monitor, keyboard & mouse",
                reorder_level=5,
                is_capital_item=True,
                manufacturer="Dell",
                model_number="OptiPlex 7020",
                warranty_months=36,
                minimum_order_quantity=5,
                lead_time_days=15,
                preferred_vendor_ids=[vendor_a_id, vendor_b_id],
            ),
        )

        indent = await create_indent(
            db,
            IndentCreate(
                institution_id=sae_id,
                campus_id=sae_cbe_id,
                department_id=cse_unit_id,
                requested_by_name="Dr. N. Anbarasan (HoD, CSE)",
                requested_by_email="hod.cse.sae@sasurie.edu.in",
                purpose=IndentPurpose.LAB,
                priority=IndentPriority.HIGH,
                required_by_date=dt(2026, 8, 15),
                budget_head="Capital Equipment — CSE Programming Lab Upgrade FY2026-27",
                remarks="Replacing end-of-life lab systems ahead of the NBA accreditation visit.",
                lines=[
                    IndentLine(item_id=item_id, description="Desktop Computer — Intel i5, 8GB RAM, 512GB SSD", quantity=20, uom="Nos", estimated_rate=42000)
                ],
                attachments=[
                    IndentAttachment(name="CSE Lab Modernisation Budget Approval.pdf", doc_type="budget_approval", uploaded_by="hod.cse.sae@sasurie.edu.in", uploaded_at=dt(2026, 7, 20)),
                    IndentAttachment(name="NBA Accreditation Lab Requirements.pdf", doc_type="technical_specification", uploaded_by="hod.cse.sae@sasurie.edu.in", uploaded_at=dt(2026, 7, 20)),
                ],
            ),
        )
        print(f"  + created indent '{indent.indent_number}' (draft)")
        await submit_indent(db, indent.id)
        await approve_indent(db, indent.id, "hod.cse.sae@sasurie.edu.in", "Endorsed — critical for NBA accreditation lab readiness.")
        indent = await approve_indent(db, indent.id, "principal.sae@sasurie.edu.in", "Approved — aligned with NBA lab modernisation budget.")
        print(f"  + indent '{indent.indent_number}' submitted and approved through both levels")

        quotation = await create_quotation(
            db,
            QuotationCreate(
                institution_id=sae_id,
                indent_id=indent.id,
                vendor_ids=[vendor_a_id, vendor_b_id, vendor_c_id],
                procurement_method=ProcurementMethod.LIMITED_QUOTATION,
            ),
        )
        print(f"  + created RFQ '{quotation.rfq_number}' inviting 3 vendors")

        await record_vendor_quote(
            db, quotation.id,
            VendorQuoteInput(vendor_id=vendor_a_id, lines=[QuoteLine(description="Desktop Computer — Intel i5, 8GB RAM, 512GB SSD", rate=41500, gst_rate=18.0)], freight=2000, installation=3000, other_charges=0, delivery_days=15, remarks="3-year onsite warranty included"),
        )
        await record_vendor_quote(
            db, quotation.id,
            VendorQuoteInput(vendor_id=vendor_b_id, lines=[QuoteLine(description="Desktop Computer — Intel i5, 8GB RAM, 512GB SSD", rate=40800, gst_rate=18.0)], freight=1500, installation=2500, other_charges=0, delivery_days=20, remarks="1-year onsite warranty, extendable"),
        )
        await record_vendor_quote(
            db, quotation.id,
            VendorQuoteInput(vendor_id=vendor_c_id, lines=[QuoteLine(description="Desktop Computer — Intel i5, 8GB RAM, 512GB SSD", rate=43000, gst_rate=18.0)], freight=0, installation=2000, other_charges=1000, delivery_days=10, remarks="Fastest delivery, includes UPS units"),
        )
        print("  + recorded quotes from all 3 vendors")

        comparative = await get_comparative_statement(db, quotation.id)
        l1_vendor = comparative.l1_vendor_id
        print(f"  + comparative statement computed — L1 vendor: {[r.vendor_name for r in comparative.rows if r.vendor_id == l1_vendor][0]}")

        quotation = await award_quotation(db, quotation.id, l1_vendor, "")
        print(f"  + RFQ '{quotation.rfq_number}' awarded to L1 vendor")

        po = await create_po_from_quotation(
            db, quotation.id,
            PurchaseOrderFromQuotation(
                delivery_date=dt(2026, 8, 10),
                payment_terms="100% within 30 days of GRN acceptance, subject to MSME payment window where applicable",
                warranty_terms="3 years onsite comprehensive warranty",
                penalty_clause="0.5% of order value per week of delay, capped at 5%",
            ),
        )
        po = await issue_purchase_order(db, po.id)
        print(f"  + purchase order '{po.po_number}' generated and issued — grand total Rs.{po.grand_total:,.2f}")

        grn = await create_grn(
            db,
            GrnCreate(
                po_id=po.id,
                vendor_invoice_number="CCPL/26-27/0451",
                vendor_invoice_date=dt(2026, 8, 8),
                lines=[GrnLineInput(line_index=0, received_qty=20, accepted_qty=20, rejected_qty=0)],
                remarks="All 20 units received in good condition, verified by CSE lab in-charge.",
            ),
        )
        print(f"  + GRN '{grn.grn_number}' recorded — quality status: {grn.quality_status.value}")

        bill = await create_bill(
            db,
            PurchaseBillCreate(grn_id=grn.id, vendor_invoice_number="CCPL/26-27/0451", vendor_invoice_date=dt(2026, 8, 8)),
        )
        bill = await approve_bill(db, bill.id, "finance.sae@sasurie.edu.in", "Verified three-way match, approved for payment within MSME window.")
        print(f"  + purchase bill '{bill.bill_number}' booked and approved — net payable Rs.{bill.net_payable:,.2f} (TDS {bill.tds_section} @ {bill.tds_rate}%)")

    print("\nSeed complete.")
    print(f"  Group ID: {group_id}")
    print(f"  SAE ID: {sae_id} | SCAS ID: {scas_id}")
    print(f"  Campuses: {sae_cbe_id}, {sae_tup_id}, {scas_tup_id}")
    print("\nDemo credentials (password login, then OTP printed to this server's console log):")
    print(f"  superadmin@sasurie.edu.in / {demo_password}")
    print(f"  chairman@sasurie.edu.in / {demo_password}  (Group Director command centre)")
    print(f"  admin.sae@sasurie.edu.in / {demo_password}")
    print(f"  principal.sae@sasurie.edu.in / {demo_password}")
    print(f"  hr.sae@sasurie.edu.in / {demo_password}")
    print(f"  finance.sae@sasurie.edu.in / {demo_password}")
    print(f"  admin.scas@sasurie.edu.in / {demo_password}")
    print(f"  principal.scas@sasurie.edu.in / {demo_password}")
    print("  employee.demo@sasurie.edu.in — OTP-only login, must set password on first login")

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
