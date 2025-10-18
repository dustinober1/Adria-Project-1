"""
Production Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
import os
from urllib.parse import quote_plus

# Database URL - now supports PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./adria.db")

# For PostgreSQL, we need to encode special characters in the password
if DATABASE_URL.startswith("postgresql://"):
    # Parse and encode the password if needed
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    password = quote_plus(parsed.password) if parsed.password else ''
    username = parsed.username
    hostname = parsed.hostname
    port = parsed.port
    database = parsed.path[1:]  # Remove leading slash
    
    DATABASE_URL = f"postgresql://{username}:{password}@{hostname}:{port}/{database}"

# Create engine with production-appropriate settings
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=int(os.getenv("DB_POOL_SIZE", 5)),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", 10)),
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=os.getenv("DEBUG_DB", "false").lower() == "true"  # Only enable in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()