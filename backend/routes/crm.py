from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from server import db, get_current_user

router = APIRouter()

class LeadCreate(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: str
    source: str
    product_interest: Optional[str] = None
    notes: Optional[str] = None

class Lead(BaseModel):
    id: str
    company_name: str
    contact_person: str
    email: str
    phone: str
    source: str
    status: str
    product_interest: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class AccountCreate(BaseModel):
    customer_name: str
    gstin: str
    billing_address: str
    shipping_addresses: List[dict]
    credit_limit: float
    payment_terms: str
    contact_person: str
    email: str
    phone: str

class Account(BaseModel):
    id: str
    customer_name: str
    gstin: str
    billing_address: str
    shipping_addresses: List[dict]
    credit_limit: float
    payment_terms: str
    contact_person: str
    email: str
    phone: str
    created_at: str

class QuotationCreate(BaseModel):
    account_id: str
    items: List[dict]
    transport: str
    credit_period: str
    validity_days: int = 15
    supply_location: str
    notes: Optional[str] = None

class Quotation(BaseModel):
    id: str
    quote_number: str
    account_id: str
    items: List[dict]
    sub_total: float
    tax_amount: float
    total_amount: float
    status: str
    transport: str
    credit_period: str
    validity_days: int
    supply_location: str
    notes: Optional[str] = None
    created_at: str
    expiry_date: str

class SampleCreate(BaseModel):
    account_id: str
    quotation_id: Optional[str] = None
    product_specs: str
    quantity: float
    from_location: str
    courier: str
    feedback_date: str

class Sample(BaseModel):
    id: str
    sample_number: str
    account_id: str
    quotation_id: Optional[str] = None
    product_specs: str
    quantity: float
    from_location: str
    courier: str
    feedback_date: str
    feedback_status: str
    cost: float
    status: str
    created_at: str


@router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lead_doc = {
        'id': lead_id,
        **lead_data.model_dump(),
        'status': 'new',
        'created_by': current_user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    await db.leads.insert_one(lead_doc)
    return Lead(**{k: v for k, v in lead_doc.items() if k != '_id'})

@router.get("/leads", response_model=List[Lead])
async def get_leads(source: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if source:
        query['source'] = source
    if status:
        query['status'] = status
    
    leads = await db.leads.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Lead(**lead) for lead in leads]

@router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return Lead(**lead)

@router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    result = await db.leads.update_one(
        {'id': lead_id},
        {'$set': {**lead_data.model_dump(), 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    return Lead(**lead)

@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({'id': lead_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {'message': 'Lead deleted successfully'}

@router.put("/leads/{lead_id}/convert")
async def convert_lead_to_account(lead_id: str, account_data: AccountCreate, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    account_id = str(uuid.uuid4())
    account_doc = {
        'id': account_id,
        **account_data.model_dump(),
        'lead_id': lead_id,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.accounts.insert_one(account_doc)
    await db.leads.update_one({'id': lead_id}, {'$set': {'status': 'converted', 'account_id': account_id}})
    
    return {'message': 'Lead converted to account', 'account_id': account_id}


@router.post("/accounts", response_model=Account)
async def create_account(account_data: AccountCreate, current_user: dict = Depends(get_current_user)):
    account_id = str(uuid.uuid4())
    account_doc = {
        'id': account_id,
        **account_data.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.accounts.insert_one(account_doc)
    return Account(**{k: v for k, v in account_doc.items() if k != '_id'})

@router.get("/accounts", response_model=List[Account])
async def get_accounts(current_user: dict = Depends(get_current_user)):
    accounts = await db.accounts.find({}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Account(**account) for account in accounts]

@router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, current_user: dict = Depends(get_current_user)):
    account = await db.accounts.find_one({'id': account_id}, {'_id': 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**account)


@router.post("/quotations", response_model=Quotation)
async def create_quotation(quote_data: QuotationCreate, current_user: dict = Depends(get_current_user)):
    quote_id = str(uuid.uuid4())
    quote_number = f"QT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    sub_total = sum(item['quantity'] * item['price'] for item in quote_data.items)
    tax_amount = sub_total * 0.18
    total_amount = sub_total + tax_amount
    
    now = datetime.now(timezone.utc)
    expiry_date = (now + timedelta(days=quote_data.validity_days)).isoformat()
    
    quote_doc = {
        'id': quote_id,
        'quote_number': quote_number,
        **quote_data.model_dump(),
        'sub_total': sub_total,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'status': 'pending',
        'created_at': now.isoformat(),
        'expiry_date': expiry_date,
        'created_by': current_user['id']
    }
    
    await db.quotations.insert_one(quote_doc)
    return Quotation(**{k: v for k, v in quote_doc.items() if k != '_id'})

@router.get("/quotations", response_model=List[Quotation])
async def get_quotations(account_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if account_id:
        query['account_id'] = account_id
    if status:
        query['status'] = status
    
    quotations = await db.quotations.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Quotation(**quote) for quote in quotations]

@router.get("/quotations/{quote_id}", response_model=Quotation)
async def get_quotation(quote_id: str, current_user: dict = Depends(get_current_user)):
    quote = await db.quotations.find_one({'id': quote_id}, {'_id': 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return Quotation(**quote)


@router.post("/samples", response_model=Sample)
async def create_sample(sample_data: SampleCreate, current_user: dict = Depends(get_current_user)):
    sample_id = str(uuid.uuid4())
    sample_number = f"SMP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    sample_doc = {
        'id': sample_id,
        'sample_number': sample_number,
        **sample_data.model_dump(),
        'feedback_status': 'pending',
        'cost': 0,
        'status': 'sent',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.samples.insert_one(sample_doc)
    return Sample(**{k: v for k, v in sample_doc.items() if k != '_id'})

@router.get("/samples", response_model=List[Sample])
async def get_samples(account_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if account_id:
        query['account_id'] = account_id
    
    samples = await db.samples.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Sample(**sample) for sample in samples]

@router.put("/samples/{sample_id}/feedback")
async def update_sample_feedback(sample_id: str, feedback_status: str, notes: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    result = await db.samples.update_one(
        {'id': sample_id},
        {'$set': {'feedback_status': feedback_status, 'feedback_notes': notes, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    return {'message': 'Sample feedback updated'}

from datetime import timedelta