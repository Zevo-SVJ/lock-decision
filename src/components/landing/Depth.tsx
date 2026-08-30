/**
 * Fast or deep.
 *
 * The differentiator that stops Lock reading as a twenty-question AI
 * interrogation: the same mechanism, two decisions, two lengths. Shown as
 * distance rather than described in a table.
 */

const QUICK = ["Name it", "Lock"];
const DEEP = [
  "Name it",
  "The thing underneath it",
  "What you would actually lose",
  "Still true tomorrow?",
  "Lock",
];

function Column({ label, steps, note }: { label: string; steps: string[]; note: string }) {
  return (
    <div className="depth-col">
      <p className="eyebrow">{label}</p>
      <ol className="depth-steps">
        {steps.map((s, i) => (
          <li key={s} className="depth-step" data-last={i === steps.length - 1 || undefined}>
            {s}
          </li>
        ))}
      </ol>
      <p className="depth-note">{note}</p>
    </div>
  );
}

export function Depth() {
  return (
    <div className="depth">
      <Column label="Already settled" steps={QUICK} note="About twenty seconds." />
      <Column label="Genuinely stuck" steps={DEEP} note="As long as it takes." />
    </div>
  );
}
