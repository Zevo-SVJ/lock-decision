import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/*
 * Headlines considered:
 *
 *   "Decide it. Lock it."       — rhythmic, but "decide it" asks the reader to
 *                                 do the hard part before Lock has offered
 *                                 anything.
 *   "Finish the decision."      — an outcome the reader has to picture.
 *   "Stop carrying it."         — the feeling, not the product.
 *   "Make a decision. Lock it." — states the job and then the thing only this
 *                                 product does, in that order.
 *
 * The control sits directly under it, so the second sentence is an instruction
 * the visitor can follow immediately rather than a slogan.
 */

/**
 * The first screen.
 *
 * A headline, one sentence, one button, and the real control. No demo plays
 * here: the visitor can drive the actual gesture with their thumb, which is a
 * better demonstration than anything that could play at them, and it means the
 * first screen is beautiful before a single thing moves.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <h1 className="hero-title">
          Make a decision.
          <span className="hero-title-turn">Lock it.</span>
        </h1>

        <p className="hero-sub">
          Bring the thing you keep going round. Lock works out what it actually turns on, then hands
          you the one move that ends it.
        </p>

        <button type="button" onClick={onStart} className="btn btn--primary hero-cta">
          Try Lock
        </button>

        <div className="hero-gesture" data-locked={locked || undefined}>
          <SlideToLock onConfirm={() => setLocked(true)} />
          <p className="hero-hint" aria-hidden="true">
            Try it. Nothing happens until you reach the end.
          </p>
        </div>
      </div>
    </section>
  );
}
