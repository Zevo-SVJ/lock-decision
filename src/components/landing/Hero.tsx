import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/*
 * Headlines considered, and why this one:
 *
 *   "Make the decision you keep putting off."  — true, but it describes the
 *                                                reader's failure, not Lock.
 *   "Where decisions end."                     — atmosphere without a promise.
 *   "Decide, and be done with it."             — right idea, four words too many.
 *   "You already know. Lock it."               — assumes what it has to earn.
 *   "Finish the decision."                     — the promise, in three words.
 *
 * The problem Lock solves is not deciding. It is finishing — the decision that
 * stays open for weeks after you already know. So: finish.
 */

/**
 * The first screen.
 *
 * A claim, a sentence, a button, and the gesture the whole product ends on —
 * nothing else. No example decision, no card, no interface to inspect: the
 * visitor should meet Lock's identity before they meet its mechanics.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="hero">
      <h1 className="hero-title">Finish the decision.</h1>

      <p className="hero-sub">
        Lock works out what you are actually deciding, then gives you one deliberate way to close
        it.
      </p>

      <button type="button" onClick={onStart} className="btn btn--primary hero-cta">
        Try Lock
      </button>

      {/* The gesture, at the size it really is. This is the whole product. */}
      <div className="hero-gesture" data-locked={locked || undefined}>
        <SlideToLock onConfirm={() => setLocked(true)} />
        <p className="hero-caption" aria-live="polite">
          <span className="hero-caption-line" data-out={locked || undefined}>
            Every decision ends here.
          </span>
          <span className="hero-caption-line hero-caption-line--in" data-in={locked || undefined}>
            That is the whole product.
          </span>
        </p>
      </div>

      <p className="hero-terms">Free while it is being built. No account.</p>
    </section>
  );
}
