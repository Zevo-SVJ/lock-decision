import { useMemo, useState } from "react";

import { WritingField } from "@/components/decision/Field";
import { SlideToLock } from "@/components/SlideToLock";
import { setChoice, setReason } from "@/lib/decision-actions";
import { compare, lockBlocker, standingSentence, tradeoffFilled } from "@/lib/decision-model";
import type { Decision } from "@/lib/decision-types";

/**
 * Choose, then lock.
 *
 * Everything the person has said is behind them; this screen only asks them to
 * say which one, in their own hand, and then perform the one gesture that ends
 * it. Lock never picks for them — the standing is shown because they built it,
 * not because it is an answer.
 */
export function Choose({
  decision,
  onSave,
  onLock,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
  onLock: () => void;
}) {
  const c = useMemo(() => compare(decision), [decision]);
  const sentence = standingSentence(c);
  const blocker = lockBlocker(decision);

  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const chosen = decision.options.find((o) => o.id === decision.chosenOptionId) ?? null;

  function lock() {
    setSaving(true);
    setFailed(false);
    try {
      onLock();
    } catch (e) {
      console.error(e);
      setFailed(true);
      setSaving(false);
      // A sealed control cannot be re-armed; give the person a fresh one.
      setAttempt((n) => n + 1);
    }
  }

  return (
    <div className="stack">
      {sentence && <p className="guide">{sentence}</p>}

      <ul className="picks">
        {decision.options.map((o) => {
          const standing = c.standings.find((s) => s.option.id === o.id);
          const written = tradeoffFilled(decision, o.id) > 0;
          return (
            <li key={o.id}>
              <button
                type="button"
                className="pick"
                data-on={o.id === decision.chosenOptionId || undefined}
                aria-pressed={o.id === decision.chosenOptionId}
                onClick={() =>
                  onSave(() =>
                    setChoice(decision.id, o.id === decision.chosenOptionId ? null : o.id),
                  )
                }
              >
                <span className="pick-label">{o.label}</span>
                <span className="pick-meta">
                  {c.ready && standing ? `${standing.index} of 100` : ""}
                  {c.ready && standing && written ? " · " : ""}
                  {written ? "trade-off written" : ""}
                </span>
                <span className="pick-mark" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <section className="why">
          <p className="type-meta">Why this one</p>
          <WritingField
            label="Why this one"
            placeholder="One or two lines, for the version of you that reads this in six months."
            rows={3}
            maxLength={1000}
            value={decision.reason}
            onSave={(next) => onSave(() => setReason(decision.id, next))}
          />
        </section>
      )}

      <div className="commit">
        <SlideToLock key={attempt} onConfirm={lock} blocked={blocker} disabled={saving} />
        <p className="commit-note">
          {blocker
            ? "The control will not go all the way until this is settled."
            : "Locking is final. You can archive it later; you cannot un-decide it."}
        </p>
        {failed && (
          <div className="lock-notice">
            <span>Lock could not save this on this device.</span>
            <button type="button" className="notice-retry" onClick={lock}>
              Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
