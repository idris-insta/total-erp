"""
Field Registry - The Command Registry Engine
Metadata-Driven Field Configuration System for all modules
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from server import db, get_current_user

router = APIRouter()

# ==================== PYDANTIC MODELS ====================

class FieldOption(BaseModel):
    """Single dropdown option"""
    value: str
    label: str
    color: Optional[str] = None  # For stage badges, status colors
    is_default: Optional[bool] = False
    is_active: Optional[bool] = True
    order: Optional[int] = 0


class FieldConfig(BaseModel):
    """Field configuration for a module entity"""
    field_name: str  # Internal name (snake_case)
    field_label: str  # Display label
    field_type: str  # text, number, date, select, multiselect, checkbox, textarea, phone, email, currency, auto
    section: Optional[str] = "default"  # Group fields by section
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    is_required: Optional[bool] = False
    is_readonly: Optional[bool] = False
    is_searchable: Optional[bool] = False
    is_filterable: Optional[bool] = False
    show_in_list: Optional[bool] = True
    show_in_form: Optional[bool] = True
    order: Optional[int] = 0
    options: Optional[List[FieldOption]] = None  # For select/multiselect
    default_value: Optional[Any] = None
    validation: Optional[Dict[str, Any]] = None  # min, max, pattern, etc.
    auto_fill_source: Optional[str] = None  # e.g., "pincode" for auto-filling state/city
    depends_on: Optional[str] = None  # Field dependency
    width: Optional[str] = "full"  # full, half, third


class ModuleEntityConfig(BaseModel):
    """Configuration for a module entity (e.g., CRM > Leads)"""
    module: str  # crm, inventory, accounts, etc.
    entity: str  # leads, accounts, quotations, items, etc.
    entity_label: str
    fields: List[FieldConfig]
    kanban_stages: Optional[List[FieldOption]] = None  # For entities with Kanban view
    list_display_fields: Optional[List[str]] = None  # Fields to show in list view
    created_by: Optional[str] = None


class MasterListConfig(BaseModel):
    """Master list configuration"""
    master_type: str  # customer, supplier, item, item_code, price, machine, employee, expense, report_type
    master_label: str
    description: Optional[str] = None
    fields: List[FieldConfig]


# ==================== API ENDPOINTS ====================

@router.get("/modules")
async def get_available_modules(current_user: dict = Depends(get_current_user)):
    """Get list of available modules and entities"""
    modules = {
        "crm": {
            "label": "CRM",
            "entities": {
                "leads": "Leads",
                "accounts": "Customer Accounts",
                "quotations": "Quotations",
                "samples": "Samples"
            }
        },
        "inventory": {
            "label": "Inventory",
            "entities": {
                "items": "Items/Products",
                "stock": "Stock Entries",
                "warehouses": "Warehouses"
            }
        },
        "accounts": {
            "label": "Accounts",
            "entities": {
                "invoices": "Invoices",
                "payments": "Payments",
                "ledger": "Ledger"
            }
        },
        "production": {
            "label": "Production",
            "entities": {
                "work_orders": "Work Orders",
                "batches": "Batches"
            }
        },
        "procurement": {
            "label": "Procurement",
            "entities": {
                "purchase_orders": "Purchase Orders",
                "grn": "Goods Receipt Notes"
            }
        },
        "hrms": {
            "label": "HRMS",
            "entities": {
                "employees": "Employees",
                "attendance": "Attendance",
                "payroll": "Payroll"
            }
        }
    }
    return modules


@router.get("/masters")
async def get_master_types(current_user: dict = Depends(get_current_user)):
    """Get list of master types"""
    masters = [
        {"type": "customer", "label": "Customer Master", "description": "The Revenue Base - GSTIN, Branch, Buying DNA, Credit Limit"},
        {"type": "supplier", "label": "Supplier Master", "description": "The Sourcing Base - Material Category, Lead Time, Reliability"},
        {"type": "item", "label": "Item Master", "description": "The Physics Base - Base Category, UOM, Technical Specs"},
        {"type": "item_code", "label": "Item Code Master", "description": "The Inventory Logic - Internal SKU, Barcode, Warehouse Location"},
        {"type": "price", "label": "Price Master", "description": "The Margin Protector - Customer Pricing, Volume Discounts, MSP"},
        {"type": "machine", "label": "Machine Master", "description": "The Plant Heart - Machine Name, Design Capacity, Maintenance Cycle"},
        {"type": "employee", "label": "Employee Master", "description": "The Accountability Base - Role, Biometric ID, Department, KPIs"},
        {"type": "expense", "label": "Expense Master", "description": "The Leakage Tracker - Category, Budget Cap, Branch Allocation"},
        {"type": "report_type", "label": "Report Type List", "description": "The Executive View - Frequency, Recipients, KPI Focus"}
    ]
    return masters


# ==================== FIELD CONFIGURATION CRUD ====================

@router.post("/config")
async def save_field_config(config: ModuleEntityConfig, current_user: dict = Depends(get_current_user)):
    """Save field configuration for a module entity (Admin only)"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can configure fields")
    
    # Convert to dict and add metadata
    config_dict = config.model_dump()
    config_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    config_dict['updated_by'] = current_user['id']
    
    # Check if config already exists
    existing = await db.field_configurations.find_one({
        'module': config.module,
        'entity': config.entity
    })
    
    if existing:
        # Update existing
        config_dict['created_at'] = existing.get('created_at', config_dict['updated_at'])
        config_dict['created_by'] = existing.get('created_by', current_user['id'])
        await db.field_configurations.update_one(
            {'module': config.module, 'entity': config.entity},
            {'$set': config_dict}
        )
    else:
        # Create new
        config_dict['id'] = str(uuid.uuid4())
        config_dict['created_at'] = config_dict['updated_at']
        config_dict['created_by'] = current_user['id']
        await db.field_configurations.insert_one(config_dict)
    
    return {"message": "Configuration saved successfully", "module": config.module, "entity": config.entity}


@router.get("/config/{module}/{entity}")
async def get_field_config(module: str, entity: str, current_user: dict = Depends(get_current_user)):
    """Get field configuration for a module entity"""
    config = await db.field_configurations.find_one(
        {'module': module, 'entity': entity},
        {'_id': 0}
    )
    
    if not config:
        # Return default config
        default = await get_default_config(module, entity)
        return default
    
    return config


@router.get("/config/{module}")
async def get_module_configs(module: str, current_user: dict = Depends(get_current_user)):
    """Get all field configurations for a module"""
    configs = await db.field_configurations.find(
        {'module': module},
        {'_id': 0}
    ).to_list(100)
    
    return configs


@router.delete("/config/{module}/{entity}")
async def reset_field_config(module: str, entity: str, current_user: dict = Depends(get_current_user)):
    """Reset field configuration to default (Admin only)"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can reset configurations")
    
    await db.field_configurations.delete_one({'module': module, 'entity': entity})
    return {"message": "Configuration reset to default", "module": module, "entity": entity}


# ==================== DROPDOWN OPTIONS MANAGEMENT ====================

@router.post("/options/{module}/{entity}/{field_name}")
async def save_field_options(
    module: str, 
    entity: str, 
    field_name: str, 
    options: List[FieldOption],
    current_user: dict = Depends(get_current_user)
):
    """Save dropdown options for a specific field"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can configure options")
    
    # Get existing config
    config = await db.field_configurations.find_one(
        {'module': module, 'entity': entity}
    )
    
    if not config:
        raise HTTPException(status_code=404, detail="Field configuration not found. Please save the entity config first.")
    
    # Update the specific field's options
    fields = config.get('fields', [])
    updated = False
    for field in fields:
        if field.get('field_name') == field_name:
            field['options'] = [opt.model_dump() for opt in options]
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail=f"Field '{field_name}' not found in configuration")
    
    await db.field_configurations.update_one(
        {'module': module, 'entity': entity},
        {'$set': {'fields': fields, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Options saved successfully", "field": field_name, "options_count": len(options)}


@router.get("/options/{module}/{entity}/{field_name}")
async def get_field_options(module: str, entity: str, field_name: str, current_user: dict = Depends(get_current_user)):
    """Get dropdown options for a specific field"""
    config = await db.field_configurations.find_one(
        {'module': module, 'entity': entity},
        {'_id': 0}
    )
    
    if not config:
        # Return default options
        default_config = await get_default_config(module, entity)
        config = default_config
    
    for field in config.get('fields', []):
        if field.get('field_name') == field_name:
            return field.get('options', [])
    
    return []


# ==================== KANBAN STAGES MANAGEMENT ====================

@router.post("/stages/{module}/{entity}")
async def save_kanban_stages(
    module: str,
    entity: str,
    stages: List[FieldOption],
    current_user: dict = Depends(get_current_user)
):
    """Save Kanban stages for an entity"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can configure stages")
    
    stages_data = [stage.model_dump() for stage in stages]
    
    await db.field_configurations.update_one(
        {'module': module, 'entity': entity},
        {
            '$set': {
                'kanban_stages': stages_data,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": "Stages saved successfully", "stages_count": len(stages)}


@router.get("/stages/{module}/{entity}")
async def get_kanban_stages(module: str, entity: str, current_user: dict = Depends(get_current_user)):
    """Get Kanban stages for an entity"""
    config = await db.field_configurations.find_one(
        {'module': module, 'entity': entity},
        {'_id': 0, 'kanban_stages': 1}
    )
    
    if config and config.get('kanban_stages'):
        return config['kanban_stages']
    
    # Return default stages for leads
    if module == 'crm' and entity == 'leads':
        return get_default_lead_stages()
    
    return []


# ==================== DEFAULT CONFIGURATIONS ====================

def get_default_lead_stages():
    """Default Kanban stages for Leads"""
    return [
        {"value": "hot_leads", "label": "Hot Leads", "color": "red", "order": 0, "is_active": True},
        {"value": "cold_leads", "label": "Cold Leads", "color": "blue", "order": 1, "is_active": True},
        {"value": "contacted", "label": "Contacted", "color": "yellow", "order": 2, "is_active": True},
        {"value": "qualified", "label": "Qualified", "color": "green", "order": 3, "is_active": True},
        {"value": "proposal", "label": "Proposal", "color": "purple", "order": 4, "is_active": True},
        {"value": "negotiation", "label": "Negotiation", "color": "orange", "order": 5, "is_active": True},
        {"value": "converted", "label": "Converted", "color": "emerald", "order": 6, "is_active": True},
        {"value": "customer", "label": "Customer", "color": "teal", "order": 7, "is_active": True},
        {"value": "lost", "label": "Lost", "color": "slate", "order": 8, "is_active": True}
    ]


async def get_default_config(module: str, entity: str):
    """Get default field configuration for a module entity"""
    
    if module == 'crm' and entity == 'leads':
        return {
            "module": "crm",
            "entity": "leads",
            "entity_label": "Leads",
            "kanban_stages": get_default_lead_stages(),
            "fields": [
                # Basic Info
                {"field_name": "company_name", "field_label": "Company Name", "field_type": "text", "section": "basic", "is_required": True, "show_in_list": True, "order": 1},
                {"field_name": "contact_person", "field_label": "Contact Person", "field_type": "text", "section": "basic", "is_required": True, "show_in_list": True, "order": 2},
                {"field_name": "email", "field_label": "Email", "field_type": "email", "section": "basic", "is_required": False, "show_in_list": False, "order": 3},
                {"field_name": "phone", "field_label": "Phone", "field_type": "phone", "section": "basic", "is_required": False, "show_in_list": False, "order": 4},
                {"field_name": "source", "field_label": "Source", "field_type": "select", "section": "basic", "is_required": False, "show_in_list": True, "order": 5,
                    "options": [
                        {"value": "indiamart", "label": "IndiaMart", "order": 0},
                        {"value": "tradeindia", "label": "TradeIndia", "order": 1},
                        {"value": "alibaba", "label": "Alibaba", "order": 2},
                        {"value": "google", "label": "Google", "order": 3},
                        {"value": "exhibition", "label": "Exhibition", "order": 4},
                        {"value": "cold_call", "label": "Cold Call", "order": 5},
                        {"value": "referral", "label": "Referral", "order": 6},
                        {"value": "website", "label": "Website", "order": 7},
                        {"value": "linkedin", "label": "LinkedIn", "order": 8},
                        {"value": "other", "label": "Other", "order": 9}
                    ]
                },
                # Address
                {"field_name": "address", "field_label": "Address", "field_type": "textarea", "section": "address", "is_required": False, "show_in_list": False, "order": 6},
                {"field_name": "country", "field_label": "Country", "field_type": "text", "section": "address", "default_value": "India", "is_required": False, "order": 7},
                {"field_name": "pincode", "field_label": "Pincode", "field_type": "text", "section": "address", "is_required": False, "auto_fill_source": "pincode", "order": 8},
                {"field_name": "state", "field_label": "State", "field_type": "text", "section": "address", "is_required": False, "order": 9},
                {"field_name": "district", "field_label": "District", "field_type": "text", "section": "address", "is_required": False, "order": 10},
                {"field_name": "city", "field_label": "City", "field_type": "text", "section": "address", "is_required": False, "show_in_list": True, "order": 11},
                # Classification
                {"field_name": "customer_type", "field_label": "Customer Type", "field_type": "select", "section": "classification", "is_required": False, "order": 12,
                    "options": [
                        {"value": "manufacturer", "label": "Manufacturer", "order": 0},
                        {"value": "trader", "label": "Trader", "order": 1},
                        {"value": "distributor", "label": "Distributor", "order": 2},
                        {"value": "retailer", "label": "Retailer", "order": 3},
                        {"value": "end_user", "label": "End User", "order": 4}
                    ]
                },
                {"field_name": "assigned_to", "field_label": "Assigned To", "field_type": "select", "section": "classification", "is_required": False, "order": 13,
                    "options": []  # Will be populated from users
                },
                {"field_name": "stage", "field_label": "Stage", "field_type": "select", "section": "classification", "is_required": False, "show_in_list": True, "order": 14,
                    "options": get_default_lead_stages()
                },
                {"field_name": "industry", "field_label": "Industry", "field_type": "select", "section": "classification", "is_required": False, "order": 15,
                    "options": [
                        {"value": "manufacturing", "label": "Manufacturing", "order": 0},
                        {"value": "packaging", "label": "Packaging", "order": 1},
                        {"value": "construction", "label": "Construction", "order": 2},
                        {"value": "automotive", "label": "Automotive", "order": 3},
                        {"value": "electronics", "label": "Electronics", "order": 4},
                        {"value": "fmcg", "label": "FMCG", "order": 5},
                        {"value": "pharmaceutical", "label": "Pharmaceutical", "order": 6},
                        {"value": "textile", "label": "Textile", "order": 7},
                        {"value": "other", "label": "Other", "order": 8}
                    ]
                },
                {"field_name": "products_of_interest", "field_label": "Products of Interest", "field_type": "multiselect", "section": "classification", "is_required": False, "order": 16,
                    "options": [
                        {"value": "bopp_tape", "label": "BOPP Tape", "order": 0},
                        {"value": "masking_tape", "label": "Masking Tape", "order": 1},
                        {"value": "double_sided", "label": "Double Sided Tape", "order": 2},
                        {"value": "cloth_tape", "label": "Cloth Tape", "order": 3},
                        {"value": "pvc_tape", "label": "PVC Tape", "order": 4},
                        {"value": "foam_tape", "label": "Foam Tape", "order": 5},
                        {"value": "custom", "label": "Custom/Special", "order": 6}
                    ]
                },
                # Follow-up
                {"field_name": "estimated_value", "field_label": "Estimated Value", "field_type": "select", "section": "followup", "is_required": False, "order": 17,
                    "options": [
                        {"value": "below_50k", "label": "Below ₹50K", "order": 0},
                        {"value": "50k_1l", "label": "₹50K - ₹1L", "order": 1},
                        {"value": "1l_5l", "label": "₹1L - ₹5L", "order": 2},
                        {"value": "5l_10l", "label": "₹5L - ₹10L", "order": 3},
                        {"value": "above_10l", "label": "Above ₹10L", "order": 4}
                    ]
                },
                {"field_name": "next_followup_date", "field_label": "Next Follow-up Date", "field_type": "date", "section": "followup", "is_required": False, "order": 18},
                {"field_name": "followup_activity", "field_label": "Follow-up Activity", "field_type": "select", "section": "followup", "is_required": False, "order": 19,
                    "options": [
                        {"value": "call", "label": "Call", "order": 0},
                        {"value": "email", "label": "Email", "order": 1},
                        {"value": "meeting", "label": "Meeting", "order": 2},
                        {"value": "visit", "label": "Site Visit", "order": 3},
                        {"value": "sample", "label": "Send Sample", "order": 4},
                        {"value": "quote", "label": "Send Quote", "order": 5}
                    ]
                },
                {"field_name": "notes", "field_label": "Notes", "field_type": "textarea", "section": "followup", "is_required": False, "order": 20}
            ],
            "list_display_fields": ["company_name", "contact_person", "city", "source", "stage", "estimated_value"]
        }
    
    elif module == 'crm' and entity == 'accounts':
        return {
            "module": "crm",
            "entity": "accounts",
            "entity_label": "Customer Accounts",
            "fields": [
                # Display Fields
                {"field_name": "customer_name", "field_label": "Company Name", "field_type": "text", "section": "display", "is_required": True, "show_in_list": True, "order": 1},
                {"field_name": "billing_city", "field_label": "City / State", "field_type": "text", "section": "display", "show_in_list": True, "order": 2},
                {"field_name": "receivable_amount", "field_label": "Total Outstanding", "field_type": "currency", "section": "display", "show_in_list": True, "is_readonly": True, "order": 3},
                {"field_name": "credit_limit", "field_label": "Credit Limit", "field_type": "currency", "section": "display", "show_in_list": True, "order": 4},
                {"field_name": "credit_days", "field_label": "Credit Days", "field_type": "number", "section": "display", "show_in_list": True, "order": 5},
                {"field_name": "avg_payment_days", "field_label": "Avg Payment Days", "field_type": "number", "section": "display", "show_in_list": True, "is_readonly": True, "order": 6},
                {"field_name": "sales_person", "field_label": "Sales Person", "field_type": "select", "section": "display", "show_in_list": True, "order": 7},
                {"field_name": "monthly_avg_turnover", "field_label": "Monthly Avg Turnover", "field_type": "currency", "section": "display", "show_in_list": True, "is_readonly": True, "order": 8},
                {"field_name": "ytd_turnover", "field_label": "YTD Turnover", "field_type": "currency", "section": "display", "show_in_list": True, "is_readonly": True, "order": 9},
                {"field_name": "gstin", "field_label": "GST No", "field_type": "text", "section": "display", "show_in_list": True, "order": 10},
                {"field_name": "phone", "field_label": "Phone No", "field_type": "phone", "section": "display", "show_in_list": True, "order": 11},
                # Basic Info
                {"field_name": "opening_balance", "field_label": "Opening Balance", "field_type": "currency", "section": "basic", "is_required": False, "show_in_form": True, "order": 12, "help_text": "Enter opening receivable balance"},
                {"field_name": "industry", "field_label": "Industry", "field_type": "select", "section": "basic", "is_required": False, "show_in_form": True, "order": 13,
                    "options": [
                        {"value": "manufacturing", "label": "Manufacturing"},
                        {"value": "packaging", "label": "Packaging"},
                        {"value": "construction", "label": "Construction"},
                        {"value": "automotive", "label": "Automotive"},
                        {"value": "electronics", "label": "Electronics"},
                        {"value": "fmcg", "label": "FMCG"},
                        {"value": "pharmaceutical", "label": "Pharmaceutical"},
                        {"value": "other", "label": "Other"}
                    ]
                },
                {"field_name": "pan", "field_label": "PAN No", "field_type": "text", "section": "basic", "order": 14},
                {"field_name": "website", "field_label": "Website", "field_type": "text", "section": "basic", "order": 15},
                {"field_name": "aadhar", "field_label": "Aadhar No", "field_type": "text", "section": "basic", "order": 16},
                {"field_name": "bank_details", "field_label": "Bank Details", "field_type": "textarea", "section": "basic", "order": 17},
                # Address
                {"field_name": "billing_address", "field_label": "Billing Address", "field_type": "textarea", "section": "address", "is_required": True, "order": 17},
                {"field_name": "shipping_same_as_billing", "field_label": "Shipping Same as Billing", "field_type": "checkbox", "section": "address", "order": 18},
                {"field_name": "shipping_address", "field_label": "Shipping Address", "field_type": "textarea", "section": "address", "order": 19},
                {"field_name": "billing_country", "field_label": "Country", "field_type": "text", "section": "address", "default_value": "India", "order": 20},
                {"field_name": "billing_pincode", "field_label": "Pincode", "field_type": "text", "section": "address", "auto_fill_source": "pincode", "order": 21},
                {"field_name": "billing_state", "field_label": "State", "field_type": "text", "section": "address", "order": 22},
                {"field_name": "billing_district", "field_label": "District", "field_type": "text", "section": "address", "order": 23},
                # Contacts
                {"field_name": "contact_name", "field_label": "Contact Name", "field_type": "text", "section": "contacts", "order": 24},
                {"field_name": "contact_designation", "field_label": "Designation", "field_type": "text", "section": "contacts", "order": 25},
                {"field_name": "contact_phone", "field_label": "Phone", "field_type": "phone", "section": "contacts", "order": 26},
                {"field_name": "contact_email", "field_label": "Email", "field_type": "email", "section": "contacts", "order": 27},
                # Credit Terms
                {"field_name": "credit_control", "field_label": "Credit Control", "field_type": "select", "section": "credit", "order": 28,
                    "options": [
                        {"value": "ignore", "label": "Ignore (No Check)"},
                        {"value": "warn", "label": "Warn (Show Alert)"},
                        {"value": "block", "label": "Block (Prevent Order)"}
                    ]
                }
            ],
            "list_display_fields": ["customer_name", "billing_city", "receivable_amount", "credit_limit", "gstin", "phone"]
        }
    
    elif module == 'crm' and entity == 'quotations':
        return {
            "module": "crm",
            "entity": "quotations",
            "entity_label": "Quotations",
            "fields": [
                # Display Fields
                {"field_name": "quote_number", "field_label": "Quotation No", "field_type": "auto", "section": "display", "is_required": True, "show_in_list": True, "is_readonly": True, "order": 1},
                {"field_name": "account_name", "field_label": "Company Name", "field_type": "select", "section": "display", "is_required": True, "show_in_list": True, "order": 2},
                {"field_name": "quote_date", "field_label": "Date", "field_type": "date", "section": "display", "is_required": True, "show_in_list": True, "order": 3},
                {"field_name": "grand_total", "field_label": "Amount", "field_type": "currency", "section": "display", "show_in_list": True, "is_readonly": True, "order": 4},
                {"field_name": "status", "field_label": "Status", "field_type": "select", "section": "display", "show_in_list": True, "order": 5,
                    "options": [
                        {"value": "draft", "label": "Draft", "color": "slate"},
                        {"value": "sent", "label": "Sent", "color": "blue"},
                        {"value": "accepted", "label": "Accepted", "color": "green"},
                        {"value": "rejected", "label": "Rejected", "color": "red"},
                        {"value": "expired", "label": "Expired", "color": "yellow"}
                    ]
                },
                {"field_name": "notes", "field_label": "Notes", "field_type": "textarea", "section": "display", "show_in_list": True, "order": 6},
                {"field_name": "comments", "field_label": "Comments", "field_type": "textarea", "section": "display", "show_in_list": True, "order": 7},
                # Form Fields
                {"field_name": "contact_person", "field_label": "Contact Person", "field_type": "text", "section": "form", "order": 8},
                {"field_name": "reference", "field_label": "Reference", "field_type": "select", "section": "form", "order": 9,
                    "options": [
                        {"value": "lead", "label": "Lead"},
                        {"value": "direct", "label": "Direct"}
                    ]
                },
                {"field_name": "validity_days", "field_label": "Validity (Days)", "field_type": "number", "section": "form", "default_value": 30, "order": 10},
                {"field_name": "warehouse", "field_label": "Warehouse", "field_type": "select", "section": "form", "order": 11,
                    "options": [
                        {"value": "main", "label": "Main Warehouse"},
                        {"value": "factory", "label": "Factory"},
                        {"value": "branch_gj", "label": "Gujarat Branch"},
                        {"value": "branch_mh", "label": "Mumbai Branch"},
                        {"value": "branch_dl", "label": "Delhi Branch"}
                    ]
                },
                {"field_name": "transport", "field_label": "Transport", "field_type": "text", "section": "form", "order": 12},
                {"field_name": "payment_terms", "field_label": "Payment Terms", "field_type": "select", "section": "form", "order": 13,
                    "options": [
                        {"value": "advance", "label": "Advance"},
                        {"value": "cod", "label": "COD"},
                        {"value": "7_days", "label": "7 Days"},
                        {"value": "15_days", "label": "15 Days"},
                        {"value": "30_days", "label": "30 Days"},
                        {"value": "45_days", "label": "45 Days"},
                        {"value": "60_days", "label": "60 Days"}
                    ]
                },
                {"field_name": "remarks", "field_label": "Remarks", "field_type": "textarea", "section": "form", "order": 13},
                {"field_name": "terms_conditions", "field_label": "Terms & Conditions", "field_type": "textarea", "section": "form", "order": 14}
            ],
            "list_display_fields": ["quote_number", "account_name", "quote_date", "grand_total", "status"],
            "line_item_fields": [
                {"field_name": "item_code", "field_label": "Item Code", "field_type": "text", "order": 1},
                {"field_name": "item_name", "field_label": "Item Name", "field_type": "select", "auto_suggest": "item_master", "order": 2},
                {"field_name": "thickness", "field_label": "Thickness", "field_type": "text", "auto_fill": True, "order": 3},
                {"field_name": "width", "field_label": "Width", "field_type": "number", "order": 4},
                {"field_name": "length", "field_label": "Length", "field_type": "number", "order": 5},
                {"field_name": "color", "field_label": "Color", "field_type": "text", "auto_fill": True, "order": 6},
                {"field_name": "qty_per_pkg", "field_label": "Qty/Pkg", "field_type": "number", "order": 7},
                {"field_name": "total_pkg", "field_label": "Total Pkg", "field_type": "number", "order": 8},
                {"field_name": "rate_uom", "field_label": "Rate per Unit", "field_type": "select", "options": [
                    {"value": "kg", "label": "Per KG"},
                    {"value": "sqm", "label": "Per SQM"},
                    {"value": "pcs", "label": "Per PCS"},
                    {"value": "roll", "label": "Per Roll"},
                    {"value": "mtr", "label": "Per MTR"}
                ], "order": 9},
                {"field_name": "rate", "field_label": "Rate", "field_type": "currency", "order": 10},
                {"field_name": "brand", "field_label": "Brand", "field_type": "text", "order": 11},
                {"field_name": "instructions", "field_label": "Instructions", "field_type": "text", "order": 12},
                {"field_name": "marking", "field_label": "Marking", "field_type": "text", "order": 13}
            ]
        }
    
    elif module == 'crm' and entity == 'samples':
        return {
            "module": "crm",
            "entity": "samples",
            "entity_label": "Samples",
            "fields": [
                # Display Fields
                {"field_name": "sample_number", "field_label": "Sample No", "field_type": "auto", "section": "display", "is_required": True, "show_in_list": True, "is_readonly": True, "order": 1},
                {"field_name": "customer_name", "field_label": "Customer", "field_type": "select", "section": "display", "is_required": True, "show_in_list": True, "auto_suggest": "leads_customers", "order": 2},
                {"field_name": "products", "field_label": "Products", "field_type": "text", "section": "display", "show_in_list": True, "is_readonly": True, "order": 3},
                {"field_name": "quantity", "field_label": "Quantity", "field_type": "number", "section": "display", "show_in_list": True, "order": 4},
                {"field_name": "status", "field_label": "Status", "field_type": "select", "section": "display", "show_in_list": True, "order": 5,
                    "options": [
                        {"value": "pending", "label": "Pending", "color": "yellow"},
                        {"value": "dispatched", "label": "Dispatched", "color": "blue"},
                        {"value": "delivered", "label": "Delivered", "color": "green"},
                        {"value": "feedback_received", "label": "Feedback Received", "color": "purple"}
                    ]
                },
                {"field_name": "feedback", "field_label": "Feedback", "field_type": "select", "section": "display", "show_in_list": True, "order": 6,
                    "options": [
                        {"value": "positive", "label": "Positive", "color": "green"},
                        {"value": "neutral", "label": "Neutral", "color": "yellow"},
                        {"value": "negative", "label": "Negative", "color": "red"},
                        {"value": "pending", "label": "Pending", "color": "slate"}
                    ]
                },
                {"field_name": "due_date", "field_label": "Due Date", "field_type": "date", "section": "display", "show_in_list": True, "order": 7},
                # Form Fields
                {"field_name": "contact_person", "field_label": "Contact Person", "field_type": "text", "section": "form", "auto_fill": True, "order": 8},
                {"field_name": "from_location", "field_label": "From Location", "field_type": "select", "section": "form", "order": 9,
                    "options": [
                        {"value": "main_warehouse", "label": "Main Warehouse"},
                        {"value": "factory", "label": "Factory"},
                        {"value": "branch_gj", "label": "Gujarat Branch"},
                        {"value": "branch_mh", "label": "Mumbai Branch"},
                        {"value": "branch_dl", "label": "Delhi Branch"}
                    ]
                },
                {"field_name": "courier", "field_label": "Courier", "field_type": "text", "section": "form", "order": 10},
                {"field_name": "tracking_no", "field_label": "Tracking No", "field_type": "text", "section": "form", "order": 11},
                {"field_name": "feedback_due_date", "field_label": "Feedback Due Date", "field_type": "date", "section": "form", "order": 12},
                {"field_name": "purpose", "field_label": "Purpose", "field_type": "select", "section": "form", "order": 13,
                    "options": [
                        {"value": "new_product", "label": "New Product Trial"},
                        {"value": "quality_check", "label": "Quality Check"},
                        {"value": "replacement", "label": "Replacement"},
                        {"value": "customer_request", "label": "Customer Request"}
                    ]
                },
                {"field_name": "notes", "field_label": "Notes", "field_type": "textarea", "section": "form", "order": 14}
            ],
            "list_display_fields": ["sample_number", "customer_name", "products", "status", "feedback", "due_date"],
            "sample_item_fields": [
                {"field_name": "product_name", "field_label": "Product Name", "field_type": "select", "auto_suggest": "item_master", "order": 1},
                {"field_name": "thickness", "field_label": "Thickness", "field_type": "text", "auto_fill": True, "order": 2},
                {"field_name": "color", "field_label": "Color", "field_type": "text", "auto_fill": True, "order": 3},
                {"field_name": "width", "field_label": "Width", "field_type": "number", "order": 4},
                {"field_name": "length", "field_label": "Length", "field_type": "number", "order": 5},
                {"field_name": "qty", "field_label": "Qty", "field_type": "number", "order": 6},
                {"field_name": "unit", "field_label": "Unit", "field_type": "select", "options": [
                    {"value": "pcs", "label": "PCS"},
                    {"value": "roll", "label": "Roll"},
                    {"value": "mtr", "label": "MTR"},
                    {"value": "kg", "label": "KG"}
                ], "order": 7}
            ]
        }
    
    # Default empty config
    return {
        "module": module,
        "entity": entity,
        "entity_label": entity.replace("_", " ").title(),
        "fields": [],
        "list_display_fields": []
    }


# ==================== MASTERS CRUD ====================

@router.post("/masters/{master_type}")
async def save_master_config(master_type: str, config: MasterListConfig, current_user: dict = Depends(get_current_user)):
    """Save master list configuration"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can configure masters")
    
    config_dict = config.model_dump()
    config_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    config_dict['updated_by'] = current_user['id']
    
    await db.master_configurations.update_one(
        {'master_type': master_type},
        {'$set': config_dict},
        upsert=True
    )
    
    return {"message": "Master configuration saved", "master_type": master_type}


@router.get("/masters/{master_type}/config")
async def get_master_config(master_type: str, current_user: dict = Depends(get_current_user)):
    """Get master configuration"""
    config = await db.master_configurations.find_one(
        {'master_type': master_type},
        {'_id': 0}
    )
    
    if not config:
        return await get_default_master_config(master_type)
    
    return config


async def get_default_master_config(master_type: str):
    """Get default master configuration"""
    
    if master_type == 'customer':
        return {
            "master_type": "customer",
            "master_label": "Customer Master",
            "description": "The Revenue Base",
            "fields": [
                {"field_name": "customer_name", "field_label": "Customer Name", "field_type": "text", "is_required": True, "order": 1},
                {"field_name": "gstin", "field_label": "GSTIN", "field_type": "text", "is_required": True, "order": 2},
                {"field_name": "branch", "field_label": "Branch", "field_type": "select", "order": 3,
                    "options": [
                        {"value": "GJ", "label": "Gujarat"},
                        {"value": "MH", "label": "Maharashtra"},
                        {"value": "DL", "label": "Delhi"}
                    ]
                },
                {"field_name": "buying_dna_rhythm", "field_label": "Buying DNA Rhythm (Days)", "field_type": "number", "order": 4},
                {"field_name": "credit_limit", "field_label": "Credit Limit", "field_type": "currency", "order": 5},
                {"field_name": "distance_from_sarigam", "field_label": "Distance from Sarigam (KM)", "field_type": "number", "order": 6}
            ]
        }
    
    elif master_type == 'supplier':
        return {
            "master_type": "supplier",
            "master_label": "Supplier Master",
            "description": "The Sourcing Base",
            "fields": [
                {"field_name": "supplier_name", "field_label": "Supplier Name", "field_type": "text", "is_required": True, "order": 1},
                {"field_name": "material_category", "field_label": "Material Category", "field_type": "select", "order": 2,
                    "options": [
                        {"value": "film", "label": "Film"},
                        {"value": "adhesive", "label": "Adhesive"},
                        {"value": "core", "label": "Core"}
                    ]
                },
                {"field_name": "lead_time", "field_label": "Lead Time (Days)", "field_type": "number", "order": 3},
                {"field_name": "reliability_score", "field_label": "Reliability Score", "field_type": "number", "order": 4}
            ]
        }
    
    elif master_type == 'item':
        return {
            "master_type": "item",
            "master_label": "Item Master",
            "description": "The Physics Base",
            "fields": [
                {"field_name": "item_name", "field_label": "Item Name", "field_type": "text", "is_required": True, "order": 1},
                {"field_name": "base_category", "field_label": "Base Category", "field_type": "select", "order": 2,
                    "options": [
                        {"value": "bopp", "label": "BOPP"},
                        {"value": "pvc", "label": "PVC"},
                        {"value": "masking", "label": "Masking"},
                        {"value": "double_sided", "label": "Double Sided"},
                        {"value": "cloth", "label": "Cloth"},
                        {"value": "foam", "label": "Foam"}
                    ]
                },
                {"field_name": "uom", "field_label": "UOM", "field_type": "select", "order": 3,
                    "options": [
                        {"value": "KG", "label": "KG"},
                        {"value": "SQM", "label": "SQM"},
                        {"value": "PCS", "label": "PCS"},
                        {"value": "ROL", "label": "Roll"},
                        {"value": "MTR", "label": "Meter"}
                    ]
                },
                {"field_name": "microns", "field_label": "Thickness (Microns)", "field_type": "number", "order": 4},
                {"field_name": "gsm", "field_label": "GSM", "field_type": "number", "order": 5},
                {"field_name": "adhesive_type", "field_label": "Adhesive Type", "field_type": "select", "order": 6,
                    "options": [
                        {"value": "water_based", "label": "Water Based"},
                        {"value": "hotmelt", "label": "Hotmelt"},
                        {"value": "solvent", "label": "Solvent"}
                    ]
                }
            ]
        }
    
    # Return generic config for unknown masters
    return {
        "master_type": master_type,
        "master_label": master_type.replace("_", " ").title(),
        "fields": []
    }


# ==================== FIELD REORDER ====================

@router.put("/config/{module}/{entity}/reorder")
async def reorder_fields(
    module: str,
    entity: str,
    field_orders: List[Dict[str, Any]],  # [{"field_name": "x", "order": 1}, ...]
    current_user: dict = Depends(get_current_user)
):
    """Reorder fields for an entity"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can reorder fields")
    
    config = await db.field_configurations.find_one({'module': module, 'entity': entity})
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Create order map
    order_map = {item['field_name']: item['order'] for item in field_orders}
    
    # Update field orders
    fields = config.get('fields', [])
    for field in fields:
        if field['field_name'] in order_map:
            field['order'] = order_map[field['field_name']]
    
    # Sort by order
    fields.sort(key=lambda x: x.get('order', 0))
    
    await db.field_configurations.update_one(
        {'module': module, 'entity': entity},
        {'$set': {'fields': fields, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Fields reordered successfully"}


@router.put("/stages/{module}/{entity}/reorder")
async def reorder_stages(
    module: str,
    entity: str,
    stage_orders: List[Dict[str, Any]],  # [{"value": "x", "order": 1}, ...]
    current_user: dict = Depends(get_current_user)
):
    """Reorder Kanban stages"""
    if current_user.get('role') not in ['admin', 'director']:
        raise HTTPException(status_code=403, detail="Only admin or director can reorder stages")
    
    config = await db.field_configurations.find_one({'module': module, 'entity': entity})
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Create order map
    order_map = {item['value']: item['order'] for item in stage_orders}
    
    # Update stage orders
    stages = config.get('kanban_stages', [])
    for stage in stages:
        if stage['value'] in order_map:
            stage['order'] = order_map[stage['value']]
    
    # Sort by order
    stages.sort(key=lambda x: x.get('order', 0))
    
    await db.field_configurations.update_one(
        {'module': module, 'entity': entity},
        {'$set': {'kanban_stages': stages, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Stages reordered successfully"}
