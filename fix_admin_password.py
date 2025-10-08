#!/usr/bin/env python3
"""
Fix admin password field and recreate admin user with proper credentials
"""

import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import engine, SessionLocal
from app.models.models import Base, Admin
from app.utils.auth import pwd_context
from app.config import settings

def fix_admin_password():
    """Drop and recreate tables, then create admin user with proper password"""
    try:
        print("🔄 Dropping and recreating database tables...")
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✅ Tables dropped successfully")
        
        # Create all tables with new schema
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Create session
        db = SessionLocal()
        
        try:
            # Create admin user with proper hashed password
            print(f"🔄 Creating admin user: {settings.ADMIN_USERNAME}")
            
            hashed_password = pwd_context.hash(settings.ADMIN_PASSWORD)
            admin = Admin(
                username=settings.ADMIN_USERNAME,
                hashed_password=hashed_password
            )
            
            db.add(admin)
            db.commit()
            
            print(f"✅ Admin user created successfully!")
            print(f"   Username: {settings.ADMIN_USERNAME}")
            print(f"   Password: {settings.ADMIN_PASSWORD}")
            
            # Verify the admin was created correctly
            check_admin = db.query(Admin).filter(Admin.username == settings.ADMIN_USERNAME).first()
            if check_admin and hasattr(check_admin, 'hashed_password'):
                print("✅ Admin user verification passed")
                return True
            else:
                print("❌ Admin user verification failed")
                return False
                
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting admin password fix...")
    success = fix_admin_password()
    if success:
        print("🎉 Admin password fix completed successfully!")
        print("🔑 You can now login with admin/admin123")
    else:
        print("💥 Admin password fix failed!")
        sys.exit(1)