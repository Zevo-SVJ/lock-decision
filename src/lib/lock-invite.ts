/**
 * Locking someone else.
 *
 * An invitation is a decision one person hands to another. It travels entirely
 * inside the link — nothing is stored, nothing is tracked, and the recipient's
 * answers never reach the sender.
 */

export type Invite = {
  /** The decision the sender wants the recipient to face. */
  prompt: string;
  /** Optional, how the sender signs it. */
  from?: string;
};

export const INVITE_PARAM = "k";
export const MAX_PROMPT = 160;
export const MAX_FROM = 24;

/** Strip control characters, collapse whitespace, cap the length. */
function clean(value: string, max: number): string {
  // Stripping control characters is the point here: this text arrives inside a
  // shared link and is rendered as a heading.
  // eslint-disable-next-line no-control-regex
  const printable = value.replace(/[\u0000-\u001f\u007f]/g, " ");
  return printable.replace(/\s+/g, " ").trim().slice(0, max);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export function encodeInvite(invite: Invite): string {
  const prompt = clean(invite.prompt, MAX_PROMPT);
  const from = invite.from ? clean(invite.from, MAX_FROM) : "";
  const payload = JSON.stringify(from ? { p: prompt, f: from } : { p: prompt });
  return toBase64Url(new TextEncoder().encode(payload));
}

export function decodeInvite(value: string | null | undefined): Invite | null {
  if (!value) return null;
  const bytes = fromBase64Url(value);
  if (!bytes) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed !== "object" || parsed === null) return null;
    const { p, f } = parsed as { p?: unknown; f?: unknown };
    if (typeof p !== "string") return null;
    const prompt = clean(p, MAX_PROMPT);
    if (!prompt) return null;
    const from = typeof f === "string" ? clean(f, MAX_FROM) : "";
    return from ? { prompt, from } : { prompt };
  } catch {
    return null;
  }
}

/** Where an invitation lands: straight in the product, never the front door. */
export const INVITE_PATH = "/lock";

export function buildInviteUrl(origin: string, invite: Invite): string {
  const url = new URL(origin);
  url.pathname = INVITE_PATH;
  url.search = "";
  url.hash = "";
  url.searchParams.set(INVITE_PARAM, encodeInvite(invite));
  return url.toString();
}

/** Read an invitation out of the current location, if there is one. */
export function readInvite(): Invite | null {
  if (typeof window === "undefined") return null;
  return decodeInvite(new URLSearchParams(window.location.search).get(INVITE_PARAM));
}

/** Drop the invitation from the address bar once it has been taken up. */
export function clearInviteFromUrl(): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(INVITE_PARAM)) return;
  url.searchParams.delete(INVITE_PARAM);
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}
