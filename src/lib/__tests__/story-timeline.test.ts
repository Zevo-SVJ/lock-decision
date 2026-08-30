import { describe, expect, test } from "bun:test";

import { CAPTIONS, RUN, timeline } from "@/components/landing/story-timeline";

const steps = timeline(200, -34, 0);

/*
 * The story is six seconds of scheduled beats that nobody watches frame by
 * frame after the first day. These are the things that break silently when a
 * beat is nudged: a step landing after the story is over, the words drifting
 * away from the picture, or a gap where nothing happens.
 */
describe("the story's schedule", () => {
  test("every beat lands inside the run", () => {
    for (const s of steps) {
      expect(s.at).toBeGreaterThanOrEqual(0);
      expect(s.at).toBeLessThan(RUN);
    }
  });

  test("it opens on the question and closes on the check", () => {
    const first = steps.filter((s) => s.at > 0)[0];
    expect(first?.sel).toBe(".s-line");

    const last = [...steps].sort((a, b) => b.at - a.at)[0];
    expect(last?.attr).toEqual(["data-morph", "check"]);
  });

  test("the words never get ahead of the picture", () => {
    // The sentence is exchanged at the same moment the caption naming that
    // exchange appears; a caption arriving first gives the ending away.
    const swap = steps.find((s) => s.sel === ".s-decision" && s.at > 0);
    const caption = CAPTIONS[2];
    expect(swap).toBeDefined();
    expect(caption?.at).toBeCloseTo(swap?.at ?? -1, 2);
  });

  test("the knob travels the distance it is given", () => {
    const move = steps.find((s) => s.sel === ".s-knob" && s.at > 0);
    expect(move?.to).toMatchObject({ x: 200 });
  });

  test("the shackle ends shut", () => {
    const shackle = steps.filter((s) => s.sel === ".s-shackle");
    expect(shackle.at(-1)?.to).toMatchObject({ rotate: 0 });
  });

  test("nothing sits still for more than a beat and a half", () => {
    // A gap longer than this reads as the animation having finished early.
    const times = [...new Set(steps.map((s) => s.at)), ...CAPTIONS.map((c) => c.at)].sort(
      (a, b) => a - b,
    );
    const gaps = times.slice(1).map((t, i) => t - (times[i] as number));
    expect(Math.max(...gaps)).toBeLessThanOrEqual(1.5);
  });

  test("captions run in order and none outlives the story", () => {
    for (let i = 1; i < CAPTIONS.length; i += 1) {
      expect(CAPTIONS[i]!.at).toBeGreaterThan(CAPTIONS[i - 1]!.at);
    }
    expect(CAPTIONS.at(-1)!.at).toBeLessThan(RUN - 1);
  });
});
