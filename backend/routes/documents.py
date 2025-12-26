from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os
import shutil
from pathlib import Path
from server import db, get_current_user

router = APIRouter()

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class Document(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    module: str
    entity: str
    entity_id: str
    description: Optional[str] = None
    version: int = 1
    uploaded_by: str
    uploaded_at: str

class EmailTemplate(BaseModel):
    name: str
    subject: str
    body: str
    module: str
    entity: str
    placeholders: List[str]

class EmailTemplateResponse(BaseModel):
    id: str
    name: str
    subject: str
    body: str
    module: str
    entity: str
    placeholders: List[str]
    created_at: str


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    module: str = None,
    entity: str = None,
    entity_id: str = None,
    description: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Upload documents/attachments to any entity
    """
    if not module or not entity or not entity_id:
        raise HTTPException(status_code=400, detail="Module, entity, and entity_id are required")
    
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = file_path.stat().st_size
    
    doc = {
        'id': file_id,
        'filename': filename,
        'original_filename': file.filename,
        'file_path': str(file_path),
        'file_size': file_size,
        'mime_type': file.content_type,
        'module': module,
        'entity': entity,
        'entity_id': entity_id,
        'description': description,
        'version': 1,
        'uploaded_by': current_user['id'],
        'uploaded_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.documents.insert_one(doc)
    
    return {
        'message': 'Document uploaded successfully',
        'document': Document(**{k: v for k, v in doc.items() if k != '_id'})
    }

@router.get("/documents")
async def get_documents(
    module: Optional[str] = None,
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get documents for an entity
    """
    query = {}
    if module:
        query['module'] = module
    if entity:
        query['entity'] = entity
    if entity_id:
        query['entity_id'] = entity_id
    
    documents = await db.documents.find(query, {'_id': 0}).sort('uploaded_at', -1).to_list(1000)
    return [Document(**doc) for doc in documents]

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a document
    """
    document = await db.documents.find_one({'id': document_id}, {'_id': 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document['file_path'])
    if file_path.exists():
        file_path.unlink()
    
    await db.documents.delete_one({'id': document_id})
    
    return {'message': 'Document deleted successfully'}


@router.post("/email-templates", response_model=EmailTemplateResponse)
async def create_email_template(template_data: EmailTemplate, current_user: dict = Depends(get_current_user)):
    """
    Create email templates for invoices, POs, quotes, etc.
    """
    if current_user['role'] not in ['admin']:
        raise HTTPException(status_code=403, detail="Only admins can create email templates")
    
    template_id = str(uuid.uuid4())
    template_doc = {
        'id': template_id,
        **template_data.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.email_templates.insert_one(template_doc)
    return EmailTemplateResponse(**{k: v for k, v in template_doc.items() if k != '_id'})

@router.get("/email-templates", response_model=List[EmailTemplateResponse])
async def get_email_templates(module: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """
    Get all email templates
    """
    query = {}
    if module:
        query['module'] = module
    
    templates = await db.email_templates.find(query, {'_id': 0}).to_list(1000)
    return [EmailTemplateResponse(**template) for template in templates]


@router.post("/notifications/create")
async def create_notification(
    title: str,
    message: str,
    notification_type: str,
    module: str,
    entity_id: Optional[str] = None,
    recipients: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Create system notifications
    """
    notification_id = str(uuid.uuid4())
    
    notification_doc = {
        'id': notification_id,
        'title': title,
        'message': message,
        'notification_type': notification_type,
        'module': module,
        'entity_id': entity_id,
        'recipients': recipients or [],
        'read_by': [],
        'created_by': current_user['id'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification_doc)
    
    return {'message': 'Notification created', 'notification_id': notification_id}

@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """
    Get user notifications
    """
    notifications = await db.notifications.find(
        {
            '$or': [
                {'recipients': current_user['id']},
                {'recipients': []}
            ],
            'read_by': {'$ne': current_user['id']}
        },
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Mark notification as read
    """
    await db.notifications.update_one(
        {'id': notification_id},
        {'$addToSet': {'read_by': current_user['id']}}
    )
    
    return {'message': 'Notification marked as read'}