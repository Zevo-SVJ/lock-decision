import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Handing a decision to someone else.
 *
 * The decision is a real object here — a small sealed chip — and it makes the
 * trip once, when the section arrives. Yours is shut; theirs opens as it lands.
 * No avatars, no arrows: the thing that moves is the decision itself, which is
 * what actually travels in the product.
 */
export function Handoff() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const play = inView && !(mounted && reduced === true);

  return (
    <div ref={ref} className="handoff" data-play={play || undefined} aria-hidden="true">
      <div className="handoff-end">
        <LockGlyph progress={1} size={22} />
        <span className="handoff-who">You</span>
      </div>

      <div className="handoff-span">
        <span className="handoff-rail" />
        <span className="handoff-chip">
          <span className="handoff-chip-mark" />
          Take the flat
        </span>
      </div>

      <div className="handoff-end handoff-end--them">
        <LockGlyph progress={0} size={22} />
        <span className="handoff-who">Them</span>
      </div>
    </div>
  );
}
