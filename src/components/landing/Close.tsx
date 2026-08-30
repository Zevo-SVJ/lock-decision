import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/**
 * The last screen, which is the first screen again.
 *
 * The page opens on the gesture and closes on it. Nothing new is introduced
 * and nothing is argued — finishing it opens the product, which by this point
 * is the only thing left to do.
 */
export function Close({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="close">
      <div className="wrap close-inner">
        <h2 className="close-title">One decision, and you are done for the day.</h2>

        <div className="close-gesture" data-locked={locked || undefined}>
          <SlideToLock
            label="slide to begin"
            confirmedLabel="open"
            onConfirm={() => {
              setLocked(true);
              window.setTimeout(onStart, 220);
            }}
          />
        </div>

        <button type="button" onClick={onStart} className="close-plain">
          or just open Lock
        </button>
      </div>
    </section>
  );
}
