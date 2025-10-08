import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.services.payment import PaymentService

@pytest.fixture
def stripe_mock():
    """Create a mock for Stripe API calls."""
    with patch('stripe.PaymentIntent') as payment_intent_mock, \
         patch('stripe.Customer') as customer_mock, \
         patch('stripe.PaymentMethod') as payment_method_mock, \
         patch('stripe.Subscription') as subscription_mock, \
         patch('stripe.Webhook') as webhook_mock:
        yield {
            'payment_intent': payment_intent_mock,
            'customer': customer_mock,
            'payment_method': payment_method_mock,
            'subscription': subscription_mock,
            'webhook': webhook_mock
        }

def test_create_payment_intent_success(db, stripe_mock):
    """Test successful creation of payment intent."""
    # Mock Stripe response
    stripe_mock['payment_intent'].create.return_value = MagicMock(
        client_secret='test_secret',
        id='test_intent_id'
    )

    service = PaymentService()
    result = asyncio.run(service.create_payment_intent(100.00, 'usd'))

    assert result['client_secret'] == 'test_secret'
    assert result['payment_intent_id'] == 'test_intent_id'
    stripe_mock['payment_intent'].create.assert_called_once_with(
        amount=10000,  # 100.00 converted to cents
        currency='usd',
        payment_method_types=['card']
    )

def test_create_payment_intent_stripe_error(db, stripe_mock):
    """Test payment intent creation with Stripe error."""
    stripe_mock['payment_intent'].create.side_effect = stripe.error.StripeError('Test error')

    service = PaymentService()
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.create_payment_intent(100.00, 'usd'))
    
    assert exc_info.value.status_code == 400
    assert 'Test error' in str(exc_info.value.detail)

def test_process_subscription_payment_success(db, test_subscription, test_plan, stripe_mock):
    """Test successful subscription payment processing."""
    # Mock Stripe response
    stripe_mock['payment_intent'].create.return_value = MagicMock(
        id='test_intent_id',
        status='succeeded'
    )

    service = PaymentService()
    result = asyncio.run(service.process_subscription_payment(
        subscription_id=test_subscription.id,
        payment_method_id='pm_test_card',
        amount=99.99
    ))

    assert result['success'] is True
    assert result['payment_intent_id'] == 'test_intent_id'
    assert result['status'] == 'succeeded'

    # Verify invoice was updated
    invoice = db.query(SubscriptionInvoice).filter(
        SubscriptionInvoice.subscription_id == test_subscription.id,
        SubscriptionInvoice.status == 'paid'
    ).first()
    assert invoice is not None
    assert invoice.payment_method == 'card'

def test_process_subscription_payment_card_error(db, test_subscription, stripe_mock):
    """Test subscription payment processing with card error."""
    stripe_mock['payment_intent'].create.side_effect = stripe.error.CardError(
        'Test card error',
        'param',
        'code'
    )

    service = PaymentService()
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.process_subscription_payment(
            subscription_id=test_subscription.id,
            payment_method_id='pm_test_card',
            amount=99.99
        ))
    
    assert exc_info.value.status_code == 400
    assert 'Test card error' in str(exc_info.value.detail)

def test_refund_payment_success(db, stripe_mock):
    """Test successful payment refund."""
    stripe_mock['refund'].create.return_value = MagicMock(
        id='test_refund_id',
        status='succeeded'
    )

    service = PaymentService()
    result = asyncio.run(service.refund_payment('pi_test_intent'))

    assert result['success'] is True
    assert result['refund_id'] == 'test_refund_id'
    assert result['status'] == 'succeeded'

def test_get_payment_method_success(db, stripe_mock):
    """Test successful retrieval of payment method."""
    stripe_mock['payment_method'].retrieve.return_value = MagicMock(
        id='pm_test_card',
        type='card',
        card={'brand': 'visa', 'last4': '4242'},
        billing_details={'name': 'Test User'}
    )

    service = PaymentService()
    result = asyncio.run(service.get_payment_method('pm_test_card'))

    assert result['id'] == 'pm_test_card'
    assert result['type'] == 'card'
    assert result['card']['brand'] == 'visa'
    assert result['billing_details']['name'] == 'Test User'

def test_create_customer_success(db, stripe_mock):
    """Test successful customer creation."""
    stripe_mock['customer'].create.return_value = MagicMock(
        id='cus_test',
        email='test@example.com',
        name='Test User'
    )

    service = PaymentService()
    result = asyncio.run(service.create_customer(
        email='test@example.com',
        name='Test User'
    ))

    assert result['customer_id'] == 'cus_test'
    assert result['email'] == 'test@example.com'
    assert result['name'] == 'Test User'

def test_update_customer_success(db, stripe_mock):
    """Test successful customer update."""
    stripe_mock['customer'].modify.return_value = MagicMock(
        id='cus_test',
        email='updated@example.com',
        name='Updated User'
    )

    service = PaymentService()
    result = asyncio.run(service.update_customer(
        customer_id='cus_test',
        email='updated@example.com',
        name='Updated User'
    ))

    assert result['customer_id'] == 'cus_test'
    assert result['email'] == 'updated@example.com'
    assert result['name'] == 'Updated User'

def test_delete_customer_success(db, stripe_mock):
    """Test successful customer deletion."""
    stripe_mock['customer'].delete.return_value = MagicMock(
        deleted=True
    )

    service = PaymentService()
    result = asyncio.run(service.delete_customer('cus_test'))

    assert result['success'] is True
    assert result['customer_id'] == 'cus_test'