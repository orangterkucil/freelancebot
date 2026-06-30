"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { getOrder, sendChat } from "@/lib/api";
import type { Message } from "@/lib/orders";

export function AgentChat({
  orderId,
  role,
  refreshKey,
}: {
  orderId: number;
  role: "client" | "freelancer";
  refreshKey?: number;
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
    <div className="liquid-glass relative flex h-full flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-signal" />
          <p className="font-display text-sm uppercase tracking-wider text-cream">
            Agent chat
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
          You are <span className="text-cream/80">{role}</span> · agent reads thread + order context
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="font-mono text-xs uppercase tracking-wider text-cream/40">
            No messages yet. Say hi to the agent.
          </p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} viewer={role} />
        ))}
      </div>

      {error && (
        <div className="border-t border-rose-400/30 bg-rose-500/10 px-5 py-2">
          <p className="font-mono text-xs text-rose-300">{error}</p>
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-white/5 px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 font-display text-xs uppercase tracking-wider text-ink transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Send className="h-3.5 w-3.5" />
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
    ? "bg-signal text-ink"
    : isAgent
    ? "bg-signal/10 text-cream border border-signal/20"
    : isSystem
    ? "bg-white/[0.04] text-cream/50 text-xs italic"
    : "bg-white/[0.06] text-cream";

  const label = isAgent ? "FreelanceBot" : isSystem ? "system" : message.role;

  return (
    <div className={`flex flex-col ${align}`}>
      <span className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-cream/40">
        {label}
      </span>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 font-mono text-xs leading-relaxed ${bubble}`}>
        {message.content}
      </div>
    </div>
  );
}
