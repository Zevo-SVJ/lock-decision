import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Handing a decision to someone else.
 *
 * Your lock is shut and theirs is not; the decision itself travels the line
 * between them. Drawn as a hand-off rather than an invitation, because that is
 * what it is — the whole thing rides inside the link, and what they answer
 * never comes back to you.
 */
export function Handoff() {
  return (
    <div className="handoff" aria-hidden="true">
      <div className="handoff-end">
        <LockGlyph progress={1} size={22} />
        <span className="handoff-name">You</span>
      </div>

      <div className="handoff-wire">
        <span className="handoff-note">Should we take it?</span>
        <span className="handoff-rail">
          <span className="handoff-pulse" />
        </span>
      </div>

      <div className="handoff-end">
        <LockGlyph progress={0} size={22} />
        <span className="handoff-name">Them</span>
      </div>
    </div>
  );
}
