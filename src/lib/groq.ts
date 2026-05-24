import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey
  ? new Groq({ apiKey })
  : null;

export const AGENT_MODEL = "llama-3.3-70b-versatile";
