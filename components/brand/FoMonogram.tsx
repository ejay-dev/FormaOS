// FormaOS "FO" monogram — F + a slashed O (∅). The diagonal slash echoes the
// brand's signature "sharp" cut (the slash through the M in the wordmark), so
// the mark reads as deliberate and sharp rather than a dead F + plain ring.
// Square viewBox, inherits color via fill="currentColor".
interface MarkProps {
  className?: string;
  title?: string;
}

export function FoMonogram({ className = "", title = "FormaOS" }: MarkProps) {
  return (
    <svg
      viewBox="82.96 -2.19 299 299"
      fill="currentColor"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <polygon points="115.99,156.33 186.28,156.33 186.28,145.32 115.99,145.32 115.99,97.06 199.66,97.06 199.66,86.05 115.99,86.05 113.12,86.05 102.95,86.05 102.95,212.05 115.99,212.05" />
      <g transform="translate(-55 0)">
        <path d="M346.62,82.57c-38.79,0-70.35,29.68-70.35,66.15s31.56,66.15,70.35,66.15c38.79,0,70.35-29.68,70.35-66.15S385.41,82.57,346.62,82.57z M346.62,203.23c-32.37,0-58.7-24.45-58.7-54.51c0-30.05,26.33-54.51,58.7-54.51s58.7,24.45,58.7,54.51C405.32,178.78,378.99,203.23,346.62,203.23z" />
        {/* signature slash — sharp diagonal through the O (∅) */}
        <rect x="270.62" y="142.5" width="152" height="12" rx="1.5" transform="rotate(-32 346.62 148.5)" />
      </g>
    </svg>
  );
}
