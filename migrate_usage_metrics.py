#!/usr/bin/env python3
"""
Database migration to update usage_metrics table structure
"""

import sys
import os
from sqlalchemy import text

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.database import SessionLocal

def migrate_usage_metrics_table():
    """Update usage_metrics table to match the service expectations"""
    db = SessionLocal()
    
    try:
        print("🔧 Starting usage_metrics table migration...")
        
        # Check if table exists and get current structure
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usage_metrics'
            ORDER BY ordinal_position
        """))
        
        current_columns = {row[0]: row[1] for row in result.fetchall()}
        print(f"Current columns: {list(current_columns.keys())}")
        
        # Drop and recreate table with new structure
        print("Dropping existing usage_metrics table...")
        db.execute(text("DROP TABLE IF EXISTS usage_metrics CASCADE"))
        db.commit()
        
        print("Creating new usage_metrics table...")
        db.execute(text("""
            CREATE TABLE usage_metrics (
                id SERIAL PRIMARY KEY,
                subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
                metric_type VARCHAR NOT NULL,
                quantity INTEGER NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.commit()
        
        print("✅ Created new usage_metrics table with correct structure")
        print("🎉 Usage metrics table migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Running usage_metrics table migration...")
    success = migrate_usage_metrics_table()
    if success:
        print("✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        sys.exit(1)