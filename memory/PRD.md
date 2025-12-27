# AdhesiveFlow ERP - Product Requirements Document

## Overview
AdhesiveFlow ERP is a comprehensive enterprise resource planning system specifically designed for the adhesive tapes industry. The system integrates ERP, CRM, HRMS, and Accounting modules with AI-powered business intelligence.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, react-beautiful-dnd
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with Role-Based Access Control (RBAC)

## Core Modules

### 1. CRM Module ✅ COMPLETED (Dec 27, 2025)
Full sales pipeline management from lead to order.

**Features Implemented:**

#### Leads Management (with Kanban Board)
- **Kanban View** - Drag-drop leads across 7 stages: New → Contacted → Qualified → Proposal → Negotiation → Converted → Lost
- **List View** - Traditional table view with advanced filters
- Full CRUD with all fields from Excel specs
- Lead source tracking with **editable dropdowns**
- Industry classification with **editable dropdowns**
- Status workflow with drag-drop movement
- Follow-up tracking and lead scoring
- Advanced filters: Status, Source, Industry, City, State, Date range
- Permission-based data visibility (users see only their assigned leads)

#### Accounts Management
- Full customer profile with **GSTIN auto-validation**
- Auto-fill state from GSTIN (extracts state code from first 2 digits)
- Auto-extract PAN from GSTIN
- Multiple shipping addresses support
- Multiple contact persons with primary contact flag
- Credit limit, credit days, credit control (Ignore/Warn/Block)
- **Salesperson assignment** tracking
- Outstanding amount tracking (receivable/payable)
- Average payment days calculation
- City and state filters
- Permission-based data visibility

#### Quotations
- Multi-line item quotations with HSN codes
- Per-item tax/discount + header discount
- Auto tax calculations (CGST/SGST/IGST)
- Transport and delivery terms
- Status workflow with convert-to-order

#### Samples
- Sample tracking with feedback management
- Courier and tracking info
- Feedback status workflow

### 2. Master Data Management ✅ NEW
- **Editable Dropdowns** for all categories:
  - Lead sources, Lead statuses, Industries
  - Payment terms, Credit control options
  - Transport terms, Units of measure
  - Tax rates, Couriers, Sample purposes
  - Quotation statuses, Follow-up types
  - Account types, Designations
- Add new options from any dropdown
- Admin/Manager can manage master data

### 3. Number Series Configuration ✅ NEW
- Customizable document number formats
- Prefix, suffix, separator configuration
- Year format options (YYYY, YY, YYYYMM, etc.)
- Padding configuration
- Auto-reset yearly/monthly

### 4. Permissions System ✅ NEW
- **Role-based access control** with 5 default roles:
  - Admin (full access)
  - Manager (team data access)
  - Salesperson (own data only)
  - Accountant (finance modules)
  - Viewer (read-only)
- **Customizable permissions per user**
- **Data visibility levels**: Own, Team, Location, All
- Module-level permissions: View, Create, Edit, Delete, Export, Approve

### 5. GST Utilities ✅ NEW
- GSTIN validation (format check)
- State extraction from GSTIN code
- PAN extraction from GSTIN
- Indian states reference with GST codes
- Ready for paid GST API integration

## API Endpoints (New)

### Master Data APIs
- `GET /api/master-data/categories` - List all categories
- `GET /api/master-data/category/{category}` - Get items for category
- `POST /api/master-data/category/{category}` - Add item to category
- `PUT /api/master-data/item/{id}` - Update item
- `DELETE /api/master-data/item/{id}` - Delete item

### Number Series APIs
- `GET /api/master-data/number-series` - List all series
- `POST /api/master-data/number-series` - Create/update series
- `POST /api/master-data/number-series/generate/{type}` - Generate next number

### Permissions APIs
- `GET /api/permissions/roles` - List all roles
- `POST /api/permissions/roles` - Create role
- `PUT /api/permissions/roles/{name}` - Update role
- `GET /api/permissions/users/{id}/access` - Get user access
- `PUT /api/permissions/users/{id}/access` - Update user access
- `GET /api/permissions/check/{module}/{action}` - Check permission

### CRM New APIs
- `GET /api/crm/leads/kanban/view` - Get Kanban data
- `PUT /api/crm/leads/{id}/move` - Move lead status (drag-drop)
- `GET /api/crm/accounts/gst-lookup/{gstin}` - Validate GSTIN

## Remaining Work

### Priority 2 (Next)
- Accounts enhancement with outstanding display in table
- Complete filter implementation across all modules
- Number series integration in documents

### Priority 3
- Module-specific dashboards with analytics
- Document print layout customization
- Salesperson name on printed documents

### Future
- Full 3rd party integrations (GST portal, E-invoice)
- AI-powered dashboard
- Other modules (Inventory, Production, Procurement, etc.)

## Login Credentials
- Email: admin@adhesiveflow.com
- Password: admin123
