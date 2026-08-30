import { useEffect, useRef } from "react";

import { createSeal } from "@/lib/lock-seal";
import { drawShareCard } from "@/lib/share-card";

/**
 * What a locked decision looks like afterwards.
 *
 * Rendered by the product's own renderer at its real dimensions — this is the
 * file that comes out, not a picture of one.
 */
export function Card() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      drawShareCard(canvas, { decision: "Yes. I start in March.", seal: createSeal() }, "square");
    }
  }, []);

  return (
    <div className="artifact">
      <canvas
        ref={ref}
        className="artifact-card"
        role="img"
        aria-label="A locked decision: yes, I start in March"
      />
    </div>
  );
}
