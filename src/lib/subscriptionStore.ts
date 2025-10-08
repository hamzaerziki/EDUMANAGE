import { create } from 'zustand';
import { apiClient } from './apiClient';
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionInvoice,
  UsageMetrics,
  CreateSubscriptionPlan,
  UpdateSubscriptionPlan,
  CreateSubscription,
  UpdateSubscription,
  CreateSubscriptionInvoice,
  UpdateSubscriptionInvoice,
  CreateUsageMetrics,
} from '../types/subscription';

interface SubscriptionStore {
  // State
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  invoices: SubscriptionInvoice[];
  metrics: UsageMetrics[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  createPlan: (data: CreateSubscriptionPlan) => Promise<SubscriptionPlan>;
  updatePlan: (id: number, data: UpdateSubscriptionPlan) => Promise<SubscriptionPlan>;
  deletePlan: (id: number) => Promise<void>;

  fetchSubscriptions: () => Promise<void>;
  createSubscription: (data: CreateSubscription) => Promise<Subscription>;
  updateSubscription: (id: number, data: UpdateSubscription) => Promise<Subscription>;

  fetchInvoices: () => Promise<void>;
  createInvoice: (data: CreateSubscriptionInvoice) => Promise<SubscriptionInvoice>;
  updateInvoice: (id: number, data: UpdateSubscriptionInvoice) => Promise<SubscriptionInvoice>;

  fetchMetrics: () => Promise<void>;
  recordMetric: (data: CreateUsageMetrics) => Promise<UsageMetrics>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plans: [],
  subscriptions: [],
  invoices: [],
  metrics: [],
  loading: false,
  error: null,

  fetchPlans: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionPlan[]>('/subscriptions/plans');
      set({ plans: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch subscription plans' });
    } finally {
      set({ loading: false });
    }
  },

  createPlan: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionPlan>('/subscriptions/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set((state) => ({ plans: [...state.plans, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create subscription plan' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePlan: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionPlan>(`/subscriptions/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set((state) => ({
        plans: state.plans.map((plan) => (plan.id === id ? response.data : plan)),
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update subscription plan' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deletePlan: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.request(`/subscriptions/plans/${id}`, { method: 'DELETE' });
      set((state) => ({
        plans: state.plans.filter((plan) => plan.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete subscription plan' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchSubscriptions: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<Subscription[]>('/subscriptions');
      set({ subscriptions: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch subscriptions' });
    } finally {
      set({ loading: false });
    }
  },

  createSubscription: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<Subscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set((state) => ({ subscriptions: [...state.subscriptions, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create subscription' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateSubscription: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<Subscription>(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set((state) => ({
        subscriptions: state.subscriptions.map((sub) => (sub.id === id ? response.data : sub)),
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update subscription' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchInvoices: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionInvoice[]>('/subscriptions/invoices');
      set({ invoices: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch invoices' });
    } finally {
      set({ loading: false });
    }
  },

  createInvoice: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionInvoice>('/subscriptions/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set((state) => ({ invoices: [...state.invoices, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create invoice' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateInvoice: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<SubscriptionInvoice>(`/subscriptions/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? response.data : inv)),
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update invoice' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchMetrics: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<UsageMetrics[]>('/subscriptions/metrics');
      set({ metrics: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch metrics' });
    } finally {
      set({ loading: false });
    }
  },

  recordMetric: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.request<UsageMetrics>('/subscriptions/metrics', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set((state) => ({ metrics: [...state.metrics, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to record metric' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));