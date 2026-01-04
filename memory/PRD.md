# AdhesiveFlow ERP - Product Requirements Document

## Overview
AdhesiveFlow ERP is a comprehensive enterprise resource planning system specifically designed for the adhesive tapes industry. The system integrates ERP, CRM, HRMS, and Accounting modules with AI-powered business intelligence.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, react-beautiful-dnd
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with Role-Based Access Control (RBAC)

## Core Modules Status

### 1. CRM Module ✅ COMPLETED (Dec 27, 2025)
Full sales pipeline management from lead to order.

**Features Implemented:**
- Leads Management with Kanban Board
- Accounts Management with GSTIN validation
- Quotations with multi-line items
- Samples tracking
- Advanced CRM Dashboard with analytics

### 2. Inventory Module ✅ COMPLETED (Jan 4, 2026)
Multi-location stock management and tracking.

**Features Implemented:**
- **Inventory Dashboard** - Stats display (Items, Warehouses, Low Stock, Transfers, Stock Value)
- **Item Master** - Full CRUD operations
  - Item codes, names, categories (Raw Material, Semi-Finished, Finished Goods, Packaging)
  - Item types specific to adhesive tapes (BOPP, Masking, Double-Sided, Cloth, PVC, Foam)
  - Specifications (thickness, width, length, color, adhesive type, base material, grade)
  - Pricing (standard cost, selling price)
  - Inventory settings (reorder level, safety stock, lead time, shelf life)
- **Warehouses** - Create and manage multiple warehouse locations
- **Stock Balance** - View stock levels across warehouses, filter by warehouse or low stock
- **Stock Transfers** - Create inter-warehouse transfers, track status (draft, in_transit, received)
- **Stock Ledger** - Transaction history for each item

### 3. Procurement Module ✅ COMPLETED (Jan 4, 2026)
Supplier management and purchase order processing.

**Features Implemented:**
- **Procurement Dashboard** - Stats display (Suppliers, POs, Pending POs, GRNs, PO Value, Top Suppliers)
- **Suppliers** - Full CRUD operations
  - Supplier codes, names, types (Raw Material, Packaging, Services, Import)
  - Contact details (person, email, phone, mobile)
  - Address information (city, state, pincode, country)
  - Tax info (GSTIN, PAN)
  - Banking details (bank name, account, IFSC)
  - Credit terms (payment terms, credit limit)
- **Purchase Orders** - Full PO lifecycle
  - Multi-line items with quantity, unit price, tax %, discount %
  - Auto-calculation of subtotal, discount, taxable amount, CGST/SGST/IGST, grand total
  - Status management (draft → sent → partial → received)
  - Warehouse assignment
  - Payment and delivery terms
- **GRN (Goods Received Notes)**
  - Create GRN from sent POs
  - Receive quantities with accept/reject tracking
  - Batch number and expiry date
  - Invoice details (number, date, amount)
  - Transport details (LR No, Vehicle No)
  - Approve GRN to automatically update stock levels

### 4. Master Data Management ✅ COMPLETED
- Editable dropdowns for all categories
- Customizable document number series

### 5. Permissions System ✅ COMPLETED
- Role-based access control (Admin, Manager, Salesperson, Accountant, Viewer)
- Customizable permissions per user

### 6. GST Utilities ✅ COMPLETED
- GSTIN validation and state extraction
- Ready for paid GST API integration

## API Endpoints Summary

### Inventory APIs
- `GET /api/inventory/stats/overview` - Dashboard stats
- `GET/POST /api/inventory/items` - Item CRUD
- `GET/PUT/DELETE /api/inventory/items/{id}` - Item operations
- `GET/POST /api/inventory/warehouses` - Warehouse management
- `GET /api/inventory/stock/balance` - Stock levels
- `GET /api/inventory/stock/ledger/{item_id}` - Transaction history
- `POST /api/inventory/stock/entry` - Record stock transaction
- `GET/POST /api/inventory/transfers` - Stock transfers
- `PUT /api/inventory/transfers/{id}/issue` - Issue transfer
- `PUT /api/inventory/transfers/{id}/receive` - Receive transfer

### Procurement APIs
- `GET /api/procurement/stats/overview` - Dashboard stats
- `GET/POST /api/procurement/suppliers` - Supplier CRUD
- `GET/PUT/DELETE /api/procurement/suppliers/{id}` - Supplier operations
- `GET/POST /api/procurement/purchase-orders` - PO management
- `GET /api/procurement/purchase-orders/{id}` - Get single PO
- `PUT /api/procurement/purchase-orders/{id}/status` - Update PO status
- `GET/POST /api/procurement/grn` - GRN management
- `PUT /api/procurement/grn/{id}/approve` - Approve GRN (updates stock)

## Remaining Modules (Not Started)

### Priority 1 - Upcoming
- **Accounts Module** - Invoices, Payments, AR/AP aging, GST reports
- **HRMS Module** - Employees, Attendance, Leave, Payroll (PF/ESI/PT/TDS)
- **Quality Module** - QC Inspections, Complaints, Batch Traceability

### Priority 2 - Future
- **Customization** - Print layout editor, document templates
- **Integrations** - GST API, E-invoicing, E-waybill, IndiaMart, Alibaba
- **AI Dashboard** - GPT-5.2 powered business intelligence

## Test Results (Jan 4, 2026)
- **Backend Tests:** 30/30 passed (100%)
- **Frontend Tests:** All pages rendering correctly
- **Full Flow Tested:** Supplier → PO → GRN → Stock Update

## Login Credentials
- Email: admin@adhesiveflow.com
- Password: admin123

## File Structure
```
/app/
├── backend/
│   ├── routes/
│   │   ├── inventory.py    # ✅ Complete
│   │   ├── procurement.py  # ✅ Complete
│   │   ├── crm.py          # ✅ Complete
│   │   ├── master_data.py  # ✅ Complete
│   │   └── permissions.py  # ✅ Complete
│   └── tests/
│       └── test_inventory_procurement.py
├── frontend/
│   └── src/
│       └── pages/
│           ├── Inventory.js    # ✅ Complete
│           ├── Procurement.js  # ✅ Complete
│           ├── CRM.js          # ✅ Complete
│           └── LeadsPage.js    # ✅ Complete
└── memory/
    └── PRD.md
```
