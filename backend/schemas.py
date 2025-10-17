"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ============ AUTH SCHEMAS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    firstName: str
    lastName: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    isAdmin: bool = False
    createdAt: Optional[datetime] = None
    lastLogin: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse
    token: Optional[str] = None


# ============ BLOG SCHEMAS ============
class BlogArticleCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    published: bool = False


class BlogArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    published: Optional[bool] = None


class BlogArticleResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ EMAIL SCHEMAS ============
class EmailSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None


class EmailResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    subscribed: bool
    
    class Config:
        from_attributes = True


# ============ ADMIN SCHEMAS ============
class AdminStats(BaseModel):
    totalUsers: int
    totalArticles: int
    publishedArticles: int
    draftArticles: int
    totalAdmins: int
    totalSubscribers: int


class UserTierUpdate(BaseModel):
    tier: str


class UserStatusUpdate(BaseModel):
    status: str


class UserAdminNotesUpdate(BaseModel):
    notes: str


class UserDetailResponse(BaseModel):
    id: int
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    isAdmin: bool
    createdAt: datetime
    lastLogin: Optional[datetime] = None
    customer_tier: str
    customer_status: str
    admin_notes: Optional[str] = None
    
    class Config:
        from_attributes = True
