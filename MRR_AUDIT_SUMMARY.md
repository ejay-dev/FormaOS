# MRR Truth Audit - Executive Summary

**Date:** 2026-02-15  
**Status:** 🔴 **AWAITING PRODUCTION ACCESS** - Audit cannot be completed from sandbox  
**New Endpoint:** `GET /api/admin/mrr-verification` ✅ Implemented and tested

---

## Quick Start: Execute the Audit

```bash
# 1. Hit production endpoint (requires founder auth)
curl https://your-production.com/api/admin/mrr-verification \
  -H "Cookie: your-session" > mrr-prod.json

# 2. Extract key metrics
cat mrr-prod.json | jq '{
  stripe_key_mode,
  db_mrr_cents,
  stripe_mrr_cents,
  delta_cents,
  match,
  db_active_count,
  stripe_active_count,
  discrepancies: {
    stripe_only: (.stripe_only | length),
    db_only: (.db_only | length)
  }
}'
```

---

## The $956 Question

**Standard Pricing:**
- Starter (basic): **$399/month**
- Professional (pro): **$1,200/month**

**$956 does NOT match any standard combination:**
- 1 Pro = $1,200 ❌
- 2 Basic = $798 ❌
- 3 Basic = $1,197 ❌
- 1 Pro + 1 Basic = $1,599 ❌

**Likely explanations:**
1. Custom/discounted pricing (promo code applied)
2. Prorated subscription (started mid-month)
3. Legacy pricing not yet migrated
4. Test/demo accounts with custom amounts

---

## Infrastructure Status

### ✅ Webhooks (Healthy)
- **Handler:** `app/api/billing/webhook/route.ts`
- **Storage:** `billing_events` table (idempotency enabled)
- **Events handled:** checkout, subscriptions, invoices
- **Check last 20:** `SELECT * FROM billing_events ORDER BY processed_at DESC LIMIT 20`

### ✅ Reconciliation (Auto-Fix Enabled)
- **Job:** `lib/billing/nightly-reconciliation.ts`
- **Trigger:** `POST /api/automation/cron` (nightly via Vercel Cron)
- **Auto-fixes:** Status, plan, period_end discrepancies
- **Check last run:** `SELECT * FROM billing_reconciliation_log ORDER BY created_at DESC LIMIT 20`

### ✅ MRR Verification (New)
- **Endpoint:** `GET /api/admin/mrr-verification`
- **Access:** Founder-only (requires `requireFounderAccess()`)
- **Returns:** DB vs Stripe comparison with detailed discrepancies

---

## Expected Drift Scenarios

### Scenario A: Perfect Match ✅
```json
{
  "db_mrr_cents": 95600,
  "stripe_mrr_cents": 95600,
  "delta_cents": 0,
  "match": true,
  "stripe_only": [],
  "db_only": []
}
```
**Meaning:** DB and Stripe are in sync. $956 is accurate (though unusual amount).

### Scenario B: Webhook Failures 🔴
```json
{
  "db_mrr_cents": 79800,
  "stripe_mrr_cents": 95600,
  "delta_cents": 15800,
  "match": false,
  "stripe_only": [
    {
      "stripe_subscription_id": "sub_xxx",
      "stripe_amount_cents": 15800
    }
  ]
}
```
**Meaning:** Customer paid Stripe but webhook didn't update DB. **Customer has no access.**

### Scenario C: Manual DB Inserts 🔴
```json
{
  "db_mrr_cents": 95600,
  "stripe_mrr_cents": 79800,
  "delta_cents": -15800,
  "match": false,
  "db_only": [
    {
      "organization_id": "org-123",
      "plan_key": "basic",
      "db_amount_cents": 15800,
      "stripe_subscription_id": null
    }
  ]
}
```
**Meaning:** Org has access without paying. **Manual subscription created in DB.**

---

## Final Assessment Template

Fill this in after executing the audit:

### 1️⃣ Is $956 real Stripe MRR?

**Answer:** [CHECK `stripe_mrr_cents` FROM ENDPOINT]
- If `stripe_mrr_cents: 95600` and `stripe_key_mode: "live"` → **YES**
- If `match: true` → DB agrees
- If `match: false` → **Trust Stripe**, investigate drift

**Actual value:** `$______` (from Stripe)

---

### 2️⃣ What caused the drift?

**Answer:** [CHECK `stripe_only` AND `db_only` ARRAYS]

**Most common causes:**
- **Webhook failures** (check Stripe dashboard webhook logs)
- **Manual Stripe changes** (check recent admin actions)
- **Missing metadata** (subscriptions without organization_id)
- **Reconciliation not running** (check cron job schedule)

**Actual cause:** [FILL IN AFTER ANALYSIS]

---

### 3️⃣ What fix to propose?

**Answer:** [DO NOT IMPLEMENT - PROPOSE ONLY]

**If webhook failures:**
→ Verify `STRIPE_WEBHOOK_SECRET`, check Stripe dashboard logs, replay missed events

**If reconciliation not running:**
→ Verify Vercel cron schedule, run manual sync: `POST /api/automation/cron`

**If systematic issues:**
→ Create bulk-sync endpoint: `POST /api/admin/billing/sync-all-from-stripe`

**Proposed fix:** [FILL IN - ASK BEFORE IMPLEMENTING]

---

## Action Items

**For founder with production access:**

- [ ] Access `GET /api/admin/mrr-verification` on production
- [ ] Capture JSON response (screenshot or save to file)
- [ ] Run SQL: `SELECT * FROM billing_events ORDER BY processed_at DESC LIMIT 20`
- [ ] Run SQL: `SELECT * FROM billing_reconciliation_log ORDER BY created_at DESC LIMIT 20`
- [ ] Run SQL: `SELECT key, name, price_cents FROM plans`
- [ ] Fill in "Final Assessment Template" above
- [ ] Report findings in issue/PR
- [ ] **Ask before implementing any fixes**

---

## Reference Files

- **Full Audit Report:** `MRR_AUDIT_REPORT.md` (319 lines, comprehensive)
- **Implementation:** `lib/admin/mrr-verification.ts` (353 lines)
- **API Route:** `app/api/admin/mrr-verification/route.ts` (14 lines)
- **Tests:** `__tests__/lib/admin/mrr-verification.test.ts` (248 lines, 6 tests passing)

---

**🔒 Security Note:** This audit is **read-only** and makes no changes to production data. All proposed fixes must be reviewed and approved before implementation.
