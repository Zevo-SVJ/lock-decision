import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Choose } from "@/components/decision/Choose";
import { Compare } from "@/components/decision/Compare";
import { Frame } from "@/components/decision/Frame";
import { LockedDetail } from "@/components/decision/LockedDetail";
import { Tradeoffs } from "@/components/decision/Tradeoffs";
import { lockDecision } from "@/lib/decision-actions";
import { compare, hasAnyTradeoff, nextGap } from "@/lib/decision-model";
import { useDecision, useStoreReady } from "@/lib/decision-store";

export const Route = createFileRoute("/decisions/$id")({
  head: () => ({ meta: [{ title: "Lock — a decision" }] }),
  component: Workspace,
});

type Stage = "frame" | "compare" | "tradeoffs" | "choose";

const STAGES: { key: Stage; label: string }[] = [
  { key: "frame", label: "Frame" },
  { key: "compare", label: "Compare" },
  { key: "tradeoffs", label: "Trade-offs" },
  { key: "choose", label: "Choose" },
];

/**
 * One decision, from the first line of it to the moment it closes.
 *
 * This is one surface that changes what it is showing, not four pages: the
 * spine along the top is where you are in the same object, and the decision
 * underneath it never reloads, never scrolls away, and is saved the instant
 * anything about it changes.
 */
function Workspace() {
  const { id } = Route.useParams();
  const decision = useDecision(id);
  const ready = useStoreReady();

  const [stage, setStage] = useState<Stage>("frame");
  const [failed, setFailed] = useState(false);
  const [sealed, setSealed] = useState(false);

  // Land on the part that still needs a person, not always at the beginning.
  const gap = decision ? nextGap(decision) : null;
  useEffect(() => {
    if (!decision || decision.status !== "active") return;
    setStage(
      gap === "options" ? "frame" : gap === "criteria" || gap === "ratings" ? "compare" : "choose",
    );
    // Only on arrival: after that the person is steering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision?.id]);

  const onSave = useCallback((fn: () => void) => {
    try {
      fn();
      setFailed(false);
    } catch (e) {
      console.error(e);
      setFailed(true);
    }
  }, []);

  if (!ready) {
    return (
      <Shell>
        <p className="guide">Opening…</p>
      </Shell>
    );
  }

  if (!decision) {
    return (
      <Shell>
        <h1 className="type-question">That decision is not on this device.</h1>
        <p className="guide">
          Decisions are kept on the device they were made on. If you locked this one somewhere else,
          it is still there.
        </p>
        <Link to="/decisions" className="action action--quiet">
          Your record
        </Link>
      </Shell>
    );
  }

  const locked = decision.status !== "active";
  const c = compare(decision);

  return (
    <Shell question={decision.question} sealed={sealed}>
      {failed && (
        <div className="lock-notice work-notice">
          <span>Lock could not save that on this device.</span>
        </div>
      )}

      {locked ? (
        <LockedDetail decision={decision} onSave={onSave} />
      ) : (
        <>
          <nav className="spine" aria-label="This decision">
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                className="spine-step"
                data-on={stage === s.key || undefined}
                aria-current={stage === s.key ? "step" : undefined}
                onClick={() => setStage(s.key)}
              >
                <span className="spine-label">{s.label}</span>
                <span
                  className="spine-dot"
                  data-done={
                    stageDone(
                      s.key,
                      decision.options.length,
                      c.missing,
                      hasAnyTradeoff(decision),
                      decision.chosenOptionId,
                    ) || undefined
                  }
                  aria-hidden="true"
                />
              </button>
            ))}
          </nav>

          <div key={stage} className="stage-enter">
            {stage === "frame" && <Frame decision={decision} onSave={onSave} />}
            {stage === "compare" && <Compare decision={decision} onSave={onSave} />}
            {stage === "tradeoffs" && <Tradeoffs decision={decision} onSave={onSave} />}
            {stage === "choose" && (
              <Choose
                decision={decision}
                onSave={onSave}
                onLock={() => {
                  lockDecision(decision.id);
                  setSealed(true);
                }}
              />
            )}
          </div>

          {stage !== "choose" && (
            <div className="onward">
              <button
                type="button"
                className="action action--quiet"
                onClick={() => setStage(nextStage(stage))}
              >
                {stage === "frame"
                  ? "What matters"
                  : stage === "compare"
                    ? "What it costs"
                    : "Choose"}
              </button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function nextStage(stage: Stage): Stage {
  return stage === "frame" ? "compare" : stage === "compare" ? "tradeoffs" : "choose";
}

/** A step is done when there is nothing obviously missing from it. */
function stageDone(
  stage: Stage,
  options: number,
  missingRatings: number,
  tradeoffs: boolean,
  chosen: string | null,
): boolean {
  if (stage === "frame") return options >= 2;
  if (stage === "compare") return options >= 2 && missingRatings === 0;
  if (stage === "tradeoffs") return tradeoffs;
  return chosen !== null;
}

function Shell({
  children,
  question,
  sealed,
}: {
  children: React.ReactNode;
  question?: string;
  sealed?: boolean;
}) {
  return (
    <>
      <div className="lock-ground" aria-hidden="true" />
      <div className="work" data-sealed={sealed || undefined}>
        <header className="work-chrome">
          <Link to="/decisions" className="chrome-back">
            Record
          </Link>
          {question && <p className="work-question">{question}</p>}
        </header>
        <main className="work-body">{children}</main>
      </div>
    </>
  );
}
