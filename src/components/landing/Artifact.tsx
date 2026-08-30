import { useEffect, useRef } from "react";

import { createSeal } from "@/lib/lock-seal";
import { drawShareCard } from "@/lib/share-card";

const EXAMPLE = {
  decision: "No. Not this year.",
  synthesis:
    "You were never deciding about a car. You were deciding whether to keep waiting on other people to be somewhere.",
};

/**
 * What a locked decision leaves behind.
 *
 * Drawn by the product's own renderer at its real dimensions — this is the
 * file that comes out the other end, not a picture of one. It is shown as the
 * artefact, never as somebody's testimonial.
 */
export function Artifact() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawShareCard(canvas, { ...EXAMPLE, seal: createSeal() }, "square");
  }, []);

  return (
    <div className="artifact">
      <canvas
        ref={ref}
        className="artifact-card"
        role="img"
        aria-label="A locked decision card: no, not this year"
      />
    </div>
  );
}
