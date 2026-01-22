# InstaBiz Industrial ERP - Product Requirements Document

## Overview
InstaBiz Industrial ERP is a comprehensive enterprise resource planning system specifically designed for the **Adhesive Tapes & Sealants industry**. The system integrates ERP, CRM, HRMS, Accounts, Production, Quality, and AI-powered Business Intelligence modules.

## The 6 Pillars of AdhesiveFlow ERP ✅ COMPLETE

### 1. Physics Engine (The Master Math)
**File:** `/app/backend/routes/core_engine.py`
- Auto-converts between Weight (KG), Area (SQM), and Pieces (PCS)
- Formula: KG = SQM × thickness_m × density
- Supports: KG, SQM, PCS, ROL, MTR
- API: `POST /api/core/physics/convert`

### 2. Production Redline (The Guardrail)
- Hard lock if scrap exceeds 7%
- Mass-Balance check (raw material vs output)
- Director override capability
- APIs: `POST /api/core/redline/check-entry`, `POST /api/core/redline/override`

### 3. CRM Buying DNA (The Hunter)
- AI learns customer purchase frequency
- Alerts if customer is 2+ days late
- Auto-drafts follow-up messages
- APIs: `GET /api/core/buying-dna/{customer_id}`, `GET /api/core/buying-dna/late-customers`

### 4. Multi-Branch Ledger (The Tax Bridge)
- Handles GST for Gujarat, Mumbai, Delhi
- Treats business as one whole, tax records separate
- Branch-wise and consolidated views
- API: `GET /api/core/gst-bridge/summary`

### 5. Import Bridge (The Margin Protector)
- Enter container cost → Auto-calculates Landed Cost
- Shows MSP (Minimum Selling Price) with 15% margin
- Shows RSP (Recommended Selling Price) with 25% margin
- API: `POST /api/core/import-bridge/landed-cost`

### 6. Director Cockpit (The Command Center)
- Cash Pulse (AR/AP position)
- Production Pulse (Scrap %, Active WOs, Redline alerts)
- Sales Pulse (MTD Sales, Orders)
- Override Queue with approval buttons
- APIs: `GET /api/core/cockpit/pulse`, `GET /api/core/cockpit/overrides-pending`

---

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

---

## Recent Updates (January 2026)

### "Powerhouse ERP" Enhancement - New Modules Added

#### Module 11: GST Compliance ✅ NEW
**File:** `/app/backend/routes/gst_compliance.py`

**Features:**
- GSTR-1 (Outward Supplies) Report Generation with B2B, B2C, CDNR tables
- GSTR-3B Summary Report with tax calculation
- E-Invoice Generation (IRN + QR Code)
- E-Way Bill Generation with validity tracking
- Input Tax Credit (ITC) Tracking & Reconciliation
- HSN Summary Reports

**Endpoints:**
- `GET /api/gst/gstr1/{period}` - Generate GSTR-1 (period format: MMYYYY)
- `GET /api/gst/gstr3b/{period}` - Generate GSTR-3B
- `GET /api/gst/itc/{period}` - ITC summary
- `POST /api/gst/e-invoice/generate/{invoice_id}` - Generate E-Invoice
- `POST /api/gst/eway-bill/generate/{invoice_id}` - Generate E-Way Bill
- `GET /api/gst/hsn-summary/{period}` - HSN summary

---

#### Module 12: Advanced Inventory ✅ NEW
**File:** `/app/backend/routes/inventory_advanced.py`

**Features:**
- Batch Tracking (lot number, manufacturing date, expiry date)
- Serial Number Assignment
- Bin Location Management (warehouse zones)
- Stock Aging Analysis
- Auto Reorder System with PO generation
- Barcode Lookup
- Multi-method Stock Valuation (FIFO, LIFO, Weighted Avg)

**Endpoints:**
- `POST /api/inventory-advanced/batches` - Create batch
- `GET /api/inventory-advanced/batches/expiring` - Expiring batches
- `POST /api/inventory-advanced/serial-numbers` - Generate serial numbers
- `POST /api/inventory-advanced/bin-locations` - Create bin location
- `GET /api/inventory-advanced/stock-aging` - Stock aging report
- `GET /api/inventory-advanced/reorder-alerts` - Low stock alerts
- `GET /api/inventory-advanced/stock-valuation` - Stock valuation

---

#### Module 13: Reports & Analytics ✅ NEW
**File:** `/app/backend/routes/reports_analytics.py`

**Features:**
- Sales Analytics (Daily, Weekly, Monthly, YoY comparison)
- Purchase Analytics with top suppliers
- Inventory Reports (summary, movement)
- Financial Reports (P&L, Cash Flow)
- Top Products & Customers reports
- Dashboard KPIs

**Endpoints:**
- `GET /api/analytics/dashboard/kpis` - All KPIs
- `GET /api/analytics/sales/summary?period={period}` - Sales summary with growth
- `GET /api/analytics/sales/trend` - Sales trend
- `GET /api/analytics/sales/top-products` - Top selling products
- `GET /api/analytics/sales/top-customers` - Top customers
- `GET /api/analytics/purchases/summary` - Purchase summary
- `GET /api/analytics/inventory/summary` - Inventory summary
- `GET /api/analytics/financial/profit-loss` - P&L report
- `GET /api/analytics/financial/cash-flow` - Cash flow report

---

#### Module 14: Enhanced HRMS ✅ NEW
**File:** `/app/backend/routes/hrms_enhanced.py`

**Features:**
- Attendance Tracking (Check-in/Check-out with working hours calculation)
- Leave Management (6 default types: CL, SL, EL, LOP, ML, PL)
- Leave Balance Tracking
- Statutory Compliance (PF/ESI/PT/LWF calculation)
- Loan & Advance Management with EMI schedules
- Holiday Calendar

**Endpoints:**
- `POST /api/hrms-enhanced/attendance` - Mark attendance
- `POST /api/hrms-enhanced/attendance/check-in` - Self check-in
- `GET /api/hrms-enhanced/attendance/summary/{emp_id}/{month}` - Monthly summary
- `GET /api/hrms-enhanced/leave-types` - List leave types
- `POST /api/hrms-enhanced/leave-applications` - Apply leave
- `PUT /api/hrms-enhanced/leave-applications/{id}/approve` - Approve leave
- `GET /api/hrms-enhanced/leave-balance/{employee_id}` - Leave balance
- `GET /api/hrms-enhanced/statutory/config` - Statutory config
- `GET /api/hrms-enhanced/statutory/calculate/{emp_id}` - Calculate deductions
- `POST /api/hrms-enhanced/loans` - Create loan/advance
- `PUT /api/hrms-enhanced/loans/{id}/pay-emi` - Pay EMI
- `GET /api/hrms-enhanced/holidays/{year}` - Holiday calendar

---

#### Module 15: Notifications & Alerts ✅ NEW
**File:** `/app/backend/routes/notifications.py`

**Features:**
- Payment Due Reminders (3-day and overdue alerts)
- Low Stock Alerts (critical & warning levels)
- Pending Approval Notifications
- Expiring Batch Alerts
- Activity Logging

**Endpoints:**
- `GET /api/notifications/notifications` - List notifications
- `GET /api/notifications/notifications/count` - Unread count
- `PUT /api/notifications/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/notifications/read-all` - Mark all read
- `POST /api/notifications/alerts/generate` - Auto-generate system alerts
- `GET /api/notifications/reminders/payment-due` - Payment reminders
- `POST /api/notifications/activity-log` - Log activity
- `GET /api/notifications/activity-log` - Activity history

---

### Frontend Dashboards Added

1. **GST Compliance Dashboard** (`/gst-compliance`)
   - GSTR-1/3B tabs with detailed breakdowns
   - ITC reconciliation view
   - E-Invoice and E-Way Bill management

2. **Reports & Analytics Dashboard** (`/analytics`)
   - KPI cards (Today's sales, Month sales, Pending POs, Alerts)
   - Sales performance with growth comparison
   - Top products & customers
   - P&L summary
   - Inventory overview

3. **HRMS Dashboard** (`/hrms-dashboard`)
   - Attendance management with quick check-in/out
   - Leave management with approval workflow
   - Loans & advances tracking
   - Statutory compliance overview

4. **Advanced Inventory Dashboard** (`/advanced-inventory`) ✅ NEW
   - Batch tracking with expiry management
   - Serial number generation
   - Bin location management (Aisle/Rack/Shelf)
   - Stock aging analysis (0-30, 31-60, 61-90, 91-180, 180+ days)
   - Stock valuation (Weighted Average method)
   - Reorder alerts with auto PO suggestion
   - Barcode/Item code lookup

5. **Notification Center** ✅ NEW
   - Real-time notification bell in header with unread badge
   - Dropdown notification list with priority badges
   - Mark as read/Mark all read functionality
   - Auto-generate system alerts button
   - Polls for new notifications every 30 seconds

---

### Auto-Populate Feature ✅ IMPLEMENTED

**Reusable Components:**
- `ItemSearchSelect.js` - Debounced search for items with auto-fill
- `CustomerSearchSelect.js` - Debounced search for customers with auto-fill

**Integrated in:**
- CRM (Quotations) - Customer & Item auto-populate
- Procurement (Purchase Orders) - Item auto-populate
- Production (Work Orders) - Item auto-populate with spec fields ✅ NEW
- Accounts (Invoices) - Customer & Item auto-populate

---

### Bug Fix: ObjectId Serialization ✅ RESOLVED

**Issue:** MongoDB `_id` field causing serialization errors in API responses
**Solution:** Added `{"_id": 0}` projection to all `find()` and `find_one()` queries, and filtered `_id` from POST response documents

**Tests:** 36/36 backend tests passed (100% success rate)

### Bug Fix: Dashboard KeyError ✅ RESOLVED (January 2026)

**Issue:** Direct dict access causing KeyError in dashboard.py
**Solution:** Changed `inv['field']` to `inv.get('field', 0)` with defaults

---

## Next Steps (Priority Order)

### P0 - Critical
1. ~~Fix ObjectId serialization bug~~ ✅ DONE
2. ~~Build Frontend for Advanced Inventory~~ ✅ DONE
3. ~~Build Notifications UI~~ ✅ DONE

### P1 - High Priority
1. ~~Extend auto-populate to Production~~ ✅ DONE
2. ~~Implement Meta-Data Driven UI ("Power Settings")~~ ✅ DONE
3. ~~Implement Document Editor for Orders/Invoices~~ ✅ DONE

### P2 - Medium Priority (NEXT)
1. External API Integrations:
   - Live GST / E-invoice / E-waybill APIs
   - B2B Portals (IndiaMart, Alibaba)
   - Payment gateways
   - WhatsApp/Email notifications
2. AI-Powered BI Dashboard (LLM integration)

### P3 - Refactoring
1. Break down `CRM.js` into smaller components
2. Move Pydantic models to `/app/backend/models/` directory
3. File cleanup and directory restructuring

---

## New Features Added (January 2026 - Session 2)

### Module 16: Power Settings (Custom Field Registry) ✅ NEW
**Files:** `/app/backend/routes/custom_fields.py`, `/app/frontend/src/pages/PowerSettings.js`

**Features:**
- 12 module configurations (CRM, Inventory, Production, Accounts, HRMS, Procurement)
- Dynamic custom field creation (text, number, date, select, multiselect, checkbox, textarea, file)
- Field properties: required, searchable, filterable, show in list
- Section grouping for fields
- Seed default fields for common use cases
- Drag-and-drop field reordering (visual)

**Endpoints:**
- `GET /api/custom-fields/modules` - List 12 available modules
- `GET /api/custom-fields/fields/{module}` - Get fields for a module
- `POST /api/custom-fields/fields` - Create custom field
- `PUT /api/custom-fields/fields/{id}` - Update field
- `DELETE /api/custom-fields/fields/{id}` - Delete field
- `POST /api/custom-fields/seed-defaults` - Seed default fields

---

### Module 17: Document Editor ✅ NEW
**Files:** `/app/backend/routes/documents.py`, `/app/frontend/src/pages/DocumentEditor.js`

**Features:**
- 5 document templates: Sales Invoice, Quotation, Purchase Order, Delivery Challan, Work Order
- Visual canvas editor with drag-and-drop elements
- Element types: Text, Data Field, Image/Logo, Table, Line, Rectangle
- Data field binding (company, customer, document, items, totals, bank details)
- Properties panel for element customization
- Zoom, grid, preview, export PDF controls
- Template save/load functionality

**Endpoints:**
- `GET /api/documents/templates` - List saved templates
- `POST /api/documents/templates` - Save template
- `GET /api/documents/templates/{type}` - Get template by type

---

## Test Files
- `/app/tests/test_new_modules.py` - 36 tests for powerhouse modules
- `/app/tests/test_dashboard_notifications.py` - 7 tests for dashboard & notifications
- `/app/tests/test_new_features_iteration4.py` - 26 tests for Power Settings & Document Editor
- `/app/test_reports/iteration_4.json` - Latest test report (100% pass)
