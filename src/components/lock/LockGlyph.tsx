import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";

import { BODY, SHACKLE_PATH, glyphPose } from "@/lib/lock-glyph";

export type LockGlyphHandle = {
  /** Pose the glyph for a travel fraction. Safe to call every frame. */
  setProgress: (progress: number) => void;
};

type Props = {
  /** Initial / static pose, 0 = open, 1 = shut. */
  progress?: number;
  /** Intrinsic size. Inside the Lock control CSS scales it with the knob. */
  size?: number;
  className?: string;
};

/**
 * The Lock mark.
 *
 * Renders at whatever pose it is given. When a ref is attached the shackle can
 * be re-posed imperatively from an animation loop, which is how the slider
 * keeps the glyph exactly in step with the finger without re-rendering.
 */
export const LockGlyph = forwardRef<LockGlyphHandle, Props>(function LockGlyph(
  { progress = 0, size = 22, className },
  ref,
) {
  const shackleRef = useRef<SVGPathElement>(null);
  const initial = useMemo(() => glyphPose(progress), [progress]);

  useImperativeHandle(ref, () => ({
    setProgress(next: number) {
      const el = shackleRef.current;
      if (!el) return;
      const pose = glyphPose(next);
      el.setAttribute("transform", pose.transform);
      el.setAttribute("stroke-width", pose.strokeWidth.toFixed(2));
    },
  }));

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        ref={shackleRef}
        d={SHACKLE_PATH}
        transform={initial.transform}
        stroke="currentColor"
        strokeWidth={initial.strokeWidth}
        strokeLinecap="round"
      />
      <rect
        x={BODY.x}
        y={BODY.y}
        width={BODY.width}
        height={BODY.height}
        rx={BODY.radius}
        stroke="currentColor"
        strokeWidth="1.85"
      />
    </svg>
  );
});
