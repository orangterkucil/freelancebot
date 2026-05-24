import Groq from "groq-sdk";

/**
 * Groq client. `null` if GROQ_API_KEY is not set so callers can degrade gracefully.
 * Instantiation does not perform any network calls, so it is safe at module load.
 */
const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

export const AGENT_MODEL = "llama-3.3-70b-versatile";
