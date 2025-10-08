from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

class SubscriptionPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    billing_interval: str  # monthly, yearly
    features: List[str]
    max_students: Optional[int] = None
    max_teachers: Optional[int] = None
    max_courses: Optional[int] = None
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    billing_interval: Optional[str] = None
    features: Optional[List[str]] = None
    max_students: Optional[int] = None
    max_teachers: Optional[int] = None
    max_courses: Optional[int] = None
    is_active: Optional[bool] = None

class SubscriptionPlanRead(SubscriptionPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class SubscriptionBase(BaseModel):
    admin_id: int
    plan_id: int
    status: str  # active, cancelled, expired
    start_date: date
    end_date: date
    auto_renew: bool = True

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    status: Optional[str] = None
    end_date: Optional[date] = None
    auto_renew: Optional[bool] = None

class SubscriptionRead(SubscriptionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class SubscriptionInvoiceBase(BaseModel):
    subscription_id: int
    amount: float
    status: str  # paid, pending, failed
    billing_date: date
    paid_date: Optional[date] = None
    payment_method: Optional[str] = None
    invoice_number: str

class SubscriptionInvoiceCreate(SubscriptionInvoiceBase):
    pass

class SubscriptionInvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paid_date: Optional[date] = None
    payment_method: Optional[str] = None

class SubscriptionInvoiceRead(SubscriptionInvoiceBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class UsageMetricsBase(BaseModel):
    admin_id: int
    metric_name: str
    metric_value: int

class UsageMetricsCreate(UsageMetricsBase):
    pass

class UsageMetricsRead(UsageMetricsBase):
    id: int
    recorded_at: datetime

    model_config = {"from_attributes": True}