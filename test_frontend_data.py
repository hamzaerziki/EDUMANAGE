#!/usr/bin/env python3
"""
Test script to verify teachers and groups data loading from frontend perspective
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_authenticated_requests():
    """Test the full flow: login + data retrieval"""
    
    print("🔐 Testing authentication and data loading...")
    
    # Step 1: Login to get token
    login_data = {"username": "admin", "password": "admin123"}
    login_response = requests.post(
        f"{BASE_URL}/auth/login", 
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        return False
    
    token_data = login_response.json()
    access_token = token_data.get("access_token")
    print(f"✅ Login successful, token: {access_token[:20]}...")
    
    # Step 2: Test teachers endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    
    teachers_response = requests.get(f"{BASE_URL}/teachers/", headers=headers)
    if teachers_response.status_code == 200:
        teachers = teachers_response.json()
        print(f"✅ Teachers loaded: {len(teachers)} teachers")
        for teacher in teachers:
            print(f"   - {teacher.get('full_name', 'Unknown')} (ID: {teacher.get('id')})")
    else:
        print(f"❌ Teachers request failed: {teachers_response.status_code} - {teachers_response.text}")
    
    # Step 3: Test groups endpoint
    groups_response = requests.get(f"{BASE_URL}/groups/", headers=headers)
    if groups_response.status_code == 200:
        groups = groups_response.json()
        print(f"✅ Groups loaded: {len(groups)} groups")
        for group in groups:
            print(f"   - {group.get('name', 'Unknown')} (Level: {group.get('level', 'N/A')}, ID: {group.get('id')})")
    else:
        print(f"❌ Groups request failed: {groups_response.status_code} - {groups_response.text}")
    
    # Step 4: Test students endpoint
    students_response = requests.get(f"{BASE_URL}/students/", headers=headers)
    if students_response.status_code == 200:
        students = students_response.json()
        print(f"✅ Students loaded: {len(students)} students")
    else:
        print(f"❌ Students request failed: {students_response.status_code} - {students_response.text}")
    
    return True

if __name__ == "__main__":
    test_authenticated_requests()