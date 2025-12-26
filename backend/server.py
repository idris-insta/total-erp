from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.getenv('JWT_SECRET', 'adhesive-erp-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'password': hashed_password.decode('utf-8'),
        'name': user_data.name,
        'role': user_data.role,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = jwt.encode({'user_id': user_id, 'exp': datetime.now(timezone.utc) + timedelta(days=7)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, role=user_data.role)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({'user_id': user['id'], 'exp': datetime.now(timezone.utc) + timedelta(days=7)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return TokenResponse(
        token=token,
        user=UserResponse(id=user['id'], email=user['email'], name=user['name'], role=user['role'])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        name=current_user['name'],
        role=current_user['role']
    )


from routes import crm, inventory, production, procurement, accounts, hrms, quality, dashboard

api_router.include_router(crm.router, prefix="/crm", tags=["CRM"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(production.router, prefix="/production", tags=["Production"])
api_router.include_router(procurement.router, prefix="/procurement", tags=["Procurement"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(hrms.router, prefix="/hrms", tags=["HRMS"])
api_router.include_router(quality.router, prefix="/quality", tags=["Quality"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()