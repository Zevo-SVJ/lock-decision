import { useEffect, useState } from "react";

import { buildInviteUrl } from "@/lib/lock-invite";
import type { LockSeal } from "@/lib/lock-seal";
import { toBlob, type ShareFormat } from "@/lib/share-card";

type Props = {
  seal: LockSeal;
  decision: string;
  synthesis: string;
  format: ShareFormat;
};

type Status = "idle" | "saved" | "copied" | "failed";

/**
 * Two ways out of a locked decision: take the image, or hand the decision to
 * someone else. Both are part of the product rather than growth furniture.
 */
export function ShareActions({ seal, decision, synthesis, format }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [inviting, setInviting] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (status === "idle") return;
    const t = window.setTimeout(() => setStatus("idle"), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  async function shareCard() {
    const card = { seal, decision, synthesis };
    try {
      const blob = await toBlob(card, format);
      if (!blob) throw new Error("render failed");
      const file = new File([blob], `lock-${seal.id}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      // No native sheet: hand them the file directly.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("saved");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setStatus("failed");
    }
  }

  async function sendInvite() {
    const text = prompt.trim();
    if (!text) return;
    const url = buildInviteUrl(window.location.origin, { prompt: text });
    try {
      if (navigator.share) {
        await navigator.share({ text: `${text}\n\nLock it.`, url });
        setInviting(false);
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setInviting(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setStatus("failed");
    }
  }

  if (inviting) {
    return (
      <div className="invite">
        <p className="invite-lead">Hand them something to decide.</p>
        <div className="answer-field" data-filled={prompt.trim().length > 0 || undefined}>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="The decision, in one line"
            maxLength={160}
            enterKeyHint="send"
            aria-label="The decision you are sending"
            className="answer-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendInvite();
              }
            }}
          />
          <span className="answer-rule" aria-hidden="true" />
        </div>
        <div className="invite-actions">
          <button
            type="button"
            className="action action--primary"
            onClick={() => void sendInvite()}
            disabled={!prompt.trim()}
          >
            Send it
          </button>
          <button type="button" className="action-plain" onClick={() => setInviting(false)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="share-actions">
      <button type="button" className="action action--quiet" onClick={() => void shareCard()}>
        {status === "saved" ? "Saved" : status === "failed" ? "Again" : "Take the card"}
      </button>
      <button type="button" className="action action--primary" onClick={() => setInviting(true)}>
        Lock someone else
      </button>
      {status === "copied" && <p className="share-note">Link copied.</p>}
    </div>
  );
}
