import { useState } from "react";

import { AddField, EditableLine, WritingField } from "@/components/decision/Field";
import {
  addOption,
  removeOption,
  renameOption,
  setContext,
  setDeadline,
  setQuestion,
} from "@/lib/decision-actions";
import { deadlineLine } from "@/lib/decision-model";
import type { Decision } from "@/lib/decision-types";

/**
 * The frame.
 *
 * What is being decided, and what is on the table. Everything else is offered
 * one piece at a time and only once the piece before it exists, so a person
 * never meets a form — they meet a question, then another one, and each answer
 * makes the next thing appear.
 */
export function Frame({
  decision,
  onSave,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(decision.context.length > 0);
  const [showDeadline, setShowDeadline] = useState(decision.deadline !== null);

  const enough = decision.options.length >= 2;

  return (
    <div className="stack">
      <EditableLine
        as="h2"
        className="type-question frame-question"
        label="the decision"
        placeholder="What are you deciding?"
        value={decision.question}
        onSave={(next) => onSave(() => setQuestion(decision.id, next))}
      />

      <section className="options">
        <p className="type-meta">On the table</p>
        <ul className="option-list">
          {decision.options.map((o) => (
            <li key={o.id} className="option-row">
              {renaming === o.id ? (
                <EditableLine
                  label="option"
                  placeholder="Option"
                  maxLength={120}
                  value={o.label}
                  onSave={(next) => {
                    setRenaming(null);
                    onSave(() => renameOption(decision.id, o.id, next));
                  }}
                />
              ) : (
                <button type="button" className="option-label" onClick={() => setRenaming(o.id)}>
                  {o.label}
                </button>
              )}
              <button
                type="button"
                className="option-drop"
                aria-label={`Remove ${o.label}`}
                onClick={() => onSave(() => removeOption(decision.id, o.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {decision.options.length < 12 && (
          <AddField
            label="Add an option"
            placeholder={decision.options.length === 0 ? "The first option" : "Another option"}
            action="Add"
            onAdd={(text) => onSave(() => addOption(decision.id, text))}
          />
        )}

        {!enough && (
          <p className="guide">
            {decision.options.length === 0
              ? "Two options is the smallest a real decision gets. Even if one of them is doing nothing."
              : "One more. Even if it is “stay as I am”."}
          </p>
        )}
      </section>

      {/* Nothing below this point exists until it is asked for. */}
      {enough && (
        <section className="extras">
          {showContext ? (
            <div className="extra">
              <p className="type-meta">Context — kept on this device, never shared</p>
              <WritingField
                label="Context"
                placeholder="Anything that matters and does not fit above."
                rows={4}
                maxLength={2000}
                value={decision.context}
                onSave={(next) => onSave(() => setContext(decision.id, next))}
              />
            </div>
          ) : (
            <button type="button" className="action-plain" onClick={() => setShowContext(true)}>
              Add context
            </button>
          )}

          {showDeadline ? (
            <div className="extra">
              <p className="type-meta">By when</p>
              <div className="deadline">
                <input
                  type="date"
                  className="deadline-input"
                  aria-label="Deadline"
                  value={decision.deadline ?? ""}
                  onChange={(e) => onSave(() => setDeadline(decision.id, e.target.value || null))}
                />
                {decision.deadline && (
                  <>
                    <span className="deadline-read">{deadlineLine(decision.deadline)}</span>
                    <button
                      type="button"
                      className="action-plain"
                      onClick={() => {
                        setShowDeadline(false);
                        onSave(() => setDeadline(decision.id, null));
                      }}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button type="button" className="action-plain" onClick={() => setShowDeadline(true)}>
              Add a deadline
            </button>
          )}
        </section>
      )}
    </div>
  );
}
