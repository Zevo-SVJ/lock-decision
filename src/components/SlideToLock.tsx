import { useCallback, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LockPhase = "idle" | "engaged" | "returning" | "locked";
/** How the thumb is currently being driven. */
type DriveMode = "free" | "drag" | "key";

type Props = {
  /** Hint rendered on the track before the gesture completes. */
  label?: string;
  /** Hint rendered once the gesture completes. */
  confirmedLabel?: string;
  /** Fired once, after the lock moment has played out. */
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
};

const TRACK_H = 76; // px — comfortable one-thumb target
const THUMB = 64; // px
const INSET = 6; // px — thumb inset inside the track

/** Travel fraction at which the gesture commits. Effectively "the far end". */
const COMMIT_AT = 0.985;
/** Where the final zone begins to pull the thumb in. */
const MAGNET_FROM = 0.86;
const MAGNET_STRENGTH = 0.22;

const SPRINGS: Record<DriveMode, { k: number; damping: number }> = {
  // Stiff enough to sit under the finger, soft enough to carry mass.
  drag: { k: 1500, damping: 0.92 },
  // Keyboard travel: crisp, deliberate, no overshoot.
  key: { k: 620, damping: 1 },
  // Released short of the end: falls back rather than snapping.
  free: { k: 210, damping: 0.86 },
};

const KEY_STEP = 0.08;
const KEY_PAGE = 0.25;

/**
 * The Lock control.
 *
 * A pointer-driven physical gesture, not a slider widget: the thumb is a mass
 * on a spring pulled toward the finger, so it stretches under acceleration,
 * can be held anywhere, reversed, and abandoned. Nothing commits until the
 * thumb actually reaches the far end of the track.
 *
 * Continuous values (position, travel, velocity) are written straight to the
 * DOM as custom properties inside a rAF loop; React state only tracks the four
 * discrete phases, so a drag never re-renders the tree.
 */
export function SlideToLock({
  label = "slide to lock",
  confirmedLabel = "locked",
  onConfirm,
  disabled = false,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const maxRef = useRef(1);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const targetRef = useRef(0);
  const modeRef = useRef<DriveMode>("free");
  const committedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const pointerStartRef = useRef(0);
  const grabOffsetRef = useRef(0);
  const hapticMarkRef = useRef(0);
  const onConfirmRef = useRef(onConfirm);

  const [phase, setPhase] = useState<LockPhase>("idle");
  const [travel, setTravel] = useState(0); // coarse — drives aria + caption only

  onConfirmRef.current = onConfirm;

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    maxRef.current = Math.max(1, el.clientWidth - THUMB - INSET * 2);
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  /** Light, short haptics — a tick, never a buzz. Silently ignored elsewhere. */
  const haptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* vibration is a nicety, never a requirement */
    }
  }, []);

  /** Push continuous state to the DOM. Called from the animation loop only. */
  const paint = useCallback((pos: number, stretch: number) => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    if (!root || !thumb) return;

    const p = Math.min(1, Math.max(0, pos / maxRef.current));
    root.style.setProperty("--p", p.toFixed(4));
    root.style.setProperty("--x", `${pos.toFixed(2)}px`);

    const sx = 1 + stretch;
    const sy = 1 - stretch * 0.62;
    thumb.style.transform = `translate3d(${pos.toFixed(2)}px, 0, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    thumb.style.transformOrigin = stretch >= 0 ? "left center" : "right center";

    // The ambient ground charges with the gesture — the only global feedback.
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--charge", p.toFixed(3));
    }
  }, []);

  const commit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    modeRef.current = "free";
    posRef.current = maxRef.current;
    velRef.current = 0;
    targetRef.current = maxRef.current;
    paint(maxRef.current, 0);
    setTravel(1);
    setPhase("locked");
    haptic([12, 46, 26]);
    window.setTimeout(() => onConfirmRef.current(), 620);
  }, [haptic, paint]);

  /** Semi-implicit spring integration; runs only while something is moving. */
  const tick = useCallback(
    (ts: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (ts - lastTsRef.current) / 1000));
      lastTsRef.current = ts;

      const mode = modeRef.current;
      const { k, damping } = SPRINGS[mode];
      const c = 2 * Math.sqrt(k) * damping;

      const delta = targetRef.current - posRef.current;
      velRef.current += (k * delta - c * velRef.current) * dt;
      posRef.current += velRef.current * dt;

      if (posRef.current < 0) {
        posRef.current = 0;
        velRef.current = 0;
      } else if (posRef.current > maxRef.current) {
        posRef.current = maxRef.current;
        velRef.current = 0;
      }

      // Deformation comes from the gap between finger and mass, so the thumb
      // stretches when yanked and relaxes the instant it catches up.
      const stretch =
        mode === "drag" && !prefersReducedMotion()
          ? Math.max(-0.07, Math.min(0.11, delta / 240))
          : 0;
      paint(posRef.current, stretch);

      if (!committedRef.current && posRef.current / maxRef.current >= COMMIT_AT) {
        commit();
        return;
      }

      // A held finger keeps the loop alive; anything else stops once at rest.
      const atRest = Math.abs(delta) < 0.35 && Math.abs(velRef.current) < 12;
      if (mode !== "drag" && atRest) {
        posRef.current = targetRef.current;
        velRef.current = 0;
        paint(posRef.current, 0);
        rafRef.current = null;
        modeRef.current = "free";
        const settledTravel = posRef.current / maxRef.current;
        setTravel(settledTravel);
        if (!committedRef.current) setPhase(settledTravel > 0.01 ? "engaged" : "idle");
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [commit, paint],
  );

  const run = useCallback(() => {
    if (rafRef.current !== null) return;
    lastTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (typeof document !== "undefined") {
        document.documentElement.style.removeProperty("--charge");
      }
    };
  }, []);

  /** Map a raw travel fraction through the final-zone magnet. */
  const applyMagnet = useCallback((raw: number) => {
    if (raw <= MAGNET_FROM) return raw;
    const t = (raw - MAGNET_FROM) / (1 - MAGNET_FROM);
    return raw + (1 - raw) * MAGNET_STRENGTH * t;
  }, []);

  /** Two ticks on the way up: the control waking, and the final zone opening. */
  const markHaptics = useCallback(
    (fraction: number) => {
      for (const m of [0.34, 0.72]) {
        if (fraction >= m && hapticMarkRef.current < m) haptic(6);
      }
      hapticMarkRef.current = fraction;
    },
    [haptic],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || committedRef.current) return;
    measure();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    pointerStartRef.current = e.clientX;
    grabOffsetRef.current = posRef.current;
    modeRef.current = "drag";
    hapticMarkRef.current = posRef.current / maxRef.current;
    setPhase("engaged");
    haptic(4);
    run();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modeRef.current !== "drag" || committedRef.current) return;
    e.preventDefault();
    const dx = e.clientX - pointerStartRef.current;
    const raw = Math.min(1, Math.max(0, (grabOffsetRef.current + dx) / maxRef.current));
    const pulled = applyMagnet(raw);
    targetRef.current = pulled * maxRef.current;
    markHaptics(pulled);
    run();
  };

  /**
   * Released short of the end: the thumb falls back, nothing is committed.
   *
   * If the finger did reach the end, the gesture stands even when the thumb is
   * still a few pixels behind it — the commitment is where the hand went, not
   * where the spring happened to be on the frame the finger lifted.
   */
  const releaseGesture = () => {
    if (committedRef.current || modeRef.current !== "drag") return;
    if (targetRef.current / maxRef.current >= COMMIT_AT) {
      modeRef.current = "key"; // let it seat itself; tick commits on arrival
      run();
      return;
    }
    modeRef.current = "free";
    targetRef.current = 0;
    hapticMarkRef.current = 0;
    setPhase("returning");
    run();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || committedRef.current) return;
    const current = targetRef.current / maxRef.current;
    let next: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + KEY_STEP;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - KEY_STEP;
    else if (e.key === "PageUp") next = current + KEY_PAGE;
    else if (e.key === "PageDown") next = current - KEY_PAGE;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    if (next === null) return;

    e.preventDefault();
    const clamped = Math.min(1, Math.max(0, next));
    if (clamped >= COMMIT_AT) {
      posRef.current = maxRef.current;
      commit();
      return;
    }
    modeRef.current = "key";
    targetRef.current = clamped * maxRef.current;
    markHaptics(clamped);
    setTravel(clamped);
    setPhase(clamped > 0.01 ? "engaged" : "idle");
    run();
  };

  /** Keyboard travel is a hold, so leaving the control releases it. */
  const onBlur = () => {
    if (committedRef.current || modeRef.current === "drag") return;
    if (targetRef.current === 0) return;
    modeRef.current = "free";
    targetRef.current = 0;
    hapticMarkRef.current = 0;
    setPhase("returning");
    run();
  };

  const engaged = phase === "engaged";
  const locked = phase === "locked";

  return (
    <div
      ref={rootRef}
      className={cn("lock-control", locked && "is-locked", engaged && "is-engaged", className)}
      style={{ "--p": 0, "--x": "0px" } as React.CSSProperties}
      data-disabled={disabled || undefined}
    >
      <div
        ref={trackRef}
        className="lock-track"
        style={{ height: TRACK_H, borderRadius: TRACK_H / 2 }}
      >
        <div className="lock-track-fill" aria-hidden="true" />
        <div className="lock-track-zone" aria-hidden="true" />

        <div className="lock-track-label" aria-hidden="true">
          <span className={cn("lock-label-hint", locked && "is-out")}>
            <span className={engaged ? undefined : "hint-sheen"}>{label}</span>
          </span>
          <span className={cn("lock-label-done", locked && "is-in")}>{confirmedLabel}</span>
        </div>

        <div
          ref={thumbRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(travel * 100)}
          aria-valuetext={
            locked
              ? "Locked"
              : `${Math.round(travel * 100)} percent. Hold and drag to the end, or use the arrow keys.`
          }
          aria-disabled={disabled || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={releaseGesture}
          onPointerCancel={releaseGesture}
          onLostPointerCapture={releaseGesture}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className="lock-thumb"
          style={{ width: THUMB, height: THUMB, left: INSET }}
        >
          <span className="lock-thumb-spec" aria-hidden="true" />
          <span className="lock-thumb-glyph" aria-hidden="true">
            <ShackleGlyph locked={locked} />
          </span>
        </div>
      </div>

      <p className="lock-control-caption" aria-live="polite">
        {locked ? "Committed" : "Hold and drag to the end"}
      </p>
    </div>
  );
}

/**
 * The Lock mark. The shackle sits open while the gesture is unresolved and
 * seats itself at commitment — the state change is in the geometry, not a
 * color swap.
 */
function ShackleGlyph({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        className="lock-shackle"
        d={locked ? "M8 10V7.5a4 4 0 0 1 8 0V10" : "M8 10V7a4 4 0 0 1 8 0v1.4"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <rect
        x="4.75"
        y="10"
        width="14.5"
        height="9.5"
        rx="3.1"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  );
}
