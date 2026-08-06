import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { appendMessage, listMessages, type Order } from "@/lib/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/agent/sweep  — the agent acting on its own initiative.
 *
 * Every other agent action in this app is triggered by a human clicking
 * something. This one isn't: a scheduled run (see vercel.json) has the agent
 * look over every live order and speak up when something needs attention —
 * a deadline closing in, work that has gone overdue, or a delivery the client
 * has left sitting unreviewed.
 *
 * Deliberately limited: it posts messages. It does not move funds, change order
 * status, or decide anything with money attached — the same boundary that
 * applies to the rest of the agent.
 *
 * Idempotent: each nudge carries a hidden marker and is only posted once per
 * order per condition, so a daily run never turns into a nag.
 */

const DAY = 86_400_000;

type Nudge = { marker: string; text: string };

/**
 * @param deliveredAt when the delivery actually landed (from the agent's verdict
 *   message), NOT order creation — an old order delivered an hour ago must not
 *   be treated as an unreviewed delivery.
 */
function nudgeFor(o: Order, now: number, deliveredAt: number | null): Nudge | null {
  const deadline = o.deadline ? new Date(o.deadline).getTime() : null;

  if (o.status === "funded" && deadline) {
    if (deadline < now) {
      return {
        marker: "[n:overdue]",
        text:
          `⏰ Heads up — the deadline for this order passed and no deliverable has been submitted yet. ` +
          `Freelancer: submit your work to start verification. Client: once the deadline plus the grace period elapses, a refund becomes available.`,
      };
    }
    if (deadline - now < 2 * DAY) {
      const hrs = Math.max(1, Math.round((deadline - now) / 3_600_000));
      return {
        marker: "[n:deadline-soon]",
        text:
          `⏳ The deadline for this order is about ${hrs} hour${hrs === 1 ? "" : "s"} away and the deliverable isn't in yet. ` +
          `Submitting early gives the verification step time to run before the cutoff.`,
      };
    }
  }

  if (o.status === "delivered" && deliveredAt != null && now - deliveredAt > 3 * DAY) {
    return {
      marker: "[n:awaiting-review]",
      text:
        `📌 This delivery has been waiting for review for a few days. ` +
        `Client: open the deliverable and release the payment if the work is good — the freelancer is holding for you.`,
    };
  }

  return null;
}

export async function GET(req: Request) {
  const started = Date.now();
  try {
    // Vercel signs cron requests. When CRON_SECRET is configured, require it so
    // this can't be triggered by strangers to burn writes.
    // Fail closed. This endpoint scans orders and writes messages, so leaving it
    // open when no secret happens to be configured is the same fail-open bug the
    // auth layer was fixed for.
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      logger.warn("agent.sweep.no_secret");
      return NextResponse.json(
        { error: "unconfigured", detail: "CRON_SECRET is not set; refusing to run." },
        { status: 503 }
      );
    }
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .in("status", ["funded", "delivered"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const orders = (data ?? []) as Order[];
    const now = Date.now();
    let posted = 0;
    const acted: number[] = [];

    for (const o of orders) {
      try {
        const msgs = await listMessages(o.id);

        // When did the delivery actually land? The verify step posts the agent's
        // verdict at submit time, so that message is the delivery timestamp.
        // Match anywhere in the message, not just at the start: the verification
        // report is written as a checklist now and "Verdict:" sits partway down
        // it. A startsWith check silently stopped resolving deliveredAt, which
        // disabled the unreviewed-delivery nudge entirely.
        const verdictMsg = [...msgs]
          .reverse()
          .find((m) => m.role === "agent" && /(^|\n)Verdict:/.test(m.content));
        const deliveredAt = verdictMsg ? new Date(verdictMsg.created_at).getTime() : null;

        const nudge = nudgeFor(o, now, deliveredAt);
        if (!nudge) continue;

        // Only speak once per condition per order.
        if (msgs.some((m) => m.role === "agent" && m.content.includes(nudge.marker))) continue;

        await appendMessage(o.id, "agent", `${nudge.text}\n${nudge.marker}`);
        posted++;
        acted.push(o.id);
      } catch (e) {
        logger.error("agent.sweep.order_failed", { orderId: o.id, err: String(e) });
      }
    }

    logger.info("agent.sweep.done", { scanned: orders.length, posted, tookMs: Date.now() - started });
    return NextResponse.json({ ok: true, scanned: orders.length, posted, orders: acted });
  } catch (err: any) {
    logger.error("agent.sweep.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { ok: false, error: "sweep_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
