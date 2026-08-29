import { useEffect, useState } from "react";

import { buildShareText, type LockSeal } from "@/lib/lock-seal";

type ShareState = "idle" | "copied" | "failed";

type Props = {
  seal: LockSeal;
  decision: string;
  statement: string;
};

/**
 * Sharing is one quiet action next to the seal, not a feature of the product.
 * Native share sheet where there is one, clipboard where there isn't.
 */
export function ShareAction({ seal, decision, statement }: Props) {
  const [state, setState] = useState<ShareState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 2400);
    return () => window.clearTimeout(t);
  }, [state]);

  async function share() {
    const text = buildShareText(seal, decision, statement);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `Locked · ${seal.id}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch (e) {
      // A cancelled share sheet is not a failure worth reporting.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setState("failed");
    }
  }

  return (
    <button type="button" onClick={share} className="action action--quiet">
      {state === "copied" ? "Copied" : state === "failed" ? "Screenshot it instead" : "Share"}
    </button>
  );
}
