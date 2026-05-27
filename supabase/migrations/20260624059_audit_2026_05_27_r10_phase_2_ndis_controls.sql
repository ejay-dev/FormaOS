-- Audit 2026-05-27 (R10 Phase 2) — expand NDIS Practice Standards
-- coverage from 8 Phase 1 representative controls to 25 across the
-- Core Module + a small Verification/Specialist module starter set.
--
-- This migration inserts the 17 NEW framework_controls + compliance_controls
-- rows. Phase 1 (migration 20260624056) already created the framework row,
-- the 4 Core Module domains, and the original 8 controls.
--
-- Evaluator predicates land in lib/compliance/evaluators/ndis/ alongside
-- this migration. The predicates use the FormaOS schema directly
-- (org_care_plans, org_incidents, org_staff_credentials, org_policies,
-- org_risks, org_registers, org_capa_items, org_regulatory_notifications,
-- org_form_submissions, org_medication_administrations). Each
-- evaluator file carries an "EXPERT REVIEW REQUIRED" header noting
-- that predicate semantics + thresholds were chosen against the
-- publicly-published NDIS Practice Standards but have NOT been
-- validated by a registered NDIS-audit practitioner.
--
-- Manual-attestation controls are kept where the FormaOS schema has
-- no faithful signal (e.g. NDIS-1.2 "Individual values and beliefs",
-- NDIS-4.2 "Participant money and property"). These return
-- not_evaluated until a future cycle adds the relevant schema.

-- Add the 5th Core Module domain marker (Specialist/Verification module).
-- Standard 5 in our numbering covers the Verification Module +
-- specialist behaviour support; not part of the official Core Module
-- but registered providers also need these where relevant.
INSERT INTO public.framework_domains (id, framework_id, name, description, sort_order) VALUES
  ('d1a1b1c1-5555-5555-5555-555555555555',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'Verification + Specialist Modules',
   'Verification Module (Specialist Behaviour Support, Implementing Behaviour Support) and high-risk specialist supports (medication management, restrictive practices, worker engagement). Required for relevant provider registration categories.',
   5)
ON CONFLICT (id) DO NOTHING;

-- 17 new framework_controls
INSERT INTO public.framework_controls (
  id, framework_id, domain_id, control_code, title, summary_description,
  implementation_guidance, default_risk_level, review_frequency_days,
  suggested_evidence_types, suggested_automation_triggers
) VALUES
  -- Standard 1 remaining
  ('fc111111-1111-1111-1111-111111111112',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-1111-1111-1111-111111111111',
   'NDIS-1.2', 'Individual values and beliefs',
   'Each participant accesses supports that respect and are responsive to their individual values, beliefs and personal circumstances.',
   'Capture participant values/cultural/spiritual context in the participant profile; staff briefed before support delivery.',
   'medium', 180,
   ARRAY['participant_profile','staff_training_record','attestation'],
   ARRAY['care_plan_updated']),
  ('fc111111-1111-1111-1111-111111111114',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-1111-1111-1111-111111111111',
   'NDIS-1.4', 'Independence and informed choice',
   'Each participant is supported to make informed choices, exercise control, and maximise their independence.',
   'Documented supported-decision-making process; consent records for high-stakes decisions; participant goals reflect their choices.',
   'high', 180,
   ARRAY['signed_consent','care_plan','participant_profile'],
   ARRAY['care_plan_updated']),
  -- Standard 2 remaining
  ('fc111111-1111-1111-1111-111111111201',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-2222-2222-2222-222222222222',
   'NDIS-2.1', 'Governance and operational management',
   'The provider has effective governance and operational management.',
   'Governance policies reviewed annually; board / leadership oversight cadence documented; operational management framework.',
   'high', 365,
   ARRAY['policy_document','board_minutes','attestation'],
   ARRAY['policy_published']),
  ('fc111111-1111-1111-1111-111111111203',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-2222-2222-2222-222222222222',
   'NDIS-2.3', 'Quality management',
   'Continuous-improvement system supports the provider to deliver quality supports.',
   'Documented quality-management process; CAPA workflow; performance metrics tracked.',
   'medium', 180,
   ARRAY['capa_log','quality_review_minutes'],
   ARRAY['capa_item_created','capa_item_resolved']),
  ('fc111111-1111-1111-1111-111111111204',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-2222-2222-2222-222222222222',
   'NDIS-2.4', 'Information management',
   'Provider manages participant + provider information securely and in accordance with legislative obligations.',
   'Documented information-management policy; access controls; audit trail of access to participant info.',
   'high', 365,
   ARRAY['policy_document','audit_log_extract','access_review'],
   ARRAY['policy_published']),
  ('fc111111-1111-1111-1111-111111111205',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-2222-2222-2222-222222222222',
   'NDIS-2.5', 'Feedback and complaints management',
   'Provider implements an effective feedback + complaints process.',
   'Complaints register; documented complaint workflow; participant-facing complaints information; resolution timeframes monitored.',
   'high', 90,
   ARRAY['policy_document','complaints_register','attestation'],
   ARRAY['complaint_logged','complaint_resolved']),
  ('fc111111-1111-1111-1111-111111111208',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-2222-2222-2222-222222222222',
   'NDIS-2.8', 'Continuity of supports',
   'Provider has a documented approach to continuity of supports during planned + unplanned disruptions.',
   'Business continuity plan; staff backup arrangements; participant-facing communication plan.',
   'medium', 365,
   ARRAY['policy_document','business_continuity_plan','attestation'],
   ARRAY[]::text[]),
  -- Standard 3 remaining
  ('fc111111-1111-1111-1111-111111111301',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-3333-3333-3333-333333333333',
   'NDIS-3.1', 'Access to supports',
   'Provider manages access to supports in a manner that is responsive to the needs of each participant.',
   'Documented intake process; eligibility criteria; reasonable accommodations.',
   'medium', 365,
   ARRAY['policy_document','intake_record','attestation'],
   ARRAY[]::text[]),
  ('fc111111-1111-1111-1111-111111111302',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-3333-3333-3333-333333333333',
   'NDIS-3.2', 'Support planning',
   'Each participant''s supports are delivered to a documented plan reflecting their identified needs, goals and preferences.',
   'Care plan with documented goals; review cadence aligned to participant needs.',
   'high', 180,
   ARRAY['care_plan','participant_goals','attestation'],
   ARRAY['care_plan_updated','goal_progress_recorded']),
  ('fc111111-1111-1111-1111-111111111304',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-3333-3333-3333-333333333333',
   'NDIS-3.4', 'Responsive support provision',
   'Each participant accesses supports that are flexible, individualised and responsive.',
   'Progress-notes cadence; staff adjust support delivery based on participant feedback.',
   'medium', 90,
   ARRAY['progress_notes','staff_feedback_log','attestation'],
   ARRAY['progress_note_added']),
  ('fc111111-1111-1111-1111-111111111305',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-3333-3333-3333-333333333333',
   'NDIS-3.5', 'Transitions to or from a provider',
   'Each participant experiences a coordinated transition to or from the provider.',
   'Documented transition checklist; warm-handover records; participant-facing transition communication.',
   'medium', 365,
   ARRAY['transition_record','handover_log','attestation'],
   ARRAY[]::text[]),
  -- Standard 4 remaining
  ('fc111111-1111-1111-1111-111111111402',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-4444-4444-4444-444444444444',
   'NDIS-4.2', 'Participant money and property',
   'Where the provider handles participant money/property, this is documented and protected.',
   'Documented financial-handling policy; segregated account records; participant-facing reporting.',
   'high', 180,
   ARRAY['policy_document','financial_record','attestation'],
   ARRAY[]::text[]),
  -- Verification / Specialist module
  ('fc111111-1111-1111-1111-111111111501',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-5555-5555-5555-555555555555',
   'NDIS-V.1', 'Specialist Behaviour Support — registration',
   'Provider holds registration as a Specialist Behaviour Support Provider where required by participant cohort.',
   'NDIS Commission registration record; key personnel records; recent compliance review.',
   'high', 365,
   ARRAY['registration_certificate','attestation'],
   ARRAY[]::text[]),
  ('fc111111-1111-1111-1111-111111111502',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-5555-5555-5555-555555555555',
   'NDIS-V.2', 'Implementing Behaviour Support — restrictive practices oversight',
   'Restrictive practices are documented, authorised, monitored, and reviewed.',
   'Restrictive practices register; authorisations on file; quarterly review; reportable use captured in monthly reports.',
   'critical', 90,
   ARRAY['restrictive_practice_register','authorisation_record','attestation'],
   ARRAY['restrictive_practice_logged']),
  ('fc111111-1111-1111-1111-111111111503',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-5555-5555-5555-555555555555',
   'NDIS-M.1', 'Medication management',
   'Where the provider supports participants with medication, administration is safe and documented.',
   'Medication policy; trained staff; medication errors logged + reviewed; participant medication chart.',
   'critical', 90,
   ARRAY['policy_document','medication_chart','training_record'],
   ARRAY['medication_administered','medication_error_logged']),
  ('fc111111-1111-1111-1111-111111111504',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-5555-5555-5555-555555555555',
   'NDIS-M.2', 'Restrictive practices and consent',
   'Any restrictive practice has documented behaviour-support-plan authorisation and participant/guardian consent.',
   'Behaviour support plan with authorisation; consent records; periodic review.',
   'critical', 90,
   ARRAY['behaviour_support_plan','signed_consent'],
   ARRAY['restrictive_practice_logged']),
  ('fc111111-1111-1111-1111-111111111505',
   '7e9d50bf-c2a4-4a5f-9d3c-1e2b3c4d5e6f',
   'd1a1b1c1-5555-5555-5555-555555555555',
   'NDIS-W.1', 'Worker engagement and wellbeing',
   'Provider engages workers with appropriate supervision, debriefing, and wellbeing support.',
   'Supervision records; staff feedback channel; documented wellbeing supports.',
   'medium', 180,
   ARRAY['supervision_record','staff_feedback','attestation'],
   ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- Matching compliance_controls rows (runtime evaluation projection)
INSERT INTO public.compliance_controls (
  id, framework_id, code, title, description, domain,
  risk_weight, is_mandatory, evaluation_mode, expected_evidence_count,
  framework_control_id
)
SELECT v.id, cf.id, v.code, v.title, v.description, v.domain,
       v.risk_weight, v.is_mandatory, v.evaluation_mode, v.expected_evidence_count,
       v.framework_control_id
FROM (VALUES
  ('cc111111-1111-1111-1111-111111111102'::uuid, 'NDIS-1.2', 'Individual values and beliefs',
   'Standard 1.2 — supports respect and respond to individual values, beliefs, and personal circumstances.',
   'STD-1', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111112'::uuid),
  ('cc111111-1111-1111-1111-111111111104'::uuid, 'NDIS-1.4', 'Independence and informed choice',
   'Standard 1.4 — supports informed choice and maximises independence.',
   'STD-1', 3, true, 'semi_auto', 1, 'fc111111-1111-1111-1111-111111111114'::uuid),
  ('cc111111-1111-1111-1111-111111111201'::uuid, 'NDIS-2.1', 'Governance and operational management',
   'Standard 2.1 — effective governance and operational management.',
   'STD-2', 3, true, 'semi_auto', 1, 'fc111111-1111-1111-1111-111111111201'::uuid),
  ('cc111111-1111-1111-1111-111111111203'::uuid, 'NDIS-2.3', 'Quality management',
   'Standard 2.3 — continuous improvement system.',
   'STD-2', 2, true, 'auto', 1, 'fc111111-1111-1111-1111-111111111203'::uuid),
  ('cc111111-1111-1111-1111-111111111204'::uuid, 'NDIS-2.4', 'Information management',
   'Standard 2.4 — secure information management.',
   'STD-2', 3, true, 'auto', 1, 'fc111111-1111-1111-1111-111111111204'::uuid),
  ('cc111111-1111-1111-1111-111111111205'::uuid, 'NDIS-2.5', 'Feedback and complaints management',
   'Standard 2.5 — feedback + complaints process.',
   'STD-2', 3, true, 'auto', 1, 'fc111111-1111-1111-1111-111111111205'::uuid),
  ('cc111111-1111-1111-1111-111111111208'::uuid, 'NDIS-2.8', 'Continuity of supports',
   'Standard 2.8 — continuity of supports during disruptions.',
   'STD-2', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111208'::uuid),
  ('cc111111-1111-1111-1111-111111111301'::uuid, 'NDIS-3.1', 'Access to supports',
   'Standard 3.1 — responsive access management.',
   'STD-3', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111301'::uuid),
  ('cc111111-1111-1111-1111-111111111302'::uuid, 'NDIS-3.2', 'Support planning',
   'Standard 3.2 — documented support plans with goals.',
   'STD-3', 3, true, 'auto', 1, 'fc111111-1111-1111-1111-111111111302'::uuid),
  ('cc111111-1111-1111-1111-111111111304'::uuid, 'NDIS-3.4', 'Responsive support provision',
   'Standard 3.4 — flexible, individualised, responsive support.',
   'STD-3', 2, true, 'auto', 1, 'fc111111-1111-1111-1111-111111111304'::uuid),
  ('cc111111-1111-1111-1111-111111111305'::uuid, 'NDIS-3.5', 'Transitions to or from a provider',
   'Standard 3.5 — coordinated transitions.',
   'STD-3', 2, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111305'::uuid),
  ('cc111111-1111-1111-1111-111111111402'::uuid, 'NDIS-4.2', 'Participant money and property',
   'Standard 4.2 — protected participant money/property handling.',
   'STD-4', 3, true, 'manual', 1, 'fc111111-1111-1111-1111-111111111402'::uuid),
  ('cc111111-1111-1111-1111-111111111501'::uuid, 'NDIS-V.1', 'Specialist Behaviour Support — registration',
   'Verification Module — specialist registration where required.',
   'STD-5', 3, false, 'manual', 1, 'fc111111-1111-1111-1111-111111111501'::uuid),
  ('cc111111-1111-1111-1111-111111111502'::uuid, 'NDIS-V.2', 'Implementing Behaviour Support — restrictive practices',
   'Verification Module — restrictive practices oversight.',
   'STD-5', 4, false, 'semi_auto', 1, 'fc111111-1111-1111-1111-111111111502'::uuid),
  ('cc111111-1111-1111-1111-111111111503'::uuid, 'NDIS-M.1', 'Medication management',
   'Specialist — medication administration safety.',
   'STD-5', 4, false, 'auto', 1, 'fc111111-1111-1111-1111-111111111503'::uuid),
  ('cc111111-1111-1111-1111-111111111504'::uuid, 'NDIS-M.2', 'Restrictive practices and consent',
   'Specialist — behaviour support plan authorisation.',
   'STD-5', 4, false, 'manual', 1, 'fc111111-1111-1111-1111-111111111504'::uuid),
  ('cc111111-1111-1111-1111-111111111505'::uuid, 'NDIS-W.1', 'Worker engagement and wellbeing',
   'Specialist — worker supervision, debriefing, wellbeing.',
   'STD-5', 2, false, 'manual', 1, 'fc111111-1111-1111-1111-111111111505'::uuid)
) AS v(id, code, title, description, domain, risk_weight, is_mandatory, evaluation_mode, expected_evidence_count, framework_control_id)
CROSS JOIN (SELECT id FROM public.compliance_frameworks WHERE code='NDIS' LIMIT 1) AS cf
ON CONFLICT (id) DO NOTHING;

-- Update the framework description to reflect Phase 2.
UPDATE public.frameworks
   SET description = 'NDIS Quality and Safeguards Commission Practice Standards — Core Module + Verification/Specialist starter set. Phase 2 (2026-05-27): 25 controls. 11 carry real predicate logic against the FormaOS schema (care plans, incidents, staff credentials, policies, risks, registers, regulatory notifications, form submissions, medications). 14 remain manual-attestation pending FormaOS schema work OR domain-expert review. See docs/compliance/ndis-framework-status.md for the predicate map.'
 WHERE slug='ndis';
