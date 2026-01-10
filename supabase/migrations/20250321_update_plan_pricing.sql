update public.plans
set name = 'Starter',
    price_cents = 15900,
    currency = 'aud',
    features = jsonb_build_array(
      'Core compliance engine',
      'Tasks and evidence management',
      'Audit logs',
      'Standard reporting'
    )
where key = 'basic';

update public.plans
set name = 'Pro',
    price_cents = 23900,
    currency = 'aud',
    features = jsonb_build_array(
      'Everything in Starter',
      'Advanced reporting',
      'Governance controls',
      'Operational dashboards',
      'Workflow automation'
    )
where key = 'pro';

update public.plans
set name = 'Enterprise',
    price_cents = null,
    currency = 'aud',
    features = jsonb_build_array(
      'White-glove onboarding',
      'Custom compliance frameworks',
      'Org-wide deployment',
      'Dedicated support'
    )
where key = 'enterprise';
