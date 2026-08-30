import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Three stages, drawn as three states of the same object.
 *
 * The mark on the left of each stage is the thing being decided, and it is the
 * only thing that changes: scattered, then single, then shut. Read down the
 * column it is one object being resolved rather than three illustrations of
 * three ideas.
 */

const STAGES = [
  {
    name: "Bring it in",
    body: "Say the thing you keep going round. One sentence is enough — Lock does not need a briefing.",
  },
  {
    name: "Find the hinge",
    body: "Most decisions turn on one or two things, and they are rarely the ones being argued about. Lock works out which.",
  },
  {
    name: "Close it",
    body: "Not a summary, not a recommendation. One deliberate movement you have to complete yourself.",
  },
];

/** Stage one: unresolved — several marks, none of them the answer. */
function Scattered() {
  return (
    <span className="stage-mark" aria-hidden="true">
      <span className="stage-tick" style={{ "--o": -7 } as React.CSSProperties} />
      <span className="stage-tick" style={{ "--o": 0 } as React.CSSProperties} />
      <span className="stage-tick" style={{ "--o": 7 } as React.CSSProperties} />
    </span>
  );
}

/** Stage two: the same marks, resolved to one. */
function Single() {
  return (
    <span className="stage-mark" aria-hidden="true">
      <span className="stage-tick is-lit" style={{ "--o": 0 } as React.CSSProperties} />
    </span>
  );
}

/** Stage three: the same line, shut. */
function Shut() {
  return (
    <span className="stage-mark stage-mark--lock" aria-hidden="true">
      <LockGlyph progress={1} size={20} />
    </span>
  );
}

const MARKS = [<Scattered key="a" />, <Single key="b" />, <Shut key="c" />];

export function Stages() {
  return (
    <ol className="stages">
      {STAGES.map(({ name, body }, i) => (
        <li key={name} className="stage">
          {MARKS[i]}
          <div className="stage-text">
            <h3 className="stage-name">{name}</h3>
            <p className="stage-body">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
