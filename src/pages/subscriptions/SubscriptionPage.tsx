import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlanList } from './PlanList';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function SubscriptionPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    subscriptions,
    invoices,
    metrics,
    loading,
    error,
    fetchSubscriptions,
    fetchInvoices,
    fetchMetrics,
  } = useSubscriptionStore();

  useEffect(() => {
    Promise.all([fetchSubscriptions(), fetchInvoices(), fetchMetrics()]).catch((err) => {
      toast({
        title: t('Error'),
        description: t('Failed to fetch subscription data'),
        variant: 'destructive',
      });
    });
  }, [fetchSubscriptions, fetchInvoices, fetchMetrics, toast, t]);

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
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('Subscription Management')}</h1>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Current Subscription')}</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('Status')}</p>
                  <p className="font-medium">
                    {subscriptions[0].status.charAt(0).toUpperCase() +
                      subscriptions[0].status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Auto Renew')}</p>
                  <p className="font-medium">{subscriptions[0].auto_renew ? t('Yes') : t('No')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Start Date')}</p>
                  <p className="font-medium">
                    {new Date(subscriptions[0].start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('End Date')}</p>
                  <p className="font-medium">
                    {new Date(subscriptions[0].end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">{t('Cancel Subscription')}</Button>
                <Button>{t('Manage Subscription')}</Button>
              </div>
            </div>
          ) : (
            <p>{t('No active subscription')}</p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('Available Plans')}</h2>
        <PlanList />
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Billing History')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Invoice Number')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Amount')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{new Date(invoice.billing_date).toLocaleDateString()}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {t('Download')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Usage Metrics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm"
              >
                <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
                <p className="text-2xl font-bold">{metric.metric_value}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(metric.recorded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}