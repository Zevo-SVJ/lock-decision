import { useEffect, useRef } from "react";

import { createSeal } from "@/lib/lock-seal";
import { drawShareCard } from "@/lib/share-card";

/**
 * What a locked decision leaves behind.
 *
 * Drawn by the product's own renderer at its real dimensions — the file that
 * actually comes out, not a picture of one.
 */
export function Result() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawShareCard(canvas, { decision: "Take the flat.", seal: createSeal() }, "square");
  }, []);

  return (
    <div className="result">
      <canvas
        ref={ref}
        className="result-image"
        role="img"
        aria-label="A locked decision card reading: take the flat"
      />
    </div>
  );
}
