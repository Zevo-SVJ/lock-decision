import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { verdictLabel } from "@/components/decision/Review";
import { LockGlyph } from "@/components/lock/LockGlyph";
import {
  compare,
  deadlineLine,
  nextGap,
  relativeDay,
  reviewStats,
  shelfOf,
  type Shelf,
} from "@/lib/decision-model";
import { createDecision, useDecisions, useStoreReady } from "@/lib/decision-store";
import type { Decision } from "@/lib/decision-types";

export const Route = createFileRoute("/decisions/")({
  head: () => ({
    meta: [
      { title: "Lock — your decisions" },
      { name: "description", content: "Every decision you have locked, and how they turned out." },
    ],
  }),
  component: Record,
});

const SHELVES: { key: Shelf; title: string; note: string }[] = [
  { key: "review", title: "Worth a look back", note: "Locked long enough ago to know something." },
  { key: "active", title: "Still open", note: "" },
  { key: "locked", title: "Locked", note: "" },
  { key: "archived", title: "Archived", note: "" },
];

/**
 * The record.
 *
 * Not a dashboard. This is the list of decisions a person has actually made,
 * in the order they made them, and the only thing it is trying to do is let
 * them find one and open it. There are no charts, no counters and no filters:
 * the four shelves are the only division that means anything, and a shelf that
 * is empty is not shown at all.
 */
function Record() {
  const decisions = useDecisions();
  const ready = useStoreReady();
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [failed, setFailed] = useState(false);

  const shelves = useMemo(() => {
    const now = new Date();
    const grouped = new Map<Shelf, Decision[]>();
    for (const d of decisions) {
      const shelf = shelfOf(d, now);
      const list = grouped.get(shelf) ?? [];
      list.push(d);
      grouped.set(shelf, list);
    }
    return grouped;
  }, [decisions]);

  const stats = useMemo(() => reviewStats(decisions), [decisions]);

  function start() {
    const text = question.trim();
    if (!text) return;
    try {
      const created = createDecision(text);
      setQuestion("");
      setAsking(false);
      void navigate({ to: "/decisions/$id", params: { id: created.id } });
    } catch (e) {
      console.error(e);
      setFailed(true);
    }
  }

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />
      <div className="work">
        <header className="work-chrome">
          <Link to="/" className="chrome-back">
            Lock
          </Link>
          <Link to="/lock" className="chrome-link">
            Guided
          </Link>
        </header>

        <main className="work-body">
          <h1 className="type-question record-title">Your decisions</h1>

          {asking ? (
            <div className="ask">
              <label className="type-meta" htmlFor="new-question">
                What are you deciding?
              </label>
              <div className="field" data-filled={question.trim().length > 0 || undefined}>
                <textarea
                  id="new-question"
                  rows={2}
                  className="field-input"
                  value={question}
                  maxLength={300}
                  autoFocus
                  placeholder="Say it in one line"
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      start();
                    }
                  }}
                />
                <span className="field-rule" aria-hidden="true" />
              </div>
              <div className="ask-actions">
                <button
                  type="button"
                  className="action action--primary"
                  onClick={start}
                  disabled={!question.trim()}
                >
                  Start it
                </button>
                <button type="button" className="action-plain" onClick={() => setAsking(false)}>
                  Not now
                </button>
              </div>
              {failed && <p className="guide">Lock could not save that on this device.</p>}
            </div>
          ) : (
            <button
              type="button"
              className="action action--primary record-new"
              onClick={() => setAsking(true)}
            >
              New decision
            </button>
          )}

          {!ready && <p className="guide">Opening…</p>}

          {ready && decisions.length === 0 && !asking && (
            <div className="record-empty">
              <p className="guide">
                Nothing here yet. The first one you lock stays here, with what you decided and why.
              </p>
              <Link to="/lock" className="action action--quiet">
                Or let Lock walk you through one
              </Link>
            </div>
          )}

          {SHELVES.map((shelf) => {
            const items = shelves.get(shelf.key);
            if (!items || items.length === 0) return null;
            return (
              <section key={shelf.key} className="shelf">
                <p className="type-meta shelf-title">{shelf.title}</p>
                {shelf.note && <p className="shelf-note">{shelf.note}</p>}
                <ul className="entries">
                  {items.map((d) => (
                    <li key={d.id}>
                      <Link
                        to="/decisions/$id"
                        params={{ id: d.id }}
                        className="entry"
                        data-shelf={shelf.key}
                      >
                        <span className="entry-mark" aria-hidden="true">
                          <LockGlyph
                            progress={d.status === "active" ? 0 : 1}
                            size={15}
                            className={d.status === "active" ? "" : "is-check"}
                          />
                        </span>
                        <span className="entry-body">
                          <span className="entry-question">{d.question}</span>
                          <span className="entry-meta">{entryLine(d)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {ready && stats.reviewed > 0 && (
            <section className="pattern">
              <p className="type-meta">Looking back</p>
              {stats.enough ? (
                <p className="pattern-read">
                  You have reviewed {stats.reviewed} decisions. {stats.yes} you would make again,{" "}
                  {stats.unsure} you are still unsure about, {stats.no} you would not.
                </p>
              ) : (
                <p className="pattern-read">
                  {stats.reviewed} reviewed so far. Lock will not read anything into a handful —
                  {stats.remaining === 1 ? " one more" : ` ${stats.remaining} more`} and there is
                  something worth saying.
                </p>
              )}
            </section>
          )}

          {ready && decisions.length > 0 && (
            <p className="record-foot">
              Kept on this device. Lock has no account and no server to put them on.
            </p>
          )}
        </main>
      </div>
    </>
  );
}

/** One line under the question: whatever is actually true of this decision. */
function entryLine(d: Decision): string {
  if (d.status === "active") {
    const gap = nextGap(d);
    const parts: string[] = [];
    if (d.options.length > 0) {
      parts.push(`${d.options.length} option${d.options.length === 1 ? "" : "s"}`);
    }
    if (gap === "options") parts.push("needs a second option");
    else if (gap === "criteria") parts.push("nothing weighed yet");
    else if (gap === "ratings") parts.push(`${compare(d).missing} to rate`);
    else if (gap === "choice") parts.push("ready to choose");
    if (d.deadline) parts.push(deadlineLine(d.deadline).toLowerCase());
    parts.push(`started ${relativeDay(d.createdAt)}`);
    return parts.join(" · ");
  }

  const chosen = d.options.find((o) => o.id === d.chosenOptionId);
  const parts: string[] = [];
  if (chosen) parts.push(`You chose ${chosen.label}`);
  if (d.lockedAt) parts.push(`locked ${relativeDay(d.lockedAt)}`);
  if (d.review) parts.push(`reviewed: ${verdictLabel(d.review.verdict).toLowerCase()}`);
  return parts.join(" · ");
}
