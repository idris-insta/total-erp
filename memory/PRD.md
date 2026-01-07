# InstaBiz Industrial ERP - Product Requirements Document

## Overview
InstaBiz Industrial ERP is a comprehensive enterprise resource planning system specifically designed for the **Adhesive Tapes & Sealants industry**. The system integrates ERP, CRM, HRMS, Accounts, Production, Quality, and AI-powered Business Intelligence modules.

## Core Logic
**Meta-Data Driven Architecture** (100% customizable fields) with a **Dimensional Physics Engine** (KG ↔ SQM ↔ PCS conversions).

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, react-beautiful-dnd
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with Role-Based Access Control (RBAC)

---

## Module Status

### Module 1: Dimensional Item Master ✅ ENHANCED
**Feature:** Multi-UOM Dimensional Tracking

**Implemented:**
- Item codes, names, categories (Raw Material, Semi-Finished, Finished Goods, Packaging)
- Item types (BOPP, Masking, Double-Sided, Cloth, PVC, Foam)
- Specifications: Thickness (Microns), Width (MM), Length (Mtrs), Color, Adhesive Type
- **NEW: GSM field** for weight calculation
- **NEW: Dual-UOM stock tracking** (stock_kg, stock_sqm, stock_pcs)
- **NEW: UOM Conversion endpoint** `/api/inventory/items/{id}/convert-uom`
- MSP (Min Sale Price) and Last Landed Rate fields

**UOM Converter Utility:** `/app/backend/utils/uom_converter.py`
- `convert_all_uom()` - Master conversion function
- `calculate_sqm()` - Width × Length to SQM
- `sqm_to_kg()` / `kg_to_sqm()` - Weight conversions
- `calculate_jumbo_to_slits()` - Production yield calculation
- `validate_weight_integrity()` - GRN verification

---

### Module 2: Multi-Branch & Multi-GST Accounting ✅ NEW
**File:** `/app/backend/routes/branches.py`

**Implemented:**
- Branch entity with state, GSTIN, address
- Branch-Bridge Ledger for inter-branch transactions
- Individual Branch Dashboards (`/api/branches/{id}/dashboard`)
- Consolidated Director Dashboard (`/api/branches/consolidated/dashboard`)
- Tax numbering series per branch

**Document Numbering:** `/app/backend/utils/document_numbering.py`
- Format: `PREFIX/BRANCH/FY/SEQ` (e.g., INV/MH/2425/0001)
- Financial year calculation (April to March)
- Branch code extraction from state
- Configurable series per document type

---

### Module 3: Two-Stage Production Engine ✅ NEW
**File:** `/app/backend/routes/production_v2.py`

**Stage 1: Coating (Chemical transformation)**
- Water-Based (BOPP), Hotmelt (Single/Double Side), PVC
- Input: Film + Adhesive + Pigment + Liner
- Output: Coated Jumbo rolls (SQM)

**Stage 2: Converting (Physical transformation)**
- Process A: Direct Slitting (Jumbo → Finished Boxes)
- Process B: Rewinding & Cutting (Jumbo → Log Roll → PCS)

**Features:**
- RM Requisition system (deducts from inventory)
- **7% Redline Guard** - Auto-locks if scrap exceeds 7%, requires Director approval
- Batch tracking throughout

**Endpoints:**
- `POST /api/production-v2/rm-requisitions` - Create RM requisition
- `PUT /api/production-v2/rm-requisitions/{id}/issue` - Issue materials
- `POST /api/production-v2/coating-batches` - Create coating batch
- `PUT /api/production-v2/coating-batches/{id}/complete` - Complete with scrap check
- `POST /api/production-v2/converting-jobs` - Create converting job
- `GET /api/production-v2/summary/{wo_id}` - Full production summary

---

### Module 4: 8-Stage CRM & Account Success ✅ COMPLETED
**Files:** `/app/backend/routes/crm.py`, `/app/frontend/src/pages/LeadsPage.js`

**Pipeline:** New Lead → Prospect → Enquiry → Negotiation → Finalization → Quotation → Converted → Regular Customer

**Implemented:**
- Kanban board with drag-and-drop
- District field + State dropdown
- Pincode auto-fill (City, State, District)
- Customer Type & Assign To fields
- Lead assignment with hierarchical visibility
- Quotation creation from leads
- Multi-item Samples

---

### Module 5: Gatepass System ✅ NEW
**File:** `/app/backend/routes/gatepass.py`

**Features:**
- Inward Gatepass (linked to GRN)
- Outward Gatepass (linked to Delivery Note)
- Transporter Master
- Vehicle & Driver tracking
- Returnable/Non-returnable items
- LR Number tracking

**Endpoints:**
- `POST /api/gatepass/` - Create gatepass
- `GET /api/gatepass/` - List with filters
- `PUT /api/gatepass/{id}/approve` - Approve gatepass
- `PUT /api/gatepass/{id}/complete` - Mark completed
- `GET /api/gatepass/vehicle-log` - Vehicle movement history

---

### Module 6: Expense & Financial Control ✅ NEW
**File:** `/app/backend/routes/expenses.py`

**Features:**
- 12 Default Expense Buckets (Exhibitions, Marketing, Utilities, etc.)
- Budget tracking per bucket
- Expense entries with approval workflow
- Reimbursement tracking
- Branch-wise expense analytics

**Endpoints:**
- `POST /api/expenses/buckets/bootstrap` - Initialize default buckets
- `POST /api/expenses/entries` - Create expense entry
- `PUT /api/expenses/entries/{id}/submit` - Submit for approval
- `PUT /api/expenses/entries/{id}/approve` - Approve expense
- `GET /api/expenses/analytics/by-bucket` - Analytics by category
- `GET /api/expenses/analytics/trend` - Monthly trend

---

### Module 7: HRMS (Performance-Linked) ✅ ENHANCED

#### 7a. Payroll Module ✅ NEW
**File:** `/app/backend/routes/payroll.py`

**Features:**
- Dual Salary (Daily/Monthly wage types)
- Attendance-to-Payroll linking
- Statutory Deductions:
  - PF: 12% employee + 12% employer (wage ceiling ₹15,000)
  - ESI: 0.75% employee + 3.25% employer (wage ceiling ₹21,000)
  - PT: Maharashtra slabs (₹0/₹175/₹200)
  - TDS: Configurable percentage
- Salary Structure per employee
- Bulk payroll processing
- Payslip generation

**Endpoints:**
- `POST /api/payroll/salary-structures` - Create salary structure
- `POST /api/payroll/process` - Process individual payroll
- `POST /api/payroll/process-bulk` - Bulk processing
- `GET /api/payroll/{id}/payslip` - Generate payslip data
- `PUT /api/payroll/{id}/approve` - Approve (requires approval)

#### 7b. Employee Document Vault ✅ NEW
**File:** `/app/backend/routes/employee_vault.py`

**Document Types:** Aadhaar, PAN, Passport, Driving License, Educational Certificates, Bank Documents, etc.

**Features:**
- File upload with employee folders
- Document verification workflow
- Expiry date tracking with alerts
- Asset Assignment tracking (laptop, mobile, vehicle, ID card)
- Complete vault summary per employee

**Endpoints:**
- `POST /api/employee-vault/documents` - Upload document
- `GET /api/employee-vault/documents` - List documents
- `PUT /api/employee-vault/documents/{id}/verify` - Verify document
- `GET /api/employee-vault/documents/expiring` - Expiring documents
- `POST /api/employee-vault/assets` - Assign asset
- `PUT /api/employee-vault/assets/{id}/return` - Return asset
- `GET /api/employee-vault/{emp_id}/vault-summary` - Complete summary

#### 7c. Sales Incentives ✅ NEW
**File:** `/app/backend/routes/sales_incentives.py`

**Features:**
- Target Setting (Monthly/Quarterly/Yearly)
- 5 Default Incentive Slabs:
  - Below Target (0-80%): 0%
  - 80-100%: 1% of achieved
  - 100-120%: 2% of achieved
  - 120-150%: 3% of achieved
  - Super Achiever (150%+): 5% of achieved
- Auto-bonus for exceeding target (5% of excess)
- Incentive payout tracking
- Sales Leaderboard

**Endpoints:**
- `POST /api/sales-incentives/slabs/bootstrap` - Initialize slabs
- `POST /api/sales-incentives/targets` - Create target
- `PUT /api/sales-incentives/targets/{id}/update-achievement` - Update achievement
- `POST /api/sales-incentives/calculate/{target_id}` - Calculate incentive
- `GET /api/sales-incentives/leaderboard` - Sales leaderboard

---

### Module 8: Procurement (Local & Import) ✅ ENHANCED

#### Import Bridge ✅ NEW
**File:** `/app/backend/routes/import_bridge.py`

**Features:**
- Import PO with foreign currency
- Multi-currency support (USD, EUR, GBP, CNY, JPY)
- Shipping terms (FOB, CIF, CNF, EXW)
- LC/TT payment tracking

**Landing Cost Calculator:**
- Basic Customs Duty + Social Welfare Cess
- IGST, Anti-dumping duty, Safeguard duty
- Ocean Freight, Insurance, Local Freight
- CHA charges, Port charges, Documentation
- Forex gain/loss calculation
- Final Landed INR Rate per item
- **Auto-update MSP** on finalization

**Endpoints:**
- `POST /api/imports/purchase-orders` - Create import PO
- `POST /api/imports/landing-cost` - Calculate landing cost
- `PUT /api/imports/landing-cost/{id}/finalize` - Finalize & update MSP
- `GET /api/imports/exchange-rates` - Get rates
- `POST /api/imports/exchange-rates` - Update rate

---

### Module 9: Power Settings (Metadata Heart) ✅ COMPLETED
**File:** `/app/backend/routes/customization.py`

**Features:**
- Custom Field Registry
- Report Templates
- Dynamic field addition to any module

---

### Module 10: Director Command Center ✅ NEW
**File:** `/app/backend/routes/director_dashboard.py`

**The 10th Screen - Consolidated Pulse View**

**Cash Pulse:**
- Total AR/AP
- Overdue amounts
- Cash & Bank balance
- AR/AP Aging (0-30, 31-60, 61-90, 90+ days)

**Production Pulse:**
- Work orders in progress
- Target vs Completed
- Average scrap % vs 7% standard
- Machines running/idle
- Pending approvals (Redline alerts)

**Sales Pulse:**
- MTD/YTD Sales vs Target
- Achievement %
- Average order value
- Orders today/this month
- Top 5 products & customers

**Alerts Dashboard:**
- Pending approvals
- Overdue invoices (>30 days)
- Low stock alerts
- Expiring documents

**Endpoints:**
- `GET /api/director/cash-pulse`
- `GET /api/director/production-pulse`
- `GET /api/director/sales-pulse`
- `GET /api/director/alerts`
- `GET /api/director/summary` - Complete dashboard

---

## File Structure
```
/app/
├── backend/
│   ├── routes/
│   │   ├── crm.py                 # ✅ CRM Module
│   │   ├── inventory.py           # ✅ Inventory (Enhanced with UOM)
│   │   ├── production.py          # ✅ Basic Production
│   │   ├── production_v2.py       # ✅ NEW: Two-Stage Production
│   │   ├── procurement.py         # ✅ Local Procurement
│   │   ├── accounts.py            # ✅ Accounts & COA
│   │   ├── hrms.py                # ✅ Basic HRMS
│   │   ├── quality.py             # ✅ Quality Module
│   │   ├── dashboard.py           # ✅ General Dashboard
│   │   ├── settings.py            # ✅ User Settings
│   │   ├── customization.py       # ✅ Custom Fields
│   │   ├── documents.py           # ✅ Document Upload
│   │   ├── master_data.py         # ✅ Master Data
│   │   ├── permissions.py         # ✅ RBAC
│   │   ├── approvals.py           # ✅ Approval System
│   │   ├── reports.py             # ✅ Reports
│   │   ├── branches.py            # ✅ NEW: Multi-Branch
│   │   ├── gatepass.py            # ✅ NEW: Gatepass
│   │   ├── expenses.py            # ✅ NEW: Expense Buckets
│   │   ├── payroll.py             # ✅ NEW: Payroll
│   │   ├── employee_vault.py      # ✅ NEW: Document Vault
│   │   ├── sales_incentives.py    # ✅ NEW: Sales Incentives
│   │   ├── import_bridge.py       # ✅ NEW: Import & Landing Cost
│   │   └── director_dashboard.py  # ✅ NEW: Director Command Center
│   └── utils/
│       ├── uom_converter.py       # ✅ NEW: Dimensional Physics Engine
│       ├── document_numbering.py  # ✅ NEW: Doc Numbering Series
│       └── permissions.py         # ✅ Permission Utils
├── frontend/
│   └── src/
│       └── pages/
│           ├── Dashboard.js       # ✅ Main Dashboard
│           ├── CRM.js             # ✅ CRM Module
│           ├── LeadsPage.js       # ✅ Leads Kanban
│           ├── Inventory.js       # ✅ Inventory
│           ├── Procurement.js     # ✅ Procurement
│           ├── Production.js      # ✅ Production
│           ├── Accounts.js        # ✅ Accounts
│           ├── HRMS.js            # ✅ HRMS
│           ├── Quality.js         # ✅ Quality
│           ├── Settings.js        # ✅ Settings
│           ├── Approvals.js       # ⚠️ Shell (needs UI)
│           └── Reports.js         # ⚠️ Shell (needs UI)
└── memory/
    └── PRD.md
```

---

## Login Credentials
- **Email:** admin@instabiz.com
- **Password:** adminpassword

---

## Next Steps (Frontend UI)
1. Build UI for Director Command Center
2. Build UI for Payroll module
3. Build UI for Import Bridge / Landing Cost
4. Build UI for Gatepass system
5. Build UI for Employee Document Vault
6. Build UI for Sales Incentives
7. Enhance Inventory UI with dual-UOM view
