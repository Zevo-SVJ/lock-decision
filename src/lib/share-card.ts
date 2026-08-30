import { BODY, SHACKLE_PATH, glyphPose } from "@/lib/lock-glyph";
import { formatSealTime, type LockSeal } from "@/lib/lock-seal";

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

  const pad = Math.round(w * 0.094);
  const story = format === "story";

  /*
   * Ground. One near-black, lifted a little at the top and settled at the
   * bottom — no pools of light, no vignette. Anything more competes with the
   * only thing on the card that is meant to be read.
   */
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, w, h);
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, "rgba(255,255,255,0.045)");
  wash.addColorStop(0.42, "rgba(255,255,255,0.012)");
  wash.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = "alphabetic";

  // Header: the state, and the identifier that makes this one particular.
  const headY = story ? h * 0.115 : pad + w * 0.024;
  const meta = Math.round(w * 0.0235);
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = `500 ${meta}px ${FONT}`;
  tracked(ctx, "LOCKED", pad, headY, w * 0.013);

  ctx.font = `400 ${meta}px ${MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.textAlign = "right";
  ctx.fillText(card.seal.id, w - pad, headY);
  ctx.textAlign = "left";

  /*
   * The decision, which is the whole card. It is set as large as it can be
   * without wrapping past five lines, and finished with the mark itself —
   * a lock where the full stop would be. That terminal is the signature: it
   * is what makes the image recognisable at thumbnail size.
   */
  const measure = w - pad * 2;
  const size = Math.round(w * (story ? 0.084 : 0.076));
  const lineHeight = size * 1.16;
  ctx.font = `500 ${size}px ${FONT}`;
  const lines = wrap(ctx, card.decision, measure, 5);

  /*
   * The mark always sits on its own line under the decision. Setting it inline
   * after the last word reads better when it fits, but whether it fits depends
   * on the decision — and a signature that sometimes hangs off the end of a
   * sentence and sometimes drops to a line of its own is not a signature.
   */
  const markSize = size * 0.78;

  /*
   * The mark is pinned, and the decision grows upward off it. Centring the
   * block instead moves the signature every time the decision changes length,
   * which is exactly what a signature must not do — this way two cards from
   * two different decisions still read as the same object.
   */
  const markTop = (story ? h * 0.6 : h * 0.55) - markSize / 2;
  const lastBaseline = markTop - size * 0.5;
  const top = lastBaseline - (lines.length - 1) * lineHeight;

  ctx.fillStyle = "#f7f7f8";
  lines.forEach((line, i) => ctx.fillText(line, pad, top + i * lineHeight));
  drawLockGlyph(ctx, pad, markTop, markSize);

  // Footer: when it happened, and whose it is.
  const footY = story ? h * 0.895 : h - pad;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(pad, footY - w * 0.062, measure, 1);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = `400 ${Math.round(w * 0.021)}px ${MONO}`;
  ctx.fillText(formatSealTime(card.seal.at), pad, footY);

  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = `500 ${meta}px ${FONT}`;
  ctx.textAlign = "right";
  tracked(ctx, "LOCK", w - pad, footY, w * 0.017, "right");
  ctx.textAlign = "left";
}

/** The lock, shut, drawn from the geometry the control itself uses. */
function drawLockGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const scale = size / 24;
  const pose = glyphPose(1);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = pose.strokeWidth;
  ctx.lineCap = "round";

  ctx.stroke(new Path2D(SHACKLE_PATH));

  const r = BODY.radius;
  ctx.beginPath();
  ctx.roundRect(BODY.x, BODY.y, BODY.width, BODY.height, r);
  ctx.stroke();
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
