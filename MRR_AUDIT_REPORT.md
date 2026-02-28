# MRR Truth Audit Report
**Date:** 2026-02-15
**Endpoint:** GET /api/admin/mrr-verification
**Status:** Cannot access production/preview from sandbox environment

## What Would Be Verified

### 1. Endpoint Access (Production & Preview)
**Action Required:** Access the following URLs as an authenticated founder:
- Production: `https://your-production-domain.com/api/admin/mrr-verification`
- Preview: `https://your-preview-domain.vercel.app/api/admin/mrr-verification`

**Expected Response Structure:**
```json
{
  "verified_at": "2026-02-15T04:00:00.000Z",
  "stripe_configured": true,
  "stripe_key_mode": "live",  // or "test" for preview
  
  "db_mrr_cents": 95600,      // Example: 2 basic + 1 pro = $956
  "stripe_mrr_cents": 95600,
  "delta_cents": 0,
  "match": true,
  
  "db_active_count": 3,
  "stripe_active_count": 3,
  
  "currency": "usd",
  "billing_intervals_found": ["month"],
  
  "per_subscription": [...],
  "stripe_only": [],
  "db_only": [],
  "errors": [],
  "duration_ms": 1234
}
```

### 2. Key Metrics to Capture

**From Production Response:**
- `stripe_key_mode`: Should be **"live"** in production
- `db_mrr_cents`: The database-computed MRR
- `stripe_mrr_cents`: The live Stripe MRR
- `delta_cents`: Difference (stripe - db)
- `match`: Should be **true** if no drift
- `db_active_count` vs `stripe_active_count`: Should match
- `per_subscription`: List of all orgs with their amounts
- `stripe_only`: Subs in Stripe but not in DB (discrepancy)
- `db_only`: Subs in DB with no stripe_subscription_id (discrepancy)

### 3. Current Plan Pricing (From Migration)
Based on `supabase/migrations/20250317_billing_core.sql`:
- **Starter (basic)**: $399/month (39,900 cents)
- **Professional (pro)**: $1,200/month (120,000 cents)
- **Enterprise**: Custom pricing (NULL in DB)

**To verify in production DB:**
```sql
SELECT key, name, price_cents FROM plans;
```
Expected result:
| key        | name         | price_cents |
|------------|--------------|-------------|
| basic      | Starter      | 39900       |
| pro        | Professional | 120000      |
| enterprise | Enterprise   | null        |

### 4. Webhook Health Check

**To verify webhook processing:**
```sql
-- Last 20 webhook events processed
SELECT id, event_type, processed_at 
FROM billing_events 
ORDER BY processed_at DESC 
LIMIT 20;
```

**What to check:**
- Are webhook events being stored?
- What event types are recent? (checkout.session.completed, customer.subscription.updated, invoice.paid, etc.)
- Any gaps in timestamps indicating webhook failures?
- Last processed timestamp compared to current time

**Webhook Handler Location:** `app/api/billing/webhook/route.ts`
- Handles: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid/payment_failed
- Uses idempotency via `billing_events` table (prevents duplicate processing)

### 5. Nightly Reconciliation Job

**Location:** `lib/billing/nightly-reconciliation.ts`
**Triggered by:** `app/api/automation/cron/route.ts` (calls `runScheduledAutomation()`)
**Schedule:** Likely configured in Vercel Cron (check vercel.json or Vercel dashboard)

**To check last run:**
```sql
-- If billing_reconciliation_log table exists:
SELECT 
  organization_id,
  discrepancy_type,
  auto_fixed,
  fixed_at,
  created_at
FROM billing_reconciliation_log
ORDER BY created_at DESC
LIMIT 20;
```

**What reconciliation does:**
- Compares local `org_subscriptions` with Stripe subscriptions
- Auto-fixes status mismatches (trialing→active, active→canceled, etc.)
- Auto-fixes plan mismatches
- Auto-fixes period_end date discrepancies
- Marks missing Stripe subscriptions as canceled
- **Auto-fix enabled by default** (unless `BILLING_AUTO_FIX=false`)

**Typical schedule:** Runs nightly via cron at `/api/automation/cron`

### 6. If Mismatch Found

**Top 10 db_only entries to investigate:**
```json
{
  "db_only": [
    {
      "organization_id": "org-uuid-1",
      "plan_key": "basic",
      "db_status": "active",
      "db_amount_cents": 39900
    }
  ]
}
```
**Questions to ask:**
- Why does this org have `stripe_subscription_id = null`?
- Was this subscription created manually in DB?
- Did Stripe webhook fail to set the subscription ID?

**Top 10 stripe_only entries to investigate:**
```json
{
  "stripe_only": [
    {
      "stripe_subscription_id": "sub_xxx",
      "stripe_status": "active",
      "stripe_amount_cents": 39900,
      "stripe_customer_id": "cus_yyy"
    }
  ]
}
```
**Questions to ask:**
- Why is this Stripe subscription not in our DB?
- Was the checkout webhook missed?
- Is the customer_id linked to any org in our system?

## Expected Findings & Analysis

### Scenario 1: $956 MRR is Real and Accurate
**If endpoint shows:**
```json
{
  "db_mrr_cents": 95600,
  "stripe_mrr_cents": 95600,
  "delta_cents": 0,
  "match": true
}
```

**Composition examples:**
- 1 Pro ($1,200) + 0 Basic = **Not $956**
- 2 Basic ($399×2 = $798) + 0 Pro = **Not $956**
- **0 Pro + 2.4 Basic** = Not possible (fractional subscriptions)
- **Likely: Manual/Custom pricing or test data**

**Why $956 specifically?** This is an unusual amount that doesn't match:
- 1× Pro = $1,200
- 2× Basic = $798
- 1× Pro + 1× Basic = $1,599
- 3× Basic = $1,197

**Possible causes:**
1. Custom/discounted pricing in Stripe (promo code)
2. Prorated subscription created mid-month
3. Old pricing that hasn't been migrated
4. Test data with custom amounts
5. Currency conversion if not USD

### Scenario 2: DB and Stripe Don't Match
**If endpoint shows drift:**
```json
{
  "db_mrr_cents": 95600,
  "stripe_mrr_cents": 159900,  // 4 subscriptions
  "delta_cents": 64300,
  "match": false,
  "db_active_count": 2,
  "stripe_active_count": 4,
  "stripe_only": [...]
}
```

**Common causes of drift:**
1. **Webhook failures** - Stripe webhook didn't reach our endpoint
2. **Manual Stripe changes** - Admin changed subscription in Stripe dashboard
3. **Webhook processing errors** - Webhook received but failed to process
4. **Race conditions** - Multiple webhooks for same event
5. **Missing metadata** - Subscription created without organization_id metadata
6. **Reconciliation disabled** - Nightly job not running or BILLING_AUTO_FIX=false

### Scenario 3: DB-Only Subscriptions (No Stripe ID)
**Indicates:**
- Subscriptions created directly in DB (manual admin action)
- Webhook never set stripe_subscription_id
- Legacy data from before Stripe integration
- Test/demo accounts

**Risk:** Orgs have access without paying

### Scenario 4: Stripe-Only Subscriptions (Not in DB)
**Indicates:**
- checkout.session.completed webhook missed
- customer.subscription.created webhook missed
- Subscription created in Stripe without org metadata
- Customer paid but we didn't create org record

**Risk:** Customer paid but has no access

## Final Assessment (Template)

### Question 1: Is $956 real Stripe MRR?
**Answer:** [REQUIRES PRODUCTION ACCESS]
- If `stripe_configured: true` and `stripe_key_mode: "live"` and `stripe_mrr_cents: 95600` → **YES**
- If `match: true` → DB agrees with Stripe
- If `match: false` → Trust Stripe value, investigate drift

### Question 2: What caused the drift?
**Answer:** [REQUIRES ACTUAL ENDPOINT DATA]
- Check `stripe_only` and `db_only` arrays
- Review last 20 webhook events for gaps
- Check reconciliation job last run timestamp
- Common cause: **Webhook delivery failures** or **manual Stripe dashboard changes**

### Question 3: What fix to propose?
**Answer:** Based on most common scenario:
1. **If webhooks failing:** Verify STRIPE_WEBHOOK_SECRET, check Stripe dashboard webhook logs
2. **If reconciliation not running:** Verify cron job schedule in Vercel, check CRON_SECRET
3. **If manual drift:** Run reconciliation job manually: `POST /api/automation/cron` with Authorization header
4. **If orphaned subscriptions:** Create admin endpoint to bulk-sync all Stripe subscriptions

**DO NOT implement yet - report findings first**

## How to Execute This Audit

### Step 1: Access Production Endpoint
```bash
# Ensure you're authenticated as founder
curl -X GET https://your-production-domain.com/api/admin/mrr-verification \
  -H "Cookie: your-session-cookie" \
  -H "Accept: application/json" \
  > mrr-production.json
```

### Step 2: Access Preview Endpoint (if available)
```bash
curl -X GET https://your-preview.vercel.app/api/admin/mrr-verification \
  -H "Cookie: your-session-cookie" \
  > mrr-preview.json
```

### Step 3: Query Webhook Events
```sql
-- Connect to production DB
SELECT 
  id,
  event_type,
  processed_at
FROM billing_events
ORDER BY processed_at DESC
LIMIT 20;
```

### Step 4: Check Reconciliation Logs
```sql
SELECT 
  organization_id,
  discrepancy_type,
  local_value,
  stripe_value,
  auto_fixed,
  fixed_at
FROM billing_reconciliation_log
ORDER BY created_at DESC
LIMIT 20;
```

### Step 5: Verify Plan Pricing
```sql
SELECT key, name, price_cents 
FROM plans 
ORDER BY price_cents DESC;
```

### Step 6: Generate Report
Parse the JSON responses and SQL results, then populate the "Final Assessment" section above.

## Next Steps

1. **Access the endpoints** (requires production credentials)
2. **Capture screenshots** of JSON responses
3. **Run SQL queries** on production database
4. **Fill in the Final Assessment** with actual data
5. **Report findings** before making any changes
6. **Propose specific fix** based on actual discrepancies found

---

**Note:** This audit is **read-only** and makes no changes to production data. All fixes must be reviewed and approved before implementation.
