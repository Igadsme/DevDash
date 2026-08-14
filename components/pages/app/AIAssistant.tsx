"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Send, ArrowRight } from "lucide-react";
import { postJson } from "@/lib/hooks";
import { useSession } from "next-auth/react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const prompts = [
  "What did I accomplish this week?",
  "What needs my attention right now?",
  "Generate my standup.",
  "Summarize my authentication work.",
  "What were my biggest blockers?",
  "Why was I less productive yesterday?",
  "What was I mainly working on this month?",
];

let msgId = 1;

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const avatar = (session?.user?.name || "D").slice(0, 1).toUpperCase();

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: msgId++, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const result = await postJson<{ conversationId: string; message: { content: string; sources?: string[] } }>(
        "/api/ai",
        { message: text, conversationId },
      );
      setConversationId(result.conversationId);
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          role: "assistant",
          content: result.message.content,
          sources: result.message.sources,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          role: "assistant",
          content: err instanceof Error ? err.message : "The assistant could not answer right now.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e26" }}>
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={15} style={{ color: "#4a8fff" }} />
          <h1 className="text-base font-semibold" style={{ color: "#f0f0f2" }}>Ask DevDash</h1>
        </div>
        <p className="text-xs" style={{ color: "#6b6b80" }}>Answers grounded in your real engineering activity.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8 fade-in">
            <div className="text-sm font-medium mb-4" style={{ color: "#6b6b80" }}>Example questions</div>
            <div className="grid gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="flex items-center justify-between text-left px-4 py-3 rounded-lg text-sm transition-all group"
                  style={{ background: "#111116", border: "1px solid #1e1e26", color: "#a0a0b0" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2a2a35";
                    (e.currentTarget as HTMLElement).style.color = "#f0f0f2";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1e1e26";
                    (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
                  }}
                >
                  {p}
                  <ArrowRight size={12} style={{ color: "#3e3e50", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "#0d1a2d", color: "#4a8fff" }}
              >
                <Zap size={13} />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
              <div
                className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                style={{
                  background: msg.role === "user" ? "#1e1e2a" : "#111116",
                  border: `1px solid ${msg.role === "user" ? "#2a2a35" : "#1e1e26"}`,
                  color: msg.role === "user" ? "#f0f0f2" : "#a0a0b0",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content.split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} style={{ color: "#f0f0f2", fontWeight: 600 }}>{part}</strong>
                  ) : (
                    part
                  )
                )}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs" style={{ color: "#3e3e50" }}>Sources:</span>
                  {msg.sources.map((s) => (
                    <button
                      key={s}
                      className="text-xs px-2 py-0.5 rounded font-mono transition-all"
                      style={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#4a8fff" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#0d1a2d")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#0d1117")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold"
                style={{ background: "#1e1e2a", color: "#4a8fff" }}
              >
                {avatar}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 fade-in">
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "#0d1a2d", color: "#4a8fff" }}
            >
              <Zap size={13} />
            </div>
            <div
              className="px-4 py-3 rounded-xl"
              style={{ background: "#111116", border: "1px solid #1e1e26" }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#4a8fff",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid #1e1e26" }}>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "#111116", border: "1px solid #1e1e26" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about your engineering activity..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#f0f0f2" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all flex-shrink-0"
            style={{
              background: input.trim() ? "#4a8fff" : "#1e1e2a",
              color: input.trim() ? "#fff" : "#3e3e50",
            }}
          >
            <Send size={13} />
          </button>
        </div>
        <div className="text-xs mt-2 text-center" style={{ color: "#3e3e50" }}>
          Grounded in your GitHub, CI/CD, and calendar activity.
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
