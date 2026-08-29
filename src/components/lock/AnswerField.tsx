import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Focus on mount — used when a question resolves to a text interaction. */
  autoFocus?: boolean;
};

/**
 * A focused answer surface.
 *
 * Deliberately not a composer: no container, no send button, no history. The
 * answer is written on the same plane as the question, under a single rule
 * that responds to focus, and it leaves as soon as it is submitted.
 */
export function AnswerField({
  value,
  onChange,
  onSubmit,
  placeholder = "In your own words",
  disabled = false,
  autoFocus = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the answer rather than scrolling inside a fixed box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    // Wait a frame so the entering transition doesn't fight the keyboard.
    const t = window.setTimeout(() => ref.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  return (
    <div className="answer-field" data-filled={value.trim().length > 0 || undefined}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        enterKeyHint="go"
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        aria-label="Your answer"
        className="answer-input"
      />
      <span className="answer-rule" aria-hidden="true" />
    </div>
  );
}
