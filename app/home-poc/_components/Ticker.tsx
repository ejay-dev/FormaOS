/**
 * Bloomberg-style kinetic ticker. Two strips scrolling opposite directions;
 * the top runs live framework posture, the bottom runs the operating creed.
 * Pure CSS animation (robust, no JS), pauses on reduced-motion via CSS.
 */

const POSTURE = [
  ['ISO 27001', '100%'],
  ['SOC 2 TYPE II', '97%'],
  ['NDIS PRACTICE', '96%'],
  ['HIPAA', '94%'],
  ['GDPR', '95%'],
  ['PCI-DSS', '92%'],
  ['CPS 234', '98%'],
  ['ESSENTIAL 8', '93%'],
];

const CREED = [
  'NAMED OWNERS',
  'IMMUTABLE EVIDENCE',
  'CONTINUOUS POSTURE',
  'AU-HOSTED BY DEFAULT',
  'AUDIT-READY, ALWAYS',
  'NO SPREADSHEETS',
];

export function Ticker() {
  return (
    <div className="bru-ticker" aria-hidden>
      <div className="bru-ticker-row">
        <div className="bru-ticker-track">
          {[0, 1].map((dup) => (
            <div className="bru-ticker-group" key={dup}>
              {POSTURE.map(([f, v]) => (
                <span className="bru-ticker-item" key={`${dup}-${f}`}>
                  <span className="bru-ticker-dot" />
                  {f}
                  <em className="bru-ticker-val">{v}</em>
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
