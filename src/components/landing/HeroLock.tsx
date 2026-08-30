import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";
import { formatSealTime, createSeal, type LockSeal } from "@/lib/lock-seal";

/**
 * The first thing a visitor does is lock something.
 *
 * Not a demo of the product — the product's actual control, holding a decision
 * every visitor already has. Nothing to set up, nothing to type, no pretend
 * conversation. They arrive, they commit, and the mechanism explains itself.
 */
export function HeroLock({ onLocked }: { onLocked: () => void }) {
  const [seal, setSeal] = useState<LockSeal | null>(null);

  return (
    <div className="hero-lock" data-locked={seal ? true : undefined}>
      <div className="hero-subject">
        <p className="type-meta">The decision</p>
        <p className="hero-statement">The thing you have been putting off.</p>
      </div>

      {seal ? (
        <div className="hero-sealed">
          <div className="hero-sealed-row">
            <span className="type-meta">Locked</span>
            <span className="type-mono text-[0.6875rem] text-fg-3">{seal.id}</span>
          </div>
          <p className="hero-sealed-time type-mono">{formatSealTime(seal.at)}</p>
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
  );
}
