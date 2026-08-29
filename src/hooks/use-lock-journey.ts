import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useRef, useState } from "react";

import { createSeal, type LockSeal } from "@/lib/lock-seal";
import { evaluateJourney } from "@/lib/lock.functions";
import type { InputKind, JourneyState, LockVerdict, Move, Turn } from "@/lib/lock-types";

/** The states the interface presents. They morph; they are not pages. */
export type Phase = "idle" | "naming" | "working" | "ready" | "locked" | "refused";

/** What the interface is currently showing. */
export type Step =
  | { move: "clarify"; text: string; kind: InputKind; choices: string[] | null }
  | { move: "reflect"; text: string }
  | { move: "tradeoff"; text: string; a: string; b: string; lean: number }
  | { move: "choose"; text: string; choices: string[] };

/**
 * Safety ceiling only. The system sets its own depth — this exists so a
 * runaway can never turn the product into an interrogation.
 */
const MAX_STEPS = 7;

const OPENING = "What are you deciding?";

type Snapshot = {
  step: Step;
  state: JourneyState;
  history: Turn[];
  count: number;
  verdict: LockVerdict | null;
};

/**
 * The Lock journey.
 *
 * The server verdict still decides everything — whether to probe again,
 * advance, finalize or abort. What changed is that a turn is no longer
 * assumed to be a question: the verdict names a move, and the interface
 * presents that move.
 */
export function useLockJourney(seededDecision?: string) {
  const evaluate = useServerFn(evaluateJourney);

  const [phase, setPhase] = useState<Phase>("idle");
  const [state, setState] = useState<JourneyState>("intro");
  const [decision, setDecision] = useState("");
  const [step, setStep] = useState<Step | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [verdict, setVerdict] = useState<LockVerdict | null>(null);
  const [seal, setSeal] = useState<LockSeal | null>(null);

  /** Snapshots so a person can step back and answer differently. */
  const pastRef = useRef<Snapshot[]>([]);
  /** The last answer sent, so a failed turn can be retried unchanged. */
  const lastAnswerRef = useRef<string | null>(null);

  const begin = useCallback(() => {
    setPhase("naming");
    setState("explore");
  }, []);

  const applyVerdict = useCallback((result: LockVerdict, answered: string, asked: string) => {
    setHistory((prev) => [
      ...prev,
      { role: "lock", text: asked },
      { role: "user", text: answered },
    ]);
    setVerdict(result);
    setCount((c) => c + 1);
    if (result.next_state) setState(result.next_state);
    return result;
  }, []);

  /**
   * One turn. The decision itself is the first answer, so naming it and
   * answering a move take the same path — there is no scripted second question.
   */
  const advance = useCallback(
    async (answer: string, asked: string, nextCount: number): Promise<boolean> => {
      setPending(true);
      setFailed(false);
      try {
        const result = await evaluate({
          data: { state, decision: decision || answer, history, answer, step: nextCount },
        });
        applyVerdict(result, answer, asked);

        if (result.action === "abort") {
          setPhase("refused");
          return true;
        }

        const next = toStep(result);
        if (!next || result.action === "finalize" || nextCount + 1 >= MAX_STEPS) {
          setState("decision");
          setStep(null);
          setPhase("ready");
          return true;
        }

        setStep(next);
        setPhase("working");
        return true;
      } catch (e) {
        // The message is already the one sentence the product shows.
        console.error(e);
        setFailed(true);
        return false;
      } finally {
        setPending(false);
      }
    },
    [applyVerdict, decision, evaluate, history, state],
  );

  /** Naming the decision is itself the first thing Lock reacts to. */
  const name = useCallback(
    async (raw: string) => {
      const d = raw.trim();
      if (!d || pending) return false;
      setDecision(d);
      lastAnswerRef.current = d;
      return advance(d, OPENING, 0);
    },
    [advance, pending],
  );

  const respond = useCallback(
    async (raw: string) => {
      const answer = raw.trim();
      if (!answer || pending || !step) return false;
      pastRef.current.push({ step, state, history, count, verdict });
      lastAnswerRef.current = answer;
      return advance(answer, step.text, count);
    },
    [advance, count, history, pending, state, step, verdict],
  );

  /** Retry the turn that failed, with the same answer. Nothing is lost. */
  const retry = useCallback(async () => {
    const answer = lastAnswerRef.current;
    if (!answer || pending) return false;
    return advance(answer, step?.text ?? OPENING, count);
  }, [advance, count, pending, step]);

  /** Step back and answer differently. Always available while working. */
  const back = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return false;
    setStep(previous.step);
    setState(previous.state);
    setHistory(previous.history);
    setCount(previous.count);
    setVerdict(previous.verdict);
    setFailed(false);
    setPhase("working");
    return true;
  }, []);

  const canGoBack = pastRef.current.length > 0;

  /** Called by the Lock control, and only by it. */
  const confirmLock = useCallback(() => {
    setSeal((prev) => prev ?? createSeal());
    setPhase("locked");
  }, []);

  /** Locking is a commitment, not a trap — the decision can be reopened. */
  const unlock = useCallback(() => {
    setPhase("ready");
  }, []);

  const reset = useCallback(() => {
    pastRef.current = [];
    lastAnswerRef.current = null;
    setPhase("idle");
    setState("intro");
    setDecision("");
    setStep(null);
    setHistory([]);
    setCount(0);
    setVerdict(null);
    setSeal(null);
    setFailed(false);
  }, []);

  /**
   * How close the system is to certainty, 0..1 — read by the Lock mark and
   * never shown as a bar or a count. It leans on the model's own confidence,
   * so a short journey still arrives closed.
   */
  const certainty = useMemo(() => {
    if (phase === "idle" || phase === "refused") return 0;
    if (phase === "ready" || phase === "locked") return 1;
    if (!verdict) return count > 0 ? 0.2 : 0;
    return Math.min(0.85, 0.2 + verdict.confidence * 0.65);
  }, [count, phase, verdict]);

  return {
    phase,
    decision,
    step,
    pending,
    failed,
    verdict,
    seal,
    certainty,
    canGoBack,
    seededDecision,
    begin,
    name,
    respond,
    retry,
    back,
    confirmLock,
    unlock,
    reset,
  };
}

/** Read the presented interaction out of a verdict. Exported for tests. */
export function toStep(result: LockVerdict): Step | null {
  const text = result.followup?.trim();
  if (!text) return null;

  const choices = sanitizeChoices(result.options);
  const move: Move = result.move ?? (choices ? "choose" : "clarify");

  if (move === "commit") return null;

  if (move === "reflect") return { move: "reflect", text };

  if (move === "tradeoff") {
    const a = result.tradeoff_a?.trim();
    const b = result.tradeoff_b?.trim();
    // A tradeoff with only one side named is not a tradeoff.
    if (a && b) {
      const lean = result.tradeoff_lean;
      return { move: "tradeoff", text, a, b, lean: lean === null ? 0.5 : clamp01(lean) };
    }
    return choices ? { move: "choose", text, choices } : asClarify(result, text, choices);
  }

  if (move === "choose") {
    return choices ? { move: "choose", text, choices } : asClarify(result, text, choices);
  }

  return asClarify(result, text, choices);
}

function asClarify(result: LockVerdict, text: string, choices: string[] | null): Step {
  // A declared kind is honoured only when it is answerable: "choice" without
  // usable options would leave the person with nothing to press.
  const kind: InputKind =
    result.input_kind === "choice" && choices
      ? "choice"
      : result.input_kind === "scale"
        ? "scale"
        : result.input_kind === "text"
          ? "text"
          : choices
            ? "choice"
            : "text";
  return { move: "clarify", text, kind, choices: kind === "choice" ? choices : null };
}

/** Choices are model output: keep them short, few, and free of chat filler. */
function sanitizeChoices(raw: string[] | null | undefined): string[] | null {
  if (!raw?.length) return null;
  const cleaned = raw
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 60)
    .slice(0, 4);
  return cleaned.length >= 2 ? cleaned : null;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export { OPENING };
