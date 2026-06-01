/**
 * MHS-4 — Diversity responsiveness (NSMHS 2010 Standard 4).
 *
 * Manual attestation: cultural-safety training, interpreter access and
 * equity-of-access analysis are not modelled as structured rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-4',
  'Diversity-responsive practice covering Aboriginal and Torres Strait Islander peoples and CALD communities, interpreter-access arrangements, cultural-safety training records, and equity-of-access/outcome review — manual attestation.',
);

export { evaluate, meta };
