import type { DOMKeyframesDefinition, AnimationOptions } from "framer-motion";

/**
 * The Turn, as data.
 *
 * A question becomes a decision and the decision gets closed. Every beat is an
 * absolute time in seconds from the moment the section comes into view, so the
 * whole story can be read — and tested — as a list rather than inferred from a
 * nest of animation options.
 *
 * It lives apart from the component for one practical reason: a sequence this
 * long is only trustworthy if its timing can be asserted, and that means the
 * schedule has to exist without a DOM.
 */

/**
 * A beat. Either something animates, or a state is set on an element and CSS
 * takes it from there — the second kind exists because the lock's turn into a
 * check is a stroke-dash animation, which the animation library declines to
 * drive and the browser handles perfectly from a keyframe.
 */
export type Step = { at: number; sel: string } & (
  | { to: DOMKeyframesDefinition; opts?: AnimationOptions; attr?: never }
  | { attr: [name: string, value: string]; to?: never; opts?: never }
);

export const QUESTION = "Should I take the job?";
export const DECISION = "Yes. I start in March.";

/** What the decision turns out to turn on. Three, and no more. */
export const SIGNALS = ["the money", "the move", "the work"];

/** The line under the frame, in step with what is happening above it. */
export const CAPTIONS = [
  { at: 0.15, text: "It arrives as a question." },
  { at: 1.5, text: "Lock finds what it turns on." },
  { at: 3.05, text: "The question becomes an answer." },
  { at: 4.35, text: "Then you close it." },
];

/** How long the whole thing runs, including the beat it rests on at the end. */
export const RUN = 6.4;

const stagger = (each: number) => (i: number) => i * each;

/**
 * Build the schedule. `travel` is how far the knob has to go, which is only
 * knowable once the capsule has been measured.
 *
 * `open` and `shut` are the shackle's angles at either end of the gesture, so
 * the mark in the story closes exactly as the real one does.
 */
export function timeline(travel: number, open: number, shut: number): Step[] {
  return [
    /* ---- rewind, so a replay starts from the same place every time ---- */
    {
      at: 0,
      sel: ".s-line",
      to: { opacity: 0, y: 30, scale: 0.985, clipPath: "inset(0 0% 0 0)" },
    },
    { at: 0, sel: ".s-line-text", to: { opacity: 1 } },
    { at: 0, sel: ".s-decision", to: { opacity: 0 } },
    { at: 0, sel: ".s-signal", to: { opacity: 0, y: 12, scale: 0.94 } },
    { at: 0, sel: ".s-control", to: { opacity: 0, x: 0 } },
    { at: 0, sel: ".s-capsule", to: { scaleX: 0.14, opacity: 0 } },
    { at: 0, sel: ".s-cap-label", to: { opacity: 0 } },
    { at: 0, sel: ".s-knob", to: { x: 0 } },
    { at: 0, sel: ".s-shackle", to: { rotate: open } },
    { at: 0, sel: ".s-glyph", attr: ["data-morph", "lock"] },

    /* ---- the question is set down ------------------------------------- */
    {
      at: 0.15,
      sel: ".s-line",
      to: { opacity: 1, y: 0, scale: 1 },
      opts: { type: "spring", stiffness: 220, damping: 24, mass: 0.9 },
    },

    /* ---- what it turns on comes up under it --------------------------- */
    {
      at: 1.0,
      sel: ".s-signal",
      to: { opacity: 0.6, y: 0, scale: 1 },
      opts: { type: "spring", stiffness: 340, damping: 28, delay: stagger(0.09) },
    },

    /* ---- and collapses back into it ----------------------------------- */
    {
      at: 2.2,
      sel: ".s-signal",
      to: { opacity: 0, y: -16, scale: 0.84 },
      opts: { duration: 0.32, ease: [0.4, 0, 0.7, 1], delay: stagger(0.05) },
    },

    /*
     * The turn of the sentence. It un-writes from the right, the words
     * underneath are exchanged while there is nothing to see, and the new one
     * writes back on from the left — so the question is not replaced, it is
     * redrawn. Closing from both sides instead leaves a fragment of a word
     * stranded in the middle of the frame, which reads as a fault.
     */
    {
      at: 2.78,
      sel: ".s-line",
      to: { clipPath: "inset(0 100% 0 0)" },
      opts: { duration: 0.26, ease: [0.5, 0, 0.75, 0] },
    },
    { at: 3.05, sel: ".s-line-text", to: { opacity: 0 }, opts: { duration: 0 } },
    { at: 3.05, sel: ".s-decision", to: { opacity: 1 }, opts: { duration: 0 } },
    {
      at: 3.07,
      sel: ".s-line",
      to: { clipPath: "inset(0 0% 0 0)" },
      opts: { duration: 0.42, ease: [0.16, 0.8, 0.24, 1] },
    },

    /* ---- the control is placed under it -------------------------------- */
    { at: 3.75, sel: ".s-control", to: { opacity: 1 }, opts: { duration: 0.16 } },
    {
      at: 3.75,
      sel: ".s-capsule",
      to: { scaleX: 1, opacity: 1 },
      opts: { type: "spring", stiffness: 280, damping: 26 },
    },
    { at: 3.95, sel: ".s-cap-label", to: { opacity: 1 }, opts: { duration: 0.2 } },

    /* ---- and it is used ------------------------------------------------ */
    {
      at: 4.4,
      sel: ".s-knob",
      to: { x: travel },
      opts: { duration: 0.78, ease: [0.5, 0, 0.2, 1] },
    },
    {
      at: 4.4,
      sel: ".s-shackle",
      to: { rotate: shut },
      opts: { duration: 0.78, ease: [0.5, 0, 0.2, 1] },
    },
    { at: 4.44, sel: ".s-cap-label", to: { opacity: 0 }, opts: { duration: 0.14 } },

    /* ---- the capsule contracts away, and the lock turns over ----------- */
    {
      at: 5.3,
      sel: ".s-capsule",
      to: { scaleX: 0.19, opacity: 0 },
      opts: { duration: 0.29, ease: [0.36, 0, 0.12, 1] },
    },
    /*
     * As the track retracts, what is left of it slides back under the sentence.
     * Without this the mark is stranded at the end of a capsule that no longer
     * exists, which reads as a leftover rather than a conclusion.
     */
    {
      at: 5.3,
      sel: ".s-control",
      to: { x: -travel },
      opts: { duration: 0.34, ease: [0.36, 0, 0.12, 1] },
    },
    { at: 5.58, sel: ".s-glyph", attr: ["data-morph", "check"] },
  ];
}
