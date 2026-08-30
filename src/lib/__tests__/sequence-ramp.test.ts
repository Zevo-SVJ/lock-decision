import { describe, expect, test } from "bun:test";

import { ramp } from "@/components/landing/Sequence";

/*
 * The sequence's stop lists are arithmetic on a handful of beat constants, so
 * moving one beat can silently push a stop behind the one before it. Framer
 * does not warn about that — it throws inside a ref callback, which takes the
 * whole page down into an error boundary. These cover the two failure modes.
 */
describe("sequence ramps", () => {
  test("refuses a stop list that goes backwards", () => {
    expect(() => ramp([0.2, 0.7, 0.65], [0, 1, 0])).toThrow(/must not decrease/);
  });

  test("accepts a list that only repeats a stop", () => {
    expect(() => ramp([0.2, 0.2, 0.7], [0, 1, 1])).not.toThrow();
  });

  test("pins the last stop to 1 so nothing extrapolates past the end", () => {
    // Left alone, a curve ending at 0.76 keeps travelling after 0.76 — which
    // is how a faded-out element comes back at the end of the scene.
    const [stops, values] = ramp([0.7, 0.76], [1, 0]);
    expect(stops).toEqual([0.7, 0.76, 1]);
    expect(values).toEqual([1, 0, 0]);
  });

  test("leaves a list that already ends at 1 alone", () => {
    const [stops, values] = ramp([0, 0.5, 1], [0, 1, 0.4]);
    expect(stops).toEqual([0, 0.5, 1]);
    expect(values).toEqual([0, 1, 0.4]);
  });

  test("keeps stops and values the same length", () => {
    const [stops, values] = ramp([0.1, 0.2, 0.3], [0, 1, 0]);
    expect(stops.length).toBe(values.length);
  });
});
