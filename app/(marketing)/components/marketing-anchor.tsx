import type { CSSProperties } from "react";

type MarketingAnchorProps = {
  title: string;
  subtitle: string;
  badge?: string;
  accent?: string;
  compact?: boolean;
};

export function MarketingAnchor({
  title,
  subtitle,
  badge = "Command center",
  accent = "56 189 248",
  compact = false,
}: MarketingAnchorProps) {
  return (
    <div
      className={`mk-anchor mk-parallax-fast ${compact ? "mk-anchor--compact" : ""}`}
      style={{ "--mk-accent": accent } as CSSProperties}
    >
      <div className="mk-anchor__halo" />
      <div className="mk-anchor__plane mk-anchor__plane--back" />
      <div className="mk-anchor__plane mk-anchor__plane--mid" />
      <div className="mk-anchor__panel mk-anchor__panel--front">
        <div className="mk-anchor__badge">{badge}</div>
        <div className="mk-anchor__title">{title}</div>
        <div className="mk-anchor__subtitle">{subtitle}</div>
      </div>
      <div className="mk-anchor__panel mk-anchor__panel--float">
        <div className="mk-anchor__chip">Live controls</div>
        <div className="mk-anchor__chip">Audit snapshot</div>
      </div>
      <div className="mk-anchor__panel mk-anchor__panel--float mk-anchor__panel--float2">
        <div className="mk-anchor__chip">Evidence chain</div>
      </div>
    </div>
  );
}
