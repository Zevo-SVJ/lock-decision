import { describe, expect, test } from "bun:test";

import { toStep } from "@/hooks/use-lock-journey";
import { lockVerdictSchema, type LockVerdict } from "@/lib/lock-types";

/** A verdict as the model returns it, with everything unspecified at default. */
function verdict(overrides: Partial<LockVerdict>): LockVerdict {
  return lockVerdictSchema.parse({
    verdict: "hold",
    reason: "Noted.",
    action: "ask_followup",
    confidence: 0.5,
    next_state: "assess_commitment",
    followup: "Why now?",
    ...overrides,
  });
}

describe("verdict to interaction", () => {
  test("a reflection is presented as a statement", () => {
    const step = toStep(verdict({ move: "reflect", followup: "You are choosing autonomy." }));
    expect(step).toEqual({ move: "reflect", text: "You are choosing autonomy." });
  });

  test("a tradeoff carries both sides and the lean", () => {
    const step = toStep(
      verdict({
        move: "tradeoff",
        tradeoff_a: "Security",
        tradeoff_b: "Autonomy",
        tradeoff_lean: 0.7,
      }),
    );
    expect(step).toEqual({
      move: "tradeoff",
      text: "Why now?",
      a: "Security",
      b: "Autonomy",
      lean: 0.7,
    });
  });

  test("a tradeoff missing a side falls back rather than rendering half a scale", () => {
    const step = toStep(verdict({ move: "tradeoff", tradeoff_a: "Security", tradeoff_b: null }));
    expect(step?.move).toBe("clarify");
  });

  test("a tradeoff with no lean sits in the middle", () => {
    const step = toStep(
      verdict({ move: "tradeoff", tradeoff_a: "A", tradeoff_b: "B", tradeoff_lean: null }),
    );
    expect(step).toMatchObject({ lean: 0.5 });
  });

  test("commit ends the journey", () => {
    expect(toStep(verdict({ move: "commit" }))).toBeNull();
  });

  test("no followup text ends the journey", () => {
    expect(toStep(verdict({ followup: null }))).toBeNull();
    expect(toStep(verdict({ followup: "   " }))).toBeNull();
  });

  test("choose without usable options degrades to a text answer", () => {
    const step = toStep(verdict({ move: "choose", options: ["only one"] }));
    expect(step).toEqual({ move: "clarify", text: "Why now?", kind: "text", choices: null });
  });

  test("a declared choice kind is only honoured when it is answerable", () => {
    const unanswerable = toStep(verdict({ move: "clarify", input_kind: "choice", options: null }));
    expect(unanswerable).toMatchObject({ kind: "text", choices: null });

    const answerable = toStep(
      verdict({ move: "clarify", input_kind: "choice", options: ["Stay", "Leave"] }),
    );
    expect(answerable).toMatchObject({ kind: "choice", choices: ["Stay", "Leave"] });
  });

  test("a scale question needs no options", () => {
    expect(toStep(verdict({ move: "clarify", input_kind: "scale" }))).toMatchObject({
      kind: "scale",
      choices: null,
    });
  });

  test("options are trimmed, capped at four, and blanks dropped", () => {
    const step = toStep(
      verdict({ move: "choose", options: ["  Stay  ", "Leave", " ", "Wait", "Ask", "Defer"] }),
    );
    expect(step).toMatchObject({ move: "choose", choices: ["Stay", "Leave", "Wait", "Ask"] });
  });

  test("a verdict from the pre-existing schema still produces an interaction", () => {
    // No move, no options, no input_kind — exactly what the fallback returns.
    expect(toStep(verdict({}))).toEqual({
      move: "clarify",
      text: "Why now?",
      kind: "text",
      choices: null,
    });
  });

  test("legacy options with no declared move become a choice", () => {
    expect(toStep(verdict({ options: ["Stay", "Leave"] }))).toMatchObject({ move: "choose" });
  });
});
