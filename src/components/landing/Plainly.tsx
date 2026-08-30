/**
 * What Lock does, drawn once.
 *
 * Many faint lines arriving, one solid line leaving, a lock at the end of it.
 * The same picture carries the two things this page has to establish: what
 * Lock is for, and that unlike a conversation it takes complexity *out*. It
 * does not move, because it is a statement, not an event.
 */

const LINES = 9;

export function Converge() {
  return (
    <svg
      className="converge"
      viewBox="0 0 320 120"
      role="img"
      aria-label="Many uncertain threads narrowing into one decision, ending in a lock"
    >
      {Array.from({ length: LINES }, (_, i) => {
        const spread = (i - (LINES - 1) / 2) / ((LINES - 1) / 2); // -1 … 1
        const y = 60 + spread * 46;
        // Every thread bends into the same point, so the eye is taken there.
        return (
          <path
            key={i}
            className="converge-thread"
            d={`M0 ${y.toFixed(1)} C 96 ${y.toFixed(1)}, 128 60, 196 60`}
            style={{ "--i": i, "--n": LINES } as React.CSSProperties}
          />
        );
      })}

      <path className="converge-out" d="M196 60 H292" />
      <circle className="converge-end" cx="298" cy="60" r="4.5" />
    </svg>
  );
}
