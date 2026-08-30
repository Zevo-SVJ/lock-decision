/**
 * Fast or deep.
 *
 * The same mechanism, two decisions. The shallow one resolves in a single
 * beat; the hard one opens up as you scroll. The rungs are the interactions
 * themselves, so depth is shown as distance rather than described in a table.
 */
export function Depth() {
  return (
    <div className="depth">
      <div className="depth-column">
        <p className="depth-label type-meta">Settled</p>
        <ol className="depth-rungs">
          <li className="depth-rung">Name it</li>
          <li className="depth-rung is-terminal">Lock</li>
        </ol>
        <p className="depth-note">Ten seconds.</p>
      </div>

      <div className="depth-column depth-column--deep">
        <p className="depth-label type-meta">Unresolved</p>
        <ol className="depth-rungs">
          <li className="depth-rung">Name it</li>
          <li className="depth-rung">The thing underneath it</li>
          <li className="depth-rung">What you would actually lose</li>
          <li className="depth-rung">Still true?</li>
          <li className="depth-rung is-terminal">Lock</li>
        </ol>
        <p className="depth-note">As long as it takes.</p>
      </div>
    </div>
  );
}
