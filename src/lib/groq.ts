import Groq from "groq-sdk";

/**
 * Groq client. `null` if GROQ_API_KEY is not set so callers can degrade gracefully.
 * Instantiation does not perform any network calls, so it is safe at module load.
 */
const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

export const AGENT_MODEL = "llama-3.3-70b-versatile";

/**
 * Vision model used to actually look at an image deliverable.
 *
 * AGENT_MODEL is text-only, so without this the agent can only reason about a
 * URL string — which is why it could never say more than "contents not
 * inspected". Overridable so the model can be swapped without a code change.
 */
export const AGENT_VISION_MODEL =
  process.env.AGENT_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
