import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * A single field. No avatars, no bubbles, no sent history — the user answers
 * and the answer is gone.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  pending = false,
  placeholder = "In your own words",
  autoFocus = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the answer, up to the cap set in CSS.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const disabled = !value.trim() || pending;

  return (
    <div className="lock-composer">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled) onSubmit();
          }
        }}
        placeholder={placeholder}
        enterKeyHint="send"
        autoComplete="off"
        spellCheck
        className="lock-input"
        aria-label="Your answer"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="lock-send"
        aria-label={pending ? "Working" : "Submit answer"}
      >
        {pending ? (
          <span className="anim-breathe block h-2 w-2 rounded-full bg-current" />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M12 19V5M12 5l-6 6M12 5l6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
