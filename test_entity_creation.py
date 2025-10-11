#!/usr/bin/env python3
"""
Test script to verify that all entities are created and appear correctly in their lists
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api_endpoint_creation():
    """Test creating various entities and verify they appear in lists"""
    
    print("🧪 Testing entity creation and list display...")
    
    # Test data
    test_entities = {
        "teacher": {
            "endpoint": "/teachers/",
            "data": {
                "full_name": "Test Teacher API",
                "speciality": "Mathematics",
                "email": "test.api@example.com",
                "phone": "+1234567890"
            }
        },
        "student": {
            "endpoint": "/students/",
            "data": {
                "full_name": "Test Student API",
                "email": "student.api@example.com",
                "phone": "+0987654321",
                "birth_date": "2000-01-01",
                "address": "Test Address",
                "status": "active"
            }
        },
        "group": {
            "endpoint": "/groups/",
            "data": {
                "name": "Test Group API",
                "level": "Primaire",
                "year": 2025,
                "capacity": 30
            }
        },
        "subject": {
            "endpoint": "/subjects/",
            "data": {
                "name": "Test Subject API",
                "category": "Sciences",
                "description": "Test subject for API testing",
                "is_active": True
            }
        },
        "course": {
            "endpoint": "/courses/",
            "data": {
                "name": "Test Course API",
                "group_id": None,  # Will be set after group creation
                "teacher_id": None  # Will be set after teacher creation
            }
        }
    }
    
    created_entities = {}
    
    try:
        # Create entities in order (some depend on others)
        for entity_name, config in test_entities.items():
            print(f"\n📝 Creating {entity_name}...")
            
            # Special handling for course (needs group and teacher IDs)
            if entity_name == "course":
                if "group" in created_entities and "teacher" in created_entities:
                    config["data"]["group_id"] = created_entities["group"]["id"]
                    config["data"]["teacher_id"] = created_entities["teacher"]["id"]
                else:
                    print(f"⚠️  Skipping course creation - missing dependencies")
                    continue
            
            response = requests.post(
                f"{BASE_URL}{config['endpoint']}",
                json=config["data"],
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 201]:
                entity_data = response.json()
                created_entities[entity_name] = entity_data
                print(f"✅ {entity_name} created with ID: {entity_data.get('id', 'N/A')}")
            else:
                print(f"❌ Failed to create {entity_name}: {response.status_code} - {response.text}")
        
        # Give the backend a moment to process
        time.sleep(1)
        
        # Verify entities appear in their respective lists
        print("\n🔍 Verifying entities appear in lists...")
        
        for entity_name, config in test_entities.items():
            if entity_name not in created_entities:
                continue
                
            print(f"\n📋 Checking {entity_name} list...")
            list_response = requests.get(f"{BASE_URL}{config['endpoint']}")
            
            if list_response.status_code == 200:
                entities_list = list_response.json()
                created_id = created_entities[entity_name]["id"]
                
                # Find our created entity in the list
                found = any(entity.get("id") == created_id for entity in entities_list)
                
                if found:
                    print(f"✅ {entity_name} (ID: {created_id}) found in list")
                else:
                    print(f"❌ {entity_name} (ID: {created_id}) NOT found in list")
                    print(f"   List contains {len(entities_list)} items")
            else:
                print(f"❌ Failed to fetch {entity_name} list: {list_response.status_code}")
        
        print("\n🎉 API testing completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during API testing: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting comprehensive API entity test...")
    success = test_api_endpoint_creation()
    if success:
        print("✅ All API tests completed!")
    else:
        print("❌ Some API tests failed!")