#!/usr/bin/env python3
"""
Database reset script for EduManage SaaS
Drops all existing tables and recreates them with the current schema
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

def reset_database():
    """Reset the database by dropping and recreating all tables"""
    try:
        print("🔗 Connecting to database...")
        
        print("🗑️ Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        print("📋 Creating all tables with new schema...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database reset completed successfully!")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"📊 PostgreSQL version: {version}")
            
            # Check if tables were created
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Created tables: {', '.join(tables)}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting EduManage Database Reset...")
    print(f"📍 Database URL: {settings.DATABASE_URL}")
    print("⚠️  WARNING: This will delete all existing data!")
    
    success = reset_database()
    
    if success:
        print("🎉 Database has been reset and is ready for use!")
        sys.exit(0)
    else:
        print("💥 Database reset failed!")
        sys.exit(1)