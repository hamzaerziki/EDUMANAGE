import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Calendar, DollarSign, Users } from 'lucide-react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  
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
    const loadData = async () => {
      try {
        await Promise.all([fetchSubscriptions(), fetchInvoices(), fetchMetrics()]);
        setInitialLoading(false);
      } catch (err) {
        console.log('Subscription API not available, showing fallback UI');
        setShowFallback(true);
        setInitialLoading(false);
      }
    };
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (initialLoading) {
        setShowFallback(true);
        setInitialLoading(false);
      }
    }, 3000);
    
    loadData();
    
    return () => clearTimeout(timeout);
  }, [fetchSubscriptions, fetchInvoices, fetchMetrics]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  // Show fallback UI when API is not available
  if (showFallback || error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Gestion des Abonnements</h1>
        </div>

        {/* Demo/Fallback Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abonnement Actuel</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Plan Pro</div>
              <p className="text-xs text-muted-foreground">Actif jusqu'au 31/12/2024</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25/100</div>
              <p className="text-xs text-muted-foreground">utilisateurs actifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coût Mensuel</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€49</div>
              <p className="text-xs text-muted-foreground">facturation mensuelle</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine Facture</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15 Nov</div>
              <p className="text-xs text-muted-foreground">dans 5 jours</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de l'Abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="font-medium text-green-600">Actif</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renouvellement Automatique</p>
                  <p className="font-medium">Activé</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de Début</p>
                  <p className="font-medium">01/01/2024</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de Fin</p>
                  <p className="font-medium">31/12/2024</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Annuler l'Abonnement</Button>
                <Button>Gérer l'Abonnement</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Plans Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Plan Basique</h3>
                <p className="text-2xl font-bold mb-2">€19<span className="text-sm font-normal">/mois</span></p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Jusqu'à 50 utilisateurs</li>
                  <li>• Support par email</li>
                  <li>• Fonctionnalités de base</li>
                </ul>
                <Button variant="outline" className="w-full">Choisir ce Plan</Button>
              </div>
              
              <div className="p-4 border-2 border-primary rounded-lg relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-2 py-1 text-xs rounded">Recommandé</span>
                </div>
                <h3 className="font-semibold mb-2">Plan Pro</h3>
                <p className="text-2xl font-bold mb-2">€49<span className="text-sm font-normal">/mois</span></p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Jusqu'à 200 utilisateurs</li>
                  <li>• Support prioritaire</li>
                  <li>• Toutes les fonctionnalités</li>
                  <li>• Rapports avancés</li>
                </ul>
                <Button className="w-full">Plan Actuel</Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Plan Entreprise</h3>
                <p className="text-2xl font-bold mb-2">€99<span className="text-sm font-normal">/mois</span></p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Utilisateurs illimités</li>
                  <li>• Support 24/7</li>
                  <li>• Intégrations personnalisées</li>
                  <li>• Gestionnaire de compte dédié</li>
                </ul>
                <Button variant="outline" className="w-full">Mettre à Niveau</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique de Facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">#INV-2024-001</p>
                  <p className="text-sm text-muted-foreground">01/10/2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€49.00</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Payé
                  </span>
                </div>
                <Button variant="ghost" size="sm">Télécharger</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">#INV-2024-002</p>
                  <p className="text-sm text-muted-foreground">01/09/2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€49.00</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Payé
                  </span>
                </div>
                <Button variant="ghost" size="sm">Télécharger</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">#INV-2024-003</p>
                  <p className="text-sm text-muted-foreground">01/08/2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€49.00</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Payé
                  </span>
                </div>
                <Button variant="ghost" size="sm">Télécharger</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {error && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-yellow-800">
                  Mode démonstration - Les données d'abonnement en temps réel ne sont pas disponibles.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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