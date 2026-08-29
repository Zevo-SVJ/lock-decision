import { BODY, SHACKLE_PATH, glyphPose } from "@/lib/lock-glyph";
import { formatSealTime, type LockSeal } from "@/lib/lock-seal";

export type ShareFormat = "story" | "square";

export type ShareCard = {
  seal: LockSeal;
  decision: string;
  synthesis: string;
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

  const pad = Math.round(w * 0.107);
  const story = format === "story";

  // Ground: near-black, with one soft pool of light low and a quiet vignette.
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, w, h);

  const pool = ctx.createRadialGradient(w / 2, h * 0.93, 0, w / 2, h * 0.93, w * 0.95);
  pool.addColorStop(0, "rgba(255,255,255,0.075)");
  pool.addColorStop(0.55, "rgba(255,255,255,0.018)");
  pool.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, w, h);

  const top = ctx.createRadialGradient(w / 2, -h * 0.08, 0, w / 2, -h * 0.08, w * 0.9);
  top.addColorStop(0, "rgba(190,205,225,0.05)");
  top.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h);

  // Header: state on the left, identifier on the right.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = `500 ${Math.round(w * 0.026)}px ${FONT}`;
  tracked(ctx, "LOCKED", pad, pad + w * 0.02, w * 0.012);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = `400 ${Math.round(w * 0.026)}px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText(card.seal.id, w - pad, pad + w * 0.02);
  ctx.textAlign = "left";

  // The mark, seated shut, large and quiet. On a story it sits above the
  // decision; on a square there is no room for it to breathe, so it stays
  // smaller and closer.
  const markSize = story ? w * 0.34 : w * 0.2;
  drawLockGlyph(ctx, w / 2 - markSize / 2, story ? h * 0.27 : h * 0.17, markSize);

  // The decision — the one thing meant to be read. Sits below the optical
  // centre so the story's safe area never crops it.
  const bodyTop = story ? h * 0.53 : h * 0.42;
  const size = story ? w * 0.072 : w * 0.062;
  ctx.fillStyle = "#f6f6f7";
  ctx.font = `500 ${Math.round(size)}px ${FONT}`;
  const lines = wrap(ctx, card.decision, w - pad * 2, 6);
  const lineHeight = size * 1.22;
  lines.forEach((line, i) => {
    ctx.fillText(line, pad, bodyTop + i * lineHeight);
  });

  // The synthesis, dimmer, beneath a hairline.
  let y = bodyTop + lines.length * lineHeight + size * 0.9;
  if (card.synthesis) {
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(pad, y - size * 0.5, w * 0.12, 1);
    y += size * 0.35;
    const sub = story ? w * 0.037 : w * 0.033;
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.font = `400 ${Math.round(sub)}px ${FONT}`;
    const subLines = wrap(ctx, card.synthesis, w - pad * 2, 4);
    subLines.forEach((line, i) => ctx.fillText(line, pad, y + i * sub * 1.5));
  }

  // Footer: moment on the left, identity on the right. Held clear of the
  // bottom of a story, where platform chrome sits.
  const footY = story ? h * 0.9 : h - pad;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(pad, footY - w * 0.075, w - pad * 2, 1);

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font = `400 ${Math.round(w * 0.023)}px ${MONO}`;
  ctx.fillText(formatSealTime(card.seal.at), pad, footY);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `500 ${Math.round(w * 0.026)}px ${FONT}`;
  tracked(ctx, "LOCK", w - pad, footY, w * 0.016, "right");
  ctx.textAlign = "left";
}

/** The lock, shut, drawn from the geometry the control itself uses. */
function drawLockGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const scale = size / 24;
  const pose = glyphPose(1);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(255,255,255,0.66)";
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
