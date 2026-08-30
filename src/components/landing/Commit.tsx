import { useEffect, useRef, useState } from "react";

import { RESOLVED } from "@/components/landing/Narrowing";
import { SlideToLock } from "@/components/SlideToLock";
import { createSeal, type LockSeal } from "@/lib/lock-seal";
import { drawShareCard } from "@/lib/share-card";

const SYNTHESIS =
  "You were not weighing five things. You were waiting for permission to want the work more than the comfort.";

/**
 * What comes out the other side: the product's own card renderer, at its real
 * dimensions. Not a mockup of the output — the output.
 */
function Result({ seal }: { seal: LockSeal }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawShareCard(canvas, { decision: RESOLVED, synthesis: SYNTHESIS, seal }, "square");
  }, [seal]);

  return (
    <div className="result">
      <canvas
        ref={canvasRef}
        className="result-card"
        role="img"
        aria-label={`A locked decision: ${RESOLVED}`}
      />
      <p className="result-note">
        Every lock leaves one of these — the decision, why it held, and the moment you made it.
      </p>
    </div>
  );
}

/**
 * The signature moment.
 *
 * The page has been getting quieter section by section and this is the bottom
 * of it: no card, no border, no second idea. The decision on screen is the one
 * the scene just resolved to, so the reader locks the thing they watched
 * narrow rather than something new.
 */
export function Commit() {
  const [seal, setSeal] = useState<LockSeal | null>(null);

  return (
    <section className="commit" data-locked={seal ? true : undefined}>
      <p className="commit-lead">When there is nothing left to think about.</p>
      <p className="commit-decision">{RESOLVED}</p>

      {seal ? <Result seal={seal} /> : <SlideToLock onConfirm={() => setSeal(createSeal())} />}
    </section>
  );
}
