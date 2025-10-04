#!/usr/bin/env python3
"""
EDUMANAGE Authentication Fix Script
==================================

This script fixes the critical authentication issues identified:
1. API URL double prefixing issue
2. Database connectivity problems
3. Admin user reset
4. Environment configuration

Usage: python fix_auth_issues.py
"""

import os
import sys
import json
import requests
import subprocess
from datetime import datetime
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n[STEP {step}] {description}")
    print("-" * 50)

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def backup_database():
    """Create database backup"""
    print_step(1, "Creating Database Backup")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"edumanage_backup_{timestamp}.dump"
    
    # Try different database names
    db_names = ['edumanage', 'edumanage_db']
    
    for db_name in db_names:
        cmd = f'pg_dump -U postgres -h localhost -p 5432 -Fc -f {backup_file} {db_name}'
        success, stdout, stderr = run_cmd(cmd)
        
        if success:
            print(f"✓ Database backup created: {backup_file}")
            return backup_file
        else:
            print(f"✗ Failed to backup {db_name}: {stderr}")
    
    print("⚠️  Could not create backup - proceeding with caution")
    return None

def fix_api_url():
    """Fix the API URL double prefixing issue"""
    print_step(2, "Fixing API URL Configuration")
    
    api_file = "src/lib/api.ts"
    
    if not os.path.exists(api_file):
        print(f"✗ API file not found: {api_file}")
        return False
    
    try:
        with open(api_file, 'r') as f:
            content = f.read()
        
        # Fix the API_BASE line to remove /api/v1 from default
        old_line = "const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';"
        new_line = "const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';"
        
        if old_line in content:
            content = content.replace(old_line, new_line)
            
            with open(api_file, 'w') as f:
                f.write(content)
            
            print("✓ Fixed API_BASE URL to avoid double /api/v1 prefixing")
            return True
        else:
            print("⚠️  API_BASE line not found or already fixed")
            return True
            
    except Exception as e:
        print(f"✗ Failed to fix API URL: {e}")
        return False

def create_env_files():
    """Create proper environment files"""
    print_step(3, "Creating Environment Files")
    
    # Backend .env
    backend_env = """DATABASE_URL=postgresql+psycopg2://postgres:Admin@localhost:5432/edumanage
JWT_SECRET=Hamz@ID_HMZ7
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin
ENVIRONMENT=development
DEBUG=true
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(backend_env)
        print("✓ Created backend .env file")
    except Exception as e:
        print(f"✗ Failed to create .env: {e}")
    
    # Frontend .env.local
    frontend_env = """VITE_API_URL=http://localhost:8000
"""
    
    try:
        with open('.env.local', 'w') as f:
            f.write(frontend_env)
        print("✓ Created frontend .env.local file")
    except Exception as e:
        print(f"✗ Failed to create .env.local: {e}")

def test_database_connection():
    """Test database connectivity"""
    print_step(4, "Testing Database Connection")
    
    # Test PostgreSQL is running
    success, stdout, stderr = run_cmd("pg_isready -h localhost -p 5432")
    if not success:
        print("✗ PostgreSQL is not running")
        print("  Start PostgreSQL service first")
        return False
    
    print("✓ PostgreSQL is running")
    
    # Test database exists
    success, stdout, stderr = run_cmd('psql -U postgres -h localhost -d edumanage -c "SELECT version();"')
    if success:
        print("✓ Database 'edumanage' is accessible")
        return True
    else:
        print(f"✗ Cannot access database: {stderr}")
        
        # Try to create database
        print("Attempting to create database...")
        success, stdout, stderr = run_cmd('createdb -U postgres -h localhost edumanage')
        if success:
            print("✓ Created database 'edumanage'")
            return True
        else:
            print(f"✗ Failed to create database: {stderr}")
            return False

def reset_admin_user():
    """Reset admin user via API or database"""
    print_step(5, "Resetting Admin User")
    
    # First try API reset
    try:
        response = requests.post("http://localhost:8000/api/v1/auth/debug/reset-admin", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✓ Admin user reset via API")
            print(f"  Username: {data.get('username', 'admin')}")
            print(f"  Password: {data.get('password', 'Admin')}")
            return True
        else:
            print(f"✗ API reset failed: {response.status_code}")
    except Exception as e:
        print(f"✗ API reset failed: {e}")
    
    # Try direct database reset
    print("Attempting database reset...")
    
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash("Admin")
    except ImportError:
        print("✗ passlib not available - install with: pip install passlib[bcrypt]")
        return False
    
    sql = f"""
    DELETE FROM admins WHERE username = 'admin';
    INSERT INTO admins (username, hashed_password, created_at) 
    VALUES ('admin', '{password_hash}', NOW());
    """
    
    with open('reset_admin.sql', 'w') as f:
        f.write(sql)
    
    success, stdout, stderr = run_cmd('psql -U postgres -h localhost -d edumanage -f reset_admin.sql')
    
    try:
        os.remove('reset_admin.sql')
    except:
        pass
    
    if success:
        print("✓ Admin user reset via database")
        print("  Username: admin")
        print("  Password: Admin")
        return True
    else:
        print(f"✗ Database reset failed: {stderr}")
        return False

def test_authentication():
    """Test the authentication flow"""
    print_step(6, "Testing Authentication")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✓ Backend health check passed")
        else:
            print(f"✗ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Backend not accessible: {e}")
        return False
    
    # Test login
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            data={"username": "admin", "password": "Admin"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✓ Login successful")
            data = response.json()
            token = data.get('access_token')
            
            # Test protected endpoint
            if token:
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get("http://localhost:8000/api/v1/teachers/", headers=headers, timeout=10)
                if response.status_code == 200:
                    print("✓ Protected endpoint access successful")
                    return True
                else:
                    print(f"✗ Protected endpoint failed: {response.status_code}")
            
        else:
            print(f"✗ Login failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Authentication test failed: {e}")
        return False

def generate_test_commands():
    """Generate test commands for verification"""
    print_step(7, "Test Commands for Verification")
    
    print("Use these commands to test the fixes:")
    print()
    print("1. Test backend health:")
    print("   curl http://localhost:8000/health")
    print()
    print("2. Test admin status:")
    print("   curl http://localhost:8000/api/v1/auth/debug/admin-status")
    print()
    print("3. Test login:")
    print('   curl -X POST http://localhost:8000/api/v1/auth/login \\')
    print('     -H "Content-Type: application/x-www-form-urlencoded" \\')
    print('     -d "username=admin&password=Admin"')
    print()
    print("4. Test protected endpoint (replace TOKEN):")
    print('   curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/v1/teachers/')
    print()
    print("5. Frontend access:")
    print("   Open http://localhost:5173")
    print("   Login with: admin / Admin")

def main():
    """Main execution function"""
    print_header("EDUMANAGE AUTHENTICATION FIX")
    print(f"Timestamp: {datetime.now()}")
    print(f"Working Directory: {os.getcwd()}")
    
    # Execute fixes in order
    backup_file = backup_database()
    
    if not fix_api_url():
        print("⚠️  API URL fix failed - continuing anyway")
    
    create_env_files()
    
    if not test_database_connection():
        print("✗ Database connection failed - cannot proceed")
        return False
    
    if not reset_admin_user():
        print("✗ Admin user reset failed - cannot proceed")
        return False
    
    if test_authentication():
        print_header("SUCCESS - AUTHENTICATION FIXED")
        print("✅ All authentication issues have been resolved")
        print()
        print("Next steps:")
        print("1. Start backend: uvicorn app.main:app --reload")
        print("2. Start frontend: npm run dev")
        print("3. Login with: admin / Admin")
        
        if backup_file:
            print(f"4. Backup saved as: {backup_file}")
    else:
        print_header("PARTIAL SUCCESS")
        print("⚠️  Some issues remain - check the output above")
    
    generate_test_commands()
    
    return True

if __name__ == "__main__":
    main()
