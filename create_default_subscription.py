#!/usr/bin/env python3
"""
Create default subscription plan and subscription for testing
"""

import sys
import os
from datetime import datetime, date, timedelta

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.database import SessionLocal
from app.models.models import Admin, SubscriptionPlan, Subscription

def create_default_subscription():
    """Create default subscription plan and assign it to admin"""
    db = SessionLocal()
    
    try:
        # Check if default plan already exists
        default_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == "Default Plan").first()
        
        if not default_plan:
            print("Creating default subscription plan...")
            # Create default plan with generous limits for testing
            default_plan = SubscriptionPlan(
                name="Default Plan",
                description="Default plan with generous limits for testing",
                price=0.0,  # Free plan
                billing_interval="monthly",
                features=["unlimited_teachers", "unlimited_students", "unlimited_courses"],
                max_students=1000,
                max_teachers=100,
                max_courses=100,
                is_active=True
            )
            db.add(default_plan)
            db.commit()
            db.refresh(default_plan)
            print(f"✅ Created default plan with ID: {default_plan.id}")
        else:
            print(f"✅ Default plan already exists with ID: {default_plan.id}")
        
        # Get admin user (assuming there's at least one admin)
        admin = db.query(Admin).first()
        if not admin:
            print("❌ No admin user found! Please create an admin first.")
            return False
        
        print(f"Found admin: {admin.username} (ID: {admin.id})")
        
        # Check if admin already has an active subscription
        existing_subscription = db.query(Subscription).filter(
            Subscription.admin_id == admin.id,
            Subscription.status == 'active'
        ).first()
        
        if not existing_subscription:
            print("Creating default subscription for admin...")
            # Create subscription for admin
            start_date = date.today()
            end_date = start_date + timedelta(days=365)  # 1 year
            
            subscription = Subscription(
                admin_id=admin.id,
                plan_id=default_plan.id,
                status="active",
                start_date=start_date,
                end_date=end_date,
                current_period_start=datetime.now(),
                current_period_end=datetime.now() + timedelta(days=30),  # 30 days
                auto_renew=True
            )
            db.add(subscription)
            db.commit()
            db.refresh(subscription)
            print(f"✅ Created subscription with ID: {subscription.id}")
        else:
            print(f"✅ Admin already has active subscription with ID: {existing_subscription.id}")
        
        print("🎉 Default subscription setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating default subscription: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Setting up default subscription...")
    success = create_default_subscription()
    if success:
        print("✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("❌ Setup failed!")
        sys.exit(1)