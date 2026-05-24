"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AgentChat } from "@/components/AgentChat";
import { OrderActions } from "@/components/OrderActions";
import { StatusBadge } from "@/components/StatusBadge";
import { getOrder } from "@/lib/api";
import type { Order } from "@/lib/orders";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);

  // Detect role from localStorage (which email signed in where).
  const [role, setRole] = useState<"client" | "freelancer" | null>(null);

  useEffect(() => {
    try {
      const clientEmail     = window.localStorage.getItem("fb_client_email");
      const freelancerEmail = window.localStorage.getItem("fb_freelancer_email");
      // we'll set after we load the order so we can compare to its emails
      const ctx = { clientEmail, freelancerEmail };
      (window as any).__fbAuthCtx = ctx;
    } catch {}
  }, []);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const { order } = await getOrder(orderId);
      setOrder(order);

      const ctx = (window as any).__fbAuthCtx ?? {};
      const isClient     = ctx.clientEmail === order.client_email;
      const isFreelancer = ctx.freelancerEmail === order.freelancer_email;

      if (isClient && isFreelancer) {
        // Same email is both parties (common in solo testing).
        // Pick the role whose turn it is based on order status.
        if (order.status === "funded") setRole("freelancer");      // freelancer must deliver
        else if (order.status === "delivered") setRole("client");  // client must approve
        else if (order.status === "draft") setRole("client");      // client must fund
        else setRole("client");                                    // released/refunded — read-only
      } else if (isClient) {
        setRole("client");
      } else if (isFreelancer) {
        setRole("freelancer");
      } else {
        setRole(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadAll = () => {
    setChatKey((k) => k + 1);
    load();
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl px-6 py-10 text-slate-500">Loading order…</main>;
  }
  if (error || !order) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-rose-700">{error ?? "Order not found"}</p>
        <Link href="/" className="mt-4 inline-block text-brand underline">← back to home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <Link href="/" className="text-xs uppercase tracking-wider text-brand-dark">
          ← FreelanceBot
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
            <p className="mt-1 text-sm text-slate-600">{order.brief}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <Field label="Client">{order.client_email}</Field>
          <Field label="Freelancer">{order.freelancer_email}</Field>
          <Field label="Amount">${order.amount_usdc.toLocaleString()} USDC</Field>
          <Field label="Deadline">
            {order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}
          </Field>
        </dl>
      </header>

      {!role && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You&apos;re viewing this order but not signed in as the client or freelancer.{" "}
          <Link href="/client" className="underline">Sign in as client</Link> or{" "}
          <Link href="/freelancer" className="underline">freelancer</Link> to take actions.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="h-[600px]">
          <AgentChat orderId={order.id} role={role ?? "client"} refreshKey={chatKey} />
        </div>
        <div className="space-y-4">
          {role ? (
            <OrderActions order={order} role={role} onChanged={reloadAll} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              Sign in to act on this order.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{children}</dd>
    </div>
  );
}
