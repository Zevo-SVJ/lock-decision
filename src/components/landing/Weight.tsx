import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * How far Lock goes.
 *
 * The same control at two lengths. A decision that is nearly made is a short
 * travel; one that is not is a long one. Nothing else about it changes — same
 * gesture, same ending — which is the whole point, and is why this is drawn
 * with the product's own object rather than a chart of two columns.
 */

const RUNS = [
  { label: "Nearly made already", span: "short" },
  { label: "Genuinely open", span: "long" },
];

export function Weight() {
  return (
    <div className="weights">
      {RUNS.map(({ label, span }) => (
        <div key={span} className="weight" data-span={span}>
          <div className="weight-capsule" aria-hidden="true">
            <span className="weight-knob">
              <LockGlyph progress={1} size={18} />
            </span>
          </div>
          <p className="weight-label">{label}</p>
        </div>
      ))}
    </div>
  );
}
