from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from server import db, get_current_user

router = APIRouter()

class SupplierCreate(BaseModel):
    supplier_name: str
    supplier_type: str
    contact_person: str
    email: str
    phone: str
    address: str
    gstin: Optional[str] = None
    country: str = "India"

class Supplier(BaseModel):
    id: str
    supplier_name: str
    supplier_type: str
    contact_person: str
    email: str
    phone: str
    address: str
    gstin: Optional[str] = None
    country: str
    quality_score: float
    created_at: str

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    po_type: str
    items: List[dict]
    currency: str = "INR"
    delivery_location: str
    payment_terms: str
    notes: Optional[str] = None

class PurchaseOrder(BaseModel):
    id: str
    po_number: str
    supplier_id: str
    po_type: str
    items: List[dict]
    sub_total: float
    tax_amount: float
    total_amount: float
    currency: str
    delivery_location: str
    payment_terms: str
    status: str
    notes: Optional[str] = None
    created_at: str

class GRNCreate(BaseModel):
    po_id: str
    items: List[dict]
    location: str
    invoice_no: Optional[str] = None
    notes: Optional[str] = None

class GRN(BaseModel):
    id: str
    grn_number: str
    po_id: str
    items: List[dict]
    location: str
    invoice_no: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str

class LandedCostCreate(BaseModel):
    po_id: str
    freight: float
    duty: float
    cha: float
    cfs: float
    insurance: float
    local_transport: float
    commission: float
    misc_expenses: float
    fx_rate: float


@router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier_data: SupplierCreate, current_user: dict = Depends(get_current_user)):
    supplier_id = str(uuid.uuid4())
    supplier_doc = {
        'id': supplier_id,
        **supplier_data.model_dump(),
        'quality_score': 100.0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.suppliers.insert_one(supplier_doc)
    return Supplier(**{k: v for k, v in supplier_doc.items() if k != '_id'})

@router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(supplier_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if supplier_type:
        query['supplier_type'] = supplier_type
    
    suppliers = await db.suppliers.find(query, {'_id': 0}).to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    supplier = await db.suppliers.find_one({'id': supplier_id}, {'_id': 0})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier)


@router.post("/purchase-orders", response_model=PurchaseOrder)
async def create_purchase_order(po_data: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    po_id = str(uuid.uuid4())
    
    if po_data.po_type == "import":
        supplier = await db.suppliers.find_one({'id': po_data.supplier_id}, {'_id': 0})
        po_number = f"IPO-{supplier['supplier_name'][:3].upper()}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
    else:
        po_number = f"PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    sub_total = sum(item['quantity'] * item['unit_price'] for item in po_data.items)
    tax_amount = sub_total * 0.18 if po_data.currency == "INR" else 0
    total_amount = sub_total + tax_amount
    
    po_doc = {
        'id': po_id,
        'po_number': po_number,
        **po_data.model_dump(),
        'sub_total': sub_total,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.purchase_orders.insert_one(po_doc)
    return PurchaseOrder(**{k: v for k, v in po_doc.items() if k != '_id'})

@router.get("/purchase-orders", response_model=List[PurchaseOrder])
async def get_purchase_orders(status: Optional[str] = None, po_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query['status'] = status
    if po_type:
        query['po_type'] = po_type
    
    pos = await db.purchase_orders.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [PurchaseOrder(**po) for po in pos]

@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrder)
async def get_purchase_order(po_id: str, current_user: dict = Depends(get_current_user)):
    po = await db.purchase_orders.find_one({'id': po_id}, {'_id': 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return PurchaseOrder(**po)


@router.post("/grn", response_model=GRN)
async def create_grn(grn_data: GRNCreate, current_user: dict = Depends(get_current_user)):
    po = await db.purchase_orders.find_one({'id': grn_data.po_id}, {'_id': 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    grn_id = str(uuid.uuid4())
    grn_number = f"GRN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    grn_doc = {
        'id': grn_id,
        'grn_number': grn_number,
        **grn_data.model_dump(),
        'status': 'completed',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.grns.insert_one(grn_doc)
    
    for item in grn_data.items:
        await db.stock_transactions.insert_one({
            'id': str(uuid.uuid4()),
            'item_id': item['item_id'],
            'location': grn_data.location,
            'quantity': item['quantity'],
            'uom': item['uom'],
            'transaction_type': 'in',
            'reference_no': grn_number,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': current_user['id']
        })
        
        existing_stock = await db.stock.find_one({'item_id': item['item_id'], 'location': grn_data.location}, {'_id': 0})
        
        if existing_stock:
            await db.stock.update_one(
                {'item_id': item['item_id'], 'location': grn_data.location},
                {'$inc': {'quantity': item['quantity']}, '$set': {'last_updated': datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.stock.insert_one({
                'id': str(uuid.uuid4()),
                'item_id': item['item_id'],
                'location': grn_data.location,
                'quantity': item['quantity'],
                'uom': item['uom'],
                'last_updated': datetime.now(timezone.utc).isoformat()
            })
    
    await db.purchase_orders.update_one(
        {'id': grn_data.po_id},
        {'$set': {'status': 'received'}}
    )
    
    return GRN(**{k: v for k, v in grn_doc.items() if k != '_id'})

@router.get("/grn", response_model=List[GRN])
async def get_grns(po_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if po_id:
        query['po_id'] = po_id
    
    grns = await db.grns.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [GRN(**grn) for grn in grns]


@router.post("/landed-cost")
async def calculate_landed_cost(cost_data: LandedCostCreate, current_user: dict = Depends(get_current_user)):
    po = await db.purchase_orders.find_one({'id': cost_data.po_id}, {'_id': 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    total_expenses = cost_data.freight + cost_data.duty + cost_data.cha + cost_data.cfs + cost_data.insurance + cost_data.local_transport + cost_data.commission + cost_data.misc_expenses
    
    usd_value = po['sub_total']
    inr_value = usd_value * cost_data.fx_rate
    total_landed_cost = inr_value + total_expenses
    
    avg_cost_per_unit = total_landed_cost / sum(item['quantity'] for item in po['items'])
    
    landed_cost_doc = {
        'id': str(uuid.uuid4()),
        'po_id': cost_data.po_id,
        'usd_value': usd_value,
        'fx_rate': cost_data.fx_rate,
        'inr_value': inr_value,
        'freight': cost_data.freight,
        'duty': cost_data.duty,
        'cha': cost_data.cha,
        'cfs': cost_data.cfs,
        'insurance': cost_data.insurance,
        'local_transport': cost_data.local_transport,
        'commission': cost_data.commission,
        'misc_expenses': cost_data.misc_expenses,
        'total_expenses': total_expenses,
        'total_landed_cost': total_landed_cost,
        'avg_cost_per_unit': avg_cost_per_unit,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.landed_costs.insert_one(landed_cost_doc)
    
    for item in po['items']:
        item_landed_cost = (item['quantity'] * item['unit_price'] * cost_data.fx_rate + (total_expenses * item['quantity'] / sum(i['quantity'] for i in po['items']))) / item['quantity']
        await db.items.update_one(
            {'id': item['item_id']},
            {'$set': {'landed_cost': item_landed_cost, 'last_cost_update': datetime.now(timezone.utc).isoformat()}}
        )
    
    return {'message': 'Landed cost calculated', 'landed_cost_id': landed_cost_doc['id'], 'total_landed_cost': total_landed_cost, 'avg_cost_per_unit': avg_cost_per_unit}

@router.get("/landed-cost/{po_id}")
async def get_landed_cost(po_id: str, current_user: dict = Depends(get_current_user)):
    landed_cost = await db.landed_costs.find_one({'po_id': po_id}, {'_id': 0})
    if not landed_cost:
        raise HTTPException(status_code=404, detail="Landed cost not found")
    return landed_cost