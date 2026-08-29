type Props = {
  options: string[];
  selected: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
};

/** Predefined stances, presented as system choices rather than quick replies. */
export function OptionList({ options, selected, onSelect, disabled = false }: Props) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Choose a stance">
      {options.map((option, i) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          data-selected={selected === option}
          onClick={() => onSelect(option)}
          className="lock-option anim-enter"
          style={{ animationDelay: `${60 + i * 45}ms` }}
        >
          <span className="lock-option-dot" aria-hidden="true" />
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}
