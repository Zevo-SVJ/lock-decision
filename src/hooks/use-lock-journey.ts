import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useState } from "react";

import { createSeal, type LockSeal } from "@/lib/lock-seal";
import { evaluateJourney } from "@/lib/lock.functions";
import type { JourneyState, LockVerdict, Turn } from "@/lib/lock-types";

/** The states the interface presents. Phases morph; they are not pages. */
export type Phase = "idle" | "understanding" | "focus" | "ready" | "locked" | "refused";

/** How the current question should be answered. */
export type InputKind = "text" | "choice" | "scale";

/**
 * Upper bound on exchanges. The system decides when it has enough — this only
 * stops a runaway from turning the product into an interrogation.
 */
export const MAX_STEPS = 4;

const FIRST_QUESTION = "What are you deciding?";
const SECOND_QUESTION = "Why now?";
const FALLBACK_QUESTION = "What is the first concrete step you will take?";

export type Prompt = {
  text: string;
  kind: InputKind;
  choices: string[] | null;
};

/**
 * The Lock journey.
 *
 * The state machine is the original engine — the server verdict still decides
 * whether to probe again, advance, finalize, or abort. This hook owns it so
 * the interface can be built around it rather than inside it.
 */
export function useLockJourney() {
  const evaluate = useServerFn(evaluateJourney);

  const [phase, setPhase] = useState<Phase>("idle");
  const [state, setState] = useState<JourneyState>("intro");
  const [decision, setDecision] = useState("");
  const [prompt, setPrompt] = useState<Prompt>({
    text: FIRST_QUESTION,
    kind: "text",
    choices: null,
  });
  const [history, setHistory] = useState<Turn[]>([]);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<LockVerdict | null>(null);
  const [seal, setSeal] = useState<LockSeal | null>(null);

  const begin = useCallback(() => {
    setPhase("understanding");
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
    setPrompt({ text: SECOND_QUESTION, kind: "text", choices: null });
    setState("assess_commitment");
    setStep(1);
    setPhase("focus");
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
        setHistory((prev) => [
          ...prev,
          { role: "lock", text: prompt.text },
          { role: "user", text },
        ]);
        setVerdict(result);
        setStep((s) => s + 1);
        if (result.next_state) setState(result.next_state);

        if (result.action === "abort") {
          setPhase("refused");
        } else if (
          result.action === "finalize" ||
          step + 1 >= MAX_STEPS ||
          (result.action === "continue" && !result.followup)
        ) {
          setState("decision");
          setPhase("ready");
        } else {
          setPrompt(nextPrompt(result));
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
    [decision, evaluate, history, pending, prompt.text, state, step],
  );

  /** Called by the Lock control, and only by it. */
  const confirmLock = useCallback(() => {
    setSeal((prev) => prev ?? createSeal());
    setPhase("locked");
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setState("intro");
    setDecision("");
    setPrompt({ text: FIRST_QUESTION, kind: "text", choices: null });
    setHistory([]);
    setStep(0);
    setVerdict(null);
    setSeal(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  /**
   * How close the system is to certainty, 0..1. Read by the Lock mark, never
   * shown as a bar or a count.
   */
  const certainty = useMemo(() => {
    if (phase === "idle") return 0;
    if (phase === "ready" || phase === "locked") return 1;
    if (phase === "refused") return 0;
    const travelled = step / (MAX_STEPS + 1);
    // Confidence from the last verdict nudges the mark, so the journey reads
    // as the system closing in rather than as steps ticking by.
    const lean = verdict ? verdict.confidence * 0.25 : 0;
    return Math.min(0.85, travelled * 0.75 + lean);
  }, [phase, step, verdict]);

  return {
    phase,
    state,
    decision,
    prompt,
    step,
    pending,
    error,
    verdict,
    seal,
    certainty,
    begin,
    captureDecision,
    submitAnswer,
    confirmLock,
    reset,
    dismissError,
  };
}

/** Turn a verdict into the next question and the interaction it deserves. */
function nextPrompt(result: LockVerdict): Prompt {
  const text = result.followup ?? FALLBACK_QUESTION;
  const choices = sanitizeChoices(result.options);
  // A declared kind is honoured only when it is actually answerable: "choice"
  // without usable options would leave the user with nothing to press.
  if (result.input_kind === "choice" && choices) return { text, kind: "choice", choices };
  if (result.input_kind === "scale") return { text, kind: "scale", choices: null };
  if (result.input_kind === "text") return { text, kind: "text", choices: null };
  return choices ? { text, kind: "choice", choices } : { text, kind: "text", choices: null };
}

/** Choices are model output: keep them short, few, and free of chat filler. */
function sanitizeChoices(raw: string[] | null | undefined): string[] | null {
  if (!raw?.length) return null;
  const cleaned = raw
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 48)
    .slice(0, 4);
  return cleaned.length >= 2 ? cleaned : null;
}
