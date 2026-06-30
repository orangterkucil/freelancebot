"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AgentChat } from "@/components/AgentChat";
import { OrderActions } from "@/components/OrderActions";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationsList } from "@/components/ApplicationsList";
import { getOrder } from "@/lib/api";
import type { Order } from "@/lib/orders";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);

  const [role, setRole] = useState<"client" | "freelancer" | null>(null);

  useEffect(() => {
    try {
      const clientEmail     = window.localStorage.getItem("fb_client_email");
      const freelancerEmail = window.localStorage.getItem("fb_freelancer_email");
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
        if (order.status === "funded") setRole("freelancer");
        else if (order.status === "delivered") setRole("client");
        else if (order.status === "draft") setRole("client");
        else setRole("client");
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
    return (
      <AppShell title="Loading…" subtitle="Fetching order from Supabase">
        <div className="liquid-glass rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-cream/50">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !order) {
    return (
      <AppShell title="Order not found" subtitle={error ?? "This order does not exist or you do not have access"}>
        <Link href="/client" className="liquid-glass inline-flex rounded-xl px-4 py-2 font-display text-xs uppercase tracking-wider text-cream hover:bg-white/10">
          ← back to dashboard
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Order #${order.id}`}
      subtitle={order.brief}
      breadcrumb={
        <>
          {role === "freelancer" ? "Freelancer" : "Client"} / Orders / #{order.id}
        </>
      }
      actions={<StatusBadge status={order.status} />}
    >
      {/* Meta strip */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Client">{order.client_email}</Field>
        <Field label="Freelancer">{order.freelancer_email}</Field>
        <Field label="Amount">
          <span className="font-display text-base text-signal">
            ${order.amount_usdc.toLocaleString()}
          </span>
          <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">USDC</span>
        </Field>
        <Field label="Deadline">
          {order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}
        </Field>
      </dl>

      {!role && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-amber-300">
            You are viewing this order but not signed in as the client or freelancer.{" "}
            <Link href="/client" className="underline">Sign in as client</Link> or{" "}
            <Link href="/freelancer" className="underline">freelancer</Link> to take actions.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="h-[600px]">
          <AgentChat orderId={order.id} role={role ?? "client"} refreshKey={chatKey} />
        </div>
        <div className="space-y-4">
          {role ? (
            <OrderActions order={order} role={role} onChanged={reloadAll} />
          ) : (
            <div className="liquid-glass rounded-2xl p-5 text-sm font-mono uppercase tracking-wider text-cream/50">
              Sign in to act on this order.
            </div>
          )}

          {/* Applications panel — only for client viewing a public order */}
          {role === "client" && order.is_public && order.status === "draft" && (
            <ApplicationsList orderId={order.id} onAccepted={reloadAll} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="liquid-glass rounded-2xl p-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-cream/40">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-cream truncate">{children}</dd>
    </div>
  );
}
