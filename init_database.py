#!/usr/bin/env python3
"""
Database initialization script for EduManage SaaS
Creates all necessary tables based on the SQLAlchemy models
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to the path so we can import our models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.models import Base
from app.config import settings
from app.database import engine

def init_database():
    """Initialize the database with all tables"""
    try:
        print("🔗 Connecting to database...")
        
        print("📋 Creating all tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database initialization completed successfully!")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"📊 PostgreSQL version: {version}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting EduManage Database Initialization...")
    print(f"📍 Database URL: {settings.DATABASE_URL}")
    
    success = init_database()
    
    if success:
        print("🎉 Database is ready for use!")
        sys.exit(0)
    else:
        print("💥 Database initialization failed!")
        sys.exit(1)