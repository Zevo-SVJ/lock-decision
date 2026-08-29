type Props = {
  choices: string[];
  selected: string | null;
  onSelect: (choice: string) => void;
  disabled?: boolean;
};

/**
 * Stances offered by the system.
 *
 * Rows on a hairline grid rather than cards or quick replies — choosing one is
 * the whole interaction, so there is nothing else on screen to confirm it.
 */
export function ChoiceList({ choices, selected, onSelect, disabled = false }: Props) {
  return (
    <div className="choice-list" role="group" aria-label="Choose one">
      {choices.map((choice, i) => (
        <button
          key={choice}
          type="button"
          disabled={disabled}
          data-selected={selected === choice || undefined}
          onClick={() => onSelect(choice)}
          className="choice-row"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="choice-label">{choice}</span>
          <span className="choice-mark" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
