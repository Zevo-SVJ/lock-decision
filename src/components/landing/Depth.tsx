import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * How far Lock goes.
 *
 * Two decisions, written out as the beats they actually take, side by side.
 * One is two lines long and one is five, and both finish on the same sealed
 * chip — so the difference in length is the argument and the shared ending is
 * the reassurance. No bars, no timings, nothing to read twice.
 */

const QUICK = ["Should I send it tonight?", "You already wrote it three times."];

const DEEP = [
  "Should I leave the company?",
  "It is not the work. It is who you report to.",
  "What you would lose: the team. What you would get: the decision back.",
  "Still true if nothing changes by March?",
];

function Run({ label, beats, note }: { label: string; beats: string[]; note: string }) {
  return (
    <div className="run">
      <p className="type-meta run-label">{label}</p>

      <ol className="run-beats">
        {beats.map((b, i) => (
          <li key={b} className="run-beat" data-first={i === 0 || undefined}>
            {b}
          </li>
        ))}
      </ol>

      <div className="run-outcome">
        <span className="run-sealed">
          <LockGlyph progress={1} size={15} className="is-check" />
          <span>Locked</span>
        </span>
        <span className="run-note">{note}</span>
      </div>
    </div>
  );
}

export function Depth() {
  return (
    <div className="runs">
      <Run label="One you have already made" beats={QUICK} note="Seconds." />
      <Run label="One you have not" beats={DEEP} note="As long as it needs." />
    </div>
  );
}
