/**
 * The light act.
 *
 * The one place the page leaves the dark. Everything before it is the state of
 * not having decided; this is what it is like on the other side. The contrast
 * carries the argument, so the section says almost nothing.
 */
export function Shift() {
  return (
    <section className="act act--light">
      <div className="act-inner">
        <p className="type-meta act-eyebrow">The shift</p>
        <p className="act-claim">
          Uncertainty is rarely missing information.
          <span className="act-claim-dim"> It is a decision you have not made yet.</span>
        </p>
        <p className="act-note">
          Lock does not find you more to think about. It gets you to the point where there is
          nothing left to think about.
        </p>
      </div>
    </section>
  );
}
