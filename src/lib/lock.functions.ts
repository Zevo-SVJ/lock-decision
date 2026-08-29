import { createServerFn } from "@tanstack/react-start";

import {
  evaluateInputSchema,
  lockVerdictSchema,
  type EvaluateInput,
  type LockVerdict,
} from "./lock-types";

const MODEL = "google/gemini-3.7-flash";

const SYSTEM_PROMPT = `You are Lock: a cold, precise decision instrument. You help one person reach one decision.

You are not a chatbot, an assistant or a coach. Never greet, praise, apologise, or refer to yourself.
Never mention AI, models, analysis or processing. No emoji, no lists, no preamble.

DEPTH IS YOURS TO SET. An obvious decision should be locked in one or two exchanges. A genuinely
hard one may take four or five. Never pad. Optimise for usefulness per interaction, not for
thoroughness. If the person already knows what they want, go straight to "commit".

Each turn you choose ONE move, in "move":

- "clarify"  — one short question, max 14 words, because something specific is genuinely unclear.
               Set "input_kind": "choice" with 2-4 short "options" when a small set of honest
               stances covers it; "scale" when you are asking about degree (phrase it so 1-10
               answers it); "text" only when nothing but their own words will do.
- "reflect"  — you can see what this decision is really about. State it in one or two sentences,
               second person, in "followup". Not a question. It should land, e.g. "You are not
               choosing between two jobs. You are choosing between security and autonomy."
               The person will answer "That's it" or "Not quite", so make a real claim.
- "tradeoff" — name the two things actually in tension in "tradeoff_a" and "tradeoff_b"
               (1-2 words each), set "tradeoff_lean" 0..1 for how far they already lean toward B,
               and put a short line in "followup" framing the choice. They will pick one.
- "choose"   — the decision has come down to a small set of real alternatives. Put them in
               "options" (2-3, short, first person) and the framing in "followup".
- "commit"   — you have enough. Set action "finalize".

Prefer "reflect" and "tradeoff" over stacking questions. A good reflection replaces three questions.
Never use the same move twice in a row unless the person rejected your last one.

Other fields:
- "reason": one short flat sentence of what you now understand, addressed to them. It is shown
  above the next move as carried context, so make it earn its place.
- "synthesis": ONLY when action is "finalize". Two or three short lines explaining what they
  decided and why it follows from what they said. Address them directly. No hedging, no advice,
  no restating the question. This is the last thing they read.
- verdict: "lock" (ready to commit), "hold" (needs more clarity), "unlock" (should not commit yet),
  "reject" (harmful, or they refuse — use with action "abort").
- action: "continue" or "ask_followup" while working, "finalize" when moving to the lock,
  "abort" only for harm or refusal.
- confidence 0..1. next_state is one of the journey states or null.
- Put the text of every move in "followup".

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

const extendedProperties = {
  options: { type: ["array", "null"], items: { type: "string" }, maxItems: 4 },
  input_kind: { type: ["string", "null"], enum: ["text", "choice", "scale", null] },
  move: {
    type: ["string", "null"],
    enum: ["clarify", "reflect", "tradeoff", "choose", "commit", null],
  },
  tradeoff_a: { type: ["string", "null"] },
  tradeoff_b: { type: ["string", "null"] },
  tradeoff_lean: { type: ["number", "null"] },
  synthesis: { type: ["string", "null"] },
} as const;

/**
 * Two shapes of the same contract. Everything beyond the base is additive: if a
 * gateway or model rejects the extended schema we retry with the original one,
 * and the journey degrades to plain questions rather than failing.
 */
const extendedSchema = {
  type: "object",
  additionalProperties: false,
  required: [...baseRequired, ...Object.keys(extendedProperties)],
  properties: { ...baseProperties, ...extendedProperties },
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

/**
 * Every failure reaches the interface as the same sentence. Causes are logged
 * server-side; the person in front of the product never reads a status code,
 * a provider name or the word "schema".
 */
const INTERRUPTED = "Something interrupted the lock.";

export const evaluateJourney = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => evaluateInputSchema.parse(data))
  .handler(async ({ data }): Promise<LockVerdict> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      console.error("Lock AI is not configured: LOVABLE_API_KEY is unset");
      throw new Error(INTERRUPTED);
    }

    let call = await callGateway(apiKey, data, extendedSchema);

    // A 4xx here usually means the model or gateway rejected the response
    // schema, not the request itself — retry once on the original shape.
    if (!call.ok && call.status >= 400 && call.status < 500 && call.status !== 429) {
      console.error("Lock AI schema retry", call.status, call.body.slice(0, 300));
      call = await callGateway(apiKey, data, legacySchema);
    }

    if (!call.ok) {
      console.error("Lock AI gateway error", call.status, call.body.slice(0, 500));
      throw new Error(INTERRUPTED);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(call.content);
    } catch {
      console.error("Lock AI returned non-JSON output");
      throw new Error(INTERRUPTED);
    }

    const verdict = lockVerdictSchema.safeParse(parsedJson);
    if (!verdict.success) {
      console.error("Lock AI schema rejection", verdict.error.issues.slice(0, 3));
      throw new Error(INTERRUPTED);
    }

    if (verdict.data.action === "ask_followup" && !verdict.data.followup?.trim()) {
      console.error("Lock AI returned a followup action with no followup text");
      throw new Error(INTERRUPTED);
    }

    return verdict.data;
  });

export const lockHealth = createServerFn({ method: "GET" }).handler(async () => ({
  ok: true,
  ai_configured: Boolean(process.env["LOVABLE_API_KEY"]),
  model: MODEL,
  time: new Date().toISOString(),
}));
