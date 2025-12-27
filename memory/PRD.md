# AdhesiveFlow ERP - Product Requirements Document

## Overview
AdhesiveFlow ERP is a comprehensive enterprise resource planning system specifically designed for the adhesive tapes industry. The system integrates ERP, CRM, HRMS, and Accounting modules with AI-powered business intelligence.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with Role-Based Access Control (RBAC)

## Core Modules

### 1. CRM Module ✅ COMPLETED (Dec 27, 2025)
Full sales pipeline management from lead to order.

**Features Implemented:**
- **Leads Management**
  - Create/Edit/Delete leads with full field support
  - Fields: Company, Contact, Email, Phone, Mobile, Address, City, State, Pincode
  - Lead source tracking (IndiaMART, TradeIndia, Alibaba, Website, Referral, etc.)
  - Industry classification
  - Estimated value tracking
  - Lead status workflow (New → Contacted → Qualified → Converted/Lost)
  - Next follow-up date and activity tracking
  - Lead score system
  - Convert lead to account functionality
  - Search and filter capabilities

- **Accounts Management**
  - Full customer profile with GSTIN and PAN
  - Multiple shipping addresses support
  - Multiple contact persons with primary contact flag
  - Credit limit and credit days configuration
  - Credit control settings (Ignore/Warn/Block)
  - Payment terms configuration
  - Industry and location tracking
  - Soft delete (deactivation)

- **Quotations**
  - Multi-line item quotations
  - Auto-generated quote numbers (QT-YYYYMMDD-XXXXXX)
  - HSN code support
  - Per-line discount and tax rates
  - Header-level discount
  - Automatic tax calculation (CGST/SGST/IGST)
  - Grand total calculation
  - Validity date tracking
  - Transport and delivery terms
  - Status workflow (Draft → Sent → Accepted/Rejected/Expired)
  - Convert to Sales Order functionality

- **Samples Management**
  - Sample tracking with unique numbers (SMP-YYYYMMDD-XXXXXX)
  - Product specs and quantity tracking
  - Courier and tracking number
  - Expected delivery date
  - Feedback due date tracking
  - Feedback status (Pending/Positive/Negative/Needs Revision/No Response)
  - Sample return tracking with condition

- **CRM Dashboard**
  - Overview stats (Leads, Accounts, Quotations, Samples counts)
  - Quote conversion rate metric
  - Recent leads and quotations
  - Sales pipeline visualization

### 2. Inventory Module 🔄 IN PROGRESS
- Items Master (basic implementation exists)
- Pending: Stock tracking, transfers, warehouse management

### 3. Production Module 🔄 IN PROGRESS
- Work Orders (basic implementation exists)
- Pending: Multi-level BOM, scheduling, resource planning

### 4. Procurement Module ⏳ NOT STARTED
- Suppliers management
- Purchase Orders
- GRN (Goods Receipt Note)
- Landed cost calculation

### 5. Accounts Module ⏳ NOT STARTED
- Invoices and payments
- AR/AP aging reports
- GST reports
- Financial statements

### 6. HRMS Module ⏳ NOT STARTED
- Employee database
- Attendance tracking
- Leave management
- Payroll with PF/ESI/PT/TDS

### 7. Quality Module ⏳ NOT STARTED
- QC Inspections
- Customer complaints
- Batch traceability

## User Authentication
- Email: admin@adhesiveflow.com
- Password: admin123
- Roles: admin, user, viewer

## API Endpoints

### CRM APIs
- `POST /api/crm/leads` - Create lead
- `GET /api/crm/leads` - List leads (with filters)
- `GET /api/crm/leads/{id}` - Get lead
- `PUT /api/crm/leads/{id}` - Update lead
- `DELETE /api/crm/leads/{id}` - Delete lead
- `PUT /api/crm/leads/{id}/convert` - Convert to account

- `POST /api/crm/accounts` - Create account
- `GET /api/crm/accounts` - List accounts
- `GET /api/crm/accounts/{id}` - Get account
- `PUT /api/crm/accounts/{id}` - Update account
- `DELETE /api/crm/accounts/{id}` - Deactivate account
- `GET /api/crm/accounts/{id}/credit-check` - Check credit availability

- `POST /api/crm/quotations` - Create quotation
- `GET /api/crm/quotations` - List quotations
- `GET /api/crm/quotations/{id}` - Get quotation
- `PUT /api/crm/quotations/{id}` - Update quotation
- `PUT /api/crm/quotations/{id}/status` - Update status
- `POST /api/crm/quotations/{id}/convert-to-order` - Convert to order
- `DELETE /api/crm/quotations/{id}` - Delete quotation

- `POST /api/crm/samples` - Create sample
- `GET /api/crm/samples` - List samples
- `GET /api/crm/samples/{id}` - Get sample
- `PUT /api/crm/samples/{id}` - Update sample
- `PUT /api/crm/samples/{id}/dispatch` - Mark dispatched
- `PUT /api/crm/samples/{id}/feedback` - Update feedback
- `PUT /api/crm/samples/{id}/return` - Mark returned
- `DELETE /api/crm/samples/{id}` - Delete sample

- `GET /api/crm/stats/overview` - CRM dashboard stats

## Integrations (Planned)
- GST API - Auto-fetch customer data from GSTIN
- E-invoice / E-waybill APIs
- IndiaMart, Alibaba B2B portals
- WhatsApp and Email campaigns
- GPT-5.2 for AI-powered insights (using Emergent LLM Key)

## Reference Files
- **Backend Routes:** /app/backend/routes/
- **Frontend Pages:** /app/frontend/src/pages/
- **Shadcn Components:** /app/frontend/src/components/ui/
- **Test Reports:** /app/test_reports/

## Database Collections
- users
- leads
- accounts
- quotations
- samples
- sales_orders
- followups
- items
- work_orders
