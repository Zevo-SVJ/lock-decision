import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/**
 * The last thing on the page is the first thing they saw.
 *
 * No new argument and no new surface — the gesture comes back on an empty
 * ground, and finishing it opens the product. Whatever else a visitor
 * remembers, it should be this movement.
 */
export function Final({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="final">
      <p className="final-line">
        Stop carrying it.
        <span className="final-line-dim"> Close it.</span>
      </p>

      <div className="final-gesture" data-locked={locked || undefined}>
        <SlideToLock
          label="slide to begin"
          confirmedLabel="open"
          onConfirm={() => {
            setLocked(true);
            window.setTimeout(onStart, 260);
          }}
        />
      </div>

      <button type="button" onClick={onStart} className="final-plain">
        or just open Lock
      </button>
    </section>
  );
}
