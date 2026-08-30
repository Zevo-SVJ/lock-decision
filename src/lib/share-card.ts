import { CHECK_PATH } from "@/lib/lock-glyph";
import type { LockSeal } from "@/lib/lock-seal";

export type ShareFormat = "story" | "square";

export type ShareCard = {
  seal: LockSeal;
  decision: string;
};

const SIZES: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace`;

/**
 * The shareable artefact.
 *
 * Drawn on a canvas rather than screenshotted, so it is a real image at real
 * dimensions and carries none of the app's chrome. The lock is the same
 * geometry the control uses, seated shut.
 */
export function drawShareCard(
  canvas: HTMLCanvasElement,
  card: ShareCard,
  format: ShareFormat,
): void {
  const { w, h } = SIZES[format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pad = Math.round(w * 0.1);
  const story = format === "story";
  const measure = w - pad * 2;

  /*
   * Three things and nothing else: whose it is, what was decided, and that it
   * is closed. Anything more and it stops being an object someone would post.
   */
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, w, h);
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, "rgba(255,255,255,0.05)");
  wash.addColorStop(0.5, "rgba(255,255,255,0.014)");
  wash.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = "alphabetic";
  const small = Math.round(w * 0.023);

  // The wordmark, top left, quiet.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 ${small}px ${FONT}`;
  tracked(ctx, "LOCK", pad, story ? h * 0.115 : pad + w * 0.026, w * 0.018);

  /*
   * The decision. It owns the card, and it is set from a fixed baseline so a
   * long one grows upward — two cards from two different decisions have to
   * read as the same object, which they cannot if the type moves.
   */
  const size = Math.round(w * (story ? 0.085 : 0.078));
  const lineHeight = size * 1.14;
  ctx.font = `500 ${size}px ${FONT}`;
  const lines = wrap(ctx, card.decision, measure, 5);
  const lastBaseline = story ? h * 0.58 : h * 0.52;

  ctx.fillStyle = "#f8f8f9";
  lines.forEach((line, i) =>
    ctx.fillText(line, pad, lastBaseline - (lines.length - 1 - i) * lineHeight),
  );

  // Closed, and said so once — the mark is the check the gesture ends on.
  const footY = story ? h * 0.885 : h - pad;
  const markSize = small * 1.5;
  drawCheck(ctx, pad, footY - markSize * 0.82, markSize);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `500 ${small}px ${FONT}`;
  tracked(ctx, "LOCKED", pad + markSize * 1.5, footY, w * 0.014);

  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.font = `400 ${Math.round(w * 0.019)}px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText(card.seal.id, w - pad, footY);
  ctx.textAlign = "left";
}

/** The check the lock turns into, drawn from the same geometry the glyph uses. */
function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(CHECK_PATH));
  ctx.restore();
}

/** Letter-spaced small caps; canvas has no tracking of its own. */
function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "right" = "left",
) {
  const chars = [...text];
  const width =
    chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cursor = align === "right" ? x - width : x;
  const previous = ctx.textAlign;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, cursor, y);
    cursor += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = previous;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  const remaining = words.slice(lines.join(" ").split(/\s+/).filter(Boolean).length).join(" ");
  lines.push(lines.length === maxLines - 1 ? ellipsize(ctx, remaining || line, maxWidth) : line);
  return lines.filter(Boolean);
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/** Render to a PNG blob, off-screen. */
export function toBlob(card: ShareCard, format: ShareFormat): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  drawShareCard(canvas, card, format);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
