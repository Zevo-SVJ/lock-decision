import type { ReactNode } from "react";

type Props = {
  /** Small label above the heading. Optional — not every section needs one. */
  eyebrow?: string;
  title?: ReactNode;
  /** One short paragraph under the heading. */
  lead?: ReactNode;
  /** Wider measure for sections built around a visual rather than a paragraph. */
  wide?: boolean;
  /** No bottom padding — for a heading that introduces what comes next. */
  flush?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * A section of the page.
 *
 * Deliberately dumb: no reveal, no observer, no entrance. Sections arrive
 * because the reader scrolled to them. Motion on this page is reserved for the
 * two places it means something — the sequence, and the lock.
 */
export function Section({ eyebrow, title, lead, wide, flush, className, children }: Props) {
  return (
    <section
      className={[
        "section",
        wide ? "section--wide" : "",
        flush ? "section--flush" : "",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="section-title">{title}</h2> : null}
      {lead ? <p className="section-lead">{lead}</p> : null}
      {children}
    </section>
  );
}
