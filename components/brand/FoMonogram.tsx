// FormaOS "FO" monogram — tightened from the authentic wordmark geometry.
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
      </g>
    </svg>
  );
}
