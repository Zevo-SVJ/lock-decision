import { useEffect, useRef, useState } from "react";

/**
 * A line of text that is part of the decision rather than part of a form.
 *
 * It reads as the thing itself until it is touched, which is what keeps the
 * workspace from turning into a settings screen.
 */
export function EditableLine({
  value,
  onSave,
  placeholder,
  label,
  as = "p",
  className,
  maxLength = 300,
}: {
  value: string;
  onSave: (next: string) => void;
  placeholder: string;
  label: string;
  as?: "p" | "h1" | "h2";
  className?: string;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === value) {
      setDraft(value);
      return;
    }
    onSave(next);
  }

  if (editing) {
    return (
      <div className="field" data-filled={draft.trim().length > 0 || undefined}>
        <textarea
          ref={ref}
          rows={2}
          className="field-input"
          value={draft}
          aria-label={label}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
        <span className="field-rule" aria-hidden="true" />
      </div>
    );
  }

  const Tag = as;
  return (
    <button type="button" className="editable" onClick={() => setEditing(true)}>
      <Tag className={className}>
        {value || <span className="editable-empty">{placeholder}</span>}
      </Tag>
      <span className="editable-hint" aria-hidden="true">
        Edit
      </span>
      <span className="sr-only">Edit {label}</span>
    </button>
  );
}

/**
 * A block of writing — notes, reasoning, an answer to a prompt. Saves as it
 * settles rather than behind a button, because nothing here is submitted.
 */
export function WritingField({
  value,
  onSave,
  placeholder,
  label,
  rows = 3,
  maxLength = 800,
  autoFocus = false,
}: {
  value: string;
  onSave: (next: string) => void;
  placeholder: string;
  label: string;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="field" data-filled={draft.trim().length > 0 || undefined}>
      <textarea
        rows={rows}
        className="field-input"
        value={draft}
        aria-label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
      />
      <span className="field-rule" aria-hidden="true" />
    </div>
  );
}

/** One input whose only job is to add another thing to a list. */
export function AddField({
  onAdd,
  placeholder,
  label,
  action = "Add",
  maxLength = 120,
  autoFocus = false,
}: {
  onAdd: (text: string) => void;
  placeholder: string;
  label: string;
  action?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const filled = text.trim().length > 0;

  function submit() {
    if (!filled) return;
    onAdd(text);
    setText("");
  }

  return (
    <div className="add-field" data-filled={filled || undefined}>
      <input
        type="text"
        className="add-input"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        enterKeyHint="done"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button type="button" className="add-go" onClick={submit} disabled={!filled}>
        {action}
      </button>
      <span className="field-rule" aria-hidden="true" />
    </div>
  );
}
