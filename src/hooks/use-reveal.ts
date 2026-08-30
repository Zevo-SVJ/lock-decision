import { useEffect, useRef, useState } from "react";

/**
 * Whether an element has come into view. Fires once — sections settle when
 * they arrive and then stay put; nothing re-animates on the way back up.
 */
export function useReveal<T extends HTMLElement>(rootMargin = "-15% 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, shown };
}
