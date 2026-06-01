import { registerEvaluator } from './index';
import { meta as soc2_CC6_1 } from './soc2/CC6.1';
import { meta as soc2_CC6_2 } from './soc2/CC6.2';
import { meta as soc2_CC6_3 } from './soc2/CC6.3';
import { meta as soc2_CC6_6 } from './soc2/CC6.6';
import { meta as soc2_CC6_7 } from './soc2/CC6.7';
import { meta as soc2_CC7_1 } from './soc2/CC7.1';
import { meta as soc2_CC7_2 } from './soc2/CC7.2';
import { meta as soc2_CC7_3 } from './soc2/CC7.3';
import { meta as soc2_CC7_4 } from './soc2/CC7.4';

// Audit compliance-004 (2026-05-22) — SOC2-TSC pack.
// Phase 1 (PR #124): framework plumbing + 10 evaluators wired under
// the `soc2-tsc` slug.
// Phase 2 (this PR): 51 additional evaluators to reach full 61/61
// coverage of the SOC2-TSC pack.
// Coverage breakdown across the full pack:
//   - ~28 DB-backed automated signals (policy cadence, MFA coverage,
//     audit-log attribution, risk register freshness, retention
//     policies, regulator notifications, compliance_scans cadence,
//     audit_log chain integrity, etc.)
//   - ~33 manual attestation (governance, communications, consent,
//     DSAR, vendor DPAs, physical access) where the FormaOS schema
//     has no automation signal today; each carries a
//     `manual_attestation_required` gap.
import { meta as soc2tsc_CC1_1 } from './soc2-tsc/CC1.1';
import { meta as soc2tsc_CC1_2 } from './soc2-tsc/CC1.2';
import { meta as soc2tsc_CC1_3 } from './soc2-tsc/CC1.3';
import { meta as soc2tsc_CC1_4 } from './soc2-tsc/CC1.4';
import { meta as soc2tsc_CC1_5 } from './soc2-tsc/CC1.5';
import { meta as soc2tsc_CC2_1 } from './soc2-tsc/CC2.1';
import { meta as soc2tsc_CC2_2 } from './soc2-tsc/CC2.2';
import { meta as soc2tsc_CC2_3 } from './soc2-tsc/CC2.3';
import { meta as soc2tsc_CC3_1 } from './soc2-tsc/CC3.1';
import { meta as soc2tsc_CC3_2 } from './soc2-tsc/CC3.2';
import { meta as soc2tsc_CC3_3 } from './soc2-tsc/CC3.3';
import { meta as soc2tsc_CC3_4 } from './soc2-tsc/CC3.4';
import { meta as soc2tsc_CC4_1 } from './soc2-tsc/CC4.1';
import { meta as soc2tsc_CC4_2 } from './soc2-tsc/CC4.2';
import { meta as soc2tsc_CC5_1 } from './soc2-tsc/CC5.1';
import { meta as soc2tsc_CC5_2 } from './soc2-tsc/CC5.2';
import { meta as soc2tsc_CC5_3 } from './soc2-tsc/CC5.3';
import { meta as soc2tsc_CC6_1 } from './soc2-tsc/CC6.1';
import { meta as soc2tsc_CC6_2 } from './soc2-tsc/CC6.2';
import { meta as soc2tsc_CC6_3 } from './soc2-tsc/CC6.3';
import { meta as soc2tsc_CC6_4 } from './soc2-tsc/CC6.4';
import { meta as soc2tsc_CC6_5 } from './soc2-tsc/CC6.5';
import { meta as soc2tsc_CC6_6 } from './soc2-tsc/CC6.6';
import { meta as soc2tsc_CC6_7 } from './soc2-tsc/CC6.7';
import { meta as soc2tsc_CC6_8 } from './soc2-tsc/CC6.8';
import { meta as soc2tsc_CC7_1 } from './soc2-tsc/CC7.1';
import { meta as soc2tsc_CC7_2 } from './soc2-tsc/CC7.2';
import { meta as soc2tsc_CC7_3 } from './soc2-tsc/CC7.3';
import { meta as soc2tsc_CC7_4 } from './soc2-tsc/CC7.4';
import { meta as soc2tsc_CC7_5 } from './soc2-tsc/CC7.5';
import { meta as soc2tsc_CC8_1 } from './soc2-tsc/CC8.1';
import { meta as soc2tsc_CC9_1 } from './soc2-tsc/CC9.1';
import { meta as soc2tsc_CC9_2 } from './soc2-tsc/CC9.2';
import { meta as soc2tsc_A1_1 } from './soc2-tsc/A1.1';
import { meta as soc2tsc_A1_2 } from './soc2-tsc/A1.2';
import { meta as soc2tsc_A1_3 } from './soc2-tsc/A1.3';
import { meta as soc2tsc_C1_1 } from './soc2-tsc/C1.1';
import { meta as soc2tsc_C1_2 } from './soc2-tsc/C1.2';
import { meta as soc2tsc_PI1_1 } from './soc2-tsc/PI1.1';
import { meta as soc2tsc_PI1_2 } from './soc2-tsc/PI1.2';
import { meta as soc2tsc_PI1_3 } from './soc2-tsc/PI1.3';
import { meta as soc2tsc_PI1_4 } from './soc2-tsc/PI1.4';
import { meta as soc2tsc_PI1_5 } from './soc2-tsc/PI1.5';
import { meta as soc2tsc_P1_1 } from './soc2-tsc/P1.1';
import { meta as soc2tsc_P2_1 } from './soc2-tsc/P2.1';
import { meta as soc2tsc_P3_1 } from './soc2-tsc/P3.1';
import { meta as soc2tsc_P3_2 } from './soc2-tsc/P3.2';
import { meta as soc2tsc_P4_1 } from './soc2-tsc/P4.1';
import { meta as soc2tsc_P4_2 } from './soc2-tsc/P4.2';
import { meta as soc2tsc_P4_3 } from './soc2-tsc/P4.3';
import { meta as soc2tsc_P5_1 } from './soc2-tsc/P5.1';
import { meta as soc2tsc_P5_2 } from './soc2-tsc/P5.2';
import { meta as soc2tsc_P6_1 } from './soc2-tsc/P6.1';
import { meta as soc2tsc_P6_2 } from './soc2-tsc/P6.2';
import { meta as soc2tsc_P6_3 } from './soc2-tsc/P6.3';
import { meta as soc2tsc_P6_4 } from './soc2-tsc/P6.4';
import { meta as soc2tsc_P6_5 } from './soc2-tsc/P6.5';
import { meta as soc2tsc_P6_6 } from './soc2-tsc/P6.6';
import { meta as soc2tsc_P6_7 } from './soc2-tsc/P6.7';
import { meta as soc2tsc_P7_1 } from './soc2-tsc/P7.1';
import { meta as soc2tsc_P8_1 } from './soc2-tsc/P8.1';

// Audit compliance-004 (2026-05-22) — phase 3 of multi-PR rollout.
// ISO/IEC 27001:2022 Annex A — 93 controls across four themes.
// Coverage breakdown:
//   - 31 DB-backed automated signals (policy cadence, MFA coverage,
//     supplier risk register, audit-log activity, compliance scans)
//   - 62 manual attestation (policy sign-off, NDAs, physical
//     perimeter, crypto policy — flagged for future automation
//     where a source signal is added)
// See lib/compliance/evaluators/iso27001-2022/_shared.ts for helpers.
import { meta as iso_A_5_1 } from './iso27001-2022/A.5.1';
import { meta as iso_A_5_2 } from './iso27001-2022/A.5.2';
import { meta as iso_A_5_3 } from './iso27001-2022/A.5.3';
import { meta as iso_A_5_4 } from './iso27001-2022/A.5.4';
import { meta as iso_A_5_5 } from './iso27001-2022/A.5.5';
import { meta as iso_A_5_6 } from './iso27001-2022/A.5.6';
import { meta as iso_A_5_7 } from './iso27001-2022/A.5.7';
import { meta as iso_A_5_8 } from './iso27001-2022/A.5.8';
import { meta as iso_A_5_9 } from './iso27001-2022/A.5.9';
import { meta as iso_A_5_10 } from './iso27001-2022/A.5.10';
import { meta as iso_A_5_11 } from './iso27001-2022/A.5.11';
import { meta as iso_A_5_12 } from './iso27001-2022/A.5.12';
import { meta as iso_A_5_13 } from './iso27001-2022/A.5.13';
import { meta as iso_A_5_14 } from './iso27001-2022/A.5.14';
import { meta as iso_A_5_15 } from './iso27001-2022/A.5.15';
import { meta as iso_A_5_16 } from './iso27001-2022/A.5.16';
import { meta as iso_A_5_17 } from './iso27001-2022/A.5.17';
import { meta as iso_A_5_18 } from './iso27001-2022/A.5.18';
import { meta as iso_A_5_19 } from './iso27001-2022/A.5.19';
import { meta as iso_A_5_20 } from './iso27001-2022/A.5.20';
import { meta as iso_A_5_21 } from './iso27001-2022/A.5.21';
import { meta as iso_A_5_22 } from './iso27001-2022/A.5.22';
import { meta as iso_A_5_23 } from './iso27001-2022/A.5.23';
import { meta as iso_A_5_24 } from './iso27001-2022/A.5.24';
import { meta as iso_A_5_25 } from './iso27001-2022/A.5.25';
import { meta as iso_A_5_26 } from './iso27001-2022/A.5.26';
import { meta as iso_A_5_27 } from './iso27001-2022/A.5.27';
import { meta as iso_A_5_28 } from './iso27001-2022/A.5.28';
import { meta as iso_A_5_29 } from './iso27001-2022/A.5.29';
import { meta as iso_A_5_30 } from './iso27001-2022/A.5.30';
import { meta as iso_A_5_31 } from './iso27001-2022/A.5.31';
import { meta as iso_A_5_32 } from './iso27001-2022/A.5.32';
import { meta as iso_A_5_33 } from './iso27001-2022/A.5.33';
import { meta as iso_A_5_34 } from './iso27001-2022/A.5.34';
import { meta as iso_A_5_35 } from './iso27001-2022/A.5.35';
import { meta as iso_A_5_36 } from './iso27001-2022/A.5.36';
import { meta as iso_A_5_37 } from './iso27001-2022/A.5.37';
import { meta as iso_A_6_1 } from './iso27001-2022/A.6.1';
import { meta as iso_A_6_2 } from './iso27001-2022/A.6.2';
import { meta as iso_A_6_3 } from './iso27001-2022/A.6.3';
import { meta as iso_A_6_4 } from './iso27001-2022/A.6.4';
import { meta as iso_A_6_5 } from './iso27001-2022/A.6.5';
import { meta as iso_A_6_6 } from './iso27001-2022/A.6.6';
import { meta as iso_A_6_7 } from './iso27001-2022/A.6.7';
import { meta as iso_A_6_8 } from './iso27001-2022/A.6.8';
import { meta as iso_A_7_1 } from './iso27001-2022/A.7.1';
import { meta as iso_A_7_2 } from './iso27001-2022/A.7.2';
import { meta as iso_A_7_3 } from './iso27001-2022/A.7.3';
import { meta as iso_A_7_4 } from './iso27001-2022/A.7.4';
import { meta as iso_A_7_5 } from './iso27001-2022/A.7.5';
import { meta as iso_A_7_6 } from './iso27001-2022/A.7.6';
import { meta as iso_A_7_7 } from './iso27001-2022/A.7.7';
import { meta as iso_A_7_8 } from './iso27001-2022/A.7.8';
import { meta as iso_A_7_9 } from './iso27001-2022/A.7.9';
import { meta as iso_A_7_10 } from './iso27001-2022/A.7.10';
import { meta as iso_A_7_11 } from './iso27001-2022/A.7.11';
import { meta as iso_A_7_12 } from './iso27001-2022/A.7.12';
import { meta as iso_A_7_13 } from './iso27001-2022/A.7.13';
import { meta as iso_A_7_14 } from './iso27001-2022/A.7.14';
import { meta as iso_A_8_1 } from './iso27001-2022/A.8.1';
import { meta as iso_A_8_2 } from './iso27001-2022/A.8.2';
import { meta as iso_A_8_3 } from './iso27001-2022/A.8.3';
import { meta as iso_A_8_4 } from './iso27001-2022/A.8.4';
import { meta as iso_A_8_5 } from './iso27001-2022/A.8.5';
import { meta as iso_A_8_6 } from './iso27001-2022/A.8.6';
import { meta as iso_A_8_7 } from './iso27001-2022/A.8.7';
import { meta as iso_A_8_8 } from './iso27001-2022/A.8.8';
import { meta as iso_A_8_9 } from './iso27001-2022/A.8.9';
import { meta as iso_A_8_10 } from './iso27001-2022/A.8.10';
import { meta as iso_A_8_11 } from './iso27001-2022/A.8.11';
import { meta as iso_A_8_12 } from './iso27001-2022/A.8.12';
import { meta as iso_A_8_13 } from './iso27001-2022/A.8.13';
import { meta as iso_A_8_14 } from './iso27001-2022/A.8.14';
import { meta as iso_A_8_15 } from './iso27001-2022/A.8.15';
import { meta as iso_A_8_16 } from './iso27001-2022/A.8.16';
import { meta as iso_A_8_17 } from './iso27001-2022/A.8.17';
import { meta as iso_A_8_18 } from './iso27001-2022/A.8.18';
import { meta as iso_A_8_19 } from './iso27001-2022/A.8.19';
import { meta as iso_A_8_20 } from './iso27001-2022/A.8.20';
import { meta as iso_A_8_21 } from './iso27001-2022/A.8.21';
import { meta as iso_A_8_22 } from './iso27001-2022/A.8.22';
import { meta as iso_A_8_23 } from './iso27001-2022/A.8.23';
import { meta as iso_A_8_24 } from './iso27001-2022/A.8.24';
import { meta as iso_A_8_25 } from './iso27001-2022/A.8.25';
import { meta as iso_A_8_26 } from './iso27001-2022/A.8.26';
import { meta as iso_A_8_27 } from './iso27001-2022/A.8.27';
import { meta as iso_A_8_28 } from './iso27001-2022/A.8.28';
import { meta as iso_A_8_29 } from './iso27001-2022/A.8.29';
import { meta as iso_A_8_30 } from './iso27001-2022/A.8.30';
import { meta as iso_A_8_31 } from './iso27001-2022/A.8.31';
import { meta as iso_A_8_32 } from './iso27001-2022/A.8.32';
import { meta as iso_A_8_33 } from './iso27001-2022/A.8.33';
import { meta as iso_A_8_34 } from './iso27001-2022/A.8.34';

// Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
// Five remaining packs onboarded in a single PR (64 controls total).
// Coverage breakdown (automated DB-backed signal vs. manual
// attestation):
//   - CIS Controls v8: 7 automated / 11 manual (18 total)
//   - NIST CSF 2.0:    6 automated / 9 manual (15 total)
//   - GDPR:            2 automated / 8 manual (10 total)
//   - HIPAA:           3 automated / 7 manual (10 total)
//   - PCI DSS 4.0:     5 automated / 6 manual (11 total)
// Manual attestation dominates because most of these packs verify
// signed-off artefacts (asset inventory, training records, vendor
// DPAs, physical safeguards) that FormaOS does not model as rows.
// Each manual evaluator carries a `manual_attestation_required` gap
// so the UI can prompt for human input.
import { meta as cis_CIS_01 } from './cis-controls/CIS-01';
import { meta as cis_CIS_02 } from './cis-controls/CIS-02';
import { meta as cis_CIS_03 } from './cis-controls/CIS-03';
import { meta as cis_CIS_04 } from './cis-controls/CIS-04';
import { meta as cis_CIS_05 } from './cis-controls/CIS-05';
import { meta as cis_CIS_06 } from './cis-controls/CIS-06';
import { meta as cis_CIS_07 } from './cis-controls/CIS-07';
import { meta as cis_CIS_08 } from './cis-controls/CIS-08';
import { meta as cis_CIS_09 } from './cis-controls/CIS-09';
import { meta as cis_CIS_10 } from './cis-controls/CIS-10';
import { meta as cis_CIS_11 } from './cis-controls/CIS-11';
import { meta as cis_CIS_12 } from './cis-controls/CIS-12';
import { meta as cis_CIS_13 } from './cis-controls/CIS-13';
import { meta as cis_CIS_14 } from './cis-controls/CIS-14';
import { meta as cis_CIS_15 } from './cis-controls/CIS-15';
import { meta as cis_CIS_16 } from './cis-controls/CIS-16';
import { meta as cis_CIS_17 } from './cis-controls/CIS-17';
import { meta as cis_CIS_18 } from './cis-controls/CIS-18';

import { meta as nist_GV_1 } from './nist-csf/GV-1';
import { meta as nist_GV_2 } from './nist-csf/GV-2';
import { meta as nist_GV_3 } from './nist-csf/GV-3';
import { meta as nist_ID_1 } from './nist-csf/ID-1';
import { meta as nist_ID_2 } from './nist-csf/ID-2';
import { meta as nist_ID_3 } from './nist-csf/ID-3';
import { meta as nist_PR_1 } from './nist-csf/PR-1';
import { meta as nist_PR_2 } from './nist-csf/PR-2';
import { meta as nist_PR_3 } from './nist-csf/PR-3';
import { meta as nist_DE_1 } from './nist-csf/DE-1';
import { meta as nist_DE_2 } from './nist-csf/DE-2';
import { meta as nist_RS_1 } from './nist-csf/RS-1';
import { meta as nist_RS_2 } from './nist-csf/RS-2';
import { meta as nist_RC_1 } from './nist-csf/RC-1';
import { meta as nist_RC_2 } from './nist-csf/RC-2';

import { meta as gdpr_GOV_1 } from './gdpr/GDPR-GOV-1';
import { meta as gdpr_GOV_2 } from './gdpr/GDPR-GOV-2';
import { meta as gdpr_DATA_1 } from './gdpr/GDPR-DATA-1';
import { meta as gdpr_DATA_2 } from './gdpr/GDPR-DATA-2';
import { meta as gdpr_RIGHTS_1 } from './gdpr/GDPR-RIGHTS-1';
import { meta as gdpr_RIGHTS_2 } from './gdpr/GDPR-RIGHTS-2';
import { meta as gdpr_BREACH_1 } from './gdpr/GDPR-BREACH-1';
import { meta as gdpr_BREACH_2 } from './gdpr/GDPR-BREACH-2';
import { meta as gdpr_VEND_1 } from './gdpr/GDPR-VEND-1';
import { meta as gdpr_VEND_2 } from './gdpr/GDPR-VEND-2';

import { meta as hipaa_ADM_1 } from './hipaa/HIPAA-ADM-1';
import { meta as hipaa_ADM_2 } from './hipaa/HIPAA-ADM-2';
import { meta as hipaa_ADM_3 } from './hipaa/HIPAA-ADM-3';
import { meta as hipaa_ADM_4 } from './hipaa/HIPAA-ADM-4';
import { meta as hipaa_PHY_1 } from './hipaa/HIPAA-PHY-1';
import { meta as hipaa_PHY_2 } from './hipaa/HIPAA-PHY-2';
import { meta as hipaa_TECH_1 } from './hipaa/HIPAA-TECH-1';
import { meta as hipaa_TECH_2 } from './hipaa/HIPAA-TECH-2';
import { meta as hipaa_TECH_3 } from './hipaa/HIPAA-TECH-3';
import { meta as hipaa_TECH_4 } from './hipaa/HIPAA-TECH-4';

// Audit 2026-05-27 NDIS Practice Standards pack.
//   Phase 1: 8 representative manual-attestation controls.
//   Phase 2: 6 of those 8 now carry real predicate logic against the
//            FormaOS schema (1.1 care_plans, 1.5 incidents+investigations,
//            2.2 risks, 2.6 incidents+regulatory_notifications, 2.7
//            at_risk_credentials, 3.3 form_submissions). 1.3 + 4.1 stay
//            manual. Plus 17 new controls covering remaining Core Module
//            outcomes + Verification + Specialist module starters.
//            5 of the 17 new carry real predicates (2.3, 2.4, 2.5, 3.2,
//            3.4, M.1); 12 stay manual pending Phase 3 schema work.
//            ⚠️ Expert review required for predicate semantics +
//            threshold calibration — see lib/compliance/evaluators/ndis/_predicates.ts.
import { meta as ndis_1_1 } from './ndis/NDIS-1.1';
import { meta as ndis_1_2 } from './ndis/NDIS-1.2';
import { meta as ndis_1_3 } from './ndis/NDIS-1.3';
import { meta as ndis_1_4 } from './ndis/NDIS-1.4';
import { meta as ndis_1_5 } from './ndis/NDIS-1.5';
import { meta as ndis_2_1 } from './ndis/NDIS-2.1';
import { meta as ndis_2_2 } from './ndis/NDIS-2.2';
import { meta as ndis_2_3 } from './ndis/NDIS-2.3';
import { meta as ndis_2_4 } from './ndis/NDIS-2.4';
import { meta as ndis_2_5 } from './ndis/NDIS-2.5';
import { meta as ndis_2_6 } from './ndis/NDIS-2.6';
import { meta as ndis_2_7 } from './ndis/NDIS-2.7';
import { meta as ndis_2_8 } from './ndis/NDIS-2.8';
import { meta as ndis_3_1 } from './ndis/NDIS-3.1';
import { meta as ndis_3_2 } from './ndis/NDIS-3.2';
import { meta as ndis_3_3 } from './ndis/NDIS-3.3';
import { meta as ndis_3_4 } from './ndis/NDIS-3.4';
import { meta as ndis_3_5 } from './ndis/NDIS-3.5';
import { meta as ndis_4_1 } from './ndis/NDIS-4.1';
import { meta as ndis_4_2 } from './ndis/NDIS-4.2';
import { meta as ndis_V_1 } from './ndis/NDIS-V.1';
import { meta as ndis_V_2 } from './ndis/NDIS-V.2';
import { meta as ndis_M_1 } from './ndis/NDIS-M.1';
import { meta as ndis_M_2 } from './ndis/NDIS-M.2';
import { meta as ndis_W_1 } from './ndis/NDIS-W.1';

// Australian Financial Services pack (framework slug = 'financial-services-au',
// 20 controls — ASIC AFS, APRA CPS 230/234/510, AUSTRAC AML/CTF, AFCA).
// Coverage breakdown (DB-signal vs. manual attestation):
//   - 7 DB-signal: AFS-003 (PDS/FSG policy cadence), AFS-004
//     (conflict_of_interest register), CPS-001 (org_risks freshness),
//     CPS-002 (business_continuity_plan register), CPS-004 (infosec +
//     incident-response policy + audit activity), AML-001 (AML/CTF
//     policy cadence), AFCA-002 (complaint register, RG 271 30-day).
//   - 13 manual attestation. AFS-006 + AML-004 were planned as DB-signal
//     against org_regulatory_notifications but that table cannot model
//     ASIC/AUSTRAC lodgements (its `regulation` CHECK excludes them,
//     `notification_type` is NDIS-specific, and it requires an
//     incident_id FK) — reading it would surface false NDIS signals, so
//     they fall back to manual. The other 11 (AFS-001/002/005/007/008,
//     CPS-003/005, AML-002/003/005, AFCA-001) verify licences, registers,
//     trust-account reconciliations, training, and board sign-offs that
//     FormaOS does not model as rows. Each carries a
//     `manual_attestation_required` gap — never a false pass.
// DB-signal helpers that find no finance-tagged rows return
// manualAttestation / not_evaluated, never `pass`.
import { meta as fsau_AFS_001 } from './financial-services-au/AFS-001';
import { meta as fsau_AFS_002 } from './financial-services-au/AFS-002';
import { meta as fsau_AFS_003 } from './financial-services-au/AFS-003';
import { meta as fsau_AFS_004 } from './financial-services-au/AFS-004';
import { meta as fsau_AFS_005 } from './financial-services-au/AFS-005';
import { meta as fsau_AFS_006 } from './financial-services-au/AFS-006';
import { meta as fsau_AFS_007 } from './financial-services-au/AFS-007';
import { meta as fsau_AFS_008 } from './financial-services-au/AFS-008';
import { meta as fsau_CPS_001 } from './financial-services-au/CPS-001';
import { meta as fsau_CPS_002 } from './financial-services-au/CPS-002';
import { meta as fsau_CPS_003 } from './financial-services-au/CPS-003';
import { meta as fsau_CPS_004 } from './financial-services-au/CPS-004';
import { meta as fsau_CPS_005 } from './financial-services-au/CPS-005';
import { meta as fsau_AML_001 } from './financial-services-au/AML-001';
import { meta as fsau_AML_002 } from './financial-services-au/AML-002';
import { meta as fsau_AML_003 } from './financial-services-au/AML-003';
import { meta as fsau_AML_004 } from './financial-services-au/AML-004';
import { meta as fsau_AML_005 } from './financial-services-au/AML-005';
import { meta as fsau_AFCA_001 } from './financial-services-au/AFCA-001';
import { meta as fsau_AFCA_002 } from './financial-services-au/AFCA-002';

import { meta as pci_PCI_1 } from './pci-dss/PCI-1';
import { meta as pci_PCI_2 } from './pci-dss/PCI-2';
import { meta as pci_PCI_3 } from './pci-dss/PCI-3';
import { meta as pci_PCI_4 } from './pci-dss/PCI-4';
import { meta as pci_PCI_5 } from './pci-dss/PCI-5';
import { meta as pci_PCI_6 } from './pci-dss/PCI-6';
import { meta as pci_PCI_7 } from './pci-dss/PCI-7';
import { meta as pci_PCI_8 } from './pci-dss/PCI-8';
import { meta as pci_PCI_10 } from './pci-dss/PCI-10';
import { meta as pci_PCI_11 } from './pci-dss/PCI-11';
import { meta as pci_PCI_12 } from './pci-dss/PCI-12';

const ALL_EVALUATORS = [
  // Legacy SOC2 (framework slug = 'soc2', 9 controls)
  soc2_CC6_1,
  soc2_CC6_2,
  soc2_CC6_3,
  soc2_CC6_6,
  soc2_CC6_7,
  soc2_CC7_1,
  soc2_CC7_2,
  soc2_CC7_3,
  soc2_CC7_4,
  // SOC2-TSC pack (framework slug = 'soc2-tsc', 61 controls — full coverage)
  soc2tsc_CC1_1,
  soc2tsc_CC1_2,
  soc2tsc_CC1_3,
  soc2tsc_CC1_4,
  soc2tsc_CC1_5,
  soc2tsc_CC2_1,
  soc2tsc_CC2_2,
  soc2tsc_CC2_3,
  soc2tsc_CC3_1,
  soc2tsc_CC3_2,
  soc2tsc_CC3_3,
  soc2tsc_CC3_4,
  soc2tsc_CC4_1,
  soc2tsc_CC4_2,
  soc2tsc_CC5_1,
  soc2tsc_CC5_2,
  soc2tsc_CC5_3,
  soc2tsc_CC6_1,
  soc2tsc_CC6_2,
  soc2tsc_CC6_3,
  soc2tsc_CC6_4,
  soc2tsc_CC6_5,
  soc2tsc_CC6_6,
  soc2tsc_CC6_7,
  soc2tsc_CC6_8,
  soc2tsc_CC7_1,
  soc2tsc_CC7_2,
  soc2tsc_CC7_3,
  soc2tsc_CC7_4,
  soc2tsc_CC7_5,
  soc2tsc_CC8_1,
  soc2tsc_CC9_1,
  soc2tsc_CC9_2,
  soc2tsc_A1_1,
  soc2tsc_A1_2,
  soc2tsc_A1_3,
  soc2tsc_C1_1,
  soc2tsc_C1_2,
  soc2tsc_PI1_1,
  soc2tsc_PI1_2,
  soc2tsc_PI1_3,
  soc2tsc_PI1_4,
  soc2tsc_PI1_5,
  soc2tsc_P1_1,
  soc2tsc_P2_1,
  soc2tsc_P3_1,
  soc2tsc_P3_2,
  soc2tsc_P4_1,
  soc2tsc_P4_2,
  soc2tsc_P4_3,
  soc2tsc_P5_1,
  soc2tsc_P5_2,
  soc2tsc_P6_1,
  soc2tsc_P6_2,
  soc2tsc_P6_3,
  soc2tsc_P6_4,
  soc2tsc_P6_5,
  soc2tsc_P6_6,
  soc2tsc_P6_7,
  soc2tsc_P7_1,
  soc2tsc_P8_1,
  // ISO/IEC 27001:2022 Annex A pack (framework slug = 'iso27001-2022', 93 controls — phase 3)
  iso_A_5_1,
  iso_A_5_2,
  iso_A_5_3,
  iso_A_5_4,
  iso_A_5_5,
  iso_A_5_6,
  iso_A_5_7,
  iso_A_5_8,
  iso_A_5_9,
  iso_A_5_10,
  iso_A_5_11,
  iso_A_5_12,
  iso_A_5_13,
  iso_A_5_14,
  iso_A_5_15,
  iso_A_5_16,
  iso_A_5_17,
  iso_A_5_18,
  iso_A_5_19,
  iso_A_5_20,
  iso_A_5_21,
  iso_A_5_22,
  iso_A_5_23,
  iso_A_5_24,
  iso_A_5_25,
  iso_A_5_26,
  iso_A_5_27,
  iso_A_5_28,
  iso_A_5_29,
  iso_A_5_30,
  iso_A_5_31,
  iso_A_5_32,
  iso_A_5_33,
  iso_A_5_34,
  iso_A_5_35,
  iso_A_5_36,
  iso_A_5_37,
  iso_A_6_1,
  iso_A_6_2,
  iso_A_6_3,
  iso_A_6_4,
  iso_A_6_5,
  iso_A_6_6,
  iso_A_6_7,
  iso_A_6_8,
  iso_A_7_1,
  iso_A_7_2,
  iso_A_7_3,
  iso_A_7_4,
  iso_A_7_5,
  iso_A_7_6,
  iso_A_7_7,
  iso_A_7_8,
  iso_A_7_9,
  iso_A_7_10,
  iso_A_7_11,
  iso_A_7_12,
  iso_A_7_13,
  iso_A_7_14,
  iso_A_8_1,
  iso_A_8_2,
  iso_A_8_3,
  iso_A_8_4,
  iso_A_8_5,
  iso_A_8_6,
  iso_A_8_7,
  iso_A_8_8,
  iso_A_8_9,
  iso_A_8_10,
  iso_A_8_11,
  iso_A_8_12,
  iso_A_8_13,
  iso_A_8_14,
  iso_A_8_15,
  iso_A_8_16,
  iso_A_8_17,
  iso_A_8_18,
  iso_A_8_19,
  iso_A_8_20,
  iso_A_8_21,
  iso_A_8_22,
  iso_A_8_23,
  iso_A_8_24,
  iso_A_8_25,
  iso_A_8_26,
  iso_A_8_27,
  iso_A_8_28,
  iso_A_8_29,
  iso_A_8_30,
  iso_A_8_31,
  iso_A_8_32,
  iso_A_8_33,
  iso_A_8_34,
  // CIS Controls v8 (framework slug = 'cis-controls', 18 controls — phase 4)
  cis_CIS_01,
  cis_CIS_02,
  cis_CIS_03,
  cis_CIS_04,
  cis_CIS_05,
  cis_CIS_06,
  cis_CIS_07,
  cis_CIS_08,
  cis_CIS_09,
  cis_CIS_10,
  cis_CIS_11,
  cis_CIS_12,
  cis_CIS_13,
  cis_CIS_14,
  cis_CIS_15,
  cis_CIS_16,
  cis_CIS_17,
  cis_CIS_18,
  // NIST CSF 2.0 (framework slug = 'nist-csf', 15 subcategories — phase 4)
  nist_GV_1,
  nist_GV_2,
  nist_GV_3,
  nist_ID_1,
  nist_ID_2,
  nist_ID_3,
  nist_PR_1,
  nist_PR_2,
  nist_PR_3,
  nist_DE_1,
  nist_DE_2,
  nist_RS_1,
  nist_RS_2,
  nist_RC_1,
  nist_RC_2,
  // GDPR Audit Workflow (framework slug = 'gdpr', 10 controls — phase 4)
  gdpr_GOV_1,
  gdpr_GOV_2,
  gdpr_DATA_1,
  gdpr_DATA_2,
  gdpr_RIGHTS_1,
  gdpr_RIGHTS_2,
  gdpr_BREACH_1,
  gdpr_BREACH_2,
  gdpr_VEND_1,
  gdpr_VEND_2,
  // HIPAA Security Rule (framework slug = 'hipaa', 10 safeguards — phase 4)
  hipaa_ADM_1,
  hipaa_ADM_2,
  hipaa_ADM_3,
  hipaa_ADM_4,
  hipaa_PHY_1,
  hipaa_PHY_2,
  hipaa_TECH_1,
  hipaa_TECH_2,
  hipaa_TECH_3,
  hipaa_TECH_4,
  // PCI DSS 4.0 (framework slug = 'pci-dss', 11 controls — phase 4)
  pci_PCI_1,
  pci_PCI_2,
  pci_PCI_3,
  pci_PCI_4,
  pci_PCI_5,
  pci_PCI_6,
  pci_PCI_7,
  pci_PCI_8,
  pci_PCI_10,
  pci_PCI_11,
  pci_PCI_12,
  // NDIS Practice Standards (framework slug = 'ndis', Phase 2 — 25 controls).
  // 11 real-predicate (auto/semi_auto), 14 manual-attestation.
  // See docs/compliance/ndis-framework-status.md.
  ndis_1_1,
  ndis_1_2,
  ndis_1_3,
  ndis_1_4,
  ndis_1_5,
  ndis_2_1,
  ndis_2_2,
  ndis_2_3,
  ndis_2_4,
  ndis_2_5,
  ndis_2_6,
  ndis_2_7,
  ndis_2_8,
  ndis_3_1,
  ndis_3_2,
  ndis_3_3,
  ndis_3_4,
  ndis_3_5,
  ndis_4_1,
  ndis_4_2,
  ndis_V_1,
  ndis_V_2,
  ndis_M_1,
  ndis_M_2,
  ndis_W_1,
  // Australian Financial Services pack (framework slug = 'financial-services-au',
  // 20 controls). 7 DB-signal, 13 manual attestation.
  fsau_AFS_001,
  fsau_AFS_002,
  fsau_AFS_003,
  fsau_AFS_004,
  fsau_AFS_005,
  fsau_AFS_006,
  fsau_AFS_007,
  fsau_AFS_008,
  fsau_CPS_001,
  fsau_CPS_002,
  fsau_CPS_003,
  fsau_CPS_004,
  fsau_CPS_005,
  fsau_AML_001,
  fsau_AML_002,
  fsau_AML_003,
  fsau_AML_004,
  fsau_AML_005,
  fsau_AFCA_001,
  fsau_AFCA_002,
];

let registered = false;

export function registerAllEvaluators(): void {
  if (registered) return;
  for (const meta of ALL_EVALUATORS) {
    registerEvaluator(meta);
  }
  registered = true;
}

export function resetRegistrationState(): void {
  registered = false;
}

export const REGISTERED_EVALUATOR_KEYS = ALL_EVALUATORS.map(
  (m) => `${m.framework}/${m.controlCode}`,
);
