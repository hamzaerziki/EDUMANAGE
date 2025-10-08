import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function PlanList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { plans, loading, error, fetchPlans } = useSubscriptionStore();

  useEffect(() => {
    fetchPlans().catch((err) => {
      toast({
        title: t('Error'),
        description: t('Failed to fetch subscription plans'),
        variant: 'destructive',
      });
    });
  }, [fetchPlans, toast, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className={plan.is_active ? '' : 'opacity-60'}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">
                /{plan.billing_interval === 'monthly' ? t('month') : t('year')}
              </span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  {feature}
                </li>
              ))}
              {plan.max_students && (
                <li className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  {t('Up to {{count}} students', { count: plan.max_students })}
                </li>
              )}
              {plan.max_teachers && (
                <li className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  {t('Up to {{count}} teachers', { count: plan.max_teachers })}
                </li>
              )}
              {plan.max_courses && (
                <li className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  {t('Up to {{count}} courses', { count: plan.max_courses })}
                </li>
              )}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={!plan.is_active}>
              {plan.is_active ? t('Subscribe') : t('Currently Unavailable')}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}