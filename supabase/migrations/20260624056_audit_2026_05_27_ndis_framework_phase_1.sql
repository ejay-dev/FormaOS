-- Audit 2026-05-27 (R10 Phase 1) — NDIS Practice Standards as a real
-- compliance framework, replacing the previous marketing-only positioning
-- (the platform used "NDIS" interchangeably with the SOC2 evaluator pack
-- via lib/industry-packs.ts).
--
-- Phase 1 scope: framework + 4 domains (one per Core Module standard) +
-- 8 representative controls drawn from the publicly-published NDIS
-- Quality and Safeguards Commission Practice Standards. All controls
-- start as manual-attestation evaluators (returning `not_evaluated` with
-- a `manual_attestation_required` gap) so customers do not see false
-- positive signal until an NDIS-domain expert builds out Phase 2.
--
-- Phase 2 (deferred to a dedicated cycle with NDIS expert): write the
-- predicate logic for each control against the FormaOS schema — incident
-- table cadence, staff worker-screening expirations, service-agreement
-- coverage, etc. — and add the ~17 remaining Core Module indicators plus
-- the Verification Module.
--
-- References:
--   - NDIS Quality and Safeguards Commission, "NDIS Practice Standards
--     and Quality Indicators" (publicly published)
--   - docs/compliance/ndis-framework-status.md (Phase 1 surface + Phase 2 TODO)

-- Step 1: framework row.
INSERT INTO public.frameworks (id, name, slug, version, description, is_active) VALUES
  (
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'NDIS Practice Standards (Core Module)',
    'ndis',
    '2024',
    'NDIS Quality and Safeguards Commission Practice Standards — Core Module. Phase 1 covers 8 representative controls drawn from Standards 1–3 with manual-attestation evaluators. Phase 2 (TODO) requires an NDIS-domain expert to write predicate logic and expand to the full Core + Verification Module indicator set.',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: four domains, one per Core Module standard.
INSERT INTO public.framework_domains (id, framework_id, name, description, sort_order) VALUES
  (
    'd1a1b1c1-1111-1111-1111-111111111111',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'Rights of Participants and Responsibilities of Providers',
    'Standard 1 of the NDIS Practice Standards Core Module — person-centred supports, dignity, choice, and protection from violence/abuse/neglect/exploitation/discrimination.',
    1
  ),
  (
    'd1a1b1c1-2222-2222-2222-222222222222',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'Provider Governance and Operational Management',
    'Standard 2 — governance, risk, quality, information management, complaints, incident management, HR, and continuity of supports.',
    2
  ),
  (
    'd1a1b1c1-3333-3333-3333-333333333333',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'Provision of Supports',
    'Standard 3 — access, planning, service agreements, responsive provision, and transitions.',
    3
  ),
  (
    'd1a1b1c1-4444-4444-4444-444444444444',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'Provision of Supports Environment',
    'Standard 4 — safe environment and participant money/property handling.',
    4
  )
ON CONFLICT (id) DO NOTHING;

-- Step 3: 8 framework_controls (the structural definition).
INSERT INTO public.framework_controls (
  id, framework_id, domain_id, control_code, title, summary_description,
  implementation_guidance, default_risk_level, review_frequency_days,
  suggested_evidence_types, suggested_automation_triggers
) VALUES
  -- Standard 1: Rights of Participants
  (
    'fc111111-1111-1111-1111-111111111101',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-1111-1111-1111-111111111111',
    'NDIS-1.1',
    'Person-centred supports',
    'Each participant accesses supports that respect their culture, diversity, values and beliefs.',
    'Document person-centred planning processes; capture participant goals and preferences; review at least every 6 months.',
    'high', 180,
    ARRAY['policy_document','participant_plan','staff_training_record'],
    ARRAY['care_plan_updated','staff_training_completed']
  ),
  (
    'fc111111-1111-1111-1111-111111111102',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-1111-1111-1111-111111111111',
    'NDIS-1.3',
    'Privacy and dignity',
    'Each participant accesses supports that respect and protect their dignity and right to privacy.',
    'Privacy policy; staff training on confidentiality; documented information-handling procedures aligned with the Australian Privacy Principles.',
    'high', 365,
    ARRAY['privacy_policy','staff_training_record','attestation'],
    ARRAY['policy_published','staff_training_completed']
  ),
  (
    'fc111111-1111-1111-1111-111111111105',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-1111-1111-1111-111111111111',
    'NDIS-1.5',
    'Violence, abuse, neglect, exploitation and discrimination',
    'Each participant accesses supports free from violence, abuse, neglect, exploitation or discrimination.',
    'Safeguarding policy; staff training on identifying and responding to abuse; documented escalation pathway; reportable incident workflow.',
    'critical', 180,
    ARRAY['policy_document','staff_training_record','incident_register'],
    ARRAY['incident_reported','staff_training_completed']
  ),
  -- Standard 2: Provider Governance
  (
    'fc111111-1111-1111-1111-111111111206',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-2222-2222-2222-222222222222',
    'NDIS-2.6',
    'Incident management',
    'Each participant is safeguarded by the provider''s incident-management system. Incidents involving participants are acknowledged, responded to with appropriate ongoing action and learnings are documented to mitigate the risk of preventable incidents occurring in the future.',
    'Documented incident-management system; reportable incident workflow that satisfies NDIS Commission notification timeframes; incident register reviewed at least quarterly.',
    'critical', 90,
    ARRAY['policy_document','incident_register','reportable_incident_log'],
    ARRAY['incident_reported','reportable_incident_filed']
  ),
  (
    'fc111111-1111-1111-1111-111111111207',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-2222-2222-2222-222222222222',
    'NDIS-2.7',
    'Human resource management',
    'Each participant''s support needs are met by workers who are competent in their role, hold relevant qualifications, and who have the relevant expertise and experience to provide person-centred support.',
    'NDIS Worker Screening Check current for every relevant worker; role-specific competency evidence; supervision records.',
    'high', 90,
    ARRAY['worker_screening_check','qualification_certificate','supervision_record'],
    ARRAY['worker_screening_renewed','qualification_expiry_approaching']
  ),
  (
    'fc111111-1111-1111-1111-111111111202',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-2222-2222-2222-222222222222',
    'NDIS-2.2',
    'Risk management',
    'Risks to participants, workers and the provider are identified and managed.',
    'Risk register reviewed at least quarterly; treatment plans for residual risks; documented escalation thresholds.',
    'medium', 90,
    ARRAY['risk_register','risk_assessment','attestation'],
    ARRAY['risk_register_reviewed']
  ),
  -- Standard 3: Provision of Supports
  (
    'fc111111-1111-1111-1111-111111111303',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-3333-3333-3333-333333333333',
    'NDIS-3.3',
    'Service agreements with participants',
    'Each participant has a clear understanding of the supports they have chosen and how they will be provided.',
    'Signed service agreement covering supports, fees, withdrawal rights, complaints process; reviewed when supports change.',
    'medium', 365,
    ARRAY['service_agreement','signed_consent'],
    ARRAY['service_agreement_signed']
  ),
  -- Standard 4: Provision of Supports Environment
  (
    'fc111111-1111-1111-1111-111111111401',
    '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
    'd1a1b1c1-4444-4444-4444-444444444444',
    'NDIS-4.1',
    'Safe environment for the delivery of supports',
    'Each participant accesses supports in a safe and fit for purpose environment.',
    'Environmental risk assessments for service-delivery locations; emergency procedures; equipment maintenance log.',
    'high', 180,
    ARRAY['risk_assessment','maintenance_log','attestation'],
    ARRAY['site_inspection_completed']
  )
ON CONFLICT (id) DO NOTHING;

-- Step 4: compliance_controls rows (the runtime-evaluation projection).
-- expected_evidence_count=1 keeps the heuristic conservative until Phase 2
-- evaluator predicates land.
INSERT INTO public.compliance_controls (
  id, framework_id, code, title, description, domain,
  risk_weight, is_mandatory, evaluation_mode, expected_evidence_count,
  framework_control_id
) VALUES
  ('cc111111-1111-1111-1111-111111111101', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-1.1',
   'Person-centred supports',
   'Standard 1.1 — supports respect participant culture, diversity, values and beliefs.',
   'STD-1', 3, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111101'),
  ('cc111111-1111-1111-1111-111111111103', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-1.3',
   'Privacy and dignity',
   'Standard 1.3 — supports respect dignity and right to privacy.',
   'STD-1', 3, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111102'),
  ('cc111111-1111-1111-1111-111111111105', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-1.5',
   'Violence, abuse, neglect, exploitation and discrimination',
   'Standard 1.5 — supports free from violence, abuse, neglect, exploitation or discrimination.',
   'STD-1', 4, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111105'),
  ('cc111111-1111-1111-1111-111111111206', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-2.6',
   'Incident management',
   'Standard 2.6 — incident management system mitigates risk of preventable incidents.',
   'STD-2', 4, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111206'),
  ('cc111111-1111-1111-1111-111111111207', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-2.7',
   'Human resource management',
   'Standard 2.7 — workers competent, screened, and supervised.',
   'STD-2', 3, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111207'),
  ('cc111111-1111-1111-1111-111111111202', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-2.2',
   'Risk management',
   'Standard 2.2 — risks to participants, workers and the provider identified and managed.',
   'STD-2', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111202'),
  ('cc111111-1111-1111-1111-111111111303', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-3.3',
   'Service agreements with participants',
   'Standard 3.3 — clear, signed service agreements covering supports and fees.',
   'STD-3', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111303'),
  ('cc111111-1111-1111-1111-111111111401', 'd8443a8d-2a4a-4492-9b1a-7a8d150d457e', 'NDIS-4.1',
   'Safe environment for the delivery of supports',
   'Standard 4.1 — supports delivered in safe, fit-for-purpose environments.',
   'STD-4', 3, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111401')
ON CONFLICT (id) DO NOTHING;
