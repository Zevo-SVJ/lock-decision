import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";
import { createSeal, formatSealTime, type LockSeal } from "@/lib/lock-seal";

/**
 * The product, in the first viewport.
 *
 * A decision is already on the board and the real control is under it, so the
 * visitor sees what Lock is before they read a word about it. Nothing to set
 * up, nothing to type, no instructions — the label on the track is the only
 * direction anyone needs.
 */
export function HeroLock({ onLocked }: { onLocked: () => void }) {
  const [seal, setSeal] = useState<LockSeal | null>(null);

  return (
    <div className="hero-lock" data-locked={seal ? true : undefined}>
      <div className="hero-card">
        <p className="type-meta hero-card-label">Your decision</p>
        <p className="hero-card-decision">Leave the job. Start on my own in October.</p>

        {seal ? (
          <div className="hero-card-sealed">
            <span className="type-meta">Locked</span>
            <span className="type-mono hero-card-id">{seal.id}</span>
            <span className="type-mono hero-card-time">{formatSealTime(seal.at)}</span>
          </div>
        ) : (
          <SlideToLock
            label="slide to lock"
            onConfirm={() => {
              setSeal(createSeal());
              onLocked();
            }}
          />
        )}
      </div>
    </div>
  );
}
