import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The product, in three states.
 *
 * Real surfaces from the application, laid out as objects rather than
 * screenshots: what you put in, what Lock puts back, and what you are left
 * with. Read left to right it is the whole mechanism, and it needs no arrows
 * to say so because the three states are obviously the same decision.
 *
 * They are deliberately unequal in height and offset from one another. Three
 * identical panels in a row is a feature grid; three objects set down on a
 * surface is not.
 */
export function Mechanism() {
  return (
    <div className="objects">
      <figure className="object object--a">
        <div className="surface">
          <p className="type-meta">The decision</p>
          <p className="surface-line">Should I take the flat?</p>
          <span className="surface-rule" aria-hidden="true" />
        </div>
        <figcaption className="object-label">You bring it in</figcaption>
      </figure>

      <figure className="object object--b">
        <div className="surface">
          <p className="type-reflection surface-reflect">
            You are not weighing the rent. You are deciding whether to stop keeping the option open.
          </p>
          <div className="reflection-reply" aria-hidden="true">
            <span className="reflection-button">That is it</span>
            <span className="reflection-button">Not quite</span>
          </div>
        </div>
        <figcaption className="object-label">Lock works it out</figcaption>
      </figure>

      <figure className="object object--c">
        <div className="surface surface--sealed">
          <p className="surface-line">I am taking it.</p>
          <p className="surface-sealed-row">
            <LockGlyph progress={1} size={16} className="is-check" />
            <span className="type-meta">Locked</span>
            <span className="type-mono surface-id">LK-7F3A-92C1</span>
          </p>
        </div>
        <figcaption className="object-label">You close it</figcaption>
      </figure>
    </div>
  );
}
