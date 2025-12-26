from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from server import db, get_current_user

router = APIRouter()

class ItemCreate(BaseModel):
    item_code: str
    item_name: str
    category: str
    item_type: str
    uom: str
    secondary_uom: Optional[str] = None
    thickness: Optional[float] = None
    width: Optional[float] = None
    length: Optional[float] = None
    color: Optional[str] = None
    adhesive_type: Optional[str] = None
    reorder_level: float
    safety_stock: float

class Item(BaseModel):
    id: str
    item_code: str
    item_name: str
    category: str
    item_type: str
    uom: str
    secondary_uom: Optional[str] = None
    thickness: Optional[float] = None
    width: Optional[float] = None
    length: Optional[float] = None
    color: Optional[str] = None
    adhesive_type: Optional[str] = None
    reorder_level: float
    safety_stock: float
    created_at: str

class StockEntry(BaseModel):
    item_id: str
    location: str
    quantity: float
    uom: str
    transaction_type: str
    reference_no: Optional[str] = None
    notes: Optional[str] = None

class Stock(BaseModel):
    id: str
    item_id: str
    location: str
    quantity: float
    uom: str
    secondary_quantity: Optional[float] = None
    last_updated: str

class StockTransferCreate(BaseModel):
    from_location: str
    to_location: str
    items: List[dict]
    truck_no: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None

class StockTransfer(BaseModel):
    id: str
    transfer_number: str
    from_location: str
    to_location: str
    items: List[dict]
    status: str
    truck_no: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    issued_at: Optional[str] = None
    received_at: Optional[str] = None


@router.post("/items", response_model=Item)
async def create_item(item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.items.find_one({'item_code': item_data.item_code}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists")
    
    item_id = str(uuid.uuid4())
    item_doc = {
        'id': item_id,
        **item_data.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.items.insert_one(item_doc)
    return Item(**{k: v for k, v in item_doc.items() if k != '_id'})

@router.get("/items", response_model=List[Item])
async def get_items(category: Optional[str] = None, item_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query['category'] = category
    if item_type:
        query['item_type'] = item_type
    
    items = await db.items.find(query, {'_id': 0}).to_list(1000)
    return [Item(**item) for item in items]

@router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({'id': item_id}, {'_id': 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(**item)


@router.post("/stock")
async def add_stock_entry(stock_data: StockEntry, current_user: dict = Depends(get_current_user)):
    entry_id = str(uuid.uuid4())
    entry_doc = {
        'id': entry_id,
        **stock_data.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.stock_transactions.insert_one(entry_doc)
    
    stock = await db.stock.find_one({'item_id': stock_data.item_id, 'location': stock_data.location}, {'_id': 0})
    
    if stock:
        new_qty = stock['quantity'] + (stock_data.quantity if stock_data.transaction_type == 'in' else -stock_data.quantity)
        await db.stock.update_one(
            {'item_id': stock_data.item_id, 'location': stock_data.location},
            {'$set': {'quantity': new_qty, 'last_updated': datetime.now(timezone.utc).isoformat()}}
        )
    else:
        stock_id = str(uuid.uuid4())
        stock_doc = {
            'id': stock_id,
            'item_id': stock_data.item_id,
            'location': stock_data.location,
            'quantity': stock_data.quantity,
            'uom': stock_data.uom,
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
        await db.stock.insert_one(stock_doc)
    
    return {'message': 'Stock updated', 'entry_id': entry_id}

@router.get("/stock", response_model=List[Stock])
async def get_stock(location: Optional[str] = None, item_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if location:
        query['location'] = location
    if item_id:
        query['item_id'] = item_id
    
    stock = await db.stock.find(query, {'_id': 0}).to_list(1000)
    return [Stock(**s) for s in stock]

@router.get("/stock/low-stock")
async def get_low_stock(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {
            '$lookup': {
                'from': 'items',
                'localField': 'item_id',
                'foreignField': 'id',
                'as': 'item_details'
            }
        },
        {'$unwind': '$item_details'},
        {
            '$match': {
                '$expr': {'$lt': ['$quantity', '$item_details.reorder_level']}
            }
        },
        {'$project': {'_id': 0}}
    ]
    
    low_stock = await db.stock.aggregate(pipeline).to_list(1000)
    return low_stock


@router.post("/transfers", response_model=StockTransfer)
async def create_stock_transfer(transfer_data: StockTransferCreate, current_user: dict = Depends(get_current_user)):
    transfer_id = str(uuid.uuid4())
    transfer_number = f"STR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    transfer_doc = {
        'id': transfer_id,
        'transfer_number': transfer_number,
        **transfer_data.model_dump(),
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current_user['id']
    }
    
    await db.stock_transfers.insert_one(transfer_doc)
    return StockTransfer(**{k: v for k, v in transfer_doc.items() if k != '_id'})

@router.get("/transfers", response_model=List[StockTransfer])
async def get_stock_transfers(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query['status'] = status
    
    transfers = await db.stock_transfers.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [StockTransfer(**transfer) for transfer in transfers]

@router.put("/transfers/{transfer_id}/issue")
async def issue_stock_transfer(transfer_id: str, current_user: dict = Depends(get_current_user)):
    transfer = await db.stock_transfers.find_one({'id': transfer_id}, {'_id': 0})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    for item in transfer['items']:
        await db.stock_transactions.insert_one({
            'id': str(uuid.uuid4()),
            'item_id': item['item_id'],
            'location': transfer['from_location'],
            'quantity': -item['quantity'],
            'uom': item['uom'],
            'transaction_type': 'out',
            'reference_no': transfer['transfer_number'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': current_user['id']
        })
        
        await db.stock.update_one(
            {'item_id': item['item_id'], 'location': transfer['from_location']},
            {'$inc': {'quantity': -item['quantity']}, '$set': {'last_updated': datetime.now(timezone.utc).isoformat()}}
        )
    
    await db.stock_transfers.update_one(
        {'id': transfer_id},
        {'$set': {'status': 'issued', 'issued_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {'message': 'Stock transfer issued'}

@router.put("/transfers/{transfer_id}/receive")
async def receive_stock_transfer(transfer_id: str, current_user: dict = Depends(get_current_user)):
    transfer = await db.stock_transfers.find_one({'id': transfer_id}, {'_id': 0})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    for item in transfer['items']:
        await db.stock_transactions.insert_one({
            'id': str(uuid.uuid4()),
            'item_id': item['item_id'],
            'location': transfer['to_location'],
            'quantity': item['quantity'],
            'uom': item['uom'],
            'transaction_type': 'in',
            'reference_no': transfer['transfer_number'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': current_user['id']
        })
        
        existing_stock = await db.stock.find_one({'item_id': item['item_id'], 'location': transfer['to_location']}, {'_id': 0})
        
        if existing_stock:
            await db.stock.update_one(
                {'item_id': item['item_id'], 'location': transfer['to_location']},
                {'$inc': {'quantity': item['quantity']}, '$set': {'last_updated': datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.stock.insert_one({
                'id': str(uuid.uuid4()),
                'item_id': item['item_id'],
                'location': transfer['to_location'],
                'quantity': item['quantity'],
                'uom': item['uom'],
                'last_updated': datetime.now(timezone.utc).isoformat()
            })
    
    await db.stock_transfers.update_one(
        {'id': transfer_id},
        {'$set': {'status': 'received', 'received_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {'message': 'Stock transfer received'}