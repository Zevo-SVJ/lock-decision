import { useEffect, useMemo, useRef, useState } from "react";

import { setShare } from "@/lib/decision-actions";
import { chosenOption } from "@/lib/decision-model";
import type { Decision } from "@/lib/decision-types";
import { buildInviteUrl } from "@/lib/lock-invite";
import { drawShareCard, toBlob, type ShareCard, type ShareFormat } from "@/lib/share-card";

/**
 * The artefact.
 *
 * A locked decision leaves one object behind, and the person decides what is on
 * it before it exists. The preview is the image itself, drawn live at share
 * dimensions, so nothing about what leaves the device is a surprise — and the
 * context they wrote is not on the list at all, because private notes are not
 * something to be talked into publishing.
 */
export function Artifact({
  decision,
  onSave,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<ShareFormat>("story");
  const [status, setStatus] = useState<"idle" | "saved" | "copied" | "failed">("idle");

  const chosen = chosenOption(decision);
  const card: ShareCard = useMemo(
    () => ({
      seal: decision.seal ?? { id: "", at: decision.lockedAt ?? decision.createdAt },
      decision: decision.question,
      chosen: decision.share.choice ? (chosen?.label ?? null) : null,
      reason: decision.share.reason ? decision.reason : null,
      showDate: decision.share.date,
    }),
    [
      chosen?.label,
      decision.createdAt,
      decision.lockedAt,
      decision.question,
      decision.reason,
      decision.seal,
      decision.share.choice,
      decision.share.date,
      decision.share.reason,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawShareCard(canvas, card, format);
  }, [card, format]);

  useEffect(() => {
    if (status === "idle") return;
    const t = window.setTimeout(() => setStatus("idle"), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  async function take() {
    try {
      const blob = await toBlob(card, format);
      if (!blob) throw new Error("render failed");
      const name = `lock-${decision.seal?.id ?? "decision"}.png`;
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("saved");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setStatus("failed");
    }
  }

  async function relay() {
    const url = buildInviteUrl(window.location.origin, { prompt: decision.question });
    try {
      if (navigator.share) {
        await navigator.share({ text: `${decision.question}\n\nLock it.`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setStatus("failed");
    }
  }

  return (
    <section className="artifact">
      <p className="type-meta">What leaves this device</p>

      <button
        type="button"
        className="result-preview-button"
        onClick={() => setFormat((f) => (f === "story" ? "square" : "story"))}
        aria-label={`Share card, ${format === "story" ? "vertical" : "square"}. Tap to switch.`}
      >
        <canvas ref={canvasRef} className="result-preview" data-format={format} />
        <span className="result-preview-hint" aria-hidden="true">
          {format === "story" ? "9:16" : "1:1"}
        </span>
      </button>

      <ul className="toggles">
        <Toggle
          label="The option you took"
          on={decision.share.choice}
          disabled={!chosen}
          disabledNote="Nothing chosen"
          onToggle={() => onSave(() => setShare(decision.id, { choice: !decision.share.choice }))}
        />
        <Toggle
          label="Why you chose it"
          on={decision.share.reason}
          disabled={!decision.reason.trim()}
          disabledNote="Not written"
          onToggle={() => onSave(() => setShare(decision.id, { reason: !decision.share.reason }))}
        />
        <Toggle
          label="The date"
          on={decision.share.date}
          onToggle={() => onSave(() => setShare(decision.id, { date: !decision.share.date }))}
        />
      </ul>

      <p className="artifact-private">
        Your context and anything you wrote in review stay on this device. They are never on the
        card.
      </p>

      <div className="share-actions">
        <button type="button" className="action action--quiet" onClick={() => void take()}>
          {status === "saved" ? "Saved" : status === "failed" ? "Again" : "Take the card"}
        </button>
        <button type="button" className="action action--primary" onClick={() => void relay()}>
          Lock someone else
        </button>
      </div>
      {status === "copied" && <p className="share-note">Link copied.</p>}
    </section>
  );
}

function Toggle({
  label,
  on,
  onToggle,
  disabled = false,
  disabledNote = "",
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  disabledNote?: string;
}) {
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={on && !disabled}
        className="toggle"
        disabled={disabled}
        onClick={onToggle}
      >
        <span className="toggle-box" aria-hidden="true" />
        <span className="toggle-label">{label}</span>
        {disabled && disabledNote && <span className="toggle-note">{disabledNote}</span>}
      </button>
    </li>
  );
}
