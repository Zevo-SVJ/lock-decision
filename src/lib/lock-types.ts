import { z } from "zod";

export const journeyStates = [
  "intro",
  "explore",
  "assess_commitment",
  "decision",
  "complete",
] as const;

export type JourneyState = (typeof journeyStates)[number];

/**
 * What the system does next. Not every turn is a question: Lock can reflect
 * something back, surface the tension underneath a decision, or simply decide
 * it has heard enough.
 */
export const moves = ["clarify", "reflect", "tradeoff", "choose", "commit"] as const;
export type Move = (typeof moves)[number];

/** How a `clarify` move should be answered. */
export const inputKinds = ["text", "choice", "scale"] as const;
export type InputKind = (typeof inputKinds)[number];

export const lockVerdictSchema = z.object({
  verdict: z.enum(["lock", "unlock", "hold", "reject"]),
  reason: z.string().min(1),
  action: z.enum(["continue", "ask_followup", "finalize", "abort"]),
  confidence: z.number().min(0).max(1),
  next_state: z.enum(journeyStates).nullable(),
  followup: z.string().nullable(),
  /**
   * Short stances the user can pick instead of typing. Every field below is
   * nullable with a default so a response from the pre-existing schema still
   * parses — the gateway falls back to it if it rejects the extended shape.
   */
  /**
   * The response schema asks for at most four; the parser tolerates more so an
   * over-eager model costs a trim rather than the whole verdict. The interface
   * takes the first four.
   */
  options: z.array(z.string().min(1).max(60)).max(8).nullable().default(null),
  input_kind: z.enum(inputKinds).nullable().default(null),
  /** The interaction to present next. */
  move: z.enum(moves).nullable().default(null),
  /** For `tradeoff`: the two things actually in tension. */
  tradeoff_a: z.string().max(28).nullable().default(null),
  tradeoff_b: z.string().max(28).nullable().default(null),
  /** 0 = entirely toward A, 1 = entirely toward B. */
  tradeoff_lean: z.number().min(0).max(1).nullable().default(null),
  /** Two or three lines shown with the locked decision. Not a report. */
  synthesis: z.string().max(400).nullable().default(null),
});

export type LockVerdict = z.infer<typeof lockVerdictSchema>;

export const turnSchema = z.object({
  role: z.enum(["lock", "user"]),
  text: z.string(),
});

export type Turn = z.infer<typeof turnSchema>;

export const evaluateInputSchema = z.object({
  state: z.enum(journeyStates),
  decision: z.string().min(1).max(400),
  history: z.array(turnSchema).max(40),
  answer: z.string().min(1).max(2000),
  step: z.number().int().min(0).max(20),
});

export type EvaluateInput = z.infer<typeof evaluateInputSchema>;
