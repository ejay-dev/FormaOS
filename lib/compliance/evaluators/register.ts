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

// Audit compliance-004 (2026-05-22) — phase 1 of SOC2-TSC rollout.
// 10 sample evaluators wired under the `soc2-tsc` framework slug.
// Coverage breakdown:
//   - 9 DB-backed (CC3.2, CC5.3, CC6.8, CC7.5, CC8.1, CC9.1, CC9.2,
//     A1.2, C1.2)
//   - 1 manual attestation (CC2.1 — no automated signal possible)
// Subsequent phases extend SOC2-TSC to its full 61-control set, then
// onboard ISO27001-2022 / CIS / NIST CSF / GDPR / HIPAA / PCI-DSS.
import { meta as soc2tsc_CC2_1 } from './soc2-tsc/CC2.1';
import { meta as soc2tsc_CC3_2 } from './soc2-tsc/CC3.2';
import { meta as soc2tsc_CC5_3 } from './soc2-tsc/CC5.3';
import { meta as soc2tsc_CC6_8 } from './soc2-tsc/CC6.8';
import { meta as soc2tsc_CC7_5 } from './soc2-tsc/CC7.5';
import { meta as soc2tsc_CC8_1 } from './soc2-tsc/CC8.1';
import { meta as soc2tsc_CC9_1 } from './soc2-tsc/CC9.1';
import { meta as soc2tsc_CC9_2 } from './soc2-tsc/CC9.2';
import { meta as soc2tsc_A1_2 } from './soc2-tsc/A1.2';
import { meta as soc2tsc_C1_2 } from './soc2-tsc/C1.2';

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
  // SOC2-TSC pack (framework slug = 'soc2-tsc', 10 controls — phase 1)
  soc2tsc_CC2_1,
  soc2tsc_CC3_2,
  soc2tsc_CC5_3,
  soc2tsc_CC6_8,
  soc2tsc_CC7_5,
  soc2tsc_CC8_1,
  soc2tsc_CC9_1,
  soc2tsc_CC9_2,
  soc2tsc_A1_2,
  soc2tsc_C1_2,
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
