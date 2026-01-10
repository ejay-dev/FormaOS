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
      className={`mk-anchor ${compact ? "mk-anchor--compact" : ""}`}
      style={{ "--mk-accent": accent } as CSSProperties}
    >
      <div className="mk-anchor__panel">
        <div className="mk-anchor__badge">{badge}</div>
        <div className="mk-anchor__title">{title}</div>
        <div className="mk-anchor__subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
