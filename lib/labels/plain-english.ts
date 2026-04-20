/**
 * Plain-English label translations
 *
 * Flat lookup map that turns regulator jargon into everyday language.
 * Intentionally a starter set — expand coverage as needed.
 */
export const PLAIN_ENGLISH: Record<string, string> = {
  // NQF Quality Areas (childcare)
  'NQF Area 1': 'Educational Program & Practice',
  'NQF Area 2': "Children's Health & Safety",
  'NQF Area 3': 'Physical Environment',
  'NQF Area 4': 'Staffing Arrangements',
  'NQF Area 5': 'Relationships with Children',
  'NQF Area 6': 'Collaborative Partnerships',
  'NQF Area 7': 'Governance & Leadership',
  'NQF Quality Areas': 'Quality Areas (7 Standards)',

  // NSQHS (healthcare)
  NSQHS: 'National Safety & Quality Health Standards',
  'NSQHS Standards': 'National Safety & Quality Standards',

  // SIRS (aged care / NDIS)
  SIRS: 'Serious Incident Reports',
  'SIRS Notifications': 'Serious Incident Reports',

  // Financial services
  'CPS 234': 'Data Security Standard',
  s912D: 'Breach Reporting',
  's912D Corporations Act 2001': 'Breach Reporting (Corporations Act)',

  // Practitioner & staff
  AHPRA: 'Practitioner Registration',
  WWCC: 'Working With Children Check',
  WWC: 'Working With Children Check',
  CPD: 'Continuing Professional Development',

  // Common acronyms
  RLS: 'Row-Level Security',
  ABN: 'Australian Business Number',
  ACN: 'Australian Company Number',
  AML: 'Anti-Money Laundering',
};
