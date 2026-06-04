/** Full editorial footer — link columns + colophon. */

const COLS = [
  ['Product', [['Platform', '/product'], ['Capabilities', '/features'], ['Pricing', '/pricing'], ['Integrations', '/integrations'], ['Changelog', '/changelog']]],
  ['Frameworks', [['All frameworks', '/frameworks'], ['SOC 2', '/soc2-compliance-automation'], ['ISO 27001', '/iso-compliance-software'], ['NDIS', '/ndis-providers'], ['HIPAA', '/healthcare-compliance']]],
  ['Industries', [['Healthcare', '/healthcare-compliance'], ['NDIS providers', '/ndis-providers'], ['Mental health', '/mental-health-compliance'], ['Financial', '/financial-services-compliance'], ['Government', '/use-cases/government-public-sector']]],
  ['Company', [['Our story', '/our-story'], ['Trust center', '/trust'], ['Security', '/security'], ['Contact', '/contact'], ['Status', '/status']]],
] as const;

export function SiteFooter() {
  return (
    <footer className="bru-footer">
      <div className="bru-frame">
        <div className="bru-footer-top">
          <div className="bru-footer-brand">
            <span className="bru-wordmark">FORMAOS</span>
            <p className="bru-body" style={{ marginTop: 18, maxWidth: '32ch' }}>
              The compliance operating system for regulated industries. Enforced workflows,
              immutable evidence, audit-ready every day.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <a href="/contact?type=compliance-plan" className="bru-btn bru-btn-red" style={{ padding: '0.7rem 1.1rem' }}>Get Compliance Plan <span className="bru-arrow">→</span></a>
            </div>
          </div>
          {COLS.map(([title, links]) => (
            <div className="bru-footer-col" key={title}>
              <h4>{title}</h4>
              {links.map(([label, href]) => (
                <a href={href} key={label}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="bru-footer-bottom">
          <span className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            © 2026 FORMAOS · COMPLIANCE OPERATING SYSTEM · ADELAIDE, SOUTH AUSTRALIA
          </span>
          <span style={{ display: 'flex', gap: 20 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Trust', '/trust']].map(([l, h]) => (
              <a key={l} href={h} className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-dim)', textDecoration: 'none', letterSpacing: '0.06em' }}>{l.toUpperCase()}</a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
