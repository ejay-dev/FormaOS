/**
 * =========================================================
 * Billing Timeline API
 * =========================================================
 * Returns billing events history for founder support console
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";
import { handleAdminError } from '@/app/api/admin/_helpers';

interface BillingEvent {
  id: string;
  eventType: string;
  orgId?: string;
  orgName?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface SubscriptionState {
  orgId: string;
  orgName?: string;
  planKey: string;
  status: string;
  currentPeriodEnd?: string;
  trialExpiresAt?: string;
  stripeSubscriptionId?: string;
  lastSyncedAt?: string;
}

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);

    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const orgId = url.searchParams.get("org_id");
    const eventType = url.searchParams.get("event_type");
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 90);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Build query for billing events
    let query = admin
      .from("billing_events")
      .select("id, event_type, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data: billingEvents, error: eventsError } = await query;

    if (eventsError) {
      console.error("[billing-timeline] Events query error:", eventsError);
    }

    // Get subscription states with org names
    let subQuery = admin
      .from("org_subscriptions")
      .select(`
        organization_id,
        plan_key,
        status,
        current_period_end,
        trial_expires_at,
        stripe_subscription_id,
        updated_at,
        organizations!inner(name)
      `)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (orgId) {
      subQuery = subQuery.eq("organization_id", orgId);
    }

    const { data: subscriptions, error: subError } = await subQuery;

    if (subError) {
      console.error("[billing-timeline] Subscriptions query error:", subError);
    }

    // Transform billing events
    const events: BillingEvent[] = (billingEvents || []).map((event: { id: string; event_type: string; created_at: string }) => ({
      id: event.id,
      eventType: event.event_type,
      timestamp: event.created_at,
    }));

    // Transform subscription states
    const subscriptionStates: SubscriptionState[] = (subscriptions || []).map((sub: { organization_id: string; plan_key: string | null; status: string | null; current_period_end: string | null; trial_expires_at: string | null; stripe_subscription_id: string | null; updated_at: string | null; organizations: unknown }) => ({
      orgId: sub.organization_id,
      orgName: (sub.organizations as { name?: string } | null)?.name,
      planKey: sub.plan_key || "unknown",
      status: sub.status || "unknown",
      currentPeriodEnd: sub.current_period_end,
      trialExpiresAt: sub.trial_expires_at,
      stripeSubscriptionId: sub.stripe_subscription_id,
      lastSyncedAt: sub.updated_at,
    }));

    // Calculate summary statistics
    const statusCounts = subscriptionStates.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const planCounts = subscriptionStates.reduce((acc, sub) => {
      acc[sub.planKey] = (acc[sub.planKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventTypeCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify potential issues
    const issues: { type: string; message: string; orgId?: string; orgName?: string }[] = [];

    // Check for expired trials still marked as trialing
    const now = new Date();
    for (const sub of subscriptionStates) {
      if (sub.status === "trialing" && sub.trialExpiresAt) {
        const trialEnd = new Date(sub.trialExpiresAt);
        if (trialEnd < now) {
          issues.push({
            type: "expired_trial",
            message: `Trial expired ${Math.floor((now.getTime() - trialEnd.getTime()) / 86400000)} days ago but status is still 'trialing'`,
            orgId: sub.orgId,
            orgName: sub.orgName,
          });
        }
      }

      // Check for missing plan key
      if (!sub.planKey || sub.planKey === "unknown") {
        issues.push({
          type: "missing_plan",
          message: "Subscription has no plan key",
          orgId: sub.orgId,
          orgName: sub.orgName,
        });
      }
    }

    return NextResponse.json({
      events,
      subscriptions: subscriptionStates,
      summary: {
        totalEvents: events.length,
        totalSubscriptions: subscriptionStates.length,
        statusCounts,
        planCounts,
        eventTypeCounts,
        issuesCount: issues.length,
        timeRange: {
          from: since.toISOString(),
          to: new Date().toISOString(),
        },
      },
      issues,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/support/billing-timeline');
  }
}
