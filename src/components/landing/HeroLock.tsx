import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";
import { createSeal, formatSealTime, type LockSeal } from "@/lib/lock-seal";

const SUBJECT = "The thing you have been putting off.";

/**
 * The first thing a visitor does is resolve something.
 *
 * The decision arrives unsettled — the same line, three times, slightly out of
 * register, the way an undecided thought actually sits. Dragging the control
 * pulls the copies into one. The gesture is not decoration on top of the idea;
 * it performs it. Uncertainty becomes clarity under their thumb, and only then
 * does it lock.
 *
 * Progress comes from `--charge`, which the control already publishes while it
 * is held, so nothing about the product component changes here.
 */
export function HeroLock({ onLocked }: { onLocked: () => void }) {
  const [seal, setSeal] = useState<LockSeal | null>(null);

  return (
    <div className="hero-lock" data-locked={seal ? true : undefined}>
      <p className="type-meta hero-eyebrow">The decision</p>

      <div className="resolve">
        {/* Decorative echoes: the same thought, not yet settled. */}
        <span className="resolve-echo resolve-echo--a" aria-hidden="true">
          {SUBJECT}
        </span>
        <span className="resolve-echo resolve-echo--b" aria-hidden="true">
          {SUBJECT}
        </span>
        <p className="resolve-line">{SUBJECT}</p>
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
