import pytest
from datetime import datetime, date
from fastapi import HTTPException

from app.services.usage import UsageService
from app.models.models import UsageMetrics, Subscription, SubscriptionPlan

def test_record_usage_success(db, test_subscription, test_plan, test_admin):
    """Test successful usage recording."""
    service = UsageService(db)
    metric = asyncio.run(service.record_usage(
        admin_id=test_admin.id,
        metric_type="students",
        value=1
    ))

    assert metric is not None
    assert metric.subscription_id == test_subscription.id
    assert metric.metric_type == "students"
    assert metric.value == 1
    assert metric.date == datetime.utcnow().date()

def test_record_usage_no_subscription(db, test_admin):
    """Test usage recording with no active subscription."""
    service = UsageService(db)
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.record_usage(
            admin_id=test_admin.id,
            metric_type="students",
            value=1
        ))
    assert exc_info.value.status_code == 400
    assert "No active subscription found" in str(exc_info.value.detail)

def test_record_usage_exceed_limit(db, test_subscription, test_plan, test_admin):
    """Test usage recording exceeding plan limits."""
    service = UsageService(db)
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.record_usage(
            admin_id=test_admin.id,
            metric_type="students",
            value=test_plan.max_students + 1
        ))
    assert exc_info.value.status_code == 400
    assert "exceed your plan limit" in str(exc_info.value.detail)

def test_get_current_usage(db, test_subscription, test_metrics, test_admin):
    """Test getting current usage metrics."""
    service = UsageService(db)
    usage = asyncio.run(service.get_current_usage(test_admin.id))

    assert usage is not None
    assert usage["students"] == 50
    assert usage["teachers"] == 5
    assert usage["courses"] == 10

def test_get_usage_history(db, test_subscription, test_metrics, test_admin):
    """Test getting usage history."""
    service = UsageService(db)
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 31)
    history = asyncio.run(service.get_usage_history(
        test_admin.id,
        start_date,
        end_date
    ))

    assert len(history) > 0
    assert history[0]["date"] == "2024-01-01"
    assert history[0]["students"] == 50
    assert history[0]["teachers"] == 5
    assert history[0]["courses"] == 10

def test_check_usage_limits_within_limit(db, test_subscription, test_metrics, test_admin):
    """Test checking usage limits when within plan limits."""
    service = UsageService(db)
    result = asyncio.run(service.check_usage_limits(
        test_admin.id,
        "students",
        1
    ))
    assert result is True

def test_check_usage_limits_exceed_limit(db, test_subscription, test_metrics, test_admin):
    """Test checking usage limits when exceeding plan limits."""
    service = UsageService(db)
    result = asyncio.run(service.check_usage_limits(
        test_admin.id,
        "students",
        51  # Current usage is 50, max is 100
    ))
    assert result is False

def test_reset_usage_metrics(db, test_subscription, test_metrics):
    """Test resetting usage metrics."""
    service = UsageService(db)
    asyncio.run(service.reset_usage_metrics(test_subscription.id))

    # Verify metrics were reset
    metrics = db.query(UsageMetrics).filter(
        UsageMetrics.subscription_id == test_subscription.id,
        UsageMetrics.date == datetime.utcnow().date()
    ).all()

    for metric in metrics:
        assert metric.value == 0