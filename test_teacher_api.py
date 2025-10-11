#!/usr/bin/env python3
"""
Test teacher creation API endpoint
"""

import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"

def test_teacher_creation():
    """Test creating a teacher through the API"""
    try:
        # First, let's test if we can get subjects (to verify auth)
        print("🔍 Testing subjects endpoint...")
        subjects_response = requests.get(f"{BASE_URL}/subjects/")
        print(f"Subjects response: {subjects_response.status_code}")
        
        # Test teacher creation
        print("🔍 Testing teacher creation...")
        teacher_data = {
            "full_name": "Test Teacher",
            "speciality": "Mathematics",
            "email": "test.teacher@example.com",
            "phone": "+1234567890"
        }
        
        teacher_response = requests.post(
            f"{BASE_URL}/teachers/",
            json=teacher_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Teacher creation response: {teacher_response.status_code}")
        if teacher_response.status_code == 200:
            print("✅ Teacher created successfully!")
            print(f"Response: {teacher_response.json()}")
        else:
            print(f"❌ Failed to create teacher: {teacher_response.text}")
            
        return teacher_response.status_code == 200
        
    except Exception as e:
        print(f"❌ Error testing teacher creation: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing teacher creation API...")
    success = test_teacher_creation()
    if success:
        print("✅ Test completed successfully!")
    else:
        print("❌ Test failed!")