import { NextResponse } from "next/server";

// Placeholder. Week 3 implements: link reachability, deadline match, deliverable type checks.
export async function POST(req: Request) {
  const { deliverableUrl, orderId } = await req.json();
  return NextResponse.json({
    orderId,
    deliverableUrl,
    verified: false,
    reason: "not_implemented_yet",
  });
}
