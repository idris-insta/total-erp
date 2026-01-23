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

### 3. CRM Buying DNA (The Hunter) ✅ ENHANCED
- AI learns customer purchase frequency
- Alerts if customer is 2+ days late
- Auto-drafts WhatsApp follow-up messages
- Full Buying DNA Dashboard with pattern analysis
- APIs: 
  - `GET /api/buying-dna/patterns` - All customer patterns with urgency scoring
  - `GET /api/buying-dna/dashboard` - Dashboard summary
  - `POST /api/buying-dna/followup-log` - Log follow-up actions
- Frontend: `/buying-dna` - Full UI with search, filters, WhatsApp integration

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
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, react-beautiful-dnd, **Vite** (migrated from CRA/CRACO - January 2026)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with Role-Based Access Control (RBAC)
- **AI Integration:** Gemini 3 Flash via Emergent LLM Key

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
2. ~~AI-Powered BI Dashboard (LLM integration)~~ ✅ DONE

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
- `/app/tests/test_ai_bi_dashboard.py` - 24 tests for AI BI Dashboard
- `/app/test_reports/iteration_6.json` - Latest test report (100% pass)

---

## Module 18: AI Business Intelligence Dashboard ✅ NEW (January 2026)
**Files:** `/app/backend/routes/ai_bi.py`, `/app/frontend/src/pages/AIBIDashboard.js`
**AI Provider:** Gemini 3 Flash via Emergent LLM Key

### Features:

**1. Natural Language Queries**
- Ask questions about business data in plain English
- Example: "What were our top 5 products this month?"
- Suggested queries for quick access
- Query history tracking
- API: `POST /api/ai/nl-query`

**2. AI-Generated Insights**
- Auto-analyze sales, inventory, production, finance
- Structure: Key Findings → Opportunities → Risks → Recommended Actions
- Focus areas: All, Sales, Inventory, Production, Finance
- Time periods: Week, Month, Quarter, Year
- API: `POST /api/ai/generate-insights`

**3. Predictive Analytics**
- Forecast sales, inventory needs, cash flow
- Configurable horizon: 7 to 90 days
- Includes confidence levels and scenarios
- Historical data visualization
- API: `POST /api/ai/predict`

**4. Smart Alerts**
- AI detects anomalies and unusual patterns
- Alert types: CRITICAL, WARNING, INFO
- Categories: Sales, Inventory, Production, Finance, Customer
- Shows summary stats: overdue invoices, low stock, scrap rate
- API: `POST /api/ai/smart-alerts`

### Frontend Route: `/ai-dashboard`
- Beautiful purple/indigo gradient theme
- 4 tabs: Ask AI, Insights, Predict, Smart Alerts
- Suggested queries, recent queries panel
- Real-time AI responses

---

## Build System Migration: CRA → Vite ✅ COMPLETE (January 2026)

### Migration Details
- **Old Stack:** Create React App (CRA) + CRACO
- **New Stack:** Vite 7.3.1 + @vitejs/plugin-react-swc

### Changes Made:
1. **Installed:** `vite`, `@vitejs/plugin-react-swc`
2. **Removed:** `react-scripts`, `@craco/craco`, `@babel/plugin-proposal-private-property-in-object`, `cra-template`
3. **Created:** `/app/frontend/vite.config.js` - Full Vite configuration with:
   - Visual edits plugin for Emergent integration
   - Path alias (`@` → `src/`)
   - JSX loader configuration for `.js` files
   - Allowed hosts configuration for preview domain
4. **Moved:** `index.html` from `/public/` to root
5. **Renamed:** All `.js` files in `src/` to `.jsx` (85 files)
6. **Updated:** Environment variables from `REACT_APP_*` to `VITE_*`
7. **Updated:** `package.json` scripts: `start`, `build`, `preview`

### Environment Variables:
- **Old:** `process.env.REACT_APP_BACKEND_URL`
- **New:** `import.meta.env.VITE_BACKEND_URL`

### Test Results:
- All 8 key pages tested and working (100% success rate)
- Login, Dashboard, CRM, Director Center, AI BI, Inventory, Production, Navigation
- Test report: `/app/test_reports/iteration_7.json`

### Benefits:
- Faster hot reload (native ESM)
- Modern build system
- Better dependency management
- No more CRA/CRACO conflicts

---

## File Structure

```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   └── routes/
│       ├── core_engine.py     # 6 Pillars implementation
│       ├── ai_bi.py           # AI Business Intelligence
│       ├── custom_fields.py   # Power Settings
│       ├── documents.py       # Document Editor
│       ├── gst_compliance.py
│       ├── inventory_advanced.py
│       ├── reports_analytics.py
│       ├── hrms_enhanced.py
│       └── notifications.py
└── frontend/
    ├── index.html             # Vite entry HTML
    ├── vite.config.js         # Vite configuration
    ├── package.json
    └── src/
        ├── index.jsx          # Entry point
        ├── App.jsx            # Routes
        ├── components/
        │   ├── ui/            # Shadcn components
        │   ├── layout/
        │   │   └── MainLayout.jsx
        │   └── NotificationCenter.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── DirectorDashboard.jsx
            ├── AIBIDashboard.jsx
            ├── PowerSettings.jsx
            ├── DocumentEditor.jsx
            ├── AdvancedInventory.jsx
            └── ... (other pages)
```

---

## Test Credentials
- **Email:** `admin@instabiz.com`
- **Password:** `adminpassword`

---

## Next Steps (Priority Order)

### P1 - High Priority
1. **Dynamic Form Rendering:** Make forms render dynamically from Power Settings metadata
2. **Canvas Document Editor:** Implement core canvas editing functionality
3. **External API Integrations:** GST/E-invoicing, B2B portals, payment gateways

### P2 - Medium Priority
1. WhatsApp/Email notification integration
2. Advanced reporting with PDF exports
3. Mobile-responsive improvements

### P3 - Refactoring
1. Break down `CRM.jsx` into smaller components
2. Move Pydantic models to `/app/backend/models/`
3. Sidebar enhancements (search, favorites)

---

## Session Update - January 2026 (Continued)

### P1/P2 Features Completed ✅

#### 1. Dynamic Form Rendering ✅
- **Created:** `useCustomFields` hook (`/app/frontend/src/hooks/useCustomFields.jsx`)
  - Fetches custom fields for any module from Power Settings
  - Groups fields by section
  - Provides initial values generator
  
- **Created:** `DynamicFormFields` component (`/app/frontend/src/components/DynamicFormFields.jsx`)
  - Renders 8+ field types dynamically: text, number, textarea, select, multiselect, checkbox, date, file
  - Supports section grouping with headers
  - Configurable column layout (1, 2, or 3 columns)
  - Help text popovers for fields
  
- **Integrated into:**
  - CRM Leads (`/app/frontend/src/pages/LeadsPage.jsx`) - Shows Business Info section with Industry, Revenue, Employees
  - Inventory Items (`/app/frontend/src/pages/Inventory.jsx`) - Custom Fields tab in item form
  - HRMS Employees (`/app/frontend/src/pages/HRMS.jsx`) - Custom Fields tab in employee form

#### 2. Document Editor (Canvas-Based) ✅
- **Location:** `/app/frontend/src/pages/DocumentEditor.jsx`
- **Templates:** Sales Invoice, Quotation, Purchase Order, Delivery Challan, Work Order
- **Element Types:** Text, Data Field, Image/Logo, Table, Line, Rectangle
- **Features:**
  - Drag-and-drop element positioning
  - Properties panel for editing (position, size, font, alignment)
  - Data field placeholders (company info, customer info, items, totals, bank)
  - Grid display for alignment
  - Zoom controls (50-150%)
  - Save, Preview, Export PDF buttons

#### 3. PDF & Excel Export ✅
- **Backend Endpoints:** (`/app/backend/routes/reports_analytics.py`)
  - `GET /api/analytics/export/pdf/{report_type}` - Generates styled PDF reports
  - `GET /api/analytics/export/excel/{report_type}` - Generates Excel workbooks
  - Report types: sales, inventory, customers
  - Supports period filter (today, week, month, quarter, year)
  
- **Frontend Integration:** (`/app/frontend/src/pages/ReportsDashboard.jsx`)
  - Export dropdown with PDF and Excel options
  - Separate sections for Sales, Inventory, and Customer reports
  - Downloads with timestamped filenames

- **Libraries Used:**
  - `reportlab` - PDF generation with tables, styling, colors
  - `xlsxwriter` - Excel workbook generation with formatting

### Test Results
- **Test Report:** `/app/test_reports/iteration_8.json`
- **Backend Tests:** 17/17 passed (100%)
- **Frontend Tests:** All UI features verified (100%)
- **Test File:** `/app/backend/tests/test_p1_p2_features.py`

### Architecture Updates
```
/app/frontend/src/
├── hooks/
│   └── useCustomFields.jsx     # NEW - Custom fields hook
├── components/
│   └── DynamicFormFields.jsx   # NEW - Dynamic form renderer
└── pages/
    ├── LeadsPage.jsx           # UPDATED - Dynamic fields
    ├── Inventory.jsx           # UPDATED - Dynamic fields tab
    ├── HRMS.jsx                # UPDATED - Dynamic fields tab
    └── ReportsDashboard.jsx    # UPDATED - Export dropdown
```

---

## Session Update - January 2026 (Major Feature Addition)

### New Features Implemented ✅

#### 1. Inter-User Chat System ✅
- **Backend:** `/app/backend/routes/chat.py`
- **Frontend:** `/app/frontend/src/pages/Chat.jsx`
- **Features:**
  - Direct Messages (1-on-1 chats)
  - Group Chats (create groups, add/remove members, admins)
  - Task Assignment from chat (create, assign, track status)
  - File/image attachments
  - Message reactions
  - Polling-based updates (5 second intervals)
  - Read receipts
- **API Endpoints:**
  - `GET /api/chat/conversations` - List all conversations
  - `GET /api/chat/messages/dm/{user_id}` - Get DM messages
  - `POST /api/chat/messages/dm/{user_id}` - Send DM
  - `POST /api/chat/groups` - Create group
  - `GET /api/chat/messages/group/{group_id}` - Get group messages
  - `GET/POST /api/chat/tasks` - Task management
  - `POST /api/chat/upload` - File uploads

#### 2. Drive System (Google Drive-style) ✅
- **Backend:** `/app/backend/routes/drive.py`
- **Frontend:** `/app/frontend/src/pages/Drive.jsx`
- **Features:**
  - File upload (docs, sheets, PDFs, images, videos)
  - Folder organization with nesting
  - File sharing with permission levels (view/edit)
  - Favorites, Recent files, Shared with me views
  - File preview (images, PDFs)
  - Storage quota tracking (5GB limit)
  - Grid/List view toggle
- **Storage:** `/app/uploads/drive/`
- **API Endpoints:**
  - `POST /api/drive/upload` - Upload files
  - `GET/POST /api/drive/folders` - Folder management
  - `GET /api/drive/files` - File listing with filters
  - `GET /api/drive/files/{id}/download` - Download file
  - `POST /api/drive/files/{id}/share` - Share file
  - `GET /api/drive/storage` - Storage stats

#### 3. Bulk Import System ✅
- **Backend:** `/app/backend/routes/bulk_import.py`
- **Frontend:** `/app/frontend/src/pages/BulkImport.jsx`
- **Import Types:**
  - Customers/Vendors (with GSTIN, contact, address)
  - Items/Products (with HSN, specs, pricing)
  - Opening Balance (debit/credit balances)
  - Opening Stock (item quantities by warehouse)
- **Features:**
  - Excel template downloads (.xlsx)
  - Upload with validation
  - Error reporting (missing fields, duplicates, not found)
  - Import guidelines and tips
- **API Endpoints:**
  - `GET /api/bulk-import/templates/{type}` - Download template
  - `POST /api/bulk-import/customers` - Import customers
  - `POST /api/bulk-import/items` - Import items
  - `POST /api/bulk-import/opening-balance` - Import balances
  - `POST /api/bulk-import/opening-stock` - Import stock

#### 4. GST E-Invoice & E-Way Bill ✅ (MOCKED)
- **Backend:** `/app/backend/routes/einvoice.py`
- **Frontend:** `/app/frontend/src/pages/EInvoice.jsx`
- **Features:**
  - IRN Generation (Mock mode - generates fake IRN)
  - QR Code generation for invoices
  - Bulk IRN generation
  - IRN cancellation (within 24 hours)
  - E-Way Bill generation for invoices > ₹50,000
  - API credentials management (NIC integration ready)
  - Activity logs tracking
- **Note:** Currently in **MOCK MODE**. Real NIC API credentials can be configured for production.
- **API Endpoints:**
  - `POST /api/einvoice/generate-irn` - Generate IRN
  - `POST /api/einvoice/generate-irn/bulk` - Bulk IRN
  - `POST /api/einvoice/cancel-irn` - Cancel IRN
  - `POST /api/einvoice/generate-eway-bill` - Generate E-Way Bill
  - `GET /api/einvoice/summary` - Summary stats
  - `GET /api/einvoice/pending-invoices` - Pending list

### Test Results
- **Test Report:** `/app/test_reports/iteration_9.json`
- **Backend Tests:** 21/21 passed (100%)
- **Frontend Tests:** All UI verified (100%)

### Navigation Updates
Added to sidebar: Chat, Drive, Bulk Import, E-Invoice

### Dependencies Added
- `pandas` - Excel file processing
- `openpyxl` - Excel template generation
- `qrcode[pil]` - QR code generation for E-Invoice


---

## Session Update - January 2026 (P0 Bug Fix & Refactoring)

### P0 Fix: Customization Tab ✅ FIXED
**File:** `/app/frontend/src/pages/Customization.jsx`

**Issue:** User reported "THE CUSTOMIZATION TAB IS ALSO NOT WORKING PROPERLY, MANY FUNCTIONS ARE EMPTY"

**Root Cause:** 
- Report Builder tab only showed static description text with non-functional "Create Report" button
- Missing tabs for Email Templates, Notifications
- Quick action cards were not clickable to switch tabs

**Fixes Implemented:**
1. **Report Builder Tab (NEW)**
   - Full CRUD functionality for report templates
   - Dynamic column selection based on module
   - Execute reports and view results in dialog
   - Module options: CRM, Inventory, Production, Accounts, HRMS, Quality
   - Chart type selection (bar, line, pie)

2. **Email Templates Tab (NEW)**
   - Pre-populated with 4 default templates: Welcome Email, Invoice, Payment Reminder, Order Confirmation
   - Create/Edit email templates with variable placeholders
   - Template activation/deactivation

3. **Notification Rules Tab (NEW)**
   - Pre-populated with 4 default rules: Low Stock Alert, Payment Overdue, Lead Assigned, WO Completed
   - Configure trigger events and notification channels (In-App, Email, SMS, WhatsApp)
   - Rule enable/disable toggle

4. **API Documentation Tab (ENHANCED)**
   - Added "Open Swagger UI" button linking to /docs
   - Added "Copy Base URL" button with clipboard functionality

5. **Import/Export Tab (NEW)**
   - Navigation links to Bulk Import and Reports pages
   - Supported import formats documentation

6. **Quick Cards (FIXED)**
   - All 6 cards now clickable and switch to corresponding tab
   - Visual highlight on selected card

**Bug Fixed by Testing Agent:**
- Create Report dialog crashed due to empty string value in SelectItem
- Fixed: Changed `<SelectItem value="">` to `<SelectItem value="none">`

### Test Results
- **Test Report:** `/app/test_reports/iteration_10.json`
- **Frontend Tests:** 100% pass rate
- **All 6 tabs verified functional:**
  - Custom Fields ✅
  - Report Builder ✅
  - Email Templates ✅
  - Notifications ✅
  - API Docs ✅
  - Import/Export ✅

### P2 Tasks Status
- **Backend Pydantic Models:** `/app/backend/models/schemas.py` created with comprehensive models
- **CRM.jsx Refactoring:** Deferred - file is 2235 lines but currently stable. Created `/app/frontend/src/components/crm/CRMOverview.jsx` as starting point

### Next Steps
1. Continue CRM.jsx component extraction (AccountsList, QuotationsList, SamplesList)
2. Update route files to import from centralized schemas.py
3. Add sidebar search/filter and favorites feature
4. Implement real-time WebSocket for Chat system

---

## Session Update - January 2026 (Grand Blueprint Implementation)

### New Features Implemented

#### 1. Dashboard Quick Actions Widget ✅
**File:** `/app/frontend/src/pages/Dashboard.jsx`

**Features:**
- **6 Quick Links:** Add Lead, Create Quotation, New Invoice, Run Report, Custom Fields, AI Dashboard
- **Action Items:** Shows count of items needing attention (overdue invoices, pending approvals, low stock, stalled WOs)
- **System Health Card:** Shows uptime status and link to Director Command Center
- **Smart Prioritization:** High-priority items highlighted in red/orange

#### 2. Autonomous Collector Module ✅ (The Revenue Hunter)
**Backend:** `/app/backend/routes/autonomous_collector.py`
**Frontend:** `/app/frontend/src/pages/AutonomousCollector.jsx`

**Features based on Grand Blueprint:**

**A. Debtor Segmentation**
- GOLD: Pays within terms, score 80-100
- SILVER: Occasional delays, score 50-79
- BRONZE: Frequent delays, score 20-49
- BLOCKED: Auto-blocked for non-payment, score 0-19
- Payment score calculation based on: credit days, overdue invoices, credit limit usage

**B. Emergency Controls ("The Nuke Button")**
- HALT_PRODUCTION: Stop all production
- FREEZE_ORDERS: Block new orders
- BLOCK_SHIPPING: Halt all shipments
- LOCKDOWN: Full business lockdown
- Configurable scope (All branches / Specific branch)
- Duration-based controls
- Director-only access

**C. Smart Payment Reminders**
- Auto-generated reminders for:
  - GENTLE_REMINDER: Invoices due within 3 days
  - OVERDUE_NOTICE: Invoices past due
  - URGENT_REMINDER: Invoices 30+ days overdue
- Pre-drafted WhatsApp/Email messages with customer details
- Priority classification (HIGH/MEDIUM)

**D. Collection Analytics**
- Total invoiced vs collected
- Collection efficiency percentage
- Average collection days
- Daily collection trend
- Period filters (week/month/quarter/year)

**E. Block/Unblock Debtors**
- Manual account blocking with reason
- Auto-block rules (3+ overdue invoices, ₹50K+ outstanding)
- Audit trail for all block/unblock actions

### Test Results
- **Test Report:** `/app/test_reports/iteration_11.json`
- **Backend Tests:** 100% (8/8 tests passed)
- **Frontend Tests:** 100% - All features verified

### API Endpoints Added
```
GET  /api/collector/debtors/segmentation
POST /api/collector/debtors/{id}/block
POST /api/collector/debtors/{id}/unblock
GET  /api/collector/reminders/pending
POST /api/collector/emergency/activate
POST /api/collector/emergency/deactivate/{id}
GET  /api/collector/emergency/status
GET  /api/collector/analytics/collection
GET  /api/collector/quick-actions
```

### Navigation Updates
- Added "Collector" link with Zap icon in sidebar (under Accounts)
- Route `/collector` mapped to AutonomousCollector page

---

## Session Update - January 2026 (Priority Tasks Batch)

### P2: Sidebar Search & Favorites ✅ COMPLETE
**File:** `/app/frontend/src/components/layout/MainLayout.jsx`

**Features:**
- **Search Bar:** Real-time filter for navigation items
- **Favorites:** Star/unstar menu items, stored in localStorage
- **Favorites Section:** Appears at top of sidebar when items are starred
- **Parent Group Display:** Shows parent group when searching nested items

### P3: Buying DNA Sales Hunter ✅ COMPLETE
**Backend:** `/app/backend/routes/buying_dna.py`
**Frontend:** `/app/frontend/src/pages/BuyingDNA.jsx`

**Features (From Grand Blueprint):**
- **Purchase Rhythm Analysis:** Calculates average order interval per customer
- **Urgency Scoring:** 
  - URGENT_FOLLOWUP: Overdue > 50% of avg interval
  - GENTLE_REMINDER: Any overdue
  - PRE_EMPTIVE_CHECK: 80%+ of avg interval passed
  - NO_ACTION: On track
- **WhatsApp Draft Messages:** Pre-written messages with customer name, days overdue
- **Follow-up Logging:** Track whatsapp_sent, call_made, email_sent actions
- **Summary Dashboard:** 4 cards showing counts per urgency level

**API Endpoints:**
```
GET  /api/buying-dna/patterns - All customer buying patterns
GET  /api/buying-dna/patterns/{account_id} - Single account pattern
GET  /api/buying-dna/dashboard - Dashboard summary
POST /api/buying-dna/followup-log - Log follow-up action
```

### P3: Real-time Chat ✅ COMPLETE
**Backend:** `/app/backend/routes/realtime_chat.py`
**Frontend:** Uses existing `/app/frontend/src/pages/Chat.jsx`

**Features:**
- **WebSocket Support:** Real-time messaging via `/api/realtime-chat/ws/{user_id}`
- **REST Fallback:** Full REST API for non-WebSocket clients
- **Room Types:** direct, group, channel
- **Typing Indicators:** Broadcast to room members
- **Read Receipts:** Track which users have read messages
- **Online Status:** Track and broadcast user online/offline status

**API Endpoints:**
```
WS   /api/realtime-chat/ws/{user_id} - WebSocket connection
GET  /api/realtime-chat/rooms - List user's chat rooms
POST /api/realtime-chat/rooms - Create new room
GET  /api/realtime-chat/rooms/{room_id}/messages - Get messages
POST /api/realtime-chat/rooms/{room_id}/messages - Send message (REST)
GET  /api/realtime-chat/online-users - List online users
```

### Test Results (Iteration 12)
- **Test Report:** `/app/test_reports/iteration_12.json`
- **Backend Tests:** 100% (9/9 tests passed)
- **Frontend Tests:** 100% - All features verified

### Navigation Updates
- Added "Buying DNA" link with DNA icon in sidebar
- Route `/buying-dna` mapped to BuyingDNA page

---

## Session Update - January 2026 (Customer Health Score)

### Customer Health Score Feature ✅ COMPLETE
**Backend:** `/app/backend/routes/customer_health.py`
**Frontend Page:** `/app/frontend/src/pages/CustomerHealth.jsx`
**Widget:** `/app/frontend/src/components/CustomerHealthWidget.jsx`

**Combined Analysis (From Grand Blueprint):**
- **Buying DNA Weight:** 40% (purchase rhythm analysis)
- **Debtor Segmentation Weight:** 60% (payment behavior)
- **Formula:** `health_score = buying_score * 0.4 + payment_score * 0.6`

**Health Status Levels:**
- CRITICAL: Score 0-39 (🔴)
- AT_RISK: Score 40-59 (🟠)
- HEALTHY: Score 60-79 (🟢)
- EXCELLENT: Score 80-100 (⭐)

**Features:**
- Unified customer health view combining buying + payment metrics
- Auto-generated risk factors based on analysis
- Auto-generated recommended actions
- Priority ranking (worst health first)
- WhatsApp/Phone quick actions
- Filter by status (CRITICAL, AT_RISK, HEALTHY, EXCELLENT)
- Search by customer name
- At-risk outstanding amount alert

**API Endpoints:**
```
GET /api/customer-health/scores - Full health scores list
GET /api/customer-health/scores/{id} - Single customer health
GET /api/customer-health/widget - Dashboard widget data
```

**UI Integration:**
- Widget added to CRM Overview page (`/crm`)
- Full page at `/customer-health`
- Navigation sidebar: "Customer Health" with Heart icon

### Test Results (Iteration 13)
- **Test Report:** `/app/test_reports/iteration_13.json`
- **Backend Tests:** 100% (7/7 tests passed)
- **Frontend Tests:** 100% - All features verified

---

## Session Update - January 2026 (PDF Generation)

### PDF Preview & Download Feature ✅ COMPLETE
**Backend:** `/app/backend/routes/pdf_generator.py`
**Frontend Updated:** `Accounts.jsx`, `CRM.jsx`

**Professional PDF Generation using ReportLab:**
- Company header with logo area, address, GSTIN
- Document title (TAX INVOICE, QUOTATION, etc.)
- Customer/Bill To section with GSTIN
- Line items table with HSN, Qty, Rate, Discount, Tax, Amount
- Totals section with subtotal, discount, GST breakdown (CGST/SGST)
- Bank details for payment
- Authorized Signatory footer

**API Endpoints:**
```
GET /api/pdf/invoice/{id}/pdf - Download Invoice PDF
GET /api/pdf/invoice/{id}/preview - Preview Invoice PDF (inline)
GET /api/pdf/quotation/{id}/pdf - Download Quotation PDF  
GET /api/pdf/quotation/{id}/preview - Preview Quotation PDF (inline)
GET /api/pdf/invoices/bulk-pdf?invoice_ids=id1,id2 - Bulk download
```

**Frontend Buttons Added:**
- **Accounts Invoice Table:** Eye (Preview), FileDown (Download), Printer (Print)
- **CRM Quotations Table:** Eye (Preview), FileDown (Download)

### Test Results (Iteration 14)
- **Test Report:** `/app/test_reports/iteration_14.json`
- **Backend Tests:** 100% (8/8 tests passed)
- **Frontend Tests:** 100% - All buttons verified

---

