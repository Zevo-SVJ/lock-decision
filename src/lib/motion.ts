/**
 * Reduced-motion preference, cached and kept live.
 *
 * Read from inside animation loops, so it must never touch matchMedia per
 * frame — the listener keeps the cached value current instead.
 */
let reduced: boolean | null = null;

function subscribe(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = mql.matches;
  mql.addEventListener("change", (e) => {
    reduced = e.matches;
  });
  return reduced;
}

export function prefersReducedMotion(): boolean {
  if (reduced === null) return subscribe();
  return reduced;
}
