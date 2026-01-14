'use client';

/**
 * =========================================================
 * Billing Dashboard Component
 * =========================================================
 * Subscription management and usage tracking
 */

import { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Users,
  FileText,
  Award,
  Zap,
  Check,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface Usage {
  members: number;
  tasks: number;
  storage: number;
  certificates: number;
  apiCalls: number;
}

interface Limits {
  members: number;
  tasks: number;
  storage: number;
  certificates: number;
  apiCalls: number;
}

interface BillingDashboardProps {
  orgId: string;
}

export default function BillingDashboard({ orgId }: BillingDashboardProps) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [orgId]);

  const fetchBillingData = async () => {
    try {
      const res = await fetch(`/api/billing?orgId=${orgId}`);
      const data = await res.json();

      setCurrentPlan(data.currentPlan);
      setUsage(data.usage);
      setLimits(data.limits);
      setPlans(data.availablePlans || []);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, planId }),
      });

      const data = await res.json();

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      const data = await res.json();

      // Redirect to Stripe portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm opacity-90 mb-1">Current Plan</div>
            <h2 className="text-3xl font-bold">
              {currentPlan?.name || 'Free'}
            </h2>
            {currentPlan && currentPlan.price > 0 && (
              <div className="mt-2 text-2xl">
                ${currentPlan.price}
                <span className="text-sm opacity-90">
                  /{currentPlan.interval}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50"
          >
            <CreditCard className="inline h-4 w-4 mr-2" />
            Manage Billing
          </button>
        </div>
      </div>

      {/* Usage Statistics */}
      {usage && limits && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Current Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Members */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Team Members</span>
              </div>
              <div className="text-2xl font-bold">
                {usage.members}
                {limits.members !== -1 && (
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}
                    / {limits.members}
                  </span>
                )}
              </div>
              {limits.members !== -1 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getUsageColor(getUsagePercentage(usage.members, limits.members))} bg-current`}
                      style={{
                        width: `${Math.min(100, getUsagePercentage(usage.members, limits.members))}%`,
                      }}
                    />
                  </div>
                  <div
                    className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.members, limits.members))}`}
                  >
                    {getUsagePercentage(usage.members, limits.members)}% used
                  </div>
                </div>
              )}
            </div>

            {/* Storage */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="font-medium">Storage</span>
              </div>
              <div className="text-2xl font-bold">
                {usage.storage.toFixed(2)} GB
                {limits.storage !== -1 && (
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}
                    / {limits.storage} GB
                  </span>
                )}
              </div>
              {limits.storage !== -1 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getUsageColor(getUsagePercentage(usage.storage, limits.storage))} bg-current`}
                      style={{
                        width: `${Math.min(100, getUsagePercentage(usage.storage, limits.storage))}%`,
                      }}
                    />
                  </div>
                  <div
                    className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.storage, limits.storage))}`}
                  >
                    {getUsagePercentage(usage.storage, limits.storage)}% used
                  </div>
                </div>
              )}
            </div>

            {/* Certificates */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Certificates</span>
              </div>
              <div className="text-2xl font-bold">
                {usage.certificates}
                {limits.certificates !== -1 && (
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}
                    / {limits.certificates}
                  </span>
                )}
              </div>
            </div>

            {/* API Calls */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="font-medium">API Calls</span>
              </div>
              <div className="text-2xl font-bold">
                {usage.apiCalls.toLocaleString()}
                {limits.apiCalls !== -1 && (
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}
                    / {limits.apiCalls.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 ${
                plan.id === currentPlan?.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
              <div className="text-3xl font-bold mb-4">
                ${plan.price}
                <span className="text-sm text-gray-500 font-normal">
                  /{plan.interval}
                </span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === currentPlan?.id ? (
                <button
                  disabled
                  className="w-full py-2 bg-gray-200 text-gray-600 rounded-lg font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
