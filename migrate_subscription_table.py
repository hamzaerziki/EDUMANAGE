#!/usr/bin/env python3
"""
Database migration to add missing columns to subscriptions table
"""

import sys
import os
from sqlalchemy import text

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.database import SessionLocal, engine

def migrate_subscription_table():
    """Add missing columns to subscriptions table"""
    db = SessionLocal()
    
    try:
        print("🔧 Starting database migration...")
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND column_name IN ('current_period_start', 'current_period_end')
        """))
        
        existing_columns = [row[0] for row in result.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Add missing columns
        if 'current_period_start' not in existing_columns:
            print("Adding current_period_start column...")
            db.execute(text("""
                ALTER TABLE subscriptions 
                ADD COLUMN current_period_start TIMESTAMP NULL
            """))
            db.commit()
            print("✅ Added current_period_start column")
        else:
            print("✅ current_period_start column already exists")
        
        if 'current_period_end' not in existing_columns:
            print("Adding current_period_end column...")
            db.execute(text("""
                ALTER TABLE subscriptions 
                ADD COLUMN current_period_end TIMESTAMP NULL
            """))
            db.commit()
            print("✅ Added current_period_end column")
        else:
            print("✅ current_period_end column already exists")
        
        print("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Running database migration...")
    success = migrate_subscription_table()
    if success:
        print("✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        sys.exit(1)