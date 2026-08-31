import { useCallback, useSyncExternalStore } from "react";

import {
  DECISION_STORE_VERSION,
  decisionSchema,
  defaultShareSettings,
  storedShapeSchema,
  type Decision,
} from "@/lib/decision-types";

/**
 * Where decisions live.
 *
 * Lock has no account and no sign-in, so it has no server to keep anything on.
 * The record is therefore kept on the device, in `localStorage`, under a
 * versioned envelope: real persistence that survives reloads and restarts, and
 * that belongs to the person rather than to us. Nothing here is a stand-in for
 * a database that exists elsewhere — this *is* the store.
 *
 * The consequences are stated plainly in the interface: a decision is kept on
 * the device it was made on.
 */

const KEY = "lock.decisions";

/** Thrown when the write itself fails — a full disk, or private-mode storage. */
export class StoreWriteError extends Error {
  constructor(cause?: unknown) {
    super("Lock could not save this on this device.");
    this.name = "StoreWriteError";
    this.cause = cause;
  }
}

let cache: Decision[] | null = null;
const listeners = new Set<() => void>();

/** A stable empty snapshot: the server has no decisions, and never will. */
const EMPTY: Decision[] = [];

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Storage can be blocked outright. The product still works; it just forgets.
    return null;
  }
}

/**
 * Read whatever is on the device, discarding anything that no longer parses.
 * A single corrupt record must never cost someone the rest of their history.
 */
function load(): Decision[] {
  const store = storage();
  if (!store) return EMPTY;
  let raw: string | null = null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (!raw) return EMPTY;

  try {
    const envelope = storedShapeSchema.safeParse(JSON.parse(raw));
    if (!envelope.success) return EMPTY;
    if (envelope.data.version !== DECISION_STORE_VERSION) return EMPTY;
    const kept: Decision[] = [];
    for (const item of envelope.data.decisions) {
      const parsed = decisionSchema.safeParse(item);
      if (parsed.success) kept.push(parsed.data);
    }
    return kept;
  } catch {
    return EMPTY;
  }
}

function persist(next: Decision[]): void {
  const store = storage();
  if (!store) throw new StoreWriteError();
  try {
    store.setItem(KEY, JSON.stringify({ version: DECISION_STORE_VERSION, decisions: next }));
  } catch (e) {
    throw new StoreWriteError(e);
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getAll(): Decision[] {
  if (cache === null) cache = load();
  return cache;
}

function getServerSnapshot(): Decision[] {
  return EMPTY;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onExternalChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onExternalChange);
    }
  };
}

/** Another tab wrote: drop the cache and let everyone re-read. */
function onExternalChange(e: StorageEvent) {
  if (e.key !== null && e.key !== KEY) return;
  cache = null;
  emit();
}

/**
 * Apply a change and save it. The cache is only replaced once the write has
 * gone through, so a failed save leaves the interface showing the truth.
 */
function write(mutate: (current: Decision[]) => Decision[]): Decision[] {
  const next = mutate(getAll());
  persist(next);
  cache = next;
  emit();
  return next;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A blank decision. Exported so callers can build one and then adjust it. */
export function blankDecision(question: string): Decision {
  const now = new Date().toISOString();
  return {
    id: newId(),
    question: question.trim().slice(0, 300),
    context: "",
    deadline: null,
    options: [],
    criteria: [],
    ratings: {},
    tradeoffs: {},
    chosenOptionId: null,
    reason: "",
    status: "active",
    seal: null,
    share: defaultShareSettings(),
    review: null,
    source: "workspace",
    createdAt: now,
    updatedAt: now,
    lockedAt: null,
    archivedAt: null,
  };
}

/** Put a decision into the record, newest first. */
export function insertDecision(decision: Decision): Decision {
  write((all) => [decision, ...all]);
  return decision;
}

export function createDecision(question: string): Decision {
  return insertDecision(blankDecision(question));
}

/** Save an existing decision. `updatedAt` is always the store's to set. */
export function updateDecision(id: string, patch: (d: Decision) => Decision): Decision | null {
  write((all) =>
    all.map((d) =>
      d.id === id ? { ...patch(d), id: d.id, updatedAt: new Date().toISOString() } : d,
    ),
  );
  return getDecision(id);
}

export function removeDecision(id: string): void {
  write((all) => all.filter((d) => d.id !== id));
}

export function getDecision(id: string): Decision | null {
  return getAll().find((d) => d.id === id) ?? null;
}

/** Test seam: forget everything, on the device and in memory. */
export function resetStore(): void {
  const store = storage();
  try {
    store?.removeItem(KEY);
  } catch {
    /* nothing to do; the cache is cleared either way */
  }
  cache = null;
  emit();
}

/* ------------------------------------------------------------------ *
 * React
 * ------------------------------------------------------------------ */

/** Every decision, newest first. Re-renders on any write, in any tab. */
export function useDecisions(): Decision[] {
  return useSyncExternalStore(subscribe, getAll, getServerSnapshot);
}

/** One decision, or null while the store is still the server's empty one. */
export function useDecision(id: string): Decision | null {
  const read = useCallback(() => getAll().find((d) => d.id === id) ?? null, [id]);
  return useSyncExternalStore(subscribe, read, () => null);
}

/**
 * Whether the store has had a chance to read the device yet. Everything is
 * empty during server rendering and the first hydration pass, and "you have no
 * decisions" is a very different sentence from "not loaded".
 */
export function useStoreReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
