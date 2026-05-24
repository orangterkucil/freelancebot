"use client";

import { useEffect, useRef, useState } from "react";
import { getOrder, sendChat } from "@/lib/api";
import type { Message } from "@/lib/orders";

export function AgentChat({
  orderId,
  role,
  refreshKey,
}: {
  orderId: number;
  role: "client" | "freelancer";
  refreshKey?: number; // bump from parent to force reload
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const { messages } = await getOrder(orderId);
      setMessages(messages);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load messages");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, refreshKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendChat(orderId, role, input.trim());
      setInput("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Agent chat</h3>
        <p className="text-xs text-slate-500">
          You are the <strong>{role}</strong>. The agent sees this thread + the order context.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">No messages yet. Say hi to the agent.</p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} viewer={role} />
        ))}
      </div>

      {error && <p className="px-5 pb-2 text-sm text-rose-700">{error}</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, viewer }: { message: Message; viewer: "client" | "freelancer" }) {
  const isMine = message.role === viewer;
  const isAgent = message.role === "agent";
  const isSystem = message.role === "system";

  const align = isMine ? "items-end" : "items-start";
  const bubble = isMine
    ? "bg-brand text-white"
    : isAgent
    ? "bg-purple-50 text-purple-900 border border-purple-200"
    : isSystem
    ? "bg-slate-100 text-slate-600 text-xs italic"
    : "bg-slate-100 text-slate-900";

  const label = isAgent
    ? "FreelanceBot"
    : isSystem
    ? "system"
    : message.role;

  return (
    <div className={`flex flex-col ${align}`}>
      <span className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${bubble}`}>
        {message.content}
      </div>
    </div>
  );
}
