from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from ..models.models import UsageMetrics, Subscription, SubscriptionPlan
from ..schemas.subscription import UsageMetricsCreate

class UsageService:
    @staticmethod
    async def track_usage(
        db: Session,
        admin_id: int,
        metric_type: str,
        quantity: int = 1
    ) -> UsageMetrics:
        """
        Track usage for a specific metric type.
        
        Args:
            db: Database session
            admin_id: ID of the admin
            metric_type: Type of usage metric (e.g., 'students', 'teachers', 'storage')
            quantity: Amount to increment the usage by
        """
        try:
            # Get active subscription for admin
            subscription = db.query(Subscription).filter(
                Subscription.admin_id == admin_id,
                Subscription.status == 'active'
            ).first()
            
            if not subscription:
                raise HTTPException(status_code=400, detail="No active subscription found")

            # Get subscription plan limits
            plan = db.query(SubscriptionPlan).filter(
                SubscriptionPlan.id == subscription.plan_id
            ).first()

            if not plan:
                raise HTTPException(status_code=400, detail="Subscription plan not found")

            # Get current usage for this metric type
            current_usage = db.query(func.sum(UsageMetrics.quantity)).filter(
                UsageMetrics.subscription_id == subscription.id,
                UsageMetrics.metric_type == metric_type
            ).scalar() or 0

            # If subscription has period dates, filter by them
            if subscription.current_period_start is not None and subscription.current_period_end is not None:
                current_usage = db.query(func.sum(UsageMetrics.quantity)).filter(
                    UsageMetrics.subscription_id == subscription.id,
                    UsageMetrics.metric_type == metric_type,
                    UsageMetrics.timestamp >= subscription.current_period_start,
                    UsageMetrics.timestamp <= subscription.current_period_end
                ).scalar() or 0

            # Check if this would exceed plan limits
            limit = getattr(plan, f"max_{metric_type}", None)
            if limit and (current_usage + quantity) > limit:
                raise HTTPException(
                    status_code=400,
                    detail=f"This operation would exceed your {metric_type} limit of {limit}"
                )

            # Create new usage metric
            usage = UsageMetrics(
                subscription_id=subscription.id,
                metric_type=metric_type,
                quantity=quantity,
                timestamp=datetime.utcnow()
            )
            db.add(usage)
            db.commit()
            db.refresh(usage)

            return usage

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_current_usage(
        db: Session,
        admin_id: int,
        metric_type: Optional[str] = None
    ) -> dict:
        """
        Get current usage statistics for an admin.
        
        Args:
            db: Database session
            admin_id: ID of the admin
            metric_type: Optional specific metric type to query
        """
        try:
            # Get active subscription
            subscription = db.query(Subscription).filter(
                Subscription.admin_id == admin_id,
                Subscription.status == 'active'
            ).first()

            if not subscription:
                raise HTTPException(status_code=400, detail="No active subscription found")

            # Base query for usage metrics
            query = db.query(
                UsageMetrics.metric_type,
                func.sum(UsageMetrics.quantity).label('total')
            ).filter(
                UsageMetrics.subscription_id == subscription.id
            )

            # If subscription has period dates, filter by them
            if subscription.current_period_start is not None and subscription.current_period_end is not None:
                query = query.filter(
                    UsageMetrics.timestamp >= subscription.current_period_start,
                    UsageMetrics.timestamp <= subscription.current_period_end
                )

            # Add metric type filter if specified
            if metric_type:
                query = query.filter(UsageMetrics.metric_type == metric_type)

            # Group by metric type
            query = query.group_by(UsageMetrics.metric_type)

            # Execute query and format results
            usage_stats = {
                row.metric_type: row.total
                for row in query.all()
            }

            # Get plan limits
            plan = db.query(SubscriptionPlan).filter(
                SubscriptionPlan.id == subscription.plan_id
            ).first()

            # Add limits to response
            response = {
                metric: {
                    'current': usage_stats.get(metric, 0),
                    'limit': getattr(plan, f"max_{metric}", None)
                }
                for metric in (usage_stats.keys() if not metric_type else [metric_type])
            }

            return response

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def check_limit(
        db: Session,
        admin_id: int,
        metric_type: str,
        quantity: int = 1
    ) -> bool:
        """
        Check if a planned usage would exceed subscription limits.
        
        Args:
            db: Database session
            admin_id: ID of the admin
            metric_type: Type of usage metric to check
            quantity: Amount to check against limit
        """
        try:
            usage_stats = await UsageService.get_current_usage(db, admin_id, metric_type)
            metric_stats = usage_stats.get(metric_type, {})
            
            current = metric_stats.get('current', 0)
            limit = metric_stats.get('limit')

            if limit is None:
                return True  # No limit set
            
            return (current + quantity) <= limit

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))