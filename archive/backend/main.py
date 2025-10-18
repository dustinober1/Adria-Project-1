"""
Main FastAPI application
"""
from fastapi import FastAPI, Depends, HTTPException, status, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import os
import secrets

from backend.database import engine, get_db, Base
from backend.models import User, BlogArticle, EmailList
from backend.schemas import (
    UserRegister, UserLogin, UserResponse, AuthResponse,
    BlogArticleCreate, BlogArticleUpdate, BlogArticleResponse,
    EmailSubscribe, EmailResponse, AdminStats,
    UserTierUpdate, UserStatusUpdate, UserAdminNotesUpdate,
    UserDetailResponse, ForgotPasswordRequest, ResetPasswordRequest
)
from backend.security import (
    hash_password, verify_password, create_access_token, verify_token
)

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Adria Style Studio API",
    description="Backend API for Adria Style Studio",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="public", html=True), name="static")


# ============ UTILITY FUNCTIONS ============
def get_current_user(token: str = Cookie(None), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify they're admin"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def user_to_response(user: User) -> dict:
    """Convert User model to response dict"""
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isAdmin": user.is_admin,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLogin": user.last_login.isoformat() if user.last_login else None
    }


# ============ AUTHENTICATION ENDPOINTS ============
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        hashed_password=hash_password(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    token = create_access_token({"userId": new_user.id})
    
    response_data = {
        "success": True,
        "message": "User registered successfully",
        "user": user_to_response(new_user),
        "token": token
    }
    
    # Return with httpOnly cookie
    json_response = JSONResponse(content=response_data)
    json_response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    return json_response


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    user.last_login = __import__('datetime').datetime.now()
    db.commit()
    
    # Create token
    token = create_access_token({"userId": user.id})
    
    response_data = {
        "success": True,
        "message": "Login successful",
        "user": user_to_response(user),
        "token": token
    }
    
    # Return with httpOnly cookie
    json_response = JSONResponse(content=response_data)
    json_response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )
    return json_response


@app.post("/api/auth/logout")
async def logout():
    """Logout user"""
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    response.delete_cookie(key="token")
    return response


@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists
        return {"success": True, "message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires = datetime.now() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = expires
    db.commit()
    
    # In a real app, send email. For demo, return the reset link
    reset_link = f"http://localhost:3000/reset-password.html?token={reset_token}"
    
    return {
        "success": True,
        "message": "If an account with that email exists, a password reset link has been sent.",
        "reset_link": reset_link  # Remove in production
    }


@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token"""
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.now()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Update password
    user.hashed_password = hash_password(request.newPassword)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"success": True, "message": "Password reset successfully"}


@app.get("/api/auth/me")
async def get_current_user_endpoint(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "success": True,
        "message": "User found",
        "user": user_to_response(current_user)
    }


# ============ BLOG ENDPOINTS ============
@app.get("/api/blog/articles", response_model=list[BlogArticleResponse])
async def get_articles(db: Session = Depends(get_db)):
    """Get all published articles"""
    articles = db.query(BlogArticle).filter(BlogArticle.published == True).all()
    return articles


@app.get("/api/blog/articles/{slug}", response_model=BlogArticleResponse)
async def get_article_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get article by slug"""
    article = db.query(BlogArticle).filter(BlogArticle.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# ============ ADMIN ENDPOINTS ============
@app.get("/api/admin/stats", response_model=AdminStats)
async def get_admin_stats(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Get admin dashboard statistics"""
    return AdminStats(
        totalUsers=db.query(User).count(),
        totalArticles=db.query(BlogArticle).count(),
        publishedArticles=db.query(BlogArticle).filter(BlogArticle.published == True).count(),
        draftArticles=db.query(BlogArticle).filter(BlogArticle.published == False).count(),
        totalAdmins=db.query(User).filter(User.is_admin == True).count(),
        totalSubscribers=db.query(EmailList).filter(EmailList.subscribed == True).count()
    )


@app.get("/api/admin/users")
async def get_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(User).all()
    return {
        "success": True,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "customer_tier": u.customer_tier,
                "customer_status": u.customer_status,
                "is_admin": u.is_admin,
                "created_at": u.created_at
            }
            for u in users
        ]
    }


@app.get("/api/admin/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "isAdmin": user.is_admin,
            "createdAt": user.created_at,
            "lastLogin": user.last_login,
            "customer_tier": user.customer_tier,
            "customer_status": user.customer_status,
            "admin_notes": user.admin_notes
        }
    }


@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted successfully"}


@app.post("/api/admin/users/{user_id}/promote")
async def promote_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Promote user to admin"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = True
    db.commit()
    return {"success": True, "message": "User promoted to admin"}


@app.post("/api/admin/users/{user_id}/demote")
async def demote_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Demote admin to user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = False
    db.commit()
    return {"success": True, "message": "User demoted from admin"}


@app.put("/api/admin/users/{user_id}/tier")
async def update_user_tier(
    user_id: int,
    tier_data: UserTierUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user tier"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.customer_tier = tier_data.tier
    db.commit()
    return {"success": True, "message": "User tier updated"}


@app.put("/api/admin/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.customer_status = status_data.status
    db.commit()
    return {"success": True, "message": "User status updated"}


@app.put("/api/admin/users/{user_id}/notes")
async def update_user_notes(
    user_id: int,
    notes_data: UserAdminNotesUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update admin notes for user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.admin_notes = notes_data.notes
    db.commit()
    return {"success": True, "message": "Admin notes updated"}


# ============ BLOG ADMIN ENDPOINTS ============
@app.get("/api/admin/articles")
async def get_admin_articles(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Get all articles (admin view)"""
    articles = db.query(BlogArticle).all()
    return {
        "success": True,
        "articles": [
            {
                "id": a.id,
                "title": a.title,
                "slug": a.slug,
                "excerpt": a.excerpt,
                "published": a.published,
                "featured_image": a.featured_image,
                "created_at": a.created_at,
                "updated_at": a.updated_at
            }
            for a in articles
        ]
    }


@app.post("/api/admin/articles")
async def create_article(
    article_data: BlogArticleCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new article"""
    # Check if slug already exists
    existing = db.query(BlogArticle).filter(BlogArticle.slug == article_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    new_article = BlogArticle(
        title=article_data.title,
        slug=article_data.slug,
        content=article_data.content,
        excerpt=article_data.excerpt,
        featured_image=article_data.featured_image,
        published=article_data.published
    )
    
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    
    return {
        "success": True,
        "message": "Article created successfully",
        "article": {
            "id": new_article.id,
            "title": new_article.title,
            "slug": new_article.slug
        }
    }


@app.put("/api/admin/articles/{article_id}")
async def update_article(
    article_id: int,
    article_data: BlogArticleUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update article"""
    article = db.query(BlogArticle).filter(BlogArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Update fields if provided
    if article_data.title:
        article.title = article_data.title
    if article_data.slug:
        article.slug = article_data.slug
    if article_data.content:
        article.content = article_data.content
    if article_data.excerpt is not None:
        article.excerpt = article_data.excerpt
    if article_data.featured_image is not None:
        article.featured_image = article_data.featured_image
    if article_data.published is not None:
        article.published = article_data.published
    
    db.commit()
    return {"success": True, "message": "Article updated successfully"}


@app.delete("/api/admin/articles/{article_id}")
async def delete_article(
    article_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete article"""
    article = db.query(BlogArticle).filter(BlogArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    return {"success": True, "message": "Article deleted successfully"}


# ============ EMAIL SUBSCRIPTION ENDPOINTS ============
@app.post("/api/email/subscribe", response_model=dict)
async def subscribe_email(email_data: EmailSubscribe, db: Session = Depends(get_db)):
    """Subscribe email to mailing list"""
    # Check if already subscribed
    existing = db.query(EmailList).filter(EmailList.email == email_data.email).first()
    if existing:
        # Re-subscribe if unsubscribed
        if not existing.subscribed:
            existing.subscribed = True
            db.commit()
        return {"success": True, "message": "Already subscribed"}
    
    # Add new subscriber
    new_subscriber = EmailList(
        email=email_data.email,
        name=email_data.name,
        phone=email_data.phone,
        message=email_data.message,
        subscribed=True
    )
    
    db.add(new_subscriber)
    db.commit()
    
    return {"success": True, "message": "Subscribed successfully"}


# ============ ROOT ENDPOINTS ============
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Adria Style Studio API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
