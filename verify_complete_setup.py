#!/usr/bin/env python3
"""
Complete verification script for EDUmanage authentication
"""

import os
import sys
import requests
import time
import subprocess
sys.path.append('.')

def print_step(step, title):
    print(f"\n{'='*60}")
    print(f"STEP {step}: {title}")
    print(f"{'='*60}")

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            return True, result.stdout.strip()
        else:
            print(f"❌ {description} - FAILED")
            print(f"   Error: {result.stderr.strip()}")
            return False, result.stderr.strip()
    except Exception as e:
        print(f"❌ {description} - ERROR: {str(e)}")
        return False, str(e)

def test_database_connection():
    """Test database connection"""
    print_step(1, "Testing Database Connection")

    # Test PostgreSQL connection
    success, output = run_command(
        'psql -U postgres -h localhost -d edumanage -c "SELECT version();"',
        "Testing PostgreSQL connection"
    )

    if not success:
        print("❌ Cannot connect to database. Make sure PostgreSQL is running.")
        return False

    # Test admin user exists
    success, output = run_command(
        'psql -U postgres -h localhost -d edumanage -c "SELECT username, LENGTH(hashed_password) as hash_len FROM admins WHERE username=\'admin\';"',
        "Checking admin user in database"
    )

    if "admin" not in output:
        print("❌ Admin user not found in database")
        return False

    print("✅ Admin user found in database")
    return True

def start_backend():
    """Start the backend server"""
    print_step(2, "Starting Backend Server")

    print("🔧 Starting backend server...")
    try:
        # Start uvicorn in background
        process = subprocess.Popen(
            ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.getcwd()
        )

        # Wait a bit for server to start
        time.sleep(3)

        # Check if process is still running
        if process.poll() is None:
            print("✅ Backend server started successfully")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Backend server failed to start")
            print(f"   Error: {stderr.decode()}")
            return None

    except Exception as e:
        print(f"❌ Failed to start backend: {str(e)}")
        return None

def test_backend_health(backend_process):
    """Test backend health endpoint"""
    print_step(3, "Testing Backend Health")

    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("database") == "connected":
                print("✅ Backend health check passed")
                print("✅ Database connection confirmed")
                return True
            else:
                print(f"❌ Database connection issue: {data}")
                return False
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {str(e)}")
        return False

def test_authentication():
    """Test authentication endpoints"""
    print_step(4, "Testing Authentication")

    # Test admin status endpoint
    try:
        response = requests.get("http://localhost:8000/api/v1/auth/debug/admin-status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin status: {data.get('total_admins', 0)} admin(s) found")
        else:
            print(f"❌ Admin status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Admin status check error: {str(e)}")
        return False

    # Test login with correct credentials
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            data={"username": "admin", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print("✅ Login successful with admin/admin123")
                print(f"   Token received: {token[:50]}...")

                # Test protected endpoint
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get("http://localhost:8000/api/v1/teachers/", headers=headers, timeout=10)
                if response.status_code == 200:
                    print("✅ Protected endpoint access successful")
                    return True
                else:
                    print(f"❌ Protected endpoint failed: {response.status_code}")
                    return False
            else:
                print("❌ No token received in login response")
                return False
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Authentication test error: {str(e)}")
        return False

def main():
    print("🚀 EDUmanage Complete Authentication Verification")
    print("=" * 60)

    # Step 1: Test database
    if not test_database_connection():
        print("\n❌ Database tests failed. Cannot proceed.")
        return False

    # Step 2: Start backend
    backend_process = start_backend()
    if not backend_process:
        print("\n❌ Backend failed to start. Cannot proceed.")
        return False

    try:
        # Step 3: Test backend health
        if not test_backend_health(backend_process):
            print("\n❌ Backend health check failed.")
            return False

        # Step 4: Test authentication
        if not test_authentication():
            print("\n❌ Authentication tests failed.")
            return False

        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("✅ Database connection: WORKING")
        print("✅ Backend server: RUNNING")
        print("✅ Authentication: WORKING")
        print("✅ API endpoints: ACCESSIBLE")
        print("\n" + "=" * 60)
        print("🌐 Your application is ready!")
        print("\nNext steps:")
        print("1. Backend is running at: http://localhost:8000")
        print("2. Start frontend: npm run dev")
        print("3. Open browser: http://localhost:5173")
        print("4. Login with: admin / admin123")
        print("\nKeep the backend running in this terminal.")
        print("Open a new terminal for the frontend.")

        # Keep backend running
        print("\n🔄 Backend server is running. Press Ctrl+C to stop.")
        try:
            backend_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping backend server...")
            backend_process.terminate()
            backend_process.wait()

    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return False
    finally:
        if backend_process and backend_process.poll() is None:
            backend_process.terminate()

if __name__ == "__main__":
    main()
