#!/usr/bin/env python3
"""
Force database reset script for EduManage SaaS
Uses CASCADE to drop all tables and dependencies
"""

import sys
import os
from sqlalchemy import create_engine, text

# Add the app directory to the path so we can import our models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.models import Base
from app.config import settings
from app.database import engine

def force_reset_database():
    """Force reset the database using CASCADE"""
    try:
        print("🔗 Connecting to database...")
        
        with engine.connect() as conn:
            # Get all tables
            result = conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"🗑️ Found tables to drop: {', '.join(tables)}")
                
                # Drop all tables with CASCADE
                for table in tables:
                    print(f"   Dropping {table}...")
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                
                conn.commit()
                print("✅ All tables dropped successfully!")
            else:
                print("ℹ️ No tables found to drop.")
        
        print("📋 Creating all tables with new schema...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database reset completed successfully!")
        
        # Verify tables were created
        with engine.connect() as conn:
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
    print("🚀 Starting EduManage Force Database Reset...")
    print("⚠️  WARNING: This will DELETE ALL DATA and dependencies!")
    
    success = force_reset_database()
    
    if success:
        print("🎉 Database has been completely reset!")
        sys.exit(0)
    else:
        print("💥 Database reset failed!")
        sys.exit(1)