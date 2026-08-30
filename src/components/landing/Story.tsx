import { useAnimate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  CAPTIONS,
  DECISION,
  QUESTION,
  SIGNALS,
  timeline,
} from "@/components/landing/story-timeline";
import { BODY, CHECK_PATH, SHACKLE_PATH, glyphPose } from "@/lib/lock-glyph";

/**
 * The Turn.
 *
 * A question becomes a decision, and the decision gets closed — played once,
 * on its own, when the section comes into view. Under six seconds, four
 * objects, and no cut anywhere in it: every state is the one before it moved,
 * masked, or re-drawn.
 *
 * It is deliberately *not* scroll-driven. Scrubbing hands the viewer
 * responsibility for the pacing of something that has a right pace, and turns
 * a six-second idea into four screens of scrolling. Here they only watch.
 *
 * The schedule lives in `story-timeline` and is run here against one clock:
 * every beat is fired at its own absolute offset rather than described as a
 * chain of relative ones, because a chain is only as good as the durations in
 * front of it, and this story is long enough that a single wrong duration
 * silently drags everything after it out of step with the words.
 */

const INSET = 4; // px the knob sits inside the capsule

export function Story() {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const wrap = useRef<HTMLElement>(null);
  const inView = useInView(wrap, { amount: 0.55 });

  // The server has no media query to read, so the animated markup is what
  // renders on both sides of hydration; the still state arrives after mount.
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const still = mounted && reduced === true;

  useEffect(() => {
    if (!inView || still || !mounted) return;
    const root = scope.current;
    if (!root) return;

    // Measured, not assumed: the capsule is a viewport-relative width.
    const capsule = root.querySelector<HTMLElement>(".story-control");
    const knob = root.querySelector<HTMLElement>(".s-knob");
    if (!capsule || !knob) return;
    const travel = Math.max(1, capsule.offsetWidth - knob.offsetWidth - INSET * 2);

    const steps = timeline(travel, glyphPose(0).angle, glyphPose(1).angle);

    /*
     * One clock. Every step is scheduled from the same zero, so a beat that
     * runs long cannot push the ones after it, and the words below the frame
     * stay tied to the picture above it.
     */
    const timers = steps.map((step) =>
      window.setTimeout(() => {
        if (step.attr) {
          const [name, value] = step.attr;
          root.querySelectorAll(step.sel).forEach((el) => el.setAttribute(name, value));
          return;
        }
        void animate(step.sel, step.to, step.opts);
      }, step.at * 1000),
    );

    const lines = Array.from(root.querySelectorAll<HTMLElement>(".s-caption"));
    const show = (i: number) =>
      lines.forEach((el, j) => (el.dataset["on"] = j === i ? "true" : "false"));
    show(-1);
    timers.push(...CAPTIONS.map(({ at }, i) => window.setTimeout(() => show(i), at * 1000)));

    return () => timers.forEach(window.clearTimeout);
  }, [inView, still, mounted, animate, scope]);

  return (
    <section ref={wrap} className="story" data-still={still || undefined}>
      <div ref={scope} className="story-frame">
        <div className="story-stage">
          <p className="s-line">
            <span className="s-line-text">{QUESTION}</span>
            <span className="s-decision">{DECISION}</span>
          </p>

          <div className="story-signals" aria-hidden="true">
            {SIGNALS.map((s) => (
              <span key={s} className="s-signal">
                {s}
              </span>
            ))}
          </div>

          <div className="s-control" aria-hidden="true">
            <div className="story-control">
              <span className="s-capsule" />
              <span className="s-cap-label">slide to lock</span>
              <span className="s-knob">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="s-glyph">
                  <g className="s-glyph-lock">
                    <path
                      className="s-shackle"
                      d={SHACKLE_PATH}
                      stroke="currentColor"
                      strokeWidth="1.8"
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
                  </g>
                  <path
                    className="s-glyph-check"
                    d={CHECK_PATH}
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <p className="story-captions" aria-hidden="true">
          {CAPTIONS.map(({ text }, i) => (
            <span key={text} className="s-caption" data-on={i === 0 ? "true" : "false"}>
              {text}
            </span>
          ))}
        </p>
      </div>

      <p className="sr-only">
        A question — {QUESTION} — comes into Lock. What it turns on ({SIGNALS.join(", ")}) surfaces
        and then collapses back into it, and the question becomes a decision: {DECISION} Sliding the
        control to the end closes it.
      </p>
    </section>
  );
}
