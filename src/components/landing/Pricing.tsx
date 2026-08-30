/**
 * The real price, which is currently nothing.
 *
 * One plan, because there is one plan. When that changes this becomes two
 * columns; it does not need a matrix to say "free".
 */
export function Pricing({ onStart }: { onStart: () => void }) {
  return (
    <div className="plan">
      <div className="plan-head">
        <p className="eyebrow">Beta</p>
        <p className="plan-price">
          Free<span className="plan-price-note"> · while Lock is being built</span>
        </p>
      </div>

      <ul className="plan-list">
        <li>Every decision, as deep as it needs to go</li>
        <li>The locked card, yours to keep or post</li>
        <li>Send a decision to someone else</li>
        <li>No account, no card, no sign-in</li>
      </ul>

      <button type="button" onClick={onStart} className="btn btn--primary plan-cta">
        Try Lock
      </button>
    </div>
  );
}
