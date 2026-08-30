import { useCallback, useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * Publishes a section's own scroll progress as `--s` (0..1) on the element.
 *
 * Written straight to the DOM inside a rAF loop that only runs while the
 * section is on screen, so a scroll-linked scene costs nothing when it is
 * not visible and never re-renders React.
 */
export function useScrollScene<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);

  const paint = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 as the section's top reaches the bottom of the viewport, 1 as its
    // bottom leaves the top.
    const span = rect.height + vh;
    const travelled = vh - rect.top;
    el.style.setProperty("--s", Math.min(1, Math.max(0, travelled / span)).toFixed(4));
  }, []);

  const loop = useCallback(() => {
    paint();
    rafRef.current = visibleRef.current ? requestAnimationFrame(loop) : null;
  }, [paint]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    paint();
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = Boolean(entry?.isIntersecting);
      if (visibleRef.current && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(loop);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      visibleRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop, paint]);

  return ref;
}
