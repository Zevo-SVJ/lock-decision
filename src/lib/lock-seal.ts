/**
 * A locked decision becomes a seal: an identifier, a moment, and a mark
 * derived from both. It is the only artefact Lock produces, and the only
 * thing worth carrying out of the app.
 */

export type LockSeal = {
  /** Human-readable identifier, e.g. LK-7F3A-92C1. */
  id: string;
  /** ISO timestamp of the moment the gesture completed. */
  at: string;
};

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford-ish: no I, L, O, U

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

export function createSeal(at: Date = new Date()): LockSeal {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return { id: `LK-${chars.slice(0, 4)}-${chars.slice(4, 8)}`, at: at.toISOString() };
}

/** Stable 32-bit hash — drives the seal's generated mark. */
export function hashSeal(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** e.g. "29 AUG 2026 · 18:53 UTC" */
export function formatSealTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())} UTC`;
}

/** The text that travels: identifier, decision, statement, moment. */
export function buildShareText(seal: LockSeal, decision: string, statement: string): string {
  return [
    `LOCKED · ${seal.id}`,
    "",
    decision,
    statement ? `\n${statement}` : "",
    "",
    formatSealTime(seal.at),
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
