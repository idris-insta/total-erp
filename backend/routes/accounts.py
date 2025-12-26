from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from server import db, get_current_user

router = APIRouter()

class InvoiceCreate(BaseModel):
    account_id: str
    quotation_id: Optional[str] = None
    invoice_type: str
    items: List[dict]
    location: str
    payment_terms: str
    notes: Optional[str] = None

class Invoice(BaseModel):
    id: str
    invoice_number: str
    account_id: str
    quotation_id: Optional[str] = None
    invoice_type: str
    items: List[dict]
    sub_total: float
    cgst: float
    sgst: float
    igst: float
    total_amount: float
    location: str
    payment_terms: str
    status: str
    notes: Optional[str] = None
    created_at: str
    due_date: str

class PaymentCreate(BaseModel):
    invoice_id: Optional[str] = None
    account_id: Optional[str] = None
    supplier_id: Optional[str] = None
    payment_type: str
    amount: float
    payment_method: str
    reference_no: str
    notes: Optional[str] = None

class Payment(BaseModel):
    id: str
    payment_number: str
    invoice_id: Optional[str] = None
    account_id: Optional[str] = None
    supplier_id: Optional[str] = None
    payment_type: str
    amount: float
    payment_method: str
    reference_no: str
    status: str
    notes: Optional[str] = None
    created_at: str


@router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    invoice_id = str(uuid.uuid4())
    invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    account = await db.accounts.find_one({'id': invoice_data.account_id}, {'_id': 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    sub_total = sum(item['quantity'] * item['price'] for item in invoice_data.items)
    
    is_interstate = False
    if account.get('gstin'):
        customer_state = account['gstin'][:2]
        company_state = "27"
        is_interstate = customer_state != company_state
    
    if is_interstate:
        cgst = 0
        sgst = 0
        igst = sub_total * 0.18
    else:
        cgst = sub_total * 0.09
        sgst = sub_total * 0.09
        igst = 0
    
    total_amount = sub_total + cgst + sgst + igst
    
    from datetime import timedelta
    payment_days = int(invoice_data.payment_terms.split()[0]) if invoice_data.payment_terms else 30
    due_date = (datetime.now(timezone.utc) + timedelta(days=payment_days)).isoformat()
    
    invoice_doc = {
        'id': invoice_id,
        'invoice_number': invoice_number,
        **invoice_data.model_dump(),
        'sub_total': sub_total,
        'cgst': cgst,
        'sgst': sgst,
        'igst': igst,
        'total_amount': total_amount,
        'status': 'unpaid',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'due_date': due_date,
        'created_by': current_user['id']
    }
    
    await db.invoices.insert_one(invoice_doc)
    return Invoice(**{k: v for k, v in invoice_doc.items() if k != '_id'})

@router.get("/invoices", response_model=List[Invoice])
async def get_invoices(account_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if account_id:
        query['account_id'] = account_id
    if status:
        query['status'] = status
    
    invoices = await db.invoices.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({'id': invoice_id}, {'_id': 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**invoice)


@router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    payment_id = str(uuid.uuid4())
    payment_number = f"PAY-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    payment_doc = {
        'id': payment_id,
        'payment_number': payment_number,
        **payment_data.model_dump(),
        'status': 'completed',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.payments.insert_one(payment_doc)
    
    if payment_data.invoice_id:
        invoice = await db.invoices.find_one({'id': payment_data.invoice_id}, {'_id': 0})
        if invoice:
            payments = await db.payments.find({'invoice_id': payment_data.invoice_id}, {'_id': 0}).to_list(1000)
            total_paid = sum(p['amount'] for p in payments)
            
            if total_paid >= invoice['total_amount']:
                await db.invoices.update_one({'id': payment_data.invoice_id}, {'$set': {'status': 'paid'}})
            else:
                await db.invoices.update_one({'id': payment_data.invoice_id}, {'$set': {'status': 'partial'}})
    
    return Payment(**{k: v for k, v in payment_doc.items() if k != '_id'})

@router.get("/payments", response_model=List[Payment])
async def get_payments(payment_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if payment_type:
        query['payment_type'] = payment_type
    
    payments = await db.payments.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Payment(**payment) for payment in payments]


@router.get("/reports/ar-aging")
async def get_ar_aging(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    invoices = await db.invoices.find({'status': {'$in': ['unpaid', 'partial']}}, {'_id': 0}).to_list(1000)
    
    aging = {'0-30': [], '30-60': [], '60-90': [], '90+': []}
    
    for invoice in invoices:
        due_date = datetime.fromisoformat(invoice['due_date'])
        days_overdue = (now - due_date).days
        
        if days_overdue <= 30:
            aging['0-30'].append(invoice)
        elif days_overdue <= 60:
            aging['30-60'].append(invoice)
        elif days_overdue <= 90:
            aging['60-90'].append(invoice)
        else:
            aging['90+'].append(invoice)
    
    summary = {
        '0-30': {'count': len(aging['0-30']), 'amount': sum(inv['total_amount'] for inv in aging['0-30'])},
        '30-60': {'count': len(aging['30-60']), 'amount': sum(inv['total_amount'] for inv in aging['30-60'])},
        '60-90': {'count': len(aging['60-90']), 'amount': sum(inv['total_amount'] for inv in aging['60-90'])},
        '90+': {'count': len(aging['90+']), 'amount': sum(inv['total_amount'] for inv in aging['90+'])}
    }
    
    return {'aging': aging, 'summary': summary}

@router.get("/reports/profitability")
async def get_profitability_report(location: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {'status': 'paid'}
    if location:
        query['location'] = location
    
    invoices = await db.invoices.find(query, {'_id': 0}).to_list(1000)
    
    total_revenue = sum(inv['total_amount'] for inv in invoices)
    
    locations = {}
    for inv in invoices:
        loc = inv.get('location', 'Unknown')
        if loc not in locations:
            locations[loc] = {'revenue': 0, 'count': 0}
        locations[loc]['revenue'] += inv['total_amount']
        locations[loc]['count'] += 1
    
    return {
        'total_revenue': total_revenue,
        'by_location': locations,
        'invoice_count': len(invoices)
    }

@router.get("/reports/cash-flow")
async def get_cash_flow(current_user: dict = Depends(get_current_user)):
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    invoices = await db.invoices.find({'created_at': {'$gte': start_of_month.isoformat()}}, {'_id': 0}).to_list(1000)
    payments_in = await db.payments.find({'payment_type': 'received', 'created_at': {'$gte': start_of_month.isoformat()}}, {'_id': 0}).to_list(1000)
    payments_out = await db.payments.find({'payment_type': 'paid', 'created_at': {'$gte': start_of_month.isoformat()}}, {'_id': 0}).to_list(1000)
    
    total_billed = sum(inv['total_amount'] for inv in invoices)
    total_received = sum(p['amount'] for p in payments_in)
    total_paid = sum(p['amount'] for p in payments_out)
    
    net_cash_flow = total_received - total_paid
    
    return {
        'total_billed': total_billed,
        'total_received': total_received,
        'total_paid': total_paid,
        'net_cash_flow': net_cash_flow,
        'period': 'current_month'
    }