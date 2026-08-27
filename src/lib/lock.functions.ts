import { createServerFn } from "@tanstack/react-start";

import {
  evaluateInputSchema,
  lockVerdictSchema,
  type EvaluateInput,
  type LockVerdict,
} from "./lock-types";

const MODEL = "google/gemini-3.7-flash";

const SYSTEM_PROMPT = `You are Lock: a terse, calm, deliberate decision coach.
The user is trying to commit to one decision. You guide a short journey through states:
intro -> explore -> assess_commitment -> decision -> complete.

Rules:
- Ask exactly ONE short question at a time (max 22 words), second person, no preamble, no lists, no emoji.
- Probe for specificity, cost, and the first concrete action. Detect vagueness, hedging, or outsourced responsibility.
- If the latest answer is vague/uncertain, action = "ask_followup" and put the single next question in "followup".
- If the answer is clear and committed, action = "continue" (advance the state) or "finalize" when the user is ready to commit (usually after 3-5 exchanges).
- Use action "abort" with verdict "reject" only if the decision is harmful or the user clearly refuses.
- "reason" is one short sentence of your read on the user, addressed to them.
- verdict: "lock" (ready to commit), "hold" (needs more clarity), "unlock" (should not commit yet), "reject".
- confidence is 0..1.
- next_state must be one of the journey states or null.
Reply with JSON only.`;

function buildUserPrompt(data: EvaluateInput): string {
  const history = data.history.map((t) => `${t.role === "lock" ? "LOCK" : "USER"}: ${t.text}`);
  return [
    `CURRENT_STATE: ${data.state}`,
    `EXCHANGE_COUNT: ${data.step}`,
    `DECISION: ${data.decision}`,
    "TRANSCRIPT:",
    history.length ? history.join("\n") : "(none)",
    `LATEST_USER_ANSWER: ${data.answer}`,
  ].join("\n");
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "reason", "action", "confidence", "next_state", "followup"],
  properties: {
    verdict: { type: "string", enum: ["lock", "unlock", "hold", "reject"] },
    reason: { type: "string" },
    action: { type: "string", enum: ["continue", "ask_followup", "finalize", "abort"] },
    confidence: { type: "number" },
    next_state: {
      type: ["string", "null"],
      enum: ["intro", "explore", "assess_commitment", "decision", "complete", null],
    },
    followup: { type: ["string", "null"] },
  },
} as const;

export const evaluateJourney = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => evaluateInputSchema.parse(data))
  .handler(async ({ data }): Promise<LockVerdict> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Lock AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(data) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "lock_verdict", strict: true, schema: jsonSchema },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Lock AI gateway error", res.status, body.slice(0, 500));
      if (res.status === 429) throw new Error("Lock is busy right now. Try again in a moment.");
      if (res.status === 402 || res.status === 403)
        throw new Error("Lock's AI access is unavailable right now.");
      throw new Error("Lock could not reflect on that. Try again.");
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Lock returned an empty reflection. Try again.");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      console.error("Lock AI returned non-JSON output");
      throw new Error("Lock returned an unreadable reflection. Try again.");
    }

    const verdict = lockVerdictSchema.safeParse(parsedJson);
    if (!verdict.success) {
      console.error("Lock AI schema rejection", verdict.error.issues.slice(0, 3));
      throw new Error("Lock returned an invalid reflection. Try again.");
    }

    if (verdict.data.action === "ask_followup" && !verdict.data.followup?.trim()) {
      throw new Error("Lock returned an incomplete reflection. Try again.");
    }

    return verdict.data;
  });

export const lockHealth = createServerFn({ method: "GET" }).handler(async () => ({
  ok: true,
  ai_configured: Boolean(process.env["LOVABLE_API_KEY"]),
  model: MODEL,
  time: new Date().toISOString(),
}));
