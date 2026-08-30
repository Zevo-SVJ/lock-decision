import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Depth, and the fact that there is always a bottom.
 *
 * Two decisions of very different weight drawn as two runs of the same track.
 * One takes two beats, one takes six — and both finish at the same closed lock,
 * lined up in the same column. That single alignment carries both arguments at
 * once: Lock fits the decision rather than a script, and unlike a conversation
 * it is built to end.
 */

const RUNS = [
  { decision: "Should I order this?", beats: 2, time: "20 seconds" },
  { decision: "Should I move?", beats: 6, time: "As long as it takes" },
];

export function Convergence() {
  return (
    <div className="runs">
      {RUNS.map(({ decision, beats, time }) => (
        <div key={decision} className="run">
          <p className="run-decision">{decision}</p>

          <div className="run-track" aria-hidden="true">
            <span className="run-line" />
            <span className="run-beats" data-beats={beats}>
              {Array.from({ length: beats }, (_, i) => (
                <span key={i} className="run-beat" />
              ))}
            </span>
            <span className="run-end">
              <LockGlyph progress={1} size={19} />
            </span>
          </div>

          <p className="run-time">{time}</p>
        </div>
      ))}
    </div>
  );
}
