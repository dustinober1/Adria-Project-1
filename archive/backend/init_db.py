"""
Initialize database with admin user and sample data
"""
import sys
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, BlogArticle, EmailList
from backend.security import hash_password
from datetime import datetime

def init_db():
    """Initialize database"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@adriastyle.com").first()
        if not admin:
            print("Creating admin user...")
            admin = User(
                email="admin@adriastyle.com",
                first_name="Admin",
                last_name="User",
                hashed_password=hash_password("Admin123!"),
                is_admin=True,
                customer_tier="paid",
                customer_status="active_customer"
            )
            db.add(admin)
            db.commit()
            print("✓ Admin user created: admin@adriastyle.com / Admin123!")
        else:
            print("✓ Admin user already exists")
        
        # Add sample articles if none exist
        if db.query(BlogArticle).count() == 0:
            print("Adding sample blog articles...")
            articles = [
                BlogArticle(
                    title="Capsule Wardrobe Essentials",
                    slug="capsule-wardrobe",
                    excerpt="Learn the basics of building a capsule wardrobe",
                    content="# Capsule Wardrobe\n\nA capsule wardrobe is a collection of essential, versatile pieces...",
                    featured_image="https://via.placeholder.com/800x400",
                    published=True
                ),
                BlogArticle(
                    title="2025 Season Color Trends",
                    slug="seasoncolortrends2025",
                    excerpt="Discover the hottest color trends for 2025",
                    content="# 2025 Color Trends\n\nThis season brings fresh, vibrant colors to the fashion world...",
                    featured_image="https://via.placeholder.com/800x400",
                    published=True
                ),
                BlogArticle(
                    title="Mixing Like a Pro",
                    slug="mixinglikeapro",
                    excerpt="Master the art of mixing patterns and styles",
                    content="# Mixing Like a Pro\n\nMixing patterns can seem intimidating, but with these tips...",
                    featured_image="https://via.placeholder.com/800x400",
                    published=True
                )
            ]
            db.add_all(articles)
            db.commit()
            print(f"✓ Added {len(articles)} sample articles")
        else:
            print("✓ Articles already exist")
        
        print("\n✅ Database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
