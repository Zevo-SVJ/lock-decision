import { useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";

/**
 * The last screen, which is the first screen again.
 *
 * The page opens on the gesture and closes on it. Nothing new is introduced
 * here and nothing is argued — finishing it opens the product, which is the
 * only thing left to do.
 */
export function Close({ onStart }: { onStart: () => void }) {
  const [locked, setLocked] = useState(false);

  return (
    <section className="close">
      <h2 className="close-title">Nothing left to think about.</h2>
      <p className="close-sub">Bring one decision. Leave without it.</p>

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
    </section>
  );
}
