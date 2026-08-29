import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AnswerField } from "@/components/lock/AnswerField";
import { ChoiceList } from "@/components/lock/ChoiceList";
import { LockMark } from "@/components/lock/LockMark";
import { ScaleControl } from "@/components/lock/ScaleControl";
import { SealCard } from "@/components/lock/SealCard";
import { ShareAction } from "@/components/lock/ShareAction";
import { SlideToLock } from "@/components/SlideToLock";
import { useLockJourney } from "@/hooks/use-lock-journey";
import { useViewportInset } from "@/hooks/use-viewport-inset";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock" },
      { name: "description", content: "A decision instrument." },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "A decision instrument." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0e0e10" },
    ],
  }),
  component: LockApp,
});

function LockApp() {
  const journey = useLockJourney();
  const { phase, prompt, pending, error, verdict, seal, decision } = journey;

  const [text, setText] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  useViewportInset();

  // Every question arrives clean; nothing carries over from the last one.
  useEffect(() => {
    setText("");
    setLevel(null);
    setChosen(null);
  }, [prompt.text]);

  async function send(answer: string) {
    if (phase === "understanding") {
      if (journey.captureDecision(answer)) setText("");
      return;
    }
    const ok = await journey.submitAnswer(answer);
    if (ok) setText("");
  }

  function choose(choice: string) {
    if (pending) return;
    setChosen(choice);
    void send(choice);
  }

  const asking = phase === "understanding" || phase === "focus";
  const kind = phase === "understanding" ? "text" : prompt.kind;
  const canContinue = kind === "scale" ? level !== null : text.trim().length > 0;

  function submitCurrent() {
    if (pending) return;
    if (kind === "scale" && level !== null) void send(`${level} out of 10`);
    else if (text.trim()) void send(text);
  }

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />
      <main className="lock-viewport">
        <div className="lock-column">
          <header className="lock-chrome">
            <LockMark progress={journey.certainty} pulsing={pending} />
          </header>

          <section className="lock-stage" data-phase={phase} data-pending={pending || undefined}>
            {phase === "idle" && (
              <div className="state-enter">
                <h1 className="type-display">
                  One decision at a time.
                  <span className="type-display-dim"> Then it closes.</span>
                </h1>
              </div>
            )}

            {asking && (
              <div
                key={prompt.text}
                className="state-enter"
                data-answering={text.trim().length > 0 || level !== null || undefined}
              >
                {phase === "focus" && verdict?.reason && (
                  <p className="read-line">{verdict.reason}</p>
                )}
                <h2 className="type-question">{prompt.text}</h2>

                <div className="answer-zone">
                  {kind === "text" && (
                    <AnswerField
                      value={text}
                      onChange={setText}
                      onSubmit={submitCurrent}
                      disabled={pending}
                      autoFocus
                      placeholder={
                        phase === "understanding" ? "Name it plainly" : "In your own words"
                      }
                    />
                  )}
                  {kind === "choice" && prompt.choices && (
                    <ChoiceList
                      choices={prompt.choices}
                      selected={chosen}
                      onSelect={choose}
                      disabled={pending}
                    />
                  )}
                  {kind === "scale" && (
                    <ScaleControl
                      value={level}
                      onChange={setLevel}
                      disabled={pending}
                      ends={["not at all", "completely"]}
                    />
                  )}
                </div>
              </div>
            )}

            {phase === "ready" && (
              <div className="state-enter">
                <p className="read-line">{verdict?.reason ?? "This is ready."}</p>
                <h2 className="type-statement">{decision}</h2>
              </div>
            )}

            {phase === "locked" && seal && (
              <SealCard seal={seal} decision={decision} statement={verdict?.reason ?? ""} />
            )}

            {phase === "refused" && (
              <div className="state-enter">
                <h2 className="type-statement">Lock won&rsquo;t hold this one.</h2>
                {verdict?.reason && <p className="read-line read-line--after">{verdict.reason}</p>}
              </div>
            )}
          </section>

          <div className="lock-dock">
            {error && (
              <button type="button" onClick={journey.dismissError} className="lock-notice">
                {error}
              </button>
            )}

            {phase === "idle" && (
              <button type="button" onClick={journey.begin} className="action action--primary">
                Begin
              </button>
            )}

            {asking && kind !== "choice" && (
              <button
                type="button"
                onClick={submitCurrent}
                disabled={!canContinue || pending}
                className="action action--quiet action--conditional"
                data-shown={canContinue || undefined}
              >
                Continue
              </button>
            )}

            {phase === "ready" && <SlideToLock onConfirm={journey.confirmLock} />}

            {phase === "locked" && seal && (
              <>
                <ShareAction seal={seal} decision={decision} statement={verdict?.reason ?? ""} />
                <button type="button" onClick={journey.reset} className="action-plain">
                  Lock another
                </button>
              </>
            )}

            {phase === "refused" && (
              <button type="button" onClick={journey.reset} className="action action--quiet">
                Start over
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
