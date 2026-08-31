import { useEffect, useState } from "react";

import { AddField, WritingField } from "@/components/decision/Field";
import { addTradeoffItem, patchTradeoff, removeTradeoffItem } from "@/lib/decision-actions";
import { tradeoffFilled } from "@/lib/decision-model";
import { emptyTradeoff, type Decision, type Tradeoff } from "@/lib/decision-types";

/**
 * Trade-offs.
 *
 * The screen that does the actual work. Every option costs something, and the
 * point of this one is that the cost is written down in the person's own words
 * before they choose, so the choice is made with its price visible.
 *
 * The balance is one object rather than two lists: a single line with what the
 * option gives you resting above it and what it takes below it. The four edges
 * underneath are the questions people skip — the upside they are really after,
 * the downside they are discounting, the risk, and the thing they cannot know
 * yet — and each one stays out of the way until it is answered.
 */

type EdgeKey = "upside" | "downside" | "risk" | "uncertainty";

const EDGES: { key: EdgeKey; ask: string; hint: string }[] = [
  {
    key: "upside",
    ask: "The biggest upside",
    hint: "If this goes well, what is the best of it?",
  },
  {
    key: "downside",
    ask: "The biggest downside",
    hint: "The part you would rather not say out loud.",
  },
  {
    key: "risk",
    ask: "The risk",
    hint: "What could actually go wrong, not what might.",
  },
  {
    key: "uncertainty",
    ask: "What you cannot know yet",
    hint: "The thing only time answers.",
  },
];

export function Tradeoffs({
  decision,
  onSave,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
}) {
  const [activeId, setActiveId] = useState(decision.options[0]?.id ?? "");

  // Options can be removed from another stage; never sit on a dead one.
  useEffect(() => {
    if (!decision.options.some((o) => o.id === activeId)) {
      setActiveId(decision.options[0]?.id ?? "");
    }
  }, [activeId, decision.options]);

  const option = decision.options.find((o) => o.id === activeId);
  if (!option) {
    return <p className="guide">Add your options first and Lock will take them one at a time.</p>;
  }

  const t: Tradeoff = decision.tradeoffs[option.id] ?? emptyTradeoff();

  return (
    <div className="stack">
      {decision.options.length > 1 && (
        <div className="switcher" role="tablist" aria-label="Option">
          {decision.options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={o.id === activeId}
              className="switch"
              data-on={o.id === activeId || undefined}
              onClick={() => setActiveId(o.id)}
            >
              {o.label}
              {tradeoffFilled(decision, o.id) > 0 && (
                <span className="switch-dot" aria-label=", written" />
              )}
            </button>
          ))}
        </div>
      )}

      <p className="guide">
        If you take <strong>{option.label}</strong> — what do you get, and what does it cost you?
      </p>

      <section className="balance" aria-label={`What ${option.label} gains and costs`}>
        <div className="balance-half balance-half--gain">
          <p className="type-meta balance-label">You gain</p>
          <ul className="balance-items">
            {t.gains.map((item, i) => (
              <li key={`${item}-${i}`} className="balance-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="balance-drop"
                  aria-label={`Remove ${item}`}
                  onClick={() =>
                    onSave(() => removeTradeoffItem(decision.id, option.id, "gains", i))
                  }
                >
                  ×
                </button>
              </li>
            ))}
            {t.gains.length === 0 && <li className="balance-empty">Nothing named yet</li>}
          </ul>
        </div>

        <div className="balance-spine" aria-hidden="true" />

        <div className="balance-half balance-half--give">
          <ul className="balance-items">
            {t.gives.map((item, i) => (
              <li key={`${item}-${i}`} className="balance-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="balance-drop"
                  aria-label={`Remove ${item}`}
                  onClick={() =>
                    onSave(() => removeTradeoffItem(decision.id, option.id, "gives", i))
                  }
                >
                  ×
                </button>
              </li>
            ))}
            {t.gives.length === 0 && <li className="balance-empty">Nothing named yet</li>}
          </ul>
          <p className="type-meta balance-label">You give up</p>
        </div>
      </section>

      <div className="balance-adds">
        <AddField
          key={`gain-${option.id}`}
          label={`Something ${option.label} gains you`}
          placeholder="Something you gain"
          action="Gain"
          maxLength={160}
          onAdd={(text) => onSave(() => addTradeoffItem(decision.id, option.id, "gains", text))}
        />
        <AddField
          key={`give-${option.id}`}
          label={`Something ${option.label} costs you`}
          placeholder="Something you give up"
          action="Give"
          maxLength={160}
          onAdd={(text) => onSave(() => addTradeoffItem(decision.id, option.id, "gives", text))}
        />
      </div>

      <div className="edges">
        {EDGES.map((edge) => (
          <EdgeRow
            key={`${option.id}-${edge.key}`}
            ask={edge.ask}
            hint={edge.hint}
            value={t[edge.key]}
            onSave={(next) =>
              onSave(() => patchTradeoff(decision.id, option.id, edgePatch(edge.key, next)))
            }
          />
        ))}
      </div>

      <section className="crux">
        <EdgeRow
          key={`${option.id}-crux`}
          ask="If it comes down to one thing"
          hint="One sentence. The thing the whole decision actually turns on."
          value={t.crux}
          statement
          onSave={(next) => onSave(() => patchTradeoff(decision.id, option.id, { crux: next }))}
        />
      </section>
    </div>
  );
}

/** Narrow the key back to a literal so the patch keeps its type. */
function edgePatch(key: EdgeKey, value: string): Partial<Tradeoff> {
  switch (key) {
    case "upside":
      return { upside: value };
    case "downside":
      return { downside: value };
    case "risk":
      return { risk: value };
    case "uncertainty":
      return { uncertainty: value };
  }
}

/**
 * A question that stays quiet until it is answered, and reads as a statement
 * afterwards. Empty prompts are an invitation, not a blank field.
 */
function EdgeRow({
  ask,
  hint,
  value,
  onSave,
  statement = false,
}: {
  ask: string;
  hint: string;
  value: string;
  onSave: (next: string) => void;
  statement?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="edge" data-open="">
        <p className="type-meta">{ask}</p>
        {hint && <p className="edge-hint">{hint}</p>}
        <WritingField
          label={ask}
          placeholder=""
          rows={statement ? 2 : 3}
          maxLength={300}
          autoFocus
          value={value}
          onSave={(next) => {
            onSave(next.trim());
            setOpen(false);
          }}
        />
        <button type="button" className="action-plain edge-done" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="edge"
      data-filled={value ? "" : undefined}
      onClick={() => setOpen(true)}
    >
      <span className="type-meta edge-ask">{ask}</span>
      {value ? (
        <span className={statement ? "edge-statement" : "edge-answer"}>{value}</span>
      ) : (
        <span className="edge-invite">{hint || "Say it"}</span>
      )}
    </button>
  );
}
