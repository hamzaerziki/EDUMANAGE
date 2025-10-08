import pytest
from datetime import date, timedelta
from fastapi import status

def test_list_subscription_plans(client, test_plan):
    """Test listing subscription plans."""
    response = client.get("/subscriptions/plans")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == test_plan.name
    assert data[0]["price"] == test_plan.price
    assert data[0]["billing_interval"] == test_plan.billing_interval

def test_create_subscription_plan(client):
    """Test creating a subscription plan."""
    plan_data = {
        "name": "New Test Plan",
        "description": "New Test Plan Description",
        "price": 149.99,
        "billing_interval": "monthly",
        "features": ["feature1", "feature2"],
        "max_students": 200,
        "max_teachers": 20,
        "max_courses": 40,
        "is_active": True
    }
    
    response = client.post("/subscriptions/plans", json=plan_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["name"] == plan_data["name"]
    assert data["price"] == plan_data["price"]
    assert data["max_students"] == plan_data["max_students"]

def test_get_subscription_plan(client, test_plan):
    """Test getting a specific subscription plan."""
    response = client.get(f"/subscriptions/plans/{test_plan.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == test_plan.id
    assert data["name"] == test_plan.name
    assert data["price"] == test_plan.price

def test_update_subscription_plan(client, test_plan):
    """Test updating a subscription plan."""
    update_data = {
        "name": "Updated Test Plan",
        "price": 199.99
    }
    
    response = client.put(f"/subscriptions/plans/{test_plan.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["price"] == update_data["price"]

def test_delete_subscription_plan(client, test_plan):
    """Test deleting a subscription plan."""
    response = client.delete(f"/subscriptions/plans/{test_plan.id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify plan is deleted
    response = client.get(f"/subscriptions/plans/{test_plan.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_list_subscriptions(client, test_subscription):
    """Test listing subscriptions."""
    response = client.get("/subscriptions")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) > 0
    assert data[0]["id"] == test_subscription.id
    assert data[0]["admin_id"] == test_subscription.admin_id
    assert data[0]["plan_id"] == test_subscription.plan_id

def test_create_subscription(client, test_admin, test_plan):
    """Test creating a subscription."""
    subscription_data = {
        "admin_id": test_admin.id,
        "plan_id": test_plan.id,
        "status": "active",
        "start_date": date.today().isoformat(),
        "end_date": (date.today() + timedelta(days=365)).isoformat(),
        "auto_renew": True
    }
    
    response = client.post("/subscriptions", json=subscription_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["admin_id"] == subscription_data["admin_id"]
    assert data["plan_id"] == subscription_data["plan_id"]
    assert data["status"] == subscription_data["status"]

def test_get_subscription(client, test_subscription):
    """Test getting a specific subscription."""
    response = client.get(f"/subscriptions/{test_subscription.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == test_subscription.id
    assert data["admin_id"] == test_subscription.admin_id
    assert data["plan_id"] == test_subscription.plan_id

def test_update_subscription(client, test_subscription):
    """Test updating a subscription."""
    update_data = {
        "status": "cancelled",
        "auto_renew": False
    }
    
    response = client.put(f"/subscriptions/{test_subscription.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["status"] == update_data["status"]
    assert data["auto_renew"] == update_data["auto_renew"]

def test_list_subscription_invoices(client, test_invoice):
    """Test listing subscription invoices."""
    response = client.get("/subscriptions/invoices")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) > 0
    assert data[0]["id"] == test_invoice.id
    assert data[0]["subscription_id"] == test_invoice.subscription_id
    assert data[0]["amount"] == test_invoice.amount

def test_create_subscription_invoice(client, test_subscription):
    """Test creating a subscription invoice."""
    invoice_data = {
        "subscription_id": test_subscription.id,
        "amount": 99.99,
        "status": "pending",
        "billing_date": date.today().isoformat(),
        "invoice_number": "INV-TEST-002"
    }
    
    response = client.post("/subscriptions/invoices", json=invoice_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["subscription_id"] == invoice_data["subscription_id"]
    assert data["amount"] == invoice_data["amount"]
    assert data["status"] == invoice_data["status"]

def test_get_subscription_invoice(client, test_invoice):
    """Test getting a specific subscription invoice."""
    response = client.get(f"/subscriptions/invoices/{test_invoice.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == test_invoice.id
    assert data["subscription_id"] == test_invoice.subscription_id
    assert data["amount"] == test_invoice.amount

def test_update_subscription_invoice(client, test_invoice):
    """Test updating a subscription invoice."""
    update_data = {
        "status": "paid",
        "paid_date": date.today().isoformat(),
        "payment_method": "card"
    }
    
    response = client.put(f"/subscriptions/invoices/{test_invoice.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["status"] == update_data["status"]
    assert data["payment_method"] == update_data["payment_method"]

def test_list_usage_metrics(client, test_metrics):
    """Test listing usage metrics."""
    response = client.get("/subscriptions/metrics")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) > 0
    for metric in data:
        assert metric["subscription_id"] == test_metrics[0].subscription_id

def test_record_usage_metric(client, test_subscription):
    """Test recording a usage metric."""
    metric_data = {
        "subscription_id": test_subscription.id,
        "metric_type": "students",
        "value": 1,
        "date": date.today().isoformat()
    }
    
    response = client.post("/subscriptions/metrics", json=metric_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["subscription_id"] == metric_data["subscription_id"]
    assert data["metric_type"] == metric_data["metric_type"]
    assert data["value"] == metric_data["value"]