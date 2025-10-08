#!/usr/bin/env python3
"""
Create admin user script for EduManage SaaS
Creates an initial admin user for testing
"""

import sys
import os
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the app directory to the path so we can import our models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.models import Admin, InstitutionSettings
from app.config import settings
from app.database import engine, SessionLocal

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    """Create an admin user and basic institution settings"""
    try:
        print("🔗 Connecting to database...")
        
        db = SessionLocal()
        
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.username == "admin").first()
        if existing_admin:
            print("ℹ️ Admin user already exists!")
        else:
            print("👤 Creating admin user...")
            hashed_password = pwd_context.hash("admin123")
            admin = Admin(
                username="admin",
                password=hashed_password
            )
            db.add(admin)
            print("✅ Admin user created: username=admin, password=admin123")
        
        # Check if institution settings exist
        existing_settings = db.query(InstitutionSettings).first()
        if existing_settings:
            print("ℹ️ Institution settings already exist!")
        else:
            print("🏫 Creating institution settings...")
            settings_data = InstitutionSettings(
                name="EduManage Academy",
                address="123 Education Street, Knowledge City",
                phone="+212 6XX XXX XXX",
                email="contact@edumanage.ma",
                time_zone="Africa/Casablanca",
                academic_year=2024,
                current_semester="Fall 2024",
                grading_scale={
                    "A": {"min": 18, "max": 20, "label": "Excellent"},
                    "B+": {"min": 16, "max": 17.99, "label": "Très Bien"},
                    "B": {"min": 14, "max": 15.99, "label": "Bien"},
                    "C+": {"min": 12, "max": 13.99, "label": "Assez Bien"},
                    "C": {"min": 10, "max": 11.99, "label": "Passable"},
                    "F": {"min": 0, "max": 9.99, "label": "Insuffisant"}
                },
                attendance_types=["present", "absent", "late", "excused"],
                payment_methods=["cash", "check", "bank_transfer", "card"],
                document_types=["certificate", "report_card", "absence_excuse"],
                event_types=["academic", "social", "holiday", "exam", "meeting"]
            )
            db.add(settings_data)
            print("✅ Institution settings created!")
        
        db.commit()
        print("🎉 Setup completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 Starting EduManage Admin Setup...")
    
    success = create_admin_user()
    
    if success:
        print("🎯 You can now login with:")
        print("   Username: admin")
        print("   Password: admin123")
        sys.exit(0)
    else:
        print("💥 Admin setup failed!")
        sys.exit(1)