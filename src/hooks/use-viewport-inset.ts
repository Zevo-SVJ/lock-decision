import { useEffect } from "react";

/**
 * Keeps the bottom dock above the software keyboard.
 *
 * iOS Safari does not shrink the layout viewport when the keyboard opens, so
 * `dvh` alone leaves the composer underneath it. The visual viewport does know,
 * and publishes the gap as `--kb` for the layout to absorb.
 */
export function useViewportInset() {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const root = document.documentElement;
    const sync = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--kb", `${Math.round(inset)}px`);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      root.style.removeProperty("--kb");
    };
  }, []);
}
