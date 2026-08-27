import { z } from "zod";

export const journeyStates = [
  "intro",
  "explore",
  "assess_commitment",
  "decision",
  "complete",
] as const;

export type JourneyState = (typeof journeyStates)[number];

export const lockVerdictSchema = z.object({
  verdict: z.enum(["lock", "unlock", "hold", "reject"]),
  reason: z.string().min(1),
  action: z.enum(["continue", "ask_followup", "finalize", "abort"]),
  confidence: z.number().min(0).max(1),
  next_state: z.enum(journeyStates).nullable(),
  followup: z.string().nullable(),
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
