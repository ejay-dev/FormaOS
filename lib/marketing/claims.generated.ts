// GENERATED FILE — do not edit by hand.
// Run `npm run claims:rehash` after changing framework packs, the pack
// registry, or evaluator coverage. CI enforces freshness via
// `npm run check:claims`.
//
// Every number here is derived from shipping code, so public copy that
// imports it cannot claim more (or less) than the product delivers.

export type FrameworkPackClaim = {
  /** Pack slug as installed (matches PACK_REGISTRY). */
  slug: string;
  /** Database framework code. */
  code: string;
  /** Human name exactly as the pack declares it. */
  name: string;
  /** Framework version/edition, when the pack declares one. */
  version: string | null;
  /** Controls defined in the pack file. */
  controlCount: number;
  /** Evaluators wired in lib/compliance/evaluators/<slug>. */
  evaluatorCount: number;
  /** Evaluators backed by a database signal. */
  automatedEvaluatorCount: number;
  /** Evaluators that require a human attestation. */
  manualAttestationCount: number;
};

export const FRAMEWORK_PACKS: readonly FrameworkPackClaim[] = [
  {
    "slug": "nist-csf",
    "code": "NIST_CSF",
    "name": "NIST Cybersecurity Framework",
    "version": "2.0",
    "controlCount": 15,
    "evaluatorCount": 15,
    "automatedEvaluatorCount": 6,
    "manualAttestationCount": 9
  },
  {
    "slug": "cis-controls",
    "code": "CIS_CONTROLS",
    "name": "CIS Critical Security Controls",
    "version": "8",
    "controlCount": 18,
    "evaluatorCount": 18,
    "automatedEvaluatorCount": 7,
    "manualAttestationCount": 11
  },
  {
    "slug": "soc2",
    "code": "SOC2",
    "name": "SOC 2 Trust Services Criteria",
    "version": "2022",
    "controlCount": 11,
    "evaluatorCount": 9,
    "automatedEvaluatorCount": 9,
    "manualAttestationCount": 0
  },
  {
    "slug": "soc2-tsc",
    "code": "SOC2_TSC",
    "name": "SOC 2 Trust Services Criteria (TSC 2017, current as of 2022)",
    "version": "2017-rev-2022",
    "controlCount": 61,
    "evaluatorCount": 61,
    "automatedEvaluatorCount": 29,
    "manualAttestationCount": 32
  },
  {
    "slug": "iso27001-2022",
    "code": "ISO27001_2022",
    "name": "ISO/IEC 27001:2022 Annex A",
    "version": "2022",
    "controlCount": 93,
    "evaluatorCount": 93,
    "automatedEvaluatorCount": 30,
    "manualAttestationCount": 63
  },
  {
    "slug": "gdpr",
    "code": "GDPR",
    "name": "GDPR Audit Workflow",
    "version": "2024",
    "controlCount": 10,
    "evaluatorCount": 10,
    "automatedEvaluatorCount": 2,
    "manualAttestationCount": 8
  },
  {
    "slug": "hipaa",
    "code": "HIPAA",
    "name": "HIPAA Security Rule",
    "version": "2013",
    "controlCount": 10,
    "evaluatorCount": 10,
    "automatedEvaluatorCount": 3,
    "manualAttestationCount": 7
  },
  {
    "slug": "pci-dss",
    "code": "PCIDSS",
    "name": "PCI DSS",
    "version": "4.0",
    "controlCount": 11,
    "evaluatorCount": 11,
    "automatedEvaluatorCount": 5,
    "manualAttestationCount": 6
  },
  {
    "slug": "financial-services-au",
    "code": "FINANCIAL_SERVICES_AU",
    "name": "Australian Financial Services Compliance",
    "version": "2026",
    "controlCount": 20,
    "evaluatorCount": 20,
    "automatedEvaluatorCount": 7,
    "manualAttestationCount": 13
  },
  {
    "slug": "ndis",
    "code": "NDIS",
    "name": "NDIS Practice Standards (Core Module)",
    "version": "2024",
    "controlCount": 8,
    "evaluatorCount": 25,
    "automatedEvaluatorCount": 22,
    "manualAttestationCount": 3
  },
  {
    "slug": "mental-health-au",
    "code": "MENTAL_HEALTH_AU",
    "name": "National Standards for Mental Health Services",
    "version": "2010",
    "controlCount": 14,
    "evaluatorCount": 14,
    "automatedEvaluatorCount": 4,
    "manualAttestationCount": 10
  }
] as const;

/** Framework packs an organisation can install today. */
export const FRAMEWORK_PACK_COUNT = 11;

/** Controls defined across every installable pack. */
export const FRAMEWORK_CONTROL_COUNT = 271;

/** Control evaluators registered in code. */
export const EVALUATOR_COUNT = 286;

/** Evaluators that read a database signal rather than asking a human. */
export const AUTOMATED_EVALUATOR_COUNT = 124;

/** Evaluators that require a human attestation. */
export const MANUAL_ATTESTATION_COUNT = 162;
