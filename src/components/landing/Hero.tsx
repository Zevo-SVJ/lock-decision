import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/*
 * Headlines considered:
 *
 *   "Finish the decision."   — the promise, but it describes an outcome the
 *                              reader has to imagine rather than a thing to do.
 *   "Close the decision."    — quieter, and a shade too ambiguous on its own.
 *   "Make the call."         — an idiom, not a product.
 *   "Decide it. Lock it."    — two beats, the second of which is the product's
 *                              name, its verb and its interaction at once.
 *
 * The control sitting directly underneath turns the headline into an
 * instruction, which is why this one wins.
 */

/**
 * The first screen.
 *
 * A headline, a sentence, a button, and the gesture the whole product ends on.
 * Nothing else belongs here — no example decision, no card, no preview. The
 * negative space is doing work: it is what makes the one object on screen read
 * as an object.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="hero">
      <h1 className="hero-title">
        Decide it.
        <span className="hero-title-line">Lock it.</span>
      </h1>

      <p className="hero-sub">
        Lock turns the thing you keep going round into a decision you can close.
      </p>

      <button type="button" onClick={onStart} className="btn btn--primary hero-cta">
        Try Lock
      </button>

      <div className="hero-gesture" data-locked={locked || undefined}>
        <SlideToLock onConfirm={() => setLocked(true)} />
      </div>

      <p className="hero-foot">Free while it is being built. No account.</p>
    </section>
  );
}
