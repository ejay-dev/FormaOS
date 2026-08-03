/**
 * Canonical public claims.
 *
 * Every number a visitor can check must come from here. The raw counts are
 * generated from shipping code (see scripts/build-marketing-claims.mjs), so
 * copy cannot drift from the product the way it did before: the same site
 * simultaneously advertised "7+", "8" and "9" framework packs, "61" and "64"
 * SOC 2 controls on a single page, and a "252 total controls" line above a
 * table whose own rows summed to 634.
 *
 * Two distinct ideas were also being conflated, which is why the numbers
 * looked irreconcilable even when each was individually defensible:
 *
 *   - a framework PACK is something an org installs and gets scored against
 *   - a REGULATOR/standard may be referenced inside policy and register
 *     templates without a scored pack existing for it
 *
 * They are exported separately below and must never be summed together.
 */
import {
  AUTOMATED_EVALUATOR_COUNT,
  EVALUATOR_COUNT,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  FRAMEWORK_PACKS,
  MANUAL_ATTESTATION_COUNT,
  type FrameworkPackClaim,
} from './claims.generated';

export {
  AUTOMATED_EVALUATOR_COUNT,
  EVALUATOR_COUNT,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  FRAMEWORK_PACKS,
  MANUAL_ATTESTATION_COUNT,
};
export type { FrameworkPackClaim };

/**
 * Short display names for running copy. Pack files carry precise formal
 * titles ("SOC 2 Trust Services Criteria (TSC 2017, current as of 2022)")
 * which are correct in a control table but unreadable in a sentence.
 * Falls back to the formal name so a new pack never renders blank.
 */
const PACK_SHORT_NAMES: Record<string, string> = {
  'nist-csf': 'NIST CSF',
  'cis-controls': 'CIS Controls',
  soc2: 'SOC 2',
  'soc2-tsc': 'SOC 2 (TSC)',
  'iso27001-2022': 'ISO 27001:2022',
  gdpr: 'GDPR',
  hipaa: 'HIPAA',
  'pci-dss': 'PCI DSS',
  'financial-services-au': 'AU Financial Services',
  ndis: 'NDIS Practice Standards',
  'mental-health-au': 'National Mental Health Standards',
};

export function getPackShortName(slug: string): string {
  return (
    PACK_SHORT_NAMES[slug] ??
    FRAMEWORK_PACKS.find((pack) => pack.slug === slug)?.name ??
    slug
  );
}

/**
 * Which standard each pack implements. Two packs can implement one
 * standard: `soc2` and `soc2-tsc` are both SOC 2, the latter organised
 * explicitly by Trust Services Criteria. Counting installable packs as
 * "frameworks" would let a buyer reasonably accuse us of double-counting,
 * so the two ideas are exported separately and named for what they are.
 */
const PACK_FAMILIES: Record<string, string> = {
  soc2: 'SOC 2',
  'soc2-tsc': 'SOC 2',
};

function familyOf(slug: string): string {
  return PACK_FAMILIES[slug] ?? slug;
}

/**
 * Distinct standards covered, with pack variants of one standard counted
 * once. This is the number to use whenever the copy says "frameworks".
 */
export const DISTINCT_FRAMEWORK_COUNT = new Set(
  FRAMEWORK_PACKS.map((pack) => familyOf(pack.slug)),
).size;

/** Short pack names in registry order, for chip rows and inline lists. */
export const FRAMEWORK_PACK_NAMES: readonly string[] = FRAMEWORK_PACKS.map(
  (pack) => getPackShortName(pack.slug),
);

/**
 * One name per distinct standard, for chip rows that should read as a list
 * of frameworks rather than a list of installable artifacts.
 */
export const DISTINCT_FRAMEWORK_NAMES: readonly string[] = Array.from(
  new Map(
    FRAMEWORK_PACKS.map((pack) => [
      familyOf(pack.slug),
      PACK_FAMILIES[pack.slug] ?? getPackShortName(pack.slug),
    ]),
  ).values(),
);

/** Look up one pack's live numbers, e.g. for a SOC 2 or ISO 27001 page. */
export function getPackClaim(slug: string): FrameworkPackClaim | null {
  return FRAMEWORK_PACKS.find((pack) => pack.slug === slug) ?? null;
}

/**
 * Controls in a single pack, for pages that talk about one framework.
 * Returns null rather than 0 so a bad slug surfaces as missing copy in
 * review instead of silently rendering "0 controls".
 */
export function getPackControlCount(slug: string): number | null {
  return getPackClaim(slug)?.controlCount ?? null;
}

/**
 * Regulators and standards named inside FormaOS policy, register and
 * template content. These are NOT scored framework packs — several have no
 * pack at all — so they are described as "referenced in templates", never
 * counted alongside FRAMEWORK_PACK_COUNT.
 *
 * Keep this list to bodies whose material is genuinely reflected in shipped
 * templates. Adding a logo here without the content behind it is the exact
 * unverifiable-claim problem this module exists to prevent.
 */
export const REGULATORY_REFERENCES = [
  'NDIS Quality and Safeguards Commission',
  'Aged Care Quality and Safety Commission',
  'AHPRA',
  'ACECQA',
  'ASIC',
  'AUSTRAC',
  'OAIC',
] as const;

/**
 * Sentence-ready descriptions of what the platform actually verifies.
 * Prefer these over hand-written numbers in JSX so a single rehash keeps
 * every page truthful at once.
 */
export const CLAIM_PHRASES = {
  /** e.g. "11 framework packs" — installable artifacts */
  packs: `${FRAMEWORK_PACK_COUNT} framework packs`,
  /** e.g. "10 frameworks" — distinct standards, the safer headline number */
  frameworks: `${DISTINCT_FRAMEWORK_COUNT} frameworks`,
  /** e.g. "271 controls" */
  controls: `${FRAMEWORK_CONTROL_COUNT} controls`,
  /** e.g. "286 control evaluators" */
  evaluators: `${EVALUATOR_COUNT} control evaluators`,
  /** e.g. "124 automated checks" — the honest subset that reads a DB signal */
  automatedChecks: `${AUTOMATED_EVALUATOR_COUNT} automated checks`,
  /**
   * The full, non-misleading version of the coverage claim. Manual
   * attestations are stated openly because hiding them is what makes a
   * compliance vendor's numbers untrustworthy under scrutiny.
   */
  coverageSentence: `${FRAMEWORK_PACK_COUNT} framework packs covering ${FRAMEWORK_CONTROL_COUNT} controls, of which ${AUTOMATED_EVALUATOR_COUNT} are checked automatically against your data and ${MANUAL_ATTESTATION_COUNT} are tracked as attestations.`,
} as const;
