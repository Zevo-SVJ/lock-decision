type Props = {
  a: string;
  b: string;
  /** 0 = entirely toward A, 1 = entirely toward B. */
  lean: number;
  onPick: (side: string) => void;
  disabled?: boolean;
  picked: string | null;
};

/**
 * The tension made visible.
 *
 * Two things the decision is actually between, weighted by where the person
 * already leans. The weights are read, not adjusted — this is a mirror, and
 * the only interaction is choosing a side.
 */
export function Tradeoff({ a, b, lean, onPick, disabled = false, picked }: Props) {
  const weights = [
    { label: a, weight: 1 - lean },
    { label: b, weight: lean },
  ];

  return (
    <div className="tradeoff">
      <div className="tradeoff-scales" aria-hidden="true">
        {weights.map(({ label, weight }) => (
          <div
            key={label}
            className="tradeoff-scale"
            style={{ "--w": weight } as React.CSSProperties}
          >
            <span className="tradeoff-name">{label}</span>
            <span className="tradeoff-bar">
              <span className="tradeoff-bar-fill" />
            </span>
          </div>
        ))}
      </div>

      <div className="tradeoff-pick" role="group" aria-label="Choose a side">
        {weights.map(({ label }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            data-selected={picked === label || undefined}
            onClick={() => onPick(label)}
            className="tradeoff-button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
