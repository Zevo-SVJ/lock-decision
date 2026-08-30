import type { ReactNode } from "react";

import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * Three reasons, each with the piece of the product that delivers it.
 *
 * The visuals are fragments of real surfaces rather than icons, so the section
 * keeps showing the product while it explains itself.
 */

function Unstuck() {
  return (
    <div className="frag frag--statement" aria-hidden="true">
      <p className="eyebrow">Lock says</p>
      <p className="frag-line">
        You have had the answer since Tuesday. What you want is someone to say it is allowed.
      </p>
    </div>
  );
}

function Depthwise() {
  return (
    <div className="frag frag--depth" aria-hidden="true">
      <div className="frag-depth-row">
        <span className="frag-dot" />
        <span className="frag-dot is-end" />
        <span className="frag-depth-label">Settled · twenty seconds</span>
      </div>
      <div className="frag-depth-row">
        <span className="frag-dot" />
        <span className="frag-dot" />
        <span className="frag-dot" />
        <span className="frag-dot" />
        <span className="frag-dot is-end" />
        <span className="frag-depth-label">Hard · as long as it takes</span>
      </div>
    </div>
  );
}

function Committed() {
  return (
    <div className="frag frag--seal" aria-hidden="true">
      <LockGlyph progress={1} size={24} />
      <div className="frag-seal-text">
        <span className="type-mono">LK-4H2X-8QD1</span>
        <span className="frag-seal-time">Locked</span>
      </div>
    </div>
  );
}

const BENEFITS: { n: string; title: string; body: string; visual: ReactNode }[] = [
  {
    n: "01",
    title: "Get unstuck",
    body: "For the decision you have already been round four times without anything new arriving.",
    visual: <Unstuck />,
  },
  {
    n: "02",
    title: "Go as deep as it deserves",
    body: "A decision you have already made takes twenty seconds. A hard one opens up instead of being rushed.",
    visual: <Depthwise />,
  },
  {
    n: "03",
    title: "Actually commit",
    body: "It ends with a gesture you have to complete on purpose. That is the part that makes it stick.",
    visual: <Committed />,
  },
];

export function Benefits() {
  return (
    <div className="benefits">
      {BENEFITS.map(({ n, title, body, visual }) => (
        <div key={n} className="benefit">
          <div className="benefit-text">
            <p className="benefit-n type-mono">{n}</p>
            <h3 className="benefit-title">{title}</h3>
            <p className="benefit-body">{body}</p>
          </div>
          <div className="benefit-visual">{visual}</div>
        </div>
      ))}
    </div>
  );
}
