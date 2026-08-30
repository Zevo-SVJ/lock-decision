import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Lock someone else.
 *
 * Two states of one decision: yours, closed, and the same decision arriving
 * for someone else — open, waiting, with their own control under it. What
 * travels is the decision, not the conversation, and the second object makes
 * that literal by being a real Lock rather than a notification about one.
 *
 * There is no line drawn between them and no arrow. The two objects are the
 * same width and the same decision; the only difference is that one is shut
 * and one is not, which is the entire idea.
 */
export function Relay() {
  return (
    <div className="relay">
      <figure className="relay-side">
        <div className="surface surface--sealed">
          <p className="surface-line">Take the flat.</p>
          <p className="surface-sealed-row">
            <LockGlyph progress={1} size={16} className="is-check" />
            <span className="type-meta">Locked</span>
          </p>
        </div>
        <figcaption className="object-label">Yours</figcaption>
      </figure>

      <figure className="relay-side relay-side--open">
        <div className="surface">
          <p className="type-meta">Sam sent you a decision</p>
          <p className="surface-line">Take the flat.</p>
          <div className="relay-control" aria-hidden="true">
            <span className="relay-track" />
            <span className="relay-knob">
              <LockGlyph progress={0} size={17} />
            </span>
            <span className="relay-hint">slide to lock</span>
          </div>
        </div>
        <figcaption className="object-label">Theirs, still open</figcaption>
      </figure>
    </div>
  );
}
