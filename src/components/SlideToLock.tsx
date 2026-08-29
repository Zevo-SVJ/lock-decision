import { useCallback, useEffect, useRef, useState } from "react";

import { LockGlyph, type LockGlyphHandle } from "@/components/lock/LockGlyph";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ControlPhase = "idle" | "engaged" | "returning" | "sealing";
/** How the knob is currently being driven. */
type DriveMode = "free" | "drag" | "key";

type Props = {
  /** Hint rendered on the track before the gesture completes. */
  label?: string;
  /** Hint rendered once the gesture completes. */
  confirmedLabel?: string;
  /** Fired once, after the seal choreography has played out. */
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
};

const TRACK_H = 56; // px — compact, still a comfortable thumb target
const KNOB = 46; // px
const INSET = 5; // px — knob inset inside the track

/** Travel fraction at which the gesture commits. Effectively "the far end". */
const COMMIT_AT = 0.985;
/** Where the final zone begins to draw the knob in. */
const MAGNET_FROM = 0.86;
const MAGNET_STRENGTH = 0.22;

/**
 * Total seal choreography: the shackle snaps, the control settles (320ms), one
 * pass of light crosses the glass (60-360ms), then the state resolves.
 */
const SEAL_MS = 380;

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
 * A pointer-driven physical gesture, not a slider widget: the knob is a mass
 * on a spring pulled toward the finger, so it stretches under acceleration,
 * can be held anywhere, reversed, and abandoned. The shackle of the glyph
 * inside it closes in exact step with travel and re-opens on the way back.
 * Nothing commits until the knob reaches the far end of the track.
 *
 * Continuous values (position, travel, glyph pose) are written straight to the
 * DOM inside a rAF loop; React state only tracks the four discrete phases, so
 * a drag never re-renders the tree.
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
  const knobRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<LockGlyphHandle>(null);

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
  const sealTimerRef = useRef<number | null>(null);
  const onConfirmRef = useRef(onConfirm);

  const [phase, setPhase] = useState<ControlPhase>("idle");
  const [travel, setTravel] = useState(0); // coarse — drives aria + caption only

  onConfirmRef.current = onConfirm;

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    maxRef.current = Math.max(1, el.clientWidth - KNOB - INSET * 2);
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

  /** Short, dry haptics — a tick, never a buzz. Silently ignored elsewhere. */
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
    const knob = knobRef.current;
    if (!root || !knob) return;

    const p = Math.min(1, Math.max(0, pos / maxRef.current));
    root.style.setProperty("--p", p.toFixed(4));
    root.style.setProperty("--x", `${pos.toFixed(2)}px`);

    // The knob gains a touch of presence as the final zone approaches.
    const swell = 1 + Math.max(0, (p - 0.72) / 0.28) * 0.02;
    const sx = (1 + stretch) * swell;
    const sy = (1 - stretch * 0.62) * swell;
    knob.style.transform = `translate3d(${pos.toFixed(2)}px, 0, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    knob.style.transformOrigin = stretch >= 0 ? "left center" : "right center";

    // The shackle tracks the finger exactly, in both directions.
    glyphRef.current?.setProgress(p);

    // The ambient ground charges with the gesture — the only global feedback.
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--charge", p.toFixed(3));
    }
  }, []);

  /** While a hand is on the control, the rest of the interface stands down. */
  const setGesture = useCallback((held: boolean) => {
    if (typeof document === "undefined") return;
    if (held) document.documentElement.dataset["gesture"] = "lock";
    else delete document.documentElement.dataset["gesture"];
  }, []);

  /**
   * The seal: the shackle snaps shut, the control stabilises, one pass of
   * light crosses the glass, then the state resolves. Kept under half a second.
   */
  const commit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    modeRef.current = "free";
    posRef.current = maxRef.current;
    velRef.current = 0;
    targetRef.current = maxRef.current;
    paint(maxRef.current, 0);
    setTravel(1);
    setPhase("sealing");
    setGesture(false);
    haptic([11, 38, 22]);
    sealTimerRef.current = window.setTimeout(() => onConfirmRef.current(), SEAL_MS);
  }, [haptic, paint, setGesture]);

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

      // Deformation comes from the gap between finger and mass, so the knob
      // stretches when yanked and relaxes the instant it catches up.
      const stretch =
        mode === "drag" && !prefersReducedMotion()
          ? Math.max(-0.06, Math.min(0.09, delta / 260))
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
      if (sealTimerRef.current !== null) window.clearTimeout(sealTimerRef.current);
      if (typeof document !== "undefined") {
        document.documentElement.style.removeProperty("--charge");
        delete document.documentElement.dataset["gesture"];
      }
    };
  }, []);

  /** Map a raw travel fraction through the final-zone magnet. */
  const applyMagnet = useCallback((raw: number) => {
    if (raw <= MAGNET_FROM) return raw;
    const t = (raw - MAGNET_FROM) / (1 - MAGNET_FROM);
    return raw + (1 - raw) * MAGNET_STRENGTH * t;
  }, []);

  /** Rising tension: the control wakes, then the final zone opens. */
  const markHaptics = useCallback(
    (fraction: number) => {
      for (const m of [0.36, 0.74, 0.92]) {
        if (fraction >= m && hapticMarkRef.current < m) haptic(m > 0.9 ? 8 : 5);
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
    setGesture(true);
    haptic(3);
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
   * Released short of the end: the knob falls back, nothing is committed.
   *
   * If the finger did reach the end, the gesture stands even when the knob is
   * still a few pixels behind it — the commitment is where the hand went, not
   * where the spring happened to be on the frame the finger lifted.
   */
  const releaseGesture = () => {
    if (committedRef.current || modeRef.current !== "drag") return;
    setGesture(false);
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
  const sealing = phase === "sealing";

  return (
    <div
      ref={rootRef}
      className={cn("lock-control", sealing && "is-sealed", engaged && "is-engaged", className)}
      style={{ "--p": 0, "--x": "0px" } as React.CSSProperties}
      data-disabled={disabled || undefined}
    >
      <div
        ref={trackRef}
        className="lock-track"
        style={{ height: TRACK_H, borderRadius: TRACK_H / 2 }}
      >
        <div className="lock-track-travelled" aria-hidden="true" />
        {/* The lit edge of the material brightens wherever the knob is. */}
        <div className="lock-track-edge" aria-hidden="true" />
        <div className="lock-track-terminus" aria-hidden="true" />
        {/* One clipped band of light: idle drift, and a single pass on sealing. */}
        <div className="lock-track-sheen" aria-hidden="true" />

        <div className="lock-track-label" aria-hidden="true">
          <span className={cn("lock-label", "lock-label-open", sealing && "is-out")}>{label}</span>
          <span className={cn("lock-label", "lock-label-shut", sealing && "is-in")}>
            {confirmedLabel}
          </span>
        </div>

        <div
          ref={knobRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(travel * 100)}
          aria-valuetext={
            sealing
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
          className="lock-knob"
          style={{ width: KNOB, height: KNOB, left: INSET }}
        >
          <span className="lock-knob-spec" aria-hidden="true" />
          <LockGlyph ref={glyphRef} size={20} className="lock-knob-glyph" />
        </div>
      </div>

      <p className="lock-control-caption" aria-live="polite">
        {sealing ? "Sealed" : "Hold and drag"}
      </p>
    </div>
  );
}
