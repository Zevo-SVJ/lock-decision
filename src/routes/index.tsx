import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Lock as LockIcon, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

import { SlideToLock } from "@/components/SlideToLock";
import { evaluateJourney } from "@/lib/lock.functions";
import type { JourneyState, LockVerdict, Turn } from "@/lib/lock-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock — Decide once, then commit" },
      {
        name: "description",
        content:
          "Lock is a focused commitment ritual: name your decision, answer a few AI questions, then slide to lock it in.",
      },
      { property: "og:title", content: "Lock — Decide once, then commit" },
      {
        property: "og:description",
        content: "Name your decision, answer a few AI questions, then slide to lock it in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockApp,
});

type Phase = "intro" | "decision" | "journey" | "commit" | "complete" | "aborted";

const MAX_STEPS = 5;
const FIRST_QUESTION = "What exactly are you deciding? Say it in one sentence.";

function LockApp() {
  const evaluate = useServerFn(evaluateJourney);

  const [phase, setPhase] = useState<Phase>("intro");
  const [state, setState] = useState<JourneyState>("intro");
  const [decision, setDecision] = useState("");
  const [question, setQuestion] = useState(FIRST_QUESTION);
  const [history, setHistory] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<LockVerdict | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function begin() {
    setPhase("decision");
    setState("explore");
  }

  function startJourney() {
    const d = answer.trim();
    if (!d) return;
    setDecision(d);
    setHistory([
      { role: "lock", text: FIRST_QUESTION },
      { role: "user", text: d },
    ]);
    setAnswer("");
    setQuestion("Why now? What changes if you commit today instead of later?");
    setState("assess_commitment");
    setStep(1);
    setPhase("journey");
  }

  async function submitAnswer() {
    const text = answer.trim();
    if (!text || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await evaluate({
        data: { state, decision, history, answer: text, step },
      });
      const nextHistory: Turn[] = [
        ...history,
        { role: "lock", text: question },
        { role: "user", text: text },
      ];
      setHistory(nextHistory);
      setAnswer("");
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
        setPhase("commit");
      } else {
        setQuestion(result.followup ?? "What is the first concrete step you will take?");
        if (result.action === "ask_followup") setState("assess_commitment");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setPhase("intro");
    setState("intro");
    setDecision("");
    setQuestion(FIRST_QUESTION);
    setHistory([]);
    setAnswer("");
    setStep(0);
    setVerdict(null);
    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-14 pb-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LockIcon size={16} strokeWidth={2.4} className="text-primary" />
          <span className="text-[13px] font-semibold tracking-[0.42em] uppercase">Lock</span>
        </div>
        {phase !== "intro" && <Progress phase={phase} step={step} />}
      </header>

      {phase === "intro" && (
        <section className="lock-rise flex flex-1 flex-col justify-center">
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight">
            Decide once.
            <br />
            <span className="text-muted-foreground">Then commit.</span>
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
            Lock walks you through a short reflection, tests whether you actually mean it, and ends
            with one deliberate gesture.
          </p>
          <button
            onClick={begin}
            className="mt-12 h-14 w-full rounded-full bg-primary text-[15px] font-semibold tracking-wide text-primary-foreground transition active:scale-[0.985]"
          >
            Begin
          </button>
        </section>
      )}

      {(phase === "decision" || phase === "journey") && (
        <section className="flex flex-1 flex-col justify-between pt-16">
          <div key={question} className="lock-rise">
            <p className="text-[11px] tracking-[0.32em] text-muted-foreground uppercase">
              {phase === "decision" ? "Your decision" : stateLabel(state)}
            </p>
            <h2 className="mt-5 text-[1.65rem] leading-snug font-medium tracking-tight">
              {question}
            </h2>
            {phase === "journey" && verdict?.reason && (
              <p className="mt-5 border-l border-border pl-4 text-[14px] leading-relaxed text-muted-foreground">
                {verdict.reason}
              </p>
            )}
          </div>

          <div className="mt-10">
            {error && (
              <div className="mb-4 rounded-2xl bg-secondary px-4 py-3 text-[13px] text-muted-foreground">
                {error} Your answer is still here.
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="Answer in your own words…"
                className="min-h-[92px] flex-1 resize-none rounded-3xl bg-secondary px-5 py-4 text-[16px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={phase === "decision" ? startJourney : submitAnswer}
                disabled={!answer.trim() || pending}
                aria-label="Continue"
                className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-30 active:scale-95"
              >
                {pending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <ArrowUp size={20} strokeWidth={2.6} />
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "commit" && (
        <section className="lock-rise flex flex-1 flex-col justify-between pt-16">
          <div>
            <p className="text-[11px] tracking-[0.32em] text-muted-foreground uppercase">
              Your commitment
            </p>
            <h2 className="mt-5 text-[1.75rem] leading-snug font-medium tracking-tight">
              {decision}
            </h2>
            {verdict?.reason && (
              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                {verdict.reason}
              </p>
            )}
          </div>
          <div className="pb-2">
            <SlideToLock onConfirm={() => setPhase("complete")} />
          </div>
        </section>
      )}

      {phase === "complete" && (
        <section className="lock-rise flex flex-1 flex-col justify-center text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
            style={{ boxShadow: "var(--shadow-lift)" }}
          >
            <LockIcon size={26} strokeWidth={2.4} />
          </div>
          <p className="mt-8 text-[11px] tracking-[0.32em] text-muted-foreground uppercase">
            Locked
          </p>
          <h2 className="mt-4 text-[1.6rem] leading-snug font-medium tracking-tight">{decision}</h2>
          <p className="mt-6 text-[14px] leading-relaxed text-muted-foreground">
            {verdict?.reason ?? "You committed. Nothing left to decide."}
          </p>
          <button
            onClick={reset}
            className="mx-auto mt-12 flex items-center gap-2 text-[13px] tracking-wide text-muted-foreground"
          >
            <RotateCcw size={14} /> Lock another decision
          </button>
        </section>
      )}

      {phase === "aborted" && (
        <section className="lock-rise flex flex-1 flex-col justify-center">
          <h2 className="text-[1.6rem] leading-snug font-medium tracking-tight">
            Lock won't hold this one.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            {verdict?.reason}
          </p>
          <button
            onClick={reset}
            className="mt-10 h-14 w-full rounded-full bg-secondary text-[15px] font-medium"
          >
            Start over
          </button>
        </section>
      )}
    </main>
  );
}

function stateLabel(state: JourneyState) {
  if (state === "explore") return "Exploring";
  if (state === "assess_commitment") return "Testing commitment";
  if (state === "decision") return "Decision";
  return "Lock";
}

function Progress({ phase, step }: { phase: Phase; step: number }) {
  const done = phase === "complete" || phase === "commit" ? MAX_STEPS : step;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_STEPS }).map((_, i) => (
        <span
          key={i}
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: i < done ? 14 : 6,
            backgroundColor:
              i < done ? "var(--primary)" : "color-mix(in oklab, var(--foreground) 22%, transparent)",
          }}
        />
      ))}
    </div>
  );
}
