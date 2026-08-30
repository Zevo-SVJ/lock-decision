import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AnswerField } from "@/components/lock/AnswerField";
import { ChoiceList } from "@/components/lock/ChoiceList";
import { LockMark } from "@/components/lock/LockMark";
import { LockResult } from "@/components/lock/LockResult";
import { Reflection } from "@/components/lock/Reflection";
import { ScaleControl } from "@/components/lock/ScaleControl";
import { ShareActions } from "@/components/lock/ShareActions";
import { Tradeoff } from "@/components/lock/Tradeoff";
import { SlideToLock } from "@/components/SlideToLock";
import { useLockJourney, OPENING } from "@/hooks/use-lock-journey";
import { useViewportInset } from "@/hooks/use-viewport-inset";
import { clearInviteFromUrl, readInvite, type Invite } from "@/lib/lock-invite";
import type { ShareFormat } from "@/lib/share-card";

export const Route = createFileRoute("/lock")({
  head: () => ({
    meta: [
      { title: "Lock" },
      { name: "description", content: "A decision instrument." },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "Decide. Then lock it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0b0d" },
    ],
  }),
  component: LockApp,
});

function LockApp() {
  const journey = useLockJourney();
  const { phase, step, pending, failed, verdict, seal, decision } = journey;

  const [text, setText] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [format, setFormat] = useState<ShareFormat>("story");

  useViewportInset();

  // An invitation, if this Lock was handed over by someone else.
  useEffect(() => {
    setInvite(readInvite());
  }, []);

  // Every move arrives clean; nothing carries over from the last one.
  const stepKey = step?.text ?? phase;
  useEffect(() => {
    setText("");
    setLevel(null);
    setPicked(null);
  }, [stepKey]);

  async function send(answer: string) {
    if (phase === "naming") {
      await journey.name(answer);
      return;
    }
    await journey.respond(answer);
  }

  /** Taking up an invitation consumes it: the link leaves the address bar. */
  function begin() {
    clearInviteFromUrl();
    journey.begin();
  }

  function pick(choice: string) {
    if (pending) return;
    setPicked(choice);
    void send(choice);
  }

  /** Only text and scale need a separate confirmation; a tap is its own answer. */
  const needsConfirm = phase === "naming" || (step?.move === "clarify" && step.kind !== "choice");
  const canConfirm =
    step?.move === "clarify" && step.kind === "scale" ? level !== null : text.trim().length > 0;

  function confirm() {
    if (pending) return;
    if (step?.move === "clarify" && step.kind === "scale" && level !== null) {
      void send(`${level} out of 10`);
    } else if (text.trim()) {
      void send(text);
    }
  }

  const headline = phase === "naming" ? OPENING : (step?.text ?? "");
  const carried = phase !== "naming" && step?.move !== "reflect" ? verdict?.reason : null;

  const synthesis = useMemo(
    () => verdict?.synthesis?.trim() || verdict?.reason?.trim() || "",
    [verdict],
  );

  return (
    <>
      <div
        className="lock-ground"
        aria-hidden="true"
        style={{ "--certainty": journey.certainty } as React.CSSProperties}
      />
      <main className="lock-viewport">
        <div
          className="lock-column"
          style={{ "--certainty": journey.certainty } as React.CSSProperties}
        >
          <header className="lock-chrome">
            <LockMark progress={journey.certainty} pulsing={pending} />
            {journey.canGoBack && phase === "working" && !pending && (
              <button type="button" onClick={journey.back} className="chrome-back">
                Back
              </button>
            )}
          </header>

          <section className="lock-stage" data-phase={phase} data-pending={pending || undefined}>
            {phase === "idle" && (
              <div className="state-enter">
                {invite ? (
                  <>
                    <p className="type-meta">
                      {invite.from ? `${invite.from} sent you this` : "Someone sent you this"}
                    </p>
                    <h1 className="type-display invite-prompt">{invite.prompt}</h1>
                  </>
                ) : (
                  <h1 className="type-display">
                    One decision at a time.
                    <span className="type-display-dim"> Then it closes.</span>
                  </h1>
                )}
              </div>
            )}

            {(phase === "naming" || phase === "working") && (
              <div
                key={stepKey}
                className="state-enter"
                data-answering={text.trim().length > 0 || level !== null || undefined}
              >
                {carried && <p className="read-line">{carried}</p>}

                {step?.move === "reflect" ? (
                  <p className="type-reflection">{headline}</p>
                ) : (
                  <h2 className="type-question">{headline}</h2>
                )}

                <div className="answer-zone">
                  {phase === "naming" && (
                    <AnswerField
                      value={text}
                      onChange={setText}
                      onSubmit={confirm}
                      disabled={pending}
                      autoFocus
                      placeholder={invite ? "Your call" : "Say it in one line"}
                    />
                  )}

                  {step?.move === "reflect" && (
                    <Reflection onRespond={pick} disabled={pending} answered={picked} />
                  )}

                  {step?.move === "tradeoff" && (
                    <Tradeoff
                      a={step.a}
                      b={step.b}
                      lean={step.lean}
                      onPick={pick}
                      disabled={pending}
                      picked={picked}
                    />
                  )}

                  {step?.move === "choose" && (
                    <ChoiceList
                      choices={step.choices}
                      selected={picked}
                      onSelect={pick}
                      disabled={pending}
                    />
                  )}

                  {step?.move === "clarify" && step.kind === "choice" && step.choices && (
                    <ChoiceList
                      choices={step.choices}
                      selected={picked}
                      onSelect={pick}
                      disabled={pending}
                    />
                  )}
                  {step?.move === "clarify" && step.kind === "text" && (
                    <AnswerField
                      value={text}
                      onChange={setText}
                      onSubmit={confirm}
                      disabled={pending}
                      autoFocus
                    />
                  )}
                  {step?.move === "clarify" && step.kind === "scale" && (
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
                <p className="read-line">{verdict?.reason ?? "This one is yours."}</p>
                <h2 className="type-statement">{decision}</h2>
              </div>
            )}

            {phase === "locked" && seal && (
              <LockResult
                seal={seal}
                decision={decision}
                synthesis={synthesis}
                format={format}
                onToggleFormat={() => setFormat((f) => (f === "story" ? "square" : "story"))}
              />
            )}

            {phase === "refused" && (
              <div className="state-enter">
                <h2 className="type-statement">Lock won&rsquo;t hold this one.</h2>
                {verdict?.reason && <p className="read-line read-line--after">{verdict.reason}</p>}
              </div>
            )}
          </section>

          <div className="lock-dock">
            {failed && (
              <div className="lock-notice">
                <span>Something interrupted the lock.</span>
                <button type="button" onClick={() => void journey.retry()} className="notice-retry">
                  Again
                </button>
              </div>
            )}

            {phase === "idle" && (
              <button type="button" onClick={begin} className="action action--primary">
                {invite ? "Take it" : "Begin"}
              </button>
            )}

            {needsConfirm && (
              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm || pending}
                className="action action--quiet action--conditional"
                data-shown={canConfirm || undefined}
              >
                Go on
              </button>
            )}

            {phase === "ready" && <SlideToLock onConfirm={journey.confirmLock} />}

            {phase === "locked" && seal && (
              <>
                <ShareActions seal={seal} decision={decision} format={format} />
                <button type="button" onClick={journey.reset} className="action-plain">
                  Another decision
                </button>
              </>
            )}

            {phase === "refused" && (
              <button type="button" onClick={journey.reset} className="action action--quiet">
                Something else
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
