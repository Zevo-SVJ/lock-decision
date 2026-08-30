import type { ReactNode } from "react";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type Props = {
  /** The one question this section answers. Rendered as its eyebrow. */
  eyebrow?: string;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * A section of the story. Each one answers exactly one question and settles
 * once when it arrives — it does not re-animate on the way back.
 */
export function Scene({ eyebrow, title, children, className }: Props) {
  const { ref, shown } = useReveal<HTMLElement>();

  return (
    <section ref={ref} className={cn("scene", className)} data-shown={shown || undefined}>
      {eyebrow && <p className="type-meta scene-eyebrow">{eyebrow}</p>}
      {title && <h2 className="scene-title">{title}</h2>}
      {children}
    </section>
  );
}
