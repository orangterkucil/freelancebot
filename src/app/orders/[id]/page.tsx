"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AgentChat } from "@/components/AgentChat";
import { OrderActions } from "@/components/OrderActions";
import { EditOrderPanel } from "@/components/EditOrderPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationsList } from "@/components/ApplicationsList";
import { AttachmentsList } from "@/components/AttachmentsList";
import { RatingForm } from "@/components/RatingForm";
import { UserBadge } from "@/components/UserBadge";
import { getOrder, listRatingsForOrder } from "@/lib/api";
import type { Order, Rating } from "@/lib/orders";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [role, setRole] = useState<"client" | "freelancer" | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    try {
      const clientEmail     = window.localStorage.getItem("fb_client_email");
      const freelancerEmail = window.localStorage.getItem("fb_freelancer_email");
      (window as any).__fbAuthCtx = { clientEmail, freelancerEmail };
    } catch {}
  }, []);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true); setError(null);
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
      } else if (isClient) setRole("client");
      else if (isFreelancer) setRole("freelancer");
      else setRole(null);

      // load ratings (silent fail)
      try {
        const { ratings } = await listRatingsForOrder(orderId);
        setRatings(ratings);
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Failed to load order");
    } finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const reloadAll = () => {
    setChatKey((k) => k + 1);
    load();
  };

  if (loading) {
    return (
      <AppShell title="Loading…" subtitle="Fetching order">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !order) {
    return (
      <AppShell title="Order not found" subtitle={error ?? "This order does not exist or you do not have access"}>
        <Link href="/client" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 font-display text-xs uppercase tracking-wider text-slate-700 hover:border-brand hover:text-brand">
          ← back to dashboard
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Order #${order.id}`}
      subtitle={order.brief}
      breadcrumb={<>{role === "freelancer" ? "Freelancer" : "Client"} / Orders / #{order.id}</>}
      actions={<StatusBadge status={order.status} />}
    >
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Client"><UserBadge email={order.client_email} raw /></Field>
        <Field label="Freelancer"><UserBadge email={order.freelancer_email} raw /></Field>
        <Field label="Amount">
          <span className="font-display text-base text-brand">${order.amount_usdc.toLocaleString()}</span>
          <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">USDC</span>
        </Field>
        <Field label="Deadline">{order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}</Field>
      </dl>

      {order.attachments && order.attachments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Attachments ({order.attachments.length})
          </p>
          <AttachmentsList
            attachments={order.attachments}
            isPublic={order.is_public}
            isViewerParty={!!role}
          />
        </div>
      )}

      {!role && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-amber-800">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-mono uppercase tracking-wider text-slate-500 shadow-sm">
              Sign in to act on this order.
            </div>
          )}

          {role === "client" && order.status === "draft" && (
            <EditOrderPanel order={order} onSaved={reloadAll} />
          )}

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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-slate-900 truncate">{children}</dd>
    </div>
  );
}
