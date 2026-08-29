/**
 * Journey progress, stated as quietly as possible: an arc that fills.
 * No counts, no steps, no percentages.
 */
export function ProgressArc({ value, size = 20 }: { value: number; size?: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  const r = 8;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label="Journey progress"
    >
      <circle cx="10" cy="10" r={r} stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.4" />
      <circle
        cx="10"
        cy="10"
        r={r}
        stroke="currentColor"
        strokeOpacity="0.9"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        transform="rotate(-90 10 10)"
        style={{ transition: "stroke-dashoffset 520ms cubic-bezier(0.32,0.72,0,1)" }}
      />
    </svg>
  );
}
