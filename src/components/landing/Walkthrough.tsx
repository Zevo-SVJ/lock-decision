import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * One decision, all the way through.
 *
 * Not six steps and not six cards: a single frame that holds the product's own
 * surfaces while one decision moves through them. Scroll advances the state —
 * the decision, what Lock sees underneath it, the choice it comes down to, and
 * the commitment — so the mechanism is watched rather than described.
 */
export function Walkthrough() {
  return (
    <section className="walk">
      <div className="walk-sticky">
        <p className="type-meta walk-eyebrow">How it works</p>
        <div className="walk-frame">
          {/* 1 — what the person brings */}
          <div className="walk-state walk-state--1">
            <p className="type-meta">You bring</p>
            <p className="walk-line">I think I should move to another city.</p>
          </div>

          {/* 2 — what Lock sees underneath it */}
          <div className="walk-state walk-state--2">
            <p className="type-meta">Lock sees</p>
            <p className="walk-line">
              You are not weighing cities. You are deciding whether to stop waiting for a reason to
              go.
            </p>
            <div className="walk-replies" aria-hidden="true">
              <span className="walk-reply">That&rsquo;s it.</span>
              <span className="walk-reply">Not quite.</span>
            </div>
          </div>

          {/* 3 — the choice it comes down to */}
          <div className="walk-state walk-state--3">
            <p className="type-meta">It comes down to</p>
            <div className="walk-scales" aria-hidden="true">
              <div className="walk-scale" style={{ "--w": 0.3 } as React.CSSProperties}>
                <span className="walk-scale-name">A reason to stay</span>
                <span className="walk-scale-bar">
                  <span className="walk-scale-fill" />
                </span>
              </div>
              <div className="walk-scale" style={{ "--w": 0.7 } as React.CSSProperties}>
                <span className="walk-scale-name">Permission to go</span>
                <span className="walk-scale-bar">
                  <span className="walk-scale-fill" />
                </span>
              </div>
            </div>
          </div>

          {/* 4 — the commitment */}
          <div className="walk-state walk-state--4">
            <p className="type-meta">You commit</p>
            <p className="walk-line">I am moving in the spring.</p>
            <div className="walk-control" aria-hidden="true">
              <span className="walk-control-knob">
                <LockGlyph progress={1} size={20} />
              </span>
              <span className="walk-control-label">locked</span>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only">
        A decision moves through Lock in four states: what you bring, what Lock sees underneath it,
        the choice it comes down to, and the commitment you make.
      </p>
    </section>
  );
}
