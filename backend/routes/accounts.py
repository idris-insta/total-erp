from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from server import db, get_current_user

router = APIRouter()

# ==================== INVOICE MODELS ====================
class InvoiceItemCreate(BaseModel):
    item_id: Optional[str] = None
    description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit: str = "Pcs"
    unit_price: float
    discount_percent: float = 0
    tax_percent: float = 18

class InvoiceCreate(BaseModel):
    invoice_type: str = "Sales"  # Sales, Purchase, Credit Note, Debit Note
    account_id: str
    order_id: Optional[str] = None
    items: List[InvoiceItemCreate]
    invoice_date: str
    due_date: str
    payment_terms: Optional[str] = None
    shipping_address: Optional[str] = None
    notes: Optional[str] = None
    irn: Optional[str] = None  # E-invoice reference

class Invoice(BaseModel):
    id: str
    invoice_number: str
    invoice_type: str
    account_id: str
    account_name: Optional[str] = None
    account_gstin: Optional[str] = None
    order_id: Optional[str] = None
    items: List[dict]
    subtotal: float
    discount_amount: float
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    total_tax: float
    grand_total: float
    invoice_date: str
    due_date: str
    payment_terms: Optional[str] = None
    shipping_address: Optional[str] = None
    notes: Optional[str] = None
    status: str  # draft, sent, partial, paid, overdue, cancelled
    paid_amount: float = 0
    balance_amount: float = 0
    irn: Optional[str] = None
    irn_date: Optional[str] = None
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

# ==================== PAYMENT MODELS ====================
class PaymentCreate(BaseModel):
    payment_type: str  # receipt, payment
    account_id: str
    amount: float
    payment_date: str
    payment_mode: str  # cash, cheque, bank_transfer, upi, card
    bank_name: Optional[str] = None
    cheque_no: Optional[str] = None
    cheque_date: Optional[str] = None
    transaction_ref: Optional[str] = None
    invoices: List[dict] = []  # [{"invoice_id": "", "amount": 0}]
    tds_amount: float = 0
    tds_section: Optional[str] = None
    notes: Optional[str] = None

class Payment(BaseModel):
    id: str
    payment_number: str
    payment_type: str
    account_id: str
    account_name: Optional[str] = None
    amount: float
    payment_date: str
    payment_mode: str
    bank_name: Optional[str] = None
    cheque_no: Optional[str] = None
    cheque_date: Optional[str] = None
    transaction_ref: Optional[str] = None
    invoices: List[dict]
    tds_amount: float
    tds_section: Optional[str] = None
    notes: Optional[str] = None
    status: str  # pending, cleared, bounced, cancelled
    created_by: str
    created_at: str

# ==================== JOURNAL ENTRY MODEL ====================
class JournalLine(BaseModel):
    account_head: str
    debit: float = 0
    credit: float = 0
    narration: Optional[str] = None

class JournalEntryCreate(BaseModel):
    entry_date: str
    entry_type: str  # manual, auto
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    lines: List[JournalLine]
    narration: str

class JournalEntry(BaseModel):
    id: str
    entry_number: str
    entry_date: str
    entry_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    lines: List[dict]
    total_debit: float
    total_credit: float
    narration: str
    status: str
    created_by: str
    created_at: str

# ==================== INVOICE ENDPOINTS ====================
def calculate_invoice_totals(items: List[dict]) -> dict:
    subtotal = 0
    total_discount = 0
    total_tax = 0
    calculated_items = []
    
    for item in items:
        qty = item.get("quantity", 0)
        price = item.get("unit_price", 0)
        discount_pct = item.get("discount_percent", 0)
        tax_pct = item.get("tax_percent", 18)
        
        line_subtotal = qty * price
        line_discount = line_subtotal * (discount_pct / 100)
        line_taxable = line_subtotal - line_discount
        line_tax = line_taxable * (tax_pct / 100)
        line_total = line_taxable + line_tax
        
        calculated_items.append({
            **item,
            "line_subtotal": round(line_subtotal, 2),
            "line_discount": round(line_discount, 2),
            "line_taxable": round(line_taxable, 2),
            "line_tax": round(line_tax, 2),
            "line_total": round(line_total, 2)
        })
        
        subtotal += line_subtotal
        total_discount += line_discount
        total_tax += line_tax
    
    taxable_amount = subtotal - total_discount
    cgst = total_tax / 2
    sgst = total_tax / 2
    grand_total = taxable_amount + total_tax
    
    return {
        "items": calculated_items,
        "subtotal": round(subtotal, 2),
        "discount_amount": round(total_discount, 2),
        "taxable_amount": round(taxable_amount, 2),
        "cgst_amount": round(cgst, 2),
        "sgst_amount": round(sgst, 2),
        "igst_amount": 0,
        "total_tax": round(total_tax, 2),
        "grand_total": round(grand_total, 2)
    }

@router.post("/invoices", response_model=Invoice)
async def create_invoice(inv_data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    inv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    # Generate invoice number based on type
    prefix = "INV" if inv_data.invoice_type == "Sales" else "PINV" if inv_data.invoice_type == "Purchase" else "CN" if inv_data.invoice_type == "Credit Note" else "DN"
    inv_number = f"{prefix}-{now.strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
    
    # Get account details
    account = await db.accounts.find_one({"id": inv_data.account_id}, {"customer_name": 1, "gstin": 1})
    if not account:
        # Check suppliers
        account = await db.suppliers.find_one({"id": inv_data.account_id}, {"supplier_name": 1, "gstin": 1})
    
    # Calculate totals
    items_dict = [item.model_dump() for item in inv_data.items]
    totals = calculate_invoice_totals(items_dict)
    
    inv_doc = {
        "id": inv_id,
        "invoice_number": inv_number,
        "invoice_type": inv_data.invoice_type,
        "account_id": inv_data.account_id,
        "account_name": account.get("customer_name") or account.get("supplier_name") if account else None,
        "account_gstin": account.get("gstin") if account else None,
        "order_id": inv_data.order_id,
        **totals,
        "invoice_date": inv_data.invoice_date,
        "due_date": inv_data.due_date,
        "payment_terms": inv_data.payment_terms,
        "shipping_address": inv_data.shipping_address,
        "notes": inv_data.notes,
        "status": "draft",
        "paid_amount": 0,
        "balance_amount": totals["grand_total"],
        "irn": inv_data.irn,
        "irn_date": None,
        "created_by": current_user["id"],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.invoices.insert_one(inv_doc)
    return Invoice(**{k: v for k, v in inv_doc.items() if k != '_id'})

@router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    invoice_type: Optional[str] = None,
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    overdue: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if invoice_type:
        query["invoice_type"] = invoice_type
    if account_id:
        query["account_id"] = account_id
    if status:
        query["status"] = status
    if date_from:
        query["invoice_date"] = {"$gte": date_from}
    if date_to:
        if "invoice_date" in query:
            query["invoice_date"]["$lte"] = date_to
        else:
            query["invoice_date"] = {"$lte": date_to}
    if overdue:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["due_date"] = {"$lt": today}
        query["status"] = {"$nin": ["paid", "cancelled"]}
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("invoice_date", -1).to_list(1000)
    return [Invoice(**inv) for inv in invoices]

@router.get("/invoices/{inv_id}", response_model=Invoice)
async def get_invoice(inv_id: str, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": inv_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**inv)

@router.put("/invoices/{inv_id}/status")
async def update_invoice_status(inv_id: str, status: str, current_user: dict = Depends(get_current_user)):
    valid_statuses = ["draft", "sent", "partial", "paid", "overdue", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    
    result = await db.invoices.update_one(
        {"id": inv_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": f"Status updated to {status}"}

# ==================== PAYMENT ENDPOINTS ====================
@router.post("/payments", response_model=Payment)
async def create_payment(pmt_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    pmt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    prefix = "RCT" if pmt_data.payment_type == "receipt" else "PMT"
    pmt_number = f"{prefix}-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    # Get account name
    account = await db.accounts.find_one({"id": pmt_data.account_id}, {"customer_name": 1})
    if not account:
        account = await db.suppliers.find_one({"id": pmt_data.account_id}, {"supplier_name": 1})
    
    pmt_doc = {
        "id": pmt_id,
        "payment_number": pmt_number,
        "payment_type": pmt_data.payment_type,
        "account_id": pmt_data.account_id,
        "account_name": account.get("customer_name") or account.get("supplier_name") if account else None,
        "amount": pmt_data.amount,
        "payment_date": pmt_data.payment_date,
        "payment_mode": pmt_data.payment_mode,
        "bank_name": pmt_data.bank_name,
        "cheque_no": pmt_data.cheque_no,
        "cheque_date": pmt_data.cheque_date,
        "transaction_ref": pmt_data.transaction_ref,
        "invoices": pmt_data.invoices,
        "tds_amount": pmt_data.tds_amount,
        "tds_section": pmt_data.tds_section,
        "notes": pmt_data.notes,
        "status": "cleared" if pmt_data.payment_mode != "cheque" else "pending",
        "created_by": current_user["id"],
        "created_at": now.isoformat()
    }
    
    await db.payments.insert_one(pmt_doc)
    
    # Update invoice balances
    for inv_ref in pmt_data.invoices:
        inv = await db.invoices.find_one({"id": inv_ref["invoice_id"]})
        if inv:
            new_paid = inv.get("paid_amount", 0) + inv_ref["amount"]
            new_balance = inv.get("grand_total", 0) - new_paid
            new_status = "paid" if new_balance <= 0 else "partial"
            
            await db.invoices.update_one(
                {"id": inv_ref["invoice_id"]},
                {"$set": {
                    "paid_amount": new_paid,
                    "balance_amount": max(0, new_balance),
                    "status": new_status,
                    "updated_at": now.isoformat()
                }}
            )
    
    # Update account outstanding
    if pmt_data.payment_type == "receipt":
        await db.accounts.update_one(
            {"id": pmt_data.account_id},
            {"$inc": {"receivable_amount": -pmt_data.amount}}
        )
    
    return Payment(**{k: v for k, v in pmt_doc.items() if k != '_id'})

@router.get("/payments", response_model=List[Payment])
async def get_payments(
    payment_type: Optional[str] = None,
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if payment_type:
        query["payment_type"] = payment_type
    if account_id:
        query["account_id"] = account_id
    if status:
        query["status"] = status
    if date_from:
        query["payment_date"] = {"$gte": date_from}
    if date_to:
        if "payment_date" in query:
            query["payment_date"]["$lte"] = date_to
        else:
            query["payment_date"] = {"$lte": date_to}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    return [Payment(**pmt) for pmt in payments]

# ==================== REPORTS ====================
@router.get("/reports/aging")
async def get_aging_report(report_type: str = "receivable", current_user: dict = Depends(get_current_user)):
    """Get AR/AP aging report"""
    today = datetime.now(timezone.utc)
    
    # Define aging buckets
    buckets = [
        {"name": "Current", "days": 0},
        {"name": "1-30", "days": 30},
        {"name": "31-60", "days": 60},
        {"name": "61-90", "days": 90},
        {"name": "90+", "days": 999}
    ]
    
    inv_type = "Sales" if report_type == "receivable" else "Purchase"
    
    # Get unpaid invoices
    invoices = await db.invoices.find({
        "invoice_type": inv_type,
        "status": {"$nin": ["paid", "cancelled"]}
    }, {"_id": 0}).to_list(1000)
    
    # Group by account and bucket
    account_aging = {}
    
    for inv in invoices:
        acc_id = inv["account_id"]
        if acc_id not in account_aging:
            account_aging[acc_id] = {
                "account_id": acc_id,
                "account_name": inv.get("account_name", ""),
                "current": 0,
                "1-30": 0,
                "31-60": 0,
                "61-90": 0,
                "90+": 0,
                "total": 0
            }
        
        due_date = datetime.fromisoformat(inv["due_date"].replace("Z", "+00:00")) if inv.get("due_date") else today
        days_overdue = (today - due_date).days
        balance = inv.get("balance_amount", 0)
        
        if days_overdue <= 0:
            account_aging[acc_id]["current"] += balance
        elif days_overdue <= 30:
            account_aging[acc_id]["1-30"] += balance
        elif days_overdue <= 60:
            account_aging[acc_id]["31-60"] += balance
        elif days_overdue <= 90:
            account_aging[acc_id]["61-90"] += balance
        else:
            account_aging[acc_id]["90+"] += balance
        
        account_aging[acc_id]["total"] += balance
    
    return list(account_aging.values())

@router.get("/reports/gst-summary")
async def get_gst_summary(month: str, year: int, current_user: dict = Depends(get_current_user)):
    """Get GST summary for a month"""
    start_date = f"{year}-{month.zfill(2)}-01"
    if int(month) == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{str(int(month) + 1).zfill(2)}-01"
    
    # Sales invoices
    sales_pipeline = [
        {"$match": {
            "invoice_type": "Sales",
            "invoice_date": {"$gte": start_date, "$lt": end_date},
            "status": {"$nin": ["cancelled"]}
        }},
        {"$group": {
            "_id": None,
            "taxable_value": {"$sum": "$taxable_amount"},
            "cgst": {"$sum": "$cgst_amount"},
            "sgst": {"$sum": "$sgst_amount"},
            "igst": {"$sum": "$igst_amount"},
            "total_tax": {"$sum": "$total_tax"},
            "invoice_count": {"$sum": 1}
        }}
    ]
    sales_result = await db.invoices.aggregate(sales_pipeline).to_list(1)
    
    # Purchase invoices
    purchase_pipeline = [
        {"$match": {
            "invoice_type": "Purchase",
            "invoice_date": {"$gte": start_date, "$lt": end_date},
            "status": {"$nin": ["cancelled"]}
        }},
        {"$group": {
            "_id": None,
            "taxable_value": {"$sum": "$taxable_amount"},
            "cgst": {"$sum": "$cgst_amount"},
            "sgst": {"$sum": "$sgst_amount"},
            "igst": {"$sum": "$igst_amount"},
            "total_tax": {"$sum": "$total_tax"},
            "invoice_count": {"$sum": 1}
        }}
    ]
    purchase_result = await db.invoices.aggregate(purchase_pipeline).to_list(1)
    
    sales = sales_result[0] if sales_result else {"taxable_value": 0, "cgst": 0, "sgst": 0, "igst": 0, "total_tax": 0, "invoice_count": 0}
    purchases = purchase_result[0] if purchase_result else {"taxable_value": 0, "cgst": 0, "sgst": 0, "igst": 0, "total_tax": 0, "invoice_count": 0}
    
    return {
        "period": f"{month}/{year}",
        "outward_supplies": {
            "taxable_value": sales.get("taxable_value", 0),
            "cgst": sales.get("cgst", 0),
            "sgst": sales.get("sgst", 0),
            "igst": sales.get("igst", 0),
            "total_tax": sales.get("total_tax", 0),
            "count": sales.get("invoice_count", 0)
        },
        "inward_supplies": {
            "taxable_value": purchases.get("taxable_value", 0),
            "cgst": purchases.get("cgst", 0),
            "sgst": purchases.get("sgst", 0),
            "igst": purchases.get("igst", 0),
            "total_tax": purchases.get("total_tax", 0),
            "count": purchases.get("invoice_count", 0)
        },
        "net_liability": {
            "cgst": sales.get("cgst", 0) - purchases.get("cgst", 0),
            "sgst": sales.get("sgst", 0) - purchases.get("sgst", 0),
            "igst": sales.get("igst", 0) - purchases.get("igst", 0),
            "total": sales.get("total_tax", 0) - purchases.get("total_tax", 0)
        }
    }

# ==================== STATS ====================
@router.get("/stats/overview")
async def get_accounts_stats(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc)
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Total receivables
    receivables_pipeline = [
        {"$match": {"invoice_type": "Sales", "status": {"$nin": ["paid", "cancelled"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$balance_amount"}}}
    ]
    receivables = await db.invoices.aggregate(receivables_pipeline).to_list(1)
    total_receivables = receivables[0]["total"] if receivables else 0
    
    # Total payables
    payables_pipeline = [
        {"$match": {"invoice_type": "Purchase", "status": {"$nin": ["paid", "cancelled"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$balance_amount"}}}
    ]
    payables = await db.invoices.aggregate(payables_pipeline).to_list(1)
    total_payables = payables[0]["total"] if payables else 0
    
    # Overdue invoices
    today_str = today.strftime("%Y-%m-%d")
    overdue_count = await db.invoices.count_documents({
        "due_date": {"$lt": today_str},
        "status": {"$nin": ["paid", "cancelled"]}
    })
    
    # This month collections
    collections_pipeline = [
        {"$match": {"payment_type": "receipt", "payment_date": {"$gte": month_start[:10]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    collections = await db.payments.aggregate(collections_pipeline).to_list(1)
    monthly_collections = collections[0]["total"] if collections else 0
    
    # This month payments
    payments_pipeline = [
        {"$match": {"payment_type": "payment", "payment_date": {"$gte": month_start[:10]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    payments_out = await db.payments.aggregate(payments_pipeline).to_list(1)
    monthly_payments = payments_out[0]["total"] if payments_out else 0
    
    return {
        "total_receivables": round(total_receivables, 2),
        "total_payables": round(total_payables, 2),
        "net_position": round(total_receivables - total_payables, 2),
        "overdue_invoices": overdue_count,
        "monthly_collections": round(monthly_collections, 2),
        "monthly_payments": round(monthly_payments, 2),
        "net_cashflow": round(monthly_collections - monthly_payments, 2)
    }
