import { useState } from "react";

import { WritingField } from "@/components/decision/Field";
import { saveReview } from "@/lib/decision-actions";
import { relativeDay } from "@/lib/decision-model";
import type { Decision, Review, ReviewVerdict } from "@/lib/decision-types";

/**
 * The look back.
 *
 * The only part of Lock that happens after the fact, and the only part that can
 * make the next decision better. It asks one question, takes an answer in one
 * tap, and then — only then — offers the three that are worth writing down.
 * Nothing here is required and nothing here is scored.
 */

const VERDICTS: { value: ReviewVerdict; label: string; after: string }[] = [
  { value: "yes", label: "Yes", after: "You would make it again." },
  { value: "unsure", label: "Not sure", after: "Still too early, or still mixed." },
  { value: "no", label: "No", after: "You would go the other way now." },
];

const PROMPTS = [
  { key: "happened" as const, ask: "What happened?" },
  { key: "learned" as const, ask: "What did you learn?" },
  { key: "differently" as const, ask: "What would you do differently?" },
];

export function ReviewPanel({
  decision,
  onSave,
  emphasised,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
  emphasised: boolean;
}) {
  const existing = decision.review;
  const [open, setOpen] = useState(existing !== null);

  function put(patch: Partial<Omit<Review, "at">>) {
    const base: Omit<Review, "at"> = {
      verdict: existing?.verdict ?? "unsure",
      happened: existing?.happened ?? "",
      learned: existing?.learned ?? "",
      differently: existing?.differently ?? "",
    };
    onSave(() => saveReview(decision.id, { ...base, ...patch }));
  }

  const answered = VERDICTS.find((v) => v.value === existing?.verdict);

  return (
    <section className="review" data-due={emphasised && !existing ? "" : undefined}>
      <h3 className="review-ask">Was it the right decision?</h3>

      <div className="verdicts" role="radiogroup" aria-label="Was it the right decision?">
        {VERDICTS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="radio"
            aria-checked={existing?.verdict === v.value}
            className="verdict"
            data-on={existing?.verdict === v.value || undefined}
            data-kind={v.value}
            onClick={() => {
              put({ verdict: v.value });
              setOpen(true);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {answered && (
        <p className="review-said">
          {answered.after}
          {existing && <span className="review-when"> Answered {relativeDay(existing.at)}.</span>}
        </p>
      )}

      {open && existing && (
        <div className="review-notes">
          {PROMPTS.map((p) => (
            <div key={p.key} className="review-note">
              <p className="type-meta">{p.ask}</p>
              <WritingField
                label={p.ask}
                placeholder=""
                rows={3}
                maxLength={800}
                value={existing[p.key]}
                onSave={(next) => put(notePatch(p.key, next))}
              />
            </div>
          ))}
          <p className="review-private">Kept on this device. Never on the card.</p>
        </div>
      )}

      {!existing && (
        <p className="review-hint">
          {emphasised
            ? "It has been long enough to know something. One tap is a real answer."
            : "Come back to this when you know how it went."}
        </p>
      )}
    </section>
  );
}

/** Narrow the prompt key back to a literal so the patch keeps its type. */
function notePatch(key: "happened" | "learned" | "differently", value: string) {
  switch (key) {
    case "happened":
      return { happened: value };
    case "learned":
      return { learned: value };
    case "differently":
      return { differently: value };
  }
}

/** Exported so the record can name a verdict without importing the list. */
export function verdictLabel(v: ReviewVerdict): string {
  return VERDICTS.find((x) => x.value === v)?.label ?? v;
}
