import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The sequence.
 *
 * One decision, from the moment it is put down to the moment it is shut, with
 * nothing cutting away in between. Every state is the previous state moved:
 * the question does not fade out and get replaced by a heading, it travels up
 * and shrinks until it *is* the heading; the two things that mattered do not
 * fade out and get replaced by an answer, they slide together and become it.
 *
 * Two clocks drive it, both from the same scroll progress:
 *
 *   `motion`  — spring-smoothed. Everything that moves reads from this, so the
 *               sequence carries weight, overshoots slightly and settles,
 *               instead of being welded to the scrollbar.
 *   `read`    — raw. Everything that appears or disappears reads from this, so
 *               legibility switches exactly where it should and never lags a
 *               spring behind the thing it belongs to.
 *
 * That split is the whole trick. It is also why nothing here needs a trigger,
 * an observer or a timer, and why the entire sequence runs backwards, at the
 * reader's speed, the moment they scroll up.
 */

/* The beats. Written once, here, so the choreography can be read in one place. */
const PLACED = 0.1; // the decision has landed
const LIFTED = 0.28; // it has become the heading
const WEIGHED = 0.48; // two of them matter, two do not
const MERGED = 0.66; // the two become one line
const ARMED = 0.82; // the control is there
const SHUT = 1; // and it is closed

const DECISION = "Should I buy a car?";
const ANSWER = "No. Not this year.";

/**
 * A stop list for `useTransform`, checked.
 *
 * Framer interpolates between stops and *extrapolates* past the last one, and
 * it throws outright if the stops are not increasing — which surfaces as the
 * whole page falling into an error boundary, not as a wonky animation. Both
 * failures have a boring cause (arithmetic on the beat constants) and no
 * visible warning, so every ramp on this page is built here instead: it pins
 * the last stop to 1 so nothing can extrapolate, and refuses to hand back a
 * list that is out of order.
 */
export function ramp(stops: number[], values: number[]): [number[], number[]] {
  const s = stops.at(-1) === 1 ? stops : [...stops, 1];
  const v = stops.at(-1) === 1 ? values : [...values, values.at(-1) as number];

  for (let i = 1; i < s.length; i += 1) {
    if ((s[i] as number) < (s[i - 1] as number)) {
      throw new Error(`ramp: stops must not decrease — ${s.join(", ")}`);
    }
  }
  return [s, v];
}

/** What the decision turns out to involve. Two of these are the decision. */
const SIGNALS = [
  { label: "The monthly cost", major: false },
  { label: "Not waiting on anyone", major: true },
  { label: "Insurance and parking", major: false },
  { label: "Getting out of the city", major: true },
];

/** Each stage of the sequence, in the words the reader gets. */
const STAGES = [
  { from: 0, to: LIFTED, text: "Bring the decision." },
  { from: LIFTED, to: MERGED, text: "Find what it actually turns on." },
  { from: MERGED, to: 1, text: "Then close it." },
];

function Signal({
  signal,
  index,
  motionP,
  readP,
}: {
  signal: (typeof SIGNALS)[number];
  index: number;
  motionP: MotionValue<number>;
  readP: MotionValue<number>;
}) {
  // They arrive in order, from below, as if set down one at a time.
  const enter = LIFTED + index * 0.022;
  const y = useTransform(motionP, ...ramp([enter, enter + 0.12], [26, 0]));

  // What matters gains contrast; what does not recedes, then goes. The majors
  // then converge on the middle of the group and hand over to the answer.
  const converge = index === 1 ? 24 : index === 2 ? -24 : 0;
  const pull = useTransform(motionP, ...ramp([WEIGHED, MERGED], [0, converge]));
  const shift = useTransform([y, pull], ([a, b]: number[]) => (a ?? 0) + (b ?? 0));

  /*
   * The minors thin out and are gone by 0.72; the majors take the contrast,
   * hold it, and then dissolve into the answer between 0.70 and 0.74.
   */
  const opacity = useTransform(
    readP,
    ...(signal.major
      ? ramp(
          [enter, enter + 0.1, WEIGHED, WEIGHED + 0.05, MERGED - 0.05, MERGED - 0.01],
          [0, 0.58, 0.58, 1, 1, 0],
        )
      : ramp(
          [enter, enter + 0.1, WEIGHED, WEIGHED + 0.05, WEIGHED + 0.1],
          [0, 0.58, 0.58, 0.22, 0],
        )),
  );
  const barScale = useTransform(
    readP,
    ...ramp([WEIGHED, WEIGHED + 0.1], [0, signal.major ? 1 : 0]),
  );

  return (
    <div className="seq-slot" style={{ "--i": index } as React.CSSProperties}>
      <motion.div className="seq-signal" style={{ y: shift, opacity }}>
        <motion.span className="seq-signal-bar" style={{ scaleY: barScale }} aria-hidden="true" />
        <span className="seq-signal-label">{signal.label}</span>
      </motion.div>
    </div>
  );
}

function Stage({ motionP, readP }: { motionP: MotionValue<number>; readP: MotionValue<number> }) {
  /*
   * The decision. One element for the whole sequence: it is set down large in
   * the middle of the frame, then travels to the top and shrinks until it is
   * the heading the rest of the sequence happens under. It is rendered at its
   * large size and scaled *down*, so the small state stays crisp.
   */
  const decisionY = useTransform(motionP, ...ramp([0, PLACED, LIFTED], [64, 0, -112]));
  const decisionScale = useTransform(motionP, ...ramp([PLACED, LIFTED], [1, 0.46]));
  const decisionOpacity = useTransform(readP, ...ramp([0, 0.04, LIFTED], [0, 1, 0.42]));

  // The label that only makes sense once the question has become context.
  const eyebrow = useTransform(readP, ...ramp([LIFTED - 0.06, LIFTED], [0, 1]));

  /*
   * The answer arrives *while* the two signals are still leaving, in the place
   * they are converging on. Strictly separating them leaves a blank frame at
   * the exact moment the sequence is supposed to be resolving; overlapping the
   * two by a few per cent is what makes it read as one thing becoming another.
   */
  const answerOpacity = useTransform(readP, ...ramp([MERGED - 0.05, MERGED + 0.01], [0, 1]));
  const answerScale = useTransform(motionP, ...ramp([MERGED - 0.04, MERGED + 0.06], [0.94, 1]));
  const answerY = useTransform(
    motionP,
    ...ramp([MERGED - 0.04, MERGED + 0.06, ARMED], [14, 0, -8]),
  );

  /*
   * The control widens out of nothing, then contracts back into the lock — the
   * same move the real control makes when a real gesture finishes. The capsule
   * goes with it, and the whole thing slides left so the lock comes to rest
   * under the decision rather than stranded at the end of a track that is no
   * longer there. -75% is the knob's own offset as a fraction of the track,
   * which the control's proportions hold constant at every width.
   */
  const capsuleScale = useTransform(
    motionP,
    ...ramp([ARMED - 0.06, ARMED, 0.95, SHUT], [0.12, 1, 1, 0.2]),
  );
  const capsuleOpacity = useTransform(
    readP,
    ...ramp([ARMED - 0.06, ARMED - 0.02, 0.96, 0.99], [0, 1, 1, 0]),
  );
  const capsuleLabel = useTransform(
    readP,
    ...ramp([ARMED, ARMED + 0.03, 0.93, 0.95], [0, 1, 1, 0]),
  );
  const knobOpacity = useTransform(readP, ...ramp([ARMED - 0.05, ARMED - 0.01], [0, 1]));
  const controlX = useTransform(motionP, [0.95, SHUT], ["0%", "-75%"]);

  // The knock as it seats. Tiny, and only at the very end.
  const knobRotate = useTransform(motionP, ...ramp([0.962, 0.975, 0.988, SHUT], [0, -3.4, 1.6, 0]));
  const knobScale = useTransform(motionP, ...ramp([0.962, 0.975, 0.988, SHUT], [1, 0.94, 1.02, 1]));

  return (
    <div className="seq-stage">
      <div className="seq-head">
        <motion.p className="eyebrow seq-eyebrow" style={{ opacity: eyebrow }}>
          The decision
        </motion.p>
      </div>

      <motion.p
        className="seq-decision"
        style={{ y: decisionY, scale: decisionScale, opacity: decisionOpacity }}
      >
        {DECISION}
      </motion.p>

      <div className="seq-body">
        {SIGNALS.map((s, i) => (
          <Signal key={s.label} signal={s} index={i} motionP={motionP} readP={readP} />
        ))}

        <motion.p
          className="seq-answer"
          style={{ opacity: answerOpacity, scale: answerScale, y: answerY }}
        >
          {ANSWER}
        </motion.p>
      </div>

      <div className="seq-foot" aria-hidden="true">
        <motion.div className="seq-control" style={{ x: controlX }}>
          <motion.span
            className="seq-capsule"
            style={{ scaleX: capsuleScale, opacity: capsuleOpacity }}
          />
          <motion.span className="seq-capsule-label" style={{ opacity: capsuleLabel }}>
            slide to lock
          </motion.span>
          <motion.span
            className="seq-knob"
            style={{ opacity: knobOpacity, rotate: knobRotate, scale: knobScale }}
          >
            <LockGlyph progress={1} size={22} />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function Copy({ readP }: { readP: MotionValue<number> }) {
  return (
    <div className="seq-copy">
      {STAGES.map(({ from, to, text }, i) => (
        <CopyLine key={text} from={from} to={to} text={text} index={i} readP={readP} />
      ))}
    </div>
  );
}

const FADE = 0.03;

function CopyLine({
  from,
  to,
  text,
  index,
  readP,
}: {
  from: number;
  to: number;
  text: string;
  index: number;
  readP: MotionValue<number>;
}) {
  const first = index === 0;
  const last = index === STAGES.length - 1;

  /*
   * Each line owns a window and hands over inside it, so two are never
   * readable at once and the strip is never blank between them.
   *
   * Both lists run all the way to 1. Past its final stop a multi-stop
   * transform extrapolates rather than holding, which puts every line back on
   * screen at the end of the sequence, stacked on top of each other.
   */
  /*
   * The incoming line starts a third of a fade before the outgoing one is
   * done. A full crossfade leaves two half-readable sentences on screen; a
   * clean cut leaves a blank frame. A third is the point where neither
   * happens — the strip never empties, and never says two things at once.
   */
  const lead = from - FADE / 3;
  const [stops, values] = first
    ? ramp([0, to - FADE, to], [1, 1, 0])
    : last
      ? ramp([lead, lead + FADE], [0, 1])
      : ramp([lead, lead + FADE, to - FADE, to], [0, 1, 1, 0]);
  const opacity = useTransform(readP, stops, values);

  return (
    <motion.p className="seq-copy-line" style={{ opacity }}>
      {text}
    </motion.p>
  );
}

/** The sequence as a list, for a reader who will never see it move. */
function Still() {
  return (
    <div className="seq-still">
      <p className="eyebrow">The decision</p>
      <p className="seq-still-decision">{DECISION}</p>

      <ul className="seq-still-list">
        {SIGNALS.map((s) => (
          <li key={s.label} className="seq-still-item" data-major={s.major || undefined}>
            <span className="seq-signal-bar" aria-hidden="true" />
            <span className="seq-signal-label">{s.label}</span>
          </li>
        ))}
      </ul>

      <p className="eyebrow">Locked</p>
      <p className="seq-still-answer">{ANSWER}</p>

      <div className="seq-still-copy">
        {STAGES.map(({ text }) => (
          <p key={text} className="seq-copy-line">
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function Sequence() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  /*
   * The spring is what makes this feel like weight rather than a scrubber.
   * Stiff enough to stay under the thumb, light enough to overshoot a little
   * and settle — and `restDelta` keeps it from idling once it has arrived.
   */
  const motionP = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 30,
    mass: 0.6,
    restDelta: 0.0005,
  });

  // Same tree on both sides of hydration; the still version arrives after.
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const still = mounted && reduced === true;

  return (
    <section ref={ref} className="seq" data-still={still || undefined} aria-label="How Lock works">
      <div className="seq-pin">
        {still ? (
          <Still />
        ) : (
          <>
            <Stage motionP={motionP} readP={scrollYProgress} />
            <Copy readP={scrollYProgress} />
          </>
        )}
      </div>

      <p className="sr-only">
        A decision — {DECISION} — is put down, and what it involves comes up with it:{" "}
        {SIGNALS.map((s) => s.label).join(", ")}. Lock narrows it to the two that decide it, and
        those two become one answer: {ANSWER} Then it is locked.
      </p>
    </section>
  );
}
