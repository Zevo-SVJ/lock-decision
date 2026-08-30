import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The Convergence.
 *
 * The one sequence the page is built around. A decision starts as everything
 * you have been carrying about it at once — nine fragments, scattered, drifting
 * and slightly out of focus. Scrolling is not a trigger here; it is the control.
 * The fragments align, the ones that never mattered fall away, the rest collapse
 * into a single line, and the Lock appears under it. Scroll back and it comes
 * apart again, exactly as far as you went.
 *
 * Driven entirely by a named view timeline, so the browser scrubs it off the
 * main thread and reversal is free. Where the timeline is unsupported the
 * resolved end state stands on its own.
 */

/** The things actually in someone's head, and which of them survive. */
const FRAGMENTS = [
  { text: "the money", x: -38, y: -30, r: -7 },
  { text: "what they will think", x: 34, y: -38, r: 6 },
  { text: "the lease runs to June", x: -30, y: 6, r: 4 },
  { text: "you said this last year", x: 40, y: 12, r: -5 },
  { text: "your father's advice", x: -42, y: 34, r: 8 },
  { text: "it is not a good time", x: 26, y: 40, r: -6 },
  { text: "the pay cut", x: 4, y: -46, r: 3 },
  { text: "nobody is stopping you", x: -8, y: 48, r: -4 },
];

export function Convergence() {
  return (
    <section className="sequence" aria-labelledby="sequence-heading">
      <div className="sequence-stage">
        <p className="sequence-caption sequence-caption--noise" aria-hidden="true">
          Everything you are carrying about it
        </p>

        <div className="sequence-field">
          {FRAGMENTS.map((f, i) => (
            <span
              key={f.text}
              className="fragment"
              aria-hidden="true"
              style={
                {
                  "--fx": `${f.x}cqw`,
                  "--fy": `${f.y}cqh`,
                  "--fr": `${f.r}deg`,
                  "--fi": i,
                } as React.CSSProperties
              }
            >
              {f.text}
            </span>
          ))}

          <p id="sequence-heading" className="fragment-signal">
            You are deciding whether to leave.
          </p>
        </div>

        <div className="sequence-lock" aria-hidden="true">
          <LockGlyph progress={1} size={22} />
          <span className="sequence-lock-label">Lock it</span>
        </div>

        <p className="sequence-caption sequence-caption--signal" aria-hidden="true">
          One decision, and the reason it holds
        </p>
      </div>

      {/* Screen readers get the argument without the choreography. */}
      <p className="sr-only">
        Lock takes everything you are carrying about a decision, sets aside what does not decide it,
        and leaves you with the one thing that does.
      </p>
    </section>
  );
}
