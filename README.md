# Sasurie Group of Institutions — ERP Platform

Production-oriented multi-institution University ERP covering configuration, organisation, RBAC, purchase, stores, assets, HR, attendance/leave, payroll and accounts — built for the Indian higher-education statutory environment.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 8 + Tailwind 4 + TanStack Query |
| Backend | FastAPI + Motor (MongoDB) + Pydantic v2 |
| Auth | JWT access/refresh + Email OTP + Password (Argon2) |

## Quick start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set MONGODB_URI and secrets
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### Seed sample data

```bash
cd backend
./venv/bin/python scripts/seed.py            # org, campuses, users, purchase cycle (once)
./venv/bin/python scripts/seed_demo_all.py   # full demo: ~200 staff, stores, assets, leave, payroll, accounts
```

`seed_demo_all.py` is idempotent and loads Sasurie-relatable sample data across SAE (Coimbatore) and SCAS (Tiruppur) — named faculty, bulk staff, lab/stationery catalog, stock issues, attendance mix, leave applications, locked payroll runs with payslips, and posted vouchers/budgets.

Demo logins (password `Sasurie@123`, then OTP from API console):

| Email | Role dashboard |
|-------|----------------|
| `superadmin@sasurie.edu.in` | Group command centre |
| `admin.sae@sasurie.edu.in` | Institution cockpit |
| `principal.sae@sasurie.edu.in` | Principal decision centre |
| `hr.sae@sasurie.edu.in` | HR command desk |
| `finance.sae@sasurie.edu.in` | Treasury & compliance |
| `purchase.sae@sasurie.edu.in` | Purchase operations |
| `stores.sae@sasurie.edu.in` | Inventory command |
| `assets.sae@sasurie.edu.in` | Asset register desk |
| `payroll.sae@sasurie.edu.in` | Statutory payroll desk |
| `employee.demo@sasurie.edu.in` | Employee self-service (OTP-only) |

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://127.0.0.1:5173 (proxies /api → :8000)
```

## Modules (all authenticated, permission-gated)

1. **Auth** — Password + OTP, sessions, forced password change
2. **Global Configuration** — Policies, branding, document numbering
3. **Organisation** — Group → Institution → Campus → Units
4. **RBAC** — Roles, field-sensitive permissions
5. **Purchase** — Vendors, indents, quotations, PO, GRN, bills (non-tender)
6. **Stores** — Multi-store stock, issues, transfers, valuation
7. **Assets** — Fixed asset register, transfer, disposal
8. **HR** — Employee 360°, designations, masked PAN/bank
9. **Attendance & Leave** — Daily attendance, leave workflow
10. **Payroll** — Indian statutory (EPF/ESI/TN PT), runs, payslips
11. **Accounts** — COA, vouchers (immutable post), budgets, trial balance
12. **Reports** — Unified report centre

## Branding

Sasurie crimson & gold institutional palette applied across UI and branded document letterheads (QR verification, seal, signatures).
