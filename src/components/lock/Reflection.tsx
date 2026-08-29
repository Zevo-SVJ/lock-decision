type Props = {
  onRespond: (answer: string) => void;
  disabled?: boolean;
  answered: string | null;
};

export const REFLECTION_YES = "That's it.";
export const REFLECTION_NO = "Not quite.";

/**
 * A reflection is not a question.
 *
 * Lock states what the decision appears to actually be about, and the person
 * either recognises it or does not. Both answers are worth more than three
 * clarifying questions, so the two responses carry equal weight.
 */
export function Reflection({ onRespond, disabled = false, answered }: Props) {
  return (
    <div className="reflection-reply" role="group" aria-label="Respond to this">
      {[REFLECTION_YES, REFLECTION_NO].map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          data-selected={answered === label || undefined}
          onClick={() => onRespond(label)}
          className="reflection-button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
