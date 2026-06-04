/**
 * Bloomberg-style kinetic ticker. Two strips scrolling opposite directions;
 * the top runs live framework posture, the bottom runs the operating creed.
 * Pure CSS animation (robust, no JS), pauses on reduced-motion via CSS.
 */

// Real framework packs shipping today (from FrameworkTrustStrip).
const POSTURE = [
  'NDIS PRACTICE STANDARDS',
  'AGED CARE QUALITY STANDARDS',
  'NSQHS STANDARDS',
  'AHPRA',
  'ASIC s912A',
  'APRA CPS 230',
  'AUSTRAC AML/CTF',
  'ISO 27001',
  'SOC 2',
  'HIPAA',
  'GDPR',
  'NIST CSF',
  'ESSENTIAL EIGHT',
];

const CREED = [
  'NAMED OWNERS',
  'IMMUTABLE EVIDENCE',
  'CONTINUOUS POSTURE',
  'AU-HOSTED BY DEFAULT',
  'BLOCKED FAILURE PATHS',
  'NO SPREADSHEETS',
];

export function Ticker() {
  return (
    <div className="bru-ticker" aria-hidden>
      <div className="bru-ticker-row">
        <div className="bru-ticker-track">
          {[0, 1].map((dup) => (
            <div className="bru-ticker-group" key={dup}>
              {POSTURE.map((f) => (
                <span className="bru-ticker-item" key={`${dup}-${f}`}>
                  <span className="bru-ticker-dot" />
                  {f}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="bru-ticker-row bru-ticker-row--alt">
        <div className="bru-ticker-track bru-ticker-track--rev">
          {[0, 1].map((dup) => (
            <div className="bru-ticker-group" key={dup}>
              {CREED.map((c) => (
                <span className="bru-ticker-item bru-ticker-item--creed" key={`${dup}-${c}`}>
                  {c}
                  <span className="bru-ticker-slash">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
