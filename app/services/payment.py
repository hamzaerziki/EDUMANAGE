from typing import Optional
import stripe
from fastapi import HTTPException
from ..config import settings
from ..models.models import SubscriptionPlan, Subscription, SubscriptionInvoice
from sqlalchemy.orm import Session

# Initialize Stripe with the API key
stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    @staticmethod
    async def create_payment_intent(amount: int, currency: str = 'usd', customer_email: Optional[str] = None) -> dict:
        """Create a Stripe PaymentIntent for a subscription payment."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,  # Amount in cents
                currency=currency,
                receipt_email=customer_email,
                payment_method_types=['card'],
            )
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def create_stripe_customer(email: str, name: Optional[str] = None) -> str:
        """Create a Stripe customer and return the customer ID."""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name
            )
            return customer.id
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def create_subscription(
        db: Session,
        customer_id: str,
        plan_id: int,
        user_id: int
    ) -> Subscription:
        """Create a subscription in both Stripe and our database."""
        try:
            # Get the plan from our database
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

            # Create Stripe subscription
            stripe_subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': plan.stripe_price_id}],
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent'],
            )

            # Create subscription in our database
            subscription = Subscription(
                user_id=user_id,
                plan_id=plan_id,
                stripe_subscription_id=stripe_subscription.id,
                status='incomplete',  # Will be updated when payment succeeds
                current_period_start=stripe_subscription.current_period_start,
                current_period_end=stripe_subscription.current_period_end
            )
            db.add(subscription)

            # Create invoice record
            invoice = SubscriptionInvoice(
                subscription_id=subscription.id,
                amount=plan.price,
                status='pending',
                stripe_invoice_id=stripe_subscription.latest_invoice.id
            )
            db.add(invoice)
            db.commit()

            return subscription

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def handle_webhook_event(payload: dict, signature: str, db: Session):
        """Handle Stripe webhook events."""
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )

            if event.type == 'invoice.paid':
                # Update subscription and invoice status
                invoice = event.data.object
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == invoice.subscription
                ).first()
                if subscription:
                    subscription.status = 'active'
                    db_invoice = db.query(SubscriptionInvoice).filter(
                        SubscriptionInvoice.stripe_invoice_id == invoice.id
                    ).first()
                    if db_invoice:
                        db_invoice.status = 'paid'
                    db.commit()

            elif event.type == 'invoice.payment_failed':
                # Handle failed payment
                invoice = event.data.object
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == invoice.subscription
                ).first()
                if subscription:
                    subscription.status = 'past_due'
                    db_invoice = db.query(SubscriptionInvoice).filter(
                        SubscriptionInvoice.stripe_invoice_id == invoice.id
                    ).first()
                    if db_invoice:
                        db_invoice.status = 'failed'
                    db.commit()

            elif event.type == 'customer.subscription.deleted':
                # Handle subscription cancellation
                subscription_data = event.data.object
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == subscription_data.id
                ).first()
                if subscription:
                    subscription.status = 'cancelled'
                    db.commit()

            return {'status': 'success'}

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))