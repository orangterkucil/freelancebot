"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmailGate } from "@/components/EmailGate";
import { OrderCard } from "@/components/OrderCard";
import { listOrders } from "@/lib/api";
import type { Order } from "@/lib/orders";

export default function FreelancerPage() {
  return (
    <EmailGate storageKey="fb_freelancer_email" label="Sign in as freelancer">
      {(email, signOut) => <FreelancerDashboard email={email} signOut={signOut} />}
    </EmailGate>
  );
}

function FreelancerDashboard({ email, signOut }: { email: string; signOut: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { orders } = await listOrders(email);
      setOrders(orders.filter((o) => o.freelancer_email === email));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <Link href="/" className="text-xs uppercase tracking-wider text-brand-dark">
          ← FreelanceBot
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Freelancer dashboard</h1>
        <p className="text-sm text-slate-500">
          Signed in as <strong>{email}</strong>{" "}
          <button onClick={signOut} className="ml-2 text-xs text-brand underline">
            switch
          </button>
        </p>
      </header>

      {loading && <p className="text-slate-500">Loading orders…</p>}
      {error && <p className="text-rose-700">{error}</p>}

      {!loading && orders.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No orders coming your way yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Ask a client to create an order on the <Link href="/client" className="text-brand underline">client page</Link>{" "}
            using your email: <strong>{email}</strong>.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} perspective="freelancer" />
        ))}
      </div>
    </main>
  );
}
