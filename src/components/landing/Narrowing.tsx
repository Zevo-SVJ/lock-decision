import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * The one scroll-driven scene on the page.
 *
 * A real decision starts as everything at once and ends as one line. That is
 * the whole product, so it is the only thing here worth animating.
 *
 * Every value inside the scene comes from a single scroll progress. Nothing
 * has its own trigger, its own observer or its own timing, and the whole scene
 * runs backwards when you scroll up. The stage is a fixed box with
 * `overflow: hidden` and the factors sit in reserved slots, so the scene can
 * neither collide with itself nor spill into the section below it.
 */

type Factor = {
  label: string;
  /** Where it sits before the scene organises it. Hand-picked, not random. */
  drift: number;
  tilt: number;
  major: boolean;
};

const FACTORS: Factor[] = [
  { label: "The money", drift: -16, tilt: -1.5, major: false },
  { label: "The work itself", drift: 12, tilt: 1.1, major: true },
  { label: "Leaving my people", drift: -9, tilt: 1.7, major: true },
  { label: "My partner's job", drift: 18, tilt: -1.2, major: false },
  { label: "The winters", drift: -13, tilt: 0.8, major: false },
];

/*
 * The beats, as fractions of the scene. They live here rather than spread
 * through the file so the choreography reads in one place — and so each fade
 * out finishes before the next fade in starts, which is what stops two things
 * ever being legible in the same space.
 */
const SETTLED = 0.24; // the factors have stopped scattering
const WEIGHED = 0.46; // some begin to matter more than others
const THINNED = 0.62; // the rest recede
const DROPPED = 0.76; // what was never the point is gone
const DECIDED = 0.8; // one decision, on its own

/*
 * Every curve below is specified all the way to 1. Past its last stop a
 * multi-stop transform extrapolates rather than holding, which reads as the
 * scene starting again just as it should be finished — so no curve is allowed
 * to end early, even where the value has already settled.
 */

/** The decision the scene resolves to. The next section locks this exact line. */
export const RESOLVED = "I am taking it. I move in January.";

function Row({ factor, index, p }: { factor: Factor; index: number; p: MotionValue<number> }) {
  // Scattered, then straight. Both settle at the same beat, so the group
  // resolves together rather than one element at a time.
  const x = useTransform(p, [0, SETTLED], [factor.drift, 0]);
  const rotate = useTransform(p, [0, SETTLED], [factor.tilt, 0]);

  // What matters gains contrast; what does not recedes, then leaves. Both
  // curves start at a visible value, so the stage is never blank at rest.
  const opacity = useTransform(
    p,
    factor.major
      ? [0, SETTLED, WEIGHED, THINNED, DROPPED, DECIDED, 1]
      : [0, SETTLED, WEIGHED, THINNED, 0.68, DROPPED, 1],
    factor.major ? [0.5, 0.62, 0.62, 1, 1, 0, 0] : [0.5, 0.62, 0.62, 0.44, 0.12, 0, 0],
  );
  const scale = useTransform(p, [WEIGHED, THINNED], [1, factor.major ? 1 : 0.96]);
  const markScale = useTransform(p, [WEIGHED, THINNED], [0, factor.major ? 1 : 0]);

  // The slot owns the layout and never moves; the row owns the motion and only
  // ever transforms within it. Overlap is then structurally impossible rather
  // than something that has to be tuned away at each viewport size.
  return (
    <div className="scene-slot" style={{ "--i": index } as React.CSSProperties}>
      <motion.div className="scene-row" style={{ x, rotate, opacity, scale }}>
        <motion.span className="scene-row-mark" style={{ scaleY: markScale }} aria-hidden="true" />
        <span className="scene-row-label">{factor.label}</span>
      </motion.div>
    </div>
  );
}

function Caption({ p }: { p: MotionValue<number> }) {
  const a = useTransform(p, [0, 0.16, SETTLED, 1], [1, 1, 0, 0]);
  const b = useTransform(p, [SETTLED, SETTLED + 0.06, THINNED, DROPPED, 1], [0, 1, 1, 0, 0]);
  const c = useTransform(p, [DECIDED, DECIDED + 0.06, 1], [0, 1, 1]);

  return (
    <div className="scene-caption" aria-hidden="true">
      <motion.span style={{ opacity: a }}>Everything, at once</motion.span>
      <motion.span style={{ opacity: b }}>What it actually turns on</motion.span>
      <motion.span style={{ opacity: c }}>Decided</motion.span>
    </div>
  );
}

function Stage({ p }: { p: MotionValue<number> }) {
  const resolved = useTransform(p, [DECIDED, DECIDED + 0.08, 1], [0, 1, 1]);
  const resolvedY = useTransform(p, [DECIDED, DECIDED + 0.08, 1], [10, 0, 0]);
  const rail = useTransform(p, [0, 1], [0, 1]);

  return (
    <div className="scene-panel">
      <div className="scene-stage">
        <div className="scene-head">
          <p className="eyebrow">The decision</p>
          <p className="scene-decision">I have been offered a job in another city.</p>
        </div>

        <div className="scene-rows">
          {FACTORS.map((f, i) => (
            <Row key={f.label} factor={f} index={i} p={p} />
          ))}

          <motion.p
            className="scene-resolved"
            style={{ opacity: resolved, y: resolvedY }}
            aria-hidden="true"
          >
            {RESOLVED}
          </motion.p>
        </div>
      </div>

      <Caption p={p} />

      <div className="scene-rail" aria-hidden="true">
        <motion.span className="scene-rail-fill" style={{ scaleX: rail }} />
      </div>
    </div>
  );
}

/**
 * The same argument, held still.
 *
 * Not just the end state: the factors are listed with the two that mattered
 * marked, so a reader who never sees the scene move still gets the point of
 * it — five things went in, one decision came out.
 */
function StillStage() {
  return (
    <div className="scene-panel scene-panel--still">
      <div className="scene-head">
        <p className="eyebrow">The decision</p>
        <p className="scene-decision">I have been offered a job in another city.</p>
      </div>

      <ul className="still-list">
        {FACTORS.map((f) => (
          <li key={f.label} className="still-item" data-major={f.major || undefined}>
            <span className="scene-row-mark" aria-hidden="true" />
            <span className="scene-row-label">{f.label}</span>
          </li>
        ))}
      </ul>

      <p className="eyebrow">Decided</p>
      <p className="scene-resolved scene-resolved--still">{RESOLVED}</p>
    </div>
  );
}

export function Narrowing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The server has no media query to read, so the scene is what renders first
  // either way; the still version is swapped in after mount. Same tree on both
  // sides of hydration, no mismatch.
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const still = mounted && reduced === true;

  return (
    <section ref={ref} className="narrowing" data-still={still || undefined}>
      <div className="narrowing-pin">{still ? <StillStage /> : <Stage p={scrollYProgress} />}</div>

      <p className="sr-only">
        A decision starts as everything at once — {FACTORS.map((f) => f.label).join(", ")} — and
        Lock narrows it to the one or two things it actually turns on, until a single decision is
        left: {RESOLVED}
      </p>
    </section>
  );
}
