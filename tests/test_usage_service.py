import pytest
from datetime import datetime, date
from fastapi import HTTPException
from app.services.usage import UsageService
from app.models.models import UsageMetrics, Subscription, SubscriptionPlan

def test_record_usage_success(db, test_subscription, test_plan):
    """Test successful usage recording."""
    service = UsageService(db)
    metric = asyncio.run(service.record_usage(
        admin_id=test_subscription.admin_id,
        metric_type='students',
        value=5
    ))

    assert metric.subscription_id == test_subscription.id
    assert metric.metric_type == 'students'
    assert metric.value == 5
    assert isinstance(metric.date, date)

def test_record_usage_no_subscription(db):
    """Test usage recording with no active subscription."""
    service = UsageService(db)
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.record_usage(
            admin_id=999,  # Non-existent admin
            metric_type='students',
            value=5
        ))
    
    assert exc_info.value.status_code == 400
    assert "No active subscription found" in str(exc_info.value.detail)

def test_record_usage_exceed_limit(db, test_subscription, test_plan):
    """Test usage recording exceeding plan limits."""
    # Set a low limit on the plan
    test_plan.max_students = 10
    db.add(test_plan)
    db.commit()

    service = UsageService(db)
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.record_usage(
            admin_id=test_subscription.admin_id,
            metric_type='students',
            value=15  # Exceeds limit
        ))
    
    assert exc_info.value.status_code == 400
    assert "exceed your plan limit" in str(exc_info.value.detail)

def test_get_current_usage(db, test_subscription, test_metrics):
    """Test getting current usage metrics."""
    service = UsageService(db)
    usage = asyncio.run(service.get_current_usage(test_subscription.admin_id))

    assert isinstance(usage, dict)
    assert 'students' in usage
    assert 'teachers' in usage
    assert 'courses' in usage
    assert usage['students'] == 50  # From test_metrics fixture
    assert usage['teachers'] == 5
    assert usage['courses'] == 10

def test_get_usage_history(db, test_subscription, test_metrics):
    """Test getting usage history."""
    service = UsageService(db)
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 31)
    
    history = asyncio.run(service.get_usage_history(
        admin_id=test_subscription.admin_id,
        start_date=start_date,
        end_date=end_date
    ))

    assert isinstance(history, list)
    assert len(history) > 0
    first_day = history[0]
    assert 'date' in first_day
    assert 'students' in first_day
    assert 'teachers' in first_day
    assert 'courses' in first_day
    assert first_day['students'] == 50
    assert first_day['teachers'] == 5
    assert first_day['courses'] == 10

def test_check_usage_limits_success(db, test_subscription, test_plan):
    """Test successful usage limit check."""
    service = UsageService(db)
    # Record some initial usage
    asyncio.run(service.record_usage(
        admin_id=test_subscription.admin_id,
        metric_type='students',
        value=5
    ))

    # Check if we can add more within limits
    result = asyncio.run(service.check_usage_limits(
        admin_id=test_subscription.admin_id,
        metric_type='students',
        value=3
    ))

    assert result is True

def test_check_usage_limits_exceeded(db, test_subscription, test_plan):
    """Test usage limit check when limit would be exceeded."""
    # Set a low limit on the plan
    test_plan.max_students = 10
    db.add(test_plan)
    db.commit()

    service = UsageService(db)
    # Record some initial usage
    asyncio.run(service.record_usage(
        admin_id=test_subscription.admin_id,
        metric_type='students',
        value=8
    ))

    # Check if adding more would exceed limit
    result = asyncio.run(service.check_usage_limits(
        admin_id=test_subscription.admin_id,
        metric_type='students',
        value=5  # Would exceed limit of 10
    ))

    assert result is False

def test_check_usage_limits_no_subscription(db):
    """Test usage limit check with no active subscription."""
    service = UsageService(db)
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.check_usage_limits(
            admin_id=999,  # Non-existent admin
            metric_type='students',
            value=5
        ))
    
    assert exc_info.value.status_code == 400
    assert "No active subscription found" in str(exc_info.value.detail)