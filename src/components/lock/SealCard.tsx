import { useEffect, useState } from "react";

import { Sigil } from "@/components/lock/Sigil";
import { buildShareText, formatSealTime, type LockSeal } from "@/lib/lock-seal";

type Props = {
  seal: LockSeal;
  decision: string;
  statement: string;
};

type ShareState = "idle" | "copied" | "failed";

/**
 * The artefact of a locked decision — identifier, mark, statement, moment.
 * Deliberately built to survive a screenshot.
 */
export function SealCard({ seal, decision, statement }: Props) {
  const [shareState, setShareState] = useState<ShareState>("idle");

  useEffect(() => {
    if (shareState === "idle") return;
    const t = window.setTimeout(() => setShareState("idle"), 2400);
    return () => window.clearTimeout(t);
  }, [shareState]);

  async function share() {
    const text = buildShareText(seal, decision, statement);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `Locked · ${seal.id}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareState("copied");
    } catch (e) {
      // A cancelled share sheet is not a failure worth reporting.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setShareState("failed");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="lock-seal anim-enter">
        <div className="relative flex items-center justify-between">
          <span className="type-meta">Locked</span>
          <span className="type-mono text-[0.6875rem] text-fg-3">{seal.id}</span>
        </div>

        <div className="relative mt-7 flex justify-center text-fg-1">
          <Sigil id={seal.id} />
        </div>

        <p className="type-statement relative mt-7 text-balance">{decision}</p>

        {statement && <p className="type-body relative mt-4 text-fg-2">{statement}</p>}

        <div className="lock-seal-rule relative mt-6" />

        <div className="relative mt-3.5 flex items-center justify-between">
          <span className="type-mono text-[0.625rem] text-fg-3">{formatSealTime(seal.at)}</span>
          <span className="type-meta text-fg-3">Lock</span>
        </div>
      </div>

      <button type="button" onClick={share} className="lock-action lock-action--quiet">
        {shareState === "copied"
          ? "Copied"
          : shareState === "failed"
            ? "Couldn't share — screenshot it"
            : "Share this lock"}
      </button>
    </div>
  );
}
