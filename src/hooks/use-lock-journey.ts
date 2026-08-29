import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useState } from "react";

import { createSeal, type LockSeal } from "@/lib/lock-seal";
import { evaluateJourney } from "@/lib/lock.functions";
import type { JourneyState, LockVerdict, Turn } from "@/lib/lock-types";

export type Phase = "intro" | "decision" | "journey" | "commit" | "complete" | "aborted";

/**
 * Hard ceiling on exchanges. Lock is meant to be decisive: the decision itself,
 * one framing question, and at most one probe before it asks for commitment.
 */
export const MAX_STEPS = 3;

const FIRST_QUESTION = "What exactly are you deciding?";
const SECOND_QUESTION = "Why now?";
const FALLBACK_QUESTION = "What is the first concrete step you will take?";

/**
 * The Lock journey.
 *
 * The state machine is unchanged from the original engine — the server verdict
 * still decides whether to probe again, advance, finalize, or abort. This hook
 * only lifts it out of the view so the interface can be rebuilt around it.
 */
export function useLockJourney() {
  const evaluate = useServerFn(evaluateJourney);

  const [phase, setPhase] = useState<Phase>("intro");
  const [state, setState] = useState<JourneyState>("intro");
  const [decision, setDecision] = useState("");
  const [question, setQuestion] = useState(FIRST_QUESTION);
  const [options, setOptions] = useState<string[] | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<LockVerdict | null>(null);
  const [seal, setSeal] = useState<LockSeal | null>(null);

  const begin = useCallback(() => {
    setPhase("decision");
    setState("explore");
  }, []);

  /** The decision itself is captured locally; nothing to evaluate yet. */
  const captureDecision = useCallback((raw: string) => {
    const d = raw.trim();
    if (!d) return false;
    setDecision(d);
    setHistory([
      { role: "lock", text: FIRST_QUESTION },
      { role: "user", text: d },
    ]);
    setQuestion(SECOND_QUESTION);
    setOptions(null);
    setState("assess_commitment");
    setStep(1);
    setPhase("journey");
    return true;
  }, []);

  const submitAnswer = useCallback(
    async (raw: string): Promise<boolean> => {
      const text = raw.trim();
      if (!text || pending) return false;
      setPending(true);
      setError(null);
      try {
        const result = await evaluate({
          data: { state, decision, history, answer: text, step },
        });
        setHistory((prev) => [...prev, { role: "lock", text: question }, { role: "user", text }]);
        setVerdict(result);
        setStep((s) => s + 1);
        if (result.next_state) setState(result.next_state);

        if (result.action === "abort") {
          setPhase("aborted");
        } else if (
          result.action === "finalize" ||
          step + 1 >= MAX_STEPS ||
          (result.action === "continue" && !result.followup)
        ) {
          setState("decision");
          setOptions(null);
          setPhase("commit");
        } else {
          setQuestion(result.followup ?? FALLBACK_QUESTION);
          setOptions(sanitizeOptions(result.options));
          if (result.action === "ask_followup") setState("assess_commitment");
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [decision, evaluate, history, pending, question, state, step],
  );

  /** Called by the Lock control, and only by it. */
  const confirmLock = useCallback(() => {
    setSeal((prev) => prev ?? createSeal());
    setPhase("complete");
  }, []);

  const reset = useCallback(() => {
    setPhase("intro");
    setState("intro");
    setDecision("");
    setQuestion(FIRST_QUESTION);
    setOptions(null);
    setHistory([]);
    setStep(0);
    setVerdict(null);
    setSeal(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  /** 0..1 — how far through the mechanism the user is. Never shown as a count. */
  const progress = useMemo(() => {
    if (phase === "intro") return 0;
    if (phase === "commit" || phase === "complete") return 1;
    if (phase === "aborted") return 1;
    return Math.min(0.92, (step + (pending ? 0.5 : 0)) / (MAX_STEPS + 1));
  }, [phase, pending, step]);

  return {
    phase,
    state,
    decision,
    question,
    options,
    step,
    pending,
    error,
    verdict,
    seal,
    progress,
    begin,
    captureDecision,
    submitAnswer,
    confirmLock,
    reset,
    dismissError,
  };
}

/** Options are model output: keep them short, few, and free of chat filler. */
function sanitizeOptions(raw: string[] | null | undefined): string[] | null {
  if (!raw?.length) return null;
  const cleaned = raw
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 48)
    .slice(0, 4);
  return cleaned.length >= 2 ? cleaned : null;
}
