import { LockGlyph } from "@/components/lock/LockGlyph";
import { useReveal } from "@/hooks/use-reveal";

/**
 * A decision can be handed to someone else.
 *
 * Drawn as a relay rather than a referral: your lock closes, theirs is still
 * open, and the line between them is the link.
 */
export function Relay() {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="relay" data-shown={shown || undefined}>
      <div className="relay-node">
        <LockGlyph progress={1} size={26} />
        <span className="relay-name">You</span>
      </div>

      <span className="relay-line" aria-hidden="true">
        <span className="relay-pulse" />
      </span>

      <div className="relay-node relay-node--them">
        <LockGlyph progress={0} size={26} />
        <span className="relay-name">Them</span>
      </div>
    </div>
  );
}
