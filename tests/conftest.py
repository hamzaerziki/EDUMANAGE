import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.models.models import Admin, SubscriptionPlan, Subscription, SubscriptionInvoice, UsageMetrics

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Create a test client using the test database."""
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def test_admin(db):
    """Create a test admin user."""
    admin = Admin(
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@pytest.fixture
def test_plan(db):
    """Create a test subscription plan."""
    plan = SubscriptionPlan(
        name="Test Plan",
        description="Test Plan Description",
        price=99.99,
        billing_interval="monthly",
        features=["feature1", "feature2"],
        max_students=100,
        max_teachers=10,
        max_courses=20,
        is_active=True
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@pytest.fixture
def test_subscription(db, test_admin, test_plan):
    """Create a test subscription."""
    subscription = Subscription(
        admin_id=test_admin.id,
        plan_id=test_plan.id,
        status="active",
        start_date="2024-01-01",
        end_date="2024-12-31",
        auto_renew=True
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription

@pytest.fixture
def test_invoice(db, test_subscription):
    """Create a test subscription invoice."""
    invoice = SubscriptionInvoice(
        subscription_id=test_subscription.id,
        amount=99.99,
        status="pending",
        billing_date="2024-01-01",
        invoice_number="INV-TEST-001"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@pytest.fixture
def test_metrics(db, test_subscription):
    """Create test usage metrics."""
    metrics = [
        UsageMetrics(
            subscription_id=test_subscription.id,
            metric_type="students",
            value=50,
            date="2024-01-01"
        ),
        UsageMetrics(
            subscription_id=test_subscription.id,
            metric_type="teachers",
            value=5,
            date="2024-01-01"
        ),
        UsageMetrics(
            subscription_id=test_subscription.id,
            metric_type="courses",
            value=10,
            date="2024-01-01"
        )
    ]
    for metric in metrics:
        db.add(metric)
    db.commit()
    for metric in metrics:
        db.refresh(metric)
    return metrics