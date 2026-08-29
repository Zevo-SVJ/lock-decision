import { createServerFn } from "@tanstack/react-start";

import {
  evaluateInputSchema,
  lockVerdictSchema,
  type EvaluateInput,
  type LockVerdict,
} from "./lock-types";

const MODEL = "google/gemini-3.7-flash";

const SYSTEM_PROMPT = `You are Lock: a terse, cold, deliberate decision instrument.
The user is trying to commit to one decision. You guide a short journey through states:
intro -> explore -> assess_commitment -> decision -> complete.

Lock is not a chatbot and never sounds like an assistant. No greetings, no praise, no hedging,
no meta-commentary about yourself, no mention of AI, models, analysis or processing.

Rules:
- Ask exactly ONE short question at a time (max 16 words), second person, no preamble, no lists, no emoji.
- Be decisive. The whole journey is 2-3 exchanges. Never pad it out.
- Probe for specificity, cost, and the first concrete action. Detect vagueness, hedging, or outsourced responsibility.
- If the latest answer is vague/uncertain, action = "ask_followup" and put the single next question in "followup".
- If the answer is clear and committed, action = "continue" (advance the state) or "finalize" when the user is ready to commit (usually after 2-3 exchanges).
- Use action "abort" with verdict "reject" only if the decision is harmful or the user clearly refuses.
- "reason" is one short, flat sentence of your read on the user, addressed to them. It is shown next to their locked decision, so make it land.
- verdict: "lock" (ready to commit), "hold" (needs more clarity), "unlock" (should not commit yet), "reject".
- confidence is 0..1.
- next_state must be one of the journey states or null.
- "options": when the followup question has a small set of honest stances, give 2-4 of them, each max 4 words,
  written in the user's first person. Otherwise null. Never use them for open questions that need the user's own words.
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

const baseProperties = {
  verdict: { type: "string", enum: ["lock", "unlock", "hold", "reject"] },
  reason: { type: "string" },
  action: { type: "string", enum: ["continue", "ask_followup", "finalize", "abort"] },
  confidence: { type: "number" },
  next_state: {
    type: ["string", "null"],
    enum: ["intro", "explore", "assess_commitment", "decision", "complete", null],
  },
  followup: { type: ["string", "null"] },
} as const;

const baseRequired = ["verdict", "reason", "action", "confidence", "next_state", "followup"];

/**
 * Two shapes of the same contract. `options` is additive: if a gateway or model
 * rejects the extended schema we retry with the original one, so the journey
 * degrades to free-text answers rather than failing.
 */
const extendedSchema = {
  type: "object",
  additionalProperties: false,
  required: [...baseRequired, "options"],
  properties: {
    ...baseProperties,
    options: {
      type: ["array", "null"],
      items: { type: "string" },
      maxItems: 4,
    },
  },
} as const;

const legacySchema = {
  type: "object",
  additionalProperties: false,
  required: baseRequired,
  properties: baseProperties,
} as const;

type GatewayCall = { ok: true; content: string } | { ok: false; status: number; body: string };

async function callGateway(
  apiKey: string,
  data: EvaluateInput,
  schema: object,
): Promise<GatewayCall> {
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
        json_schema: { name: "lock_verdict", strict: true, schema },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, status: res.status, body };
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return { ok: false, status: 502, body: "empty completion" };
  return { ok: true, content };
}

export const evaluateJourney = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => evaluateInputSchema.parse(data))
  .handler(async ({ data }): Promise<LockVerdict> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Lock AI is not configured.");

    let call = await callGateway(apiKey, data, extendedSchema);

    // A 4xx here usually means the model or gateway rejected the response
    // schema, not the request itself — retry once on the original shape.
    if (!call.ok && call.status >= 400 && call.status < 500 && call.status !== 429) {
      console.error("Lock AI schema retry", call.status, call.body.slice(0, 300));
      call = await callGateway(apiKey, data, legacySchema);
    }

    if (!call.ok) {
      console.error("Lock AI gateway error", call.status, call.body.slice(0, 500));
      if (call.status === 429) throw new Error("Lock is busy right now. Try again in a moment.");
      if (call.status === 402 || call.status === 403)
        throw new Error("Lock's AI access is unavailable right now.");
      throw new Error("Lock could not reflect on that. Try again.");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(call.content);
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
