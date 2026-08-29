import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Composer } from "@/components/lock/Composer";
import { LockMark } from "@/components/lock/LockMark";
import { OptionList } from "@/components/lock/OptionList";
import { ProgressArc } from "@/components/lock/ProgressArc";
import { SealCard } from "@/components/lock/SealCard";
import { SlideToLock } from "@/components/SlideToLock";
import { useLockJourney } from "@/hooks/use-lock-journey";
import { useViewportInset } from "@/hooks/use-viewport-inset";
import type { JourneyState } from "@/lib/lock-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock" },
      {
        name: "description",
        content: "Lock is a decision instrument. Name it, hold it, commit.",
      },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Name it. Hold it. Commit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#111113" },
    ],
  }),
  component: LockApp,
});

function LockApp() {
  const journey = useLockJourney();
  const { phase, question, options, pending, error, verdict, seal, decision } = journey;

  const [answer, setAnswer] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);

  useViewportInset();

  // Each new question arrives clean — nothing carries over from the last one.
  useEffect(() => {
    setAnswer("");
    setChosen(null);
  }, [question]);

  async function send(raw: string) {
    if (phase === "decision") {
      if (journey.captureDecision(raw)) setAnswer("");
      return;
    }
    const ok = await journey.submitAnswer(raw);
    if (ok) setAnswer("");
  }

  function choose(option: string) {
    if (pending) return;
    setChosen(option);
    void send(option);
  }

  const asking = phase === "decision" || phase === "journey";

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />
      <main className="lock-viewport">
        <div className="lock-column">
          <header className="flex h-14 shrink-0 items-center justify-between text-fg-2">
            <LockMark />
            {phase !== "intro" && (
              <span className="text-fg-2">
                <ProgressArc value={journey.progress} />
              </span>
            )}
          </header>

          <section className="lock-stage">
            {phase === "intro" && (
              <div className="stage-bias">
                <p className="type-meta anim-enter">Standby</p>
                <h1 className="type-question anim-enter anim-enter-1 mt-7 text-balance">
                  One decision at a time.
                  <br />
                  Then it closes.
                </h1>
                <p className="type-body anim-enter anim-enter-2 mt-6 max-w-[30ch]">
                  Lock asks what it needs to, then hands you the control.
                </p>
              </div>
            )}

            {asking && (
              <div key={question} className="anim-settle stage-bias">
                <p className="type-meta">{stateLabel(journey.state)}</p>
                <h2 className="type-question mt-7 text-balance">{question}</h2>
                {phase === "journey" && verdict?.reason && (
                  <p className="type-body mt-7 border-l border-white/10 pl-4 text-fg-3">
                    {verdict.reason}
                  </p>
                )}
              </div>
            )}

            {phase === "commit" && (
              <div className="anim-settle stage-bias">
                <p className="type-meta">Commitment</p>
                <h2 className="type-statement mt-7 text-balance">{decision}</h2>
                {verdict?.reason && <p className="type-body mt-6 text-fg-2">{verdict.reason}</p>}
              </div>
            )}

            {phase === "complete" && seal && (
              <SealCard seal={seal} decision={decision} statement={verdict?.reason ?? ""} />
            )}

            {phase === "aborted" && (
              <div className="anim-enter stage-bias">
                <p className="type-meta">Refused</p>
                <h2 className="type-statement mt-7 text-balance">Lock won't hold this one.</h2>
                {verdict?.reason && <p className="type-body mt-6">{verdict.reason}</p>}
              </div>
            )}
          </section>

          <div className="lock-dock">
            {phase === "intro" && (
              <button
                type="button"
                onClick={journey.begin}
                className="lock-action anim-enter anim-enter-3"
              >
                Begin
              </button>
            )}

            {asking && (
              <div className="flex flex-col gap-3">
                {error && (
                  <button
                    type="button"
                    onClick={journey.dismissError}
                    className="lock-notice"
                    aria-live="polite"
                  >
                    {error}
                  </button>
                )}
                {options && (
                  <OptionList
                    options={options}
                    selected={chosen}
                    onSelect={choose}
                    disabled={pending}
                  />
                )}
                <Composer
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={() => void send(answer)}
                  pending={pending}
                  placeholder={phase === "decision" ? "Name the decision" : "In your own words"}
                />
              </div>
            )}

            {phase === "commit" && <SlideToLock onConfirm={journey.confirmLock} />}

            {(phase === "complete" || phase === "aborted") && (
              <button
                type="button"
                onClick={journey.reset}
                className="lock-action lock-action--quiet"
              >
                {phase === "complete" ? "Lock another decision" : "Start over"}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/** Cold, structural labels. They name the stage, they don't narrate it. */
function stateLabel(state: JourneyState): string {
  switch (state) {
    case "explore":
      return "Subject";
    case "assess_commitment":
      return "Assessment";
    case "decision":
      return "Commitment";
    case "complete":
      return "Sealed";
    default:
      return "Standby";
  }
}
