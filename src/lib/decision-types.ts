import { z } from "zod";

/**
 * A decision, as Lock keeps it.
 *
 * One record holds the whole life of a decision: the question, what was on the
 * table, what mattered, what each option costs, which one was taken, and — much
 * later — whether it turned out to be right. Nothing here is derived state;
 * everything derived lives in `decision-model.ts` so it can be tested on its own.
 *
 * Optional information is `null` or `""` rather than absent. The project runs
 * with `exactOptionalPropertyTypes`, and a record that always has the same
 * shape is far easier to migrate than one whose keys come and go.
 */

/** Bumped only when the stored shape changes in a way old data cannot satisfy. */
export const DECISION_STORE_VERSION = 1;

export const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
});
export type DecisionOption = z.infer<typeof optionSchema>;

/**
 * How much a criterion counts. Three steps, named rather than numbered — a
 * person can say whether something is decisive; they cannot say whether it is
 * a seven.
 */
export const WEIGHTS = [
  { value: 1, label: "Nice to have" },
  { value: 2, label: "Matters" },
  { value: 3, label: "Decisive" },
] as const;

export const criterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  weight: z.number().int().min(1).max(3),
});
export type Criterion = z.infer<typeof criterionSchema>;

/** 1..5 per option per criterion. An absent entry means "not said yet". */
export const ratingsSchema = z.record(
  z.string(),
  z.record(z.string(), z.number().int().min(1).max(5)),
);
export type Ratings = z.infer<typeof ratingsSchema>;

export const tradeoffSchema = z.object({
  /** What taking this option gives you. */
  gains: z.array(z.string().min(1).max(160)).max(12),
  /** What taking it costs you. */
  gives: z.array(z.string().min(1).max(160)).max(12),
  upside: z.string().max(300),
  downside: z.string().max(300),
  risk: z.string().max(300),
  uncertainty: z.string().max(300),
  /** The one trade-off that actually decides it. */
  crux: z.string().max(300),
});
export type Tradeoff = z.infer<typeof tradeoffSchema>;

export function emptyTradeoff(): Tradeoff {
  return { gains: [], gives: [], upside: "", downside: "", risk: "", uncertainty: "", crux: "" };
}

export const reviewVerdicts = ["yes", "unsure", "no"] as const;
export type ReviewVerdict = (typeof reviewVerdicts)[number];

export const reviewSchema = z.object({
  verdict: z.enum(reviewVerdicts),
  happened: z.string().max(800),
  learned: z.string().max(800),
  differently: z.string().max(800),
  at: z.string().min(1),
});
export type Review = z.infer<typeof reviewSchema>;

/**
 * What leaves the device. Everything is off unless the person turns it on, and
 * `context` is not on the list at all: private notes never become an image.
 */
export const shareSettingsSchema = z.object({
  choice: z.boolean(),
  reason: z.boolean(),
  date: z.boolean(),
});
export type ShareSettings = z.infer<typeof shareSettingsSchema>;

export function defaultShareSettings(): ShareSettings {
  return { choice: true, reason: false, date: true };
}

export const sealSchema = z.object({ id: z.string().min(1), at: z.string().min(1) });

export const decisionStatuses = ["active", "locked", "archived"] as const;
export type DecisionStatus = (typeof decisionStatuses)[number];

export const decisionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(300),
  /** Private. Never shared, never rendered onto the artefact. */
  context: z.string().max(2000),
  /** ISO date (yyyy-mm-dd), or null. */
  deadline: z.string().nullable(),
  options: z.array(optionSchema).max(12),
  criteria: z.array(criterionSchema).max(12),
  ratings: ratingsSchema,
  tradeoffs: z.record(z.string(), tradeoffSchema),
  chosenOptionId: z.string().nullable(),
  /** Why this one. Written before locking, kept after. */
  reason: z.string().max(1000),
  status: z.enum(decisionStatuses),
  seal: sealSchema.nullable(),
  share: shareSettingsSchema,
  review: reviewSchema.nullable(),
  /** Where it came from: the workspace, or the guided Lock journey. */
  source: z.enum(["workspace", "journey"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  lockedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
});
export type Decision = z.infer<typeof decisionSchema>;

export const storedShapeSchema = z.object({
  version: z.number().int(),
  decisions: z.array(z.unknown()),
});
