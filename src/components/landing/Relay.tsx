import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Handing a decision to someone else.
 *
 * Drawn as a relay rather than a referral: your lock is shut, theirs is still
 * open, and the line between them is the link. What they answer never comes
 * back to you, which is the point of it.
 */
export function Relay() {
  return (
    <div className="relay" aria-hidden="true">
      <div className="relay-node">
        <LockGlyph progress={1} size={24} />
        <span className="relay-name">You</span>
      </div>

      <span className="relay-line">
        <span className="relay-pulse" />
      </span>

      <div className="relay-node">
        <LockGlyph progress={0} size={24} />
        <span className="relay-name">Them</span>
      </div>
    </div>
  );
}
