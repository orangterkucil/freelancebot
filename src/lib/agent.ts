import { groq, AGENT_MODEL } from "./groq";

/**
 * FreelanceBot agent core.
 *
 * Two responsibilities:
 *   1. chatTurn(...)         — conversational turn with the user (client or freelancer)
 *   2. verifyDeliverable(...) — programmatic check + LLM judgment whether a submitted
 *                               deliverable matches the brief and the rules of the order.
 *
 * The agent runs against Groq's hosted Llama 3.3 70B. Free tier is generous enough
 * for the hackathon MVP.
 */

export const SYSTEM_PROMPT = `You are FreelanceBot, an autonomous payment agent that mediates
between a client and a freelancer on a stablecoin escrow protocol called Arc.

Your role:
- Be brief, neutral, and operational. Do not roleplay personality.
- Help the freelancer submit a clear deliverable.
- Help the client decide whether to approve.
- When asked to verify a deliverable, you weigh evidence and respond with a structured
  JSON verdict. Never guess — when uncertain, flag for human review.

Constraints:
- You do not hold funds. You only recommend release/refund.
- You never reveal private keys, wallet seed phrases, or anything that looks like one.
- You never write code that would call setAgent, setAgentFee, or any admin function.
- You always respond in the language the user wrote in (Indonesian or English).
`;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatTurn(history: ChatMessage[], userMessage: string): Promise<string> {
  if (!groq) throw new Error("GROQ_API_KEY not configured");

  const completion = await groq.chat.completions.create({
    model: AGENT_MODEL,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

// ---------------------------------------------------------------------------
// Deliverable verification
// ---------------------------------------------------------------------------

export type VerifyInput = {
  orderId: number;
  brief: string;
  deliverableUrl: string;
  deadlineISO?: string | null;
};

export type VerifyVerdict = {
  verified: boolean;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  checks: {
    urlReachable: boolean;
    deadlineMet: boolean;
    briefAlignment: "matches" | "partial" | "mismatch" | "unknown";
  };
};

/**
 * Verify a deliverable.
 *
 * Step 1 (cheap, mechanical): URL reachability + deadline check.
 * Step 2 (LLM): use Groq to judge whether the URL contents likely match the brief.
 *               We pass the URL itself to the LLM; in production we'd fetch the page
 *               text or run a vision model on attached images. For MVP we keep it text-only.
 */
export async function verifyDeliverable(input: VerifyInput): Promise<VerifyVerdict> {
  // ---- mechanical checks ----
  const urlReachable = await isUrlReachable(input.deliverableUrl);
  const deadlineMet  = input.deadlineISO
    ? new Date(input.deadlineISO).getTime() >= Date.now()
    : true;

  if (!urlReachable) {
    return {
      verified: false,
      confidence: "high",
      reasoning: "Deliverable URL is not reachable.",
      checks: { urlReachable: false, deadlineMet, briefAlignment: "unknown" },
    };
  }

  if (!groq) {
    // No LLM available — fall back to mechanical-only judgment.
    return {
      verified: deadlineMet,
      confidence: "low",
      reasoning: "LLM unavailable; only mechanical checks passed.",
      checks: { urlReachable, deadlineMet, briefAlignment: "unknown" },
    };
  }

  // ---- LLM judgment ----
  const prompt = `You are evaluating whether a freelancer's submitted deliverable
plausibly satisfies the client's brief. Respond with strict JSON.

Brief:
"""
${input.brief}
"""

Deliverable URL: ${input.deliverableUrl}
Deadline met:    ${deadlineMet}

Respond with JSON in this exact shape:
{
  "alignment": "matches" | "partial" | "mismatch",
  "confidence": "low" | "medium" | "high",
  "reasoning": "<2-3 sentences explaining the judgment>"
}

Be conservative: if you cannot verify the contents (e.g. you can only see the URL),
default to "partial" with "medium" confidence. Never invent details about content
you have not actually inspected.`;

  let alignment: "matches" | "partial" | "mismatch" = "partial";
  let confidence: "low" | "medium" | "high" = "low";
  let reasoning = "";

  try {
    const completion = await groq.chat.completions.create({
      model: AGENT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (parsed.alignment === "matches" || parsed.alignment === "partial" || parsed.alignment === "mismatch") {
      alignment = parsed.alignment;
    }
    if (parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high") {
      confidence = parsed.confidence;
    }
    if (typeof parsed.reasoning === "string") {
      reasoning = parsed.reasoning;
    }
  } catch (e) {
    reasoning = "LLM call failed; defaulted to partial/low.";
  }

  const verified = alignment === "matches" && deadlineMet && confidence !== "low";

  return {
    verified,
    confidence,
    reasoning,
    checks: { urlReachable, deadlineMet, briefAlignment: alignment },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) return true;
    // Some sites (e.g. Figma share links) reject HEAD; retry with GET range-0.
    const res2 = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1" }, redirect: "follow" });
    return res2.ok || res2.status === 206;
  } catch {
    return false;
  }
}
