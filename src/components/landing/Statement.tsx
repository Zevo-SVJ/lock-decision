import { useInView } from "framer-motion";
import { useRef } from "react";

type Props = {
  /** The setup. Stays muted. */
  lead: string;
  /** The point. Comes up to full strength as the section is reached. */
  rest: string;
  className?: string;
};

/**
 * Every heading on the page.
 *
 * The line arrives muted and its second half comes up to full brightness once
 * the section is reached — the page's one piece of reveal motion, used the same
 * way six times so it reads as a property of the page rather than an effect.
 *
 * With motion off it is simply a bright line on a muted one, which is the
 * composition it was designed as; nothing here depends on the transition
 * happening.
 */
export function Statement({ lead, rest, className }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const lit = useInView(ref, { amount: 0.7, once: true });

  return (
    <h2
      ref={ref}
      className={["statement", className].filter(Boolean).join(" ")}
      data-lit={lit || undefined}
    >
      <span className="statement-lead">{lead} </span>
      <span className="statement-rest">{rest}</span>
    </h2>
  );
}
