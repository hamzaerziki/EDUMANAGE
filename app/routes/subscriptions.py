from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import uuid

from ..database import get_db
from ..models.models import SubscriptionPlan, Subscription, SubscriptionInvoice, UsageMetrics, Admin
from ..schemas.subscription import (
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanRead,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionRead,
    SubscriptionInvoiceCreate, SubscriptionInvoiceUpdate, SubscriptionInvoiceRead,
    UsageMetricsCreate, UsageMetricsRead
)
from ..utils.auth import get_current_admin
from ..services.payment import PaymentService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Subscription Plans
@router.get("/plans", response_model=List[SubscriptionPlanRead])
def list_subscription_plans(db: Session = Depends(get_db)):
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

@router.post("/plans", response_model=SubscriptionPlanRead, dependencies=[Depends(get_current_admin)])
def create_subscription_plan(payload: SubscriptionPlanCreate, db: Session = Depends(get_db)):
    obj = SubscriptionPlan(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/plans/{plan_id}", response_model=SubscriptionPlanRead)
def get_subscription_plan(plan_id: int, db: Session = Depends(get_db)):
    obj = db.get(SubscriptionPlan, plan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    return obj

@router.put("/plans/{plan_id}", response_model=SubscriptionPlanRead, dependencies=[Depends(get_current_admin)])
def update_subscription_plan(plan_id: int, payload: SubscriptionPlanUpdate, db: Session = Depends(get_db)):
    obj = db.get(SubscriptionPlan, plan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/plans/{plan_id}", dependencies=[Depends(get_current_admin)])
def delete_subscription_plan(plan_id: int, db: Session = Depends(get_db)):
    obj = db.get(SubscriptionPlan, plan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    obj.is_active = False
    db.add(obj)
    db.commit()
    return {"ok": True}

# Subscriptions
@router.get("/", response_model=List[SubscriptionRead], dependencies=[Depends(get_current_admin)])
def list_subscriptions(db: Session = Depends(get_db)):
    return db.query(Subscription).order_by(Subscription.id.desc()).all()

@router.post("/", response_model=SubscriptionRead)
async def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    # Check if plan exists and is active
    plan = db.get(SubscriptionPlan, payload.plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")

    # Create payment intent
    payment_result = await PaymentService.create_payment_intent(
        amount=plan.price,
        currency='usd'  # You might want to make this configurable
    )

    # Create subscription
    obj = Subscription(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    # Create initial invoice
    invoice = SubscriptionInvoice(
        subscription_id=obj.id,
        amount=plan.price,
        status="pending",
        billing_date=date.today(),
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}"
    )
    db.add(invoice)
    db.commit()

    return {
        **obj.__dict__,
        'payment_intent': payment_result
    }

@router.get("/{subscription_id}", response_model=SubscriptionRead)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    obj = db.get(Subscription, subscription_id)
    if not obj or obj.admin_id != admin.id:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return obj

@router.put("/{subscription_id}", response_model=SubscriptionRead)
def update_subscription(
    subscription_id: int,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    obj = db.get(Subscription, subscription_id)
    if not obj or obj.admin_id != admin.id:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if payload.plan_id:
        plan = db.get(SubscriptionPlan, payload.plan_id)
        if not plan or not plan.is_active:
            raise HTTPException(status_code=400, detail="Invalid subscription plan")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# Payment webhook
@router.post("/webhook")
async def stripe_webhook(
    payload: dict,
    stripe_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    await PaymentService.handle_webhook_event(payload, stripe_signature)
    return {"ok": True}

# Subscription Invoices
@router.get("/invoices", response_model=List[SubscriptionInvoiceRead])
def list_subscription_invoices(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    return (
        db.query(SubscriptionInvoice)
        .join(Subscription)
        .filter(Subscription.admin_id == admin.id)
        .order_by(SubscriptionInvoice.id.desc())
        .all()
    )

@router.post("/invoices", response_model=SubscriptionInvoiceRead)
def create_subscription_invoice(
    payload: SubscriptionInvoiceCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    # Verify subscription belongs to admin
    subscription = db.get(Subscription, payload.subscription_id)
    if not subscription or subscription.admin_id != admin.id:
        raise HTTPException(status_code=404, detail="Subscription not found")

    obj = SubscriptionInvoice(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/invoices/{invoice_id}", response_model=SubscriptionInvoiceRead)
def get_subscription_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    obj = (
        db.query(SubscriptionInvoice)
        .join(Subscription)
        .filter(
            SubscriptionInvoice.id == invoice_id,
            Subscription.admin_id == admin.id
        )
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return obj

@router.put("/invoices/{invoice_id}", response_model=SubscriptionInvoiceRead)
def update_subscription_invoice(
    invoice_id: int,
    payload: SubscriptionInvoiceUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    obj = (
        db.query(SubscriptionInvoice)
        .join(Subscription)
        .filter(
            SubscriptionInvoice.id == invoice_id,
            Subscription.admin_id == admin.id
        )
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# Usage Metrics
@router.get("/metrics", response_model=List[UsageMetricsRead])
def list_usage_metrics(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    return (
        db.query(UsageMetrics)
        .filter(UsageMetrics.admin_id == admin.id)
        .order_by(UsageMetrics.recorded_at.desc())
        .all()
    )

@router.post("/metrics", response_model=UsageMetricsRead)
def record_usage_metric(
    payload: UsageMetricsCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    if payload.admin_id != admin.id:
        raise HTTPException(status_code=403, detail="Not authorized to record metrics for other admins")
    
    obj = UsageMetrics(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj