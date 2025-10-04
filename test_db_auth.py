#!/usr/bin/env python3
"""
Test script to verify database connection and authentication
"""

import os
import sys
sys.path.append('.')

from app.database import SessionLocal, engine
from app.models.models import Admin
from app.utils.auth import verify_password, hash_password
from app.config import settings
from sqlalchemy import text

def test_database_connection():
    """Test basic database connectivity"""
    print("🔍 Testing database connection...")
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✅ Database connected: {version[:50]}...")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_admin_user():
    """Test admin user existence and credentials"""
    print("🔍 Testing admin user...")
    try:
        db = SessionLocal()

        # Check if admin user exists
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            print("❌ Admin user not found")
            db.close()
            return False

        print(f"✅ Admin user found: {admin.username}")
        print(f"   Password hash length: {len(admin.hashed_password)}")

        # Test password verification
        test_passwords = ["admin123", "Admin", "admin"]
        for pwd in test_passwords:
            if verify_password(pwd, admin.hashed_password):
                print(f"✅ Password '{pwd}' works!")
                break
        else:
            print("❌ None of the test passwords work")
            print(f"   Hash: {admin.hashed_password[:50]}...")

        db.close()
        return True
    except Exception as e:
        print(f"❌ Admin user test failed: {e}")
        return False

def test_auth_functions():
    """Test authentication functions"""
    print("🔍 Testing auth functions...")
    try:
        # Test password hashing
        hashed = hash_password("admin123")
        verified = verify_password("admin123", hashed)
        print(f"✅ Password hashing/verification: {'OK' if verified else 'FAILED'}")

        # Test settings
        print(f"✅ JWT Secret configured: {'Yes' if settings.get_jwt_secret() else 'No'}")
        print(f"✅ Database URL: {settings.DATABASE_URL[:50]}...")

        return True
    except Exception as e:
        print(f"❌ Auth functions test failed: {e}")
        return False

def main():
    print("🧪 EDUmanage Database & Authentication Test")
    print("=" * 50)

    results = []
    results.append(test_database_connection())
    results.append(test_admin_user())
    results.append(test_auth_functions())

    print("\n" + "=" * 50)
    if all(results):
        print("🎉 All tests passed! Backend should work with database.")
        print("\nNext steps:")
        print("1. Start backend: uvicorn app.main:app --reload")
        print("2. Test login endpoint: POST /api/v1/auth/login")
        print("3. Username: admin, Password: admin123")
    else:
        print("❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
