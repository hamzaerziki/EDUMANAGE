export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  features: string[];
  max_students?: number;
  max_teachers?: number;
  max_courses?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  admin_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: number;
  subscription_id: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  billing_date: string;
  paid_date?: string;
  payment_method?: string;
  invoice_number: string;
  created_at: string;
}

export interface UsageMetrics {
  id: number;
  admin_id: number;
  metric_name: string;
  metric_value: number;
  recorded_at: string;
}

export interface CreateSubscriptionPlan {
  name: string;
  description?: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  features: string[];
  max_students?: number;
  max_teachers?: number;
  max_courses?: number;
  is_active?: boolean;
}

export interface UpdateSubscriptionPlan {
  name?: string;
  description?: string;
  price?: number;
  billing_interval?: 'monthly' | 'yearly';
  features?: string[];
  max_students?: number;
  max_teachers?: number;
  max_courses?: number;
  is_active?: boolean;
}

export interface CreateSubscription {
  admin_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew?: boolean;
}

export interface UpdateSubscription {
  plan_id?: number;
  status?: 'active' | 'cancelled' | 'expired';
  end_date?: string;
  auto_renew?: boolean;
}

export interface CreateSubscriptionInvoice {
  subscription_id: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  billing_date: string;
  paid_date?: string;
  payment_method?: string;
  invoice_number: string;
}

export interface UpdateSubscriptionInvoice {
  status?: 'paid' | 'pending' | 'failed';
  paid_date?: string;
  payment_method?: string;
}

export interface CreateUsageMetrics {
  admin_id: number;
  metric_name: string;
  metric_value: number;
}