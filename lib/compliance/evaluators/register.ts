import { registerEvaluator } from './index';
import { meta as soc2_CC6_1 } from './soc2/CC6.1';
import { meta as soc2_CC6_2 } from './soc2/CC6.2';
import { meta as soc2_CC6_3 } from './soc2/CC6.3';
import { meta as soc2_CC6_6 } from './soc2/CC6.6';
import { meta as soc2_CC6_7 } from './soc2/CC6.7';

const ALL_EVALUATORS = [
  soc2_CC6_1,
  soc2_CC6_2,
  soc2_CC6_3,
  soc2_CC6_6,
  soc2_CC6_7,
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
