import { Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  label?: string;
  confirmedLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
};

const THUMB = 68; // px
const PADDING = 6; // px inset of thumb inside the track
const THRESHOLD = 0.985;

/**
 * iOS "slide to power off"-style confirmation.
 * Real pointer-driven drag: the thumb tracks the finger continuously,
 * can be held or reversed anywhere, and only confirms at the far end.
 */
export function SlideToLock({
  label = "slide to lock",
  confirmedLabel = "locked",
  onConfirm,
  disabled = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const maxRef = useRef(1);
  const confirmedRef = useRef(false);

  const [offset, setOffset] = useState(0); // px travelled by thumb
  const [max, setMax] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const m = Math.max(1, el.clientWidth - THUMB - PADDING * 2);
    maxRef.current = m;
    setMax(m);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const progress = Math.min(1, offset / max);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmedRef.current) return;
    measure();
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    startOffsetRef.current = offset;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || confirmedRef.current) return;
    e.preventDefault();
    const next = Math.min(
      maxRef.current,
      Math.max(0, startOffsetRef.current + (e.clientX - startXRef.current)),
    );
    setOffset(next);

    if (next / maxRef.current >= THRESHOLD) {
      confirmedRef.current = true;
      setDragging(false);
      setOffset(maxRef.current);
      setConfirmed(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(18);
      }
      window.setTimeout(onConfirm, 620);
    }
  };

  const handlePointerEnd = () => {
    if (confirmedRef.current) return;
    setDragging(false);
    setOffset(0); // springs back with CSS transition
  };

  return (
    <div className="w-full select-none">
      <div
        ref={trackRef}
        className="relative h-20 w-full touch-none overflow-hidden rounded-full border border-white/8 bg-track"
        style={{ boxShadow: "var(--shadow-track)" }}
      >
        {/* filled portion follows the thumb */}
        <div
          className="absolute inset-y-0 left-0 bg-track-fill"
          style={{
            width: `${offset + THUMB / 2 + PADDING}px`,
            transition: dragging ? "none" : "width 340ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {/* instruction text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {confirmed ? (
            <span className="text-[15px] font-medium tracking-[0.28em] text-primary uppercase">
              {confirmedLabel}
            </span>
          ) : (
            <span
              className="lock-shimmer text-[15px] font-medium tracking-[0.28em] uppercase"
              style={{ opacity: 1 - progress * 0.75 }}
            >
              {label}
            </span>
          )}
        </div>

        {/* thumb */}
        <div
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="absolute top-1/2 flex items-center justify-center rounded-full bg-thumb text-thumb-foreground"
          style={{
            width: THUMB,
            height: THUMB,
            left: PADDING,
            transform: `translate(${offset}px, -50%) scale(${dragging ? 1.03 : 1})`,
            transition: dragging
              ? "transform 60ms linear"
              : "transform 380ms cubic-bezier(0.22,1,0.36,1)",
            boxShadow: "var(--shadow-thumb)",
            touchAction: "none",
            cursor: disabled ? "default" : "grab",
          }}
        >
          {confirmed && (
            <span className="lock-pulse absolute inset-0 rounded-full bg-primary/70" />
          )}
          <Lock
            className="relative"
            size={24}
            strokeWidth={2.2}
            style={{ opacity: confirmed ? 1 : 0.85 }}
          />
        </div>
      </div>
      <p className="mt-4 text-center text-xs tracking-wide text-muted-foreground">
        {confirmed ? "Commitment locked" : "Drag all the way to commit"}
      </p>
    </div>
  );
}
