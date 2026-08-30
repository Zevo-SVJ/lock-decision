import { useEffect, useRef } from "react";

import { createSeal } from "@/lib/lock-seal";
import { drawShareCard } from "@/lib/share-card";

const EXAMPLE = {
  decision: "Leave the agency and go independent on 1 October.",
  synthesis:
    "You are not weighing two jobs. You are buying back the right to choose your own work, and you priced it months ago.",
};

/**
 * What a locked decision leaves behind.
 *
 * Rendered by the product's own card renderer at its real dimensions, not a
 * mockup of one — this is the file that comes out the other end. It is shown
 * as an example of the artefact, never as somebody's testimonial.
 */
export function Artifact() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, { ...EXAMPLE, seal: createSeal() }, "story");
  }, []);

  return (
    <div className="artifact">
      <canvas
        ref={canvasRef}
        className="artifact-card"
        role="img"
        aria-label="An example of a locked decision card"
      />
      <p className="artifact-note">
        Every lock leaves one of these. Yours to keep, or to put somewhere people will ask about it.
      </p>
    </div>
  );
}
