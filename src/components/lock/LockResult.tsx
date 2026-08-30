import { useEffect, useRef } from "react";

import { drawShareCard, type ShareFormat } from "@/lib/share-card";
import type { LockSeal } from "@/lib/lock-seal";

type Props = {
  seal: LockSeal;
  decision: string;
  synthesis: string;
  format: ShareFormat;
  onToggleFormat: () => void;
};

/**
 * The end of the journey.
 *
 * The person reads their own decision and the reasoning that got them here —
 * two or three lines, not a report. Below it is the exact image that leaves
 * the product, rendered live and doubling as its own format switch, so what
 * they share is never a surprise.
 */
export function LockResult({ seal, decision, synthesis, format, onToggleFormat }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, { seal, decision }, format);
  }, [decision, format, seal]);

  return (
    <div className="result">
      <p className="type-meta result-state">Locked</p>

      <h2 className="type-statement result-decision">{decision}</h2>

      {synthesis && <p className="result-synthesis">{synthesis}</p>}

      <button
        type="button"
        onClick={onToggleFormat}
        className="result-preview-button"
        aria-label={`Share card, ${format === "story" ? "vertical" : "square"}. Tap to switch.`}
      >
        <canvas ref={canvasRef} className="result-preview" data-format={format} />
        <span className="result-preview-hint" aria-hidden="true">
          {format === "story" ? "9:16" : "1:1"}
        </span>
      </button>
    </div>
  );
}
