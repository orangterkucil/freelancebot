import { NextResponse } from "next/server";
import { groq, AGENT_MODEL } from "@/lib/groq";

// Placeholder route. Week 3 fills in the real agent logic.
export async function POST(req: Request) {
  if (!groq) {
    return NextResponse.json(
      { error: "Groq API key not configured" },
      { status: 500 }
    );
  }
  const { message } = await req.json();

  const completion = await groq.chat.completions.create({
    model: AGENT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are FreelanceBot, an autonomous payment agent. Respond briefly.",
      },
      { role: "user", content: message ?? "" },
    ],
  });

  return NextResponse.json({
    reply: completion.choices[0]?.message?.content ?? "",
  });
}
