#!/usr/bin/env node

// Smoke-asserts that every STRIPE_PRICE_* env value resolves to a Stripe
// product whose name matches the plan it represents. Prevents the
// 2026-05-22 audit billing-001 regression (STRIPE_PRICE_GROWTH pointing at
// the Scale-priced product, overcharging customers 2.26×).
//
// Run manually after rotating any STRIPE_PRICE_* env var, or as a post-deploy
// step. Skips gracefully when STRIPE_SECRET_KEY is unset.

import Stripe from 'stripe';
import { config } from 'dotenv';

config({ path: '.env.local' });

const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
if (!stripeKey) {
  console.log('ℹ️  STRIPE_SECRET_KEY not set — skipping Stripe price smoke check.');
  process.exit(0);
}

const stripe = new Stripe(stripeKey);

const checks = [
  { envName: 'STRIPE_PRICE_FOUNDATION', expect: /Foundation/i, planLabel: 'Foundation' },
  { envName: 'STRIPE_PRICE_GROWTH', expect: /Growth/i, planLabel: 'Growth' },
  { envName: 'STRIPE_PRICE_SCALE', expect: /Scale/i, planLabel: 'Scale' },
];

const failures = [];
const passes = [];

for (const { envName, expect, planLabel } of checks) {
  const priceId = (process.env[envName] || '').trim();
  if (!priceId) {
    failures.push(`${envName} is not set in env`);
    console.error(`FAIL ${envName} is not set`);
    continue;
  }

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const product = price.product;
    if (typeof product === 'string' || !product || product.deleted) {
      failures.push(
        `${envName} → ${priceId} resolved to an unexpanded / deleted product`,
      );
      console.error(`FAIL ${envName} → ${priceId} product unavailable`);
      continue;
    }
    const productName = product.name ?? '(unnamed)';
    if (!expect.test(productName)) {
      failures.push(
        `${envName} → ${priceId} → product "${productName}" does not match ${expect}`,
      );
      console.error(
        `FAIL ${envName} → ${priceId} resolves to product "${productName}", expected match ${expect}`,
      );
      continue;
    }
    const amount = price.unit_amount != null ? `${price.unit_amount / 100} ${price.currency}` : '(no amount)';
    passes.push(`${envName} → ${planLabel} product "${productName}" (${amount})`);
    console.log(`PASS ${envName} → "${productName}" (${amount})`);
  } catch (err) {
    failures.push(`${envName} → ${priceId}: ${err.message}`);
    console.error(`FAIL ${envName} → ${priceId}: ${err.message}`);
  }
}

console.log('');
console.log(`Passed: ${passes.length}`);
console.log(`Failed: ${failures.length}`);

if (failures.length > 0) {
  process.exit(1);
}
