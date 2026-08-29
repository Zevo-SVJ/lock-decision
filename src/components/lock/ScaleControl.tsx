import { useCallback, useRef, useState } from "react";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Anchors shown at each end, e.g. ["not at all", "completely"]. */
  ends?: [string, string];
  disabled?: boolean;
};

/**
 * A compact continuous control for degree questions.
 *
 * Unlike the Lock control this is a value selector, not a commitment: touching
 * the rail sets a value directly, because there is nothing here to guard
 * against — the answer is only sent when the user continues.
 */
export function ScaleControl({
  value,
  onChange,
  min = 1,
  max = 10,
  ends,
  disabled = false,
}: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const fromClientX = useCallback(
    (clientX: number) => {
      const el = railRef.current;
      if (!el) return min;
      const rect = el.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
      return Math.round(min + t * (max - min));
    },
    [max, min],
  );

  const set = useCallback(
    (clientX: number) => {
      const next = fromClientX(clientX);
      if (next !== value) {
        onChange(next);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate?.(3);
          } catch {
            /* optional */
          }
        }
      }
    },
    [fromClientX, onChange, value],
  );

  const shown = value ?? Math.round((min + max) / 2);
  const fraction = (shown - min) / (max - min);

  return (
    <div className="scale" data-answered={value !== null || undefined}>
      <div className="scale-readout" aria-hidden="true">
        <span className="scale-value">{value === null ? "—" : value}</span>
        <span className="scale-of">/ {max}</span>
      </div>

      <div
        ref={railRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Choose a level"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? "Not set" : `${value} of ${max}`}
        className="scale-rail"
        style={{ "--f": fraction } as React.CSSProperties}
        data-dragging={dragging || undefined}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.focus({ preventScroll: true });
          setDragging(true);
          set(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          e.preventDefault();
          set(e.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (disabled) return;
          const base = value ?? Math.round((min + max) / 2);
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(max, base + 1));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(min, base - 1));
          } else if (e.key === "Home") {
            e.preventDefault();
            onChange(min);
          } else if (e.key === "End") {
            e.preventDefault();
            onChange(max);
          }
        }}
      >
        <span className="scale-fill" aria-hidden="true" />
        <span className="scale-knob" aria-hidden="true" />
      </div>

      {ends && (
        <div className="scale-ends" aria-hidden="true">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
    </div>
  );
}
