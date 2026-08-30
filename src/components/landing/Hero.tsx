import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";
import { createSeal, formatSealTime, type LockSeal } from "@/lib/lock-seal";

/**
 * The first screen.
 *
 * The claim is one sentence and the proof is directly under it: a real
 * decision, what Lock made of it, and the actual control — live, not a
 * screenshot. A visitor can lock something before they have read anything,
 * which is the fastest way to understand what this is.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const [seal, setSeal] = useState<LockSeal | null>(null);

  return (
    <section className="hero">
      <h1 className="hero-title">Make the decision you keep putting off.</h1>

      <p className="hero-sub">
        Say what you are stuck on. Lock finds the real decision under it — then you lock it in.
      </p>

      <div className="hero-actions">
        <button type="button" onClick={onStart} className="btn btn--primary">
          Try Lock
        </button>
        <span className="hero-terms">Free while it is in beta. No account.</span>
      </div>

      {/* The product, at the size it actually is. */}
      <div className="card hero-card" data-locked={seal ? true : undefined}>
        <p className="eyebrow">{seal ? "Locked" : "Your decision"}</p>
        <p className="card-decision">Should I move to Paris?</p>

        <div className="card-read">
          <p className="eyebrow">What it comes down to</p>
          <p className="card-read-line">
            You are not choosing a city. You are deciding whether to stop waiting for the right
            moment to arrive.
          </p>
        </div>

        {seal ? (
          <div className="card-seal">
            <span className="type-mono card-seal-id">{seal.id}</span>
            <span className="type-mono card-seal-time">{formatSealTime(seal.at)}</span>
          </div>
        ) : (
          <SlideToLock label="slide to lock" onConfirm={() => setSeal(createSeal())} />
        )}
      </div>

      <p className="hero-after" data-shown={seal ? true : undefined} aria-live="polite">
        That last move is the product. Everything before it exists to get you to it.
      </p>
    </section>
  );
}
