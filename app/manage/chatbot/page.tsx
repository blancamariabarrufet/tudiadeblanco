"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { loadChatbot, saveChatbot } from "@/app/actions/panel";
import type { QAPair } from "@/lib/types";
import { Plus, Trash2, GripVertical, Send, RotateCcw, Save } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_QA: Omit<QAPair, "id" | "submission_id">[] = [
  { question: "What time does the ceremony start?", answer: "The ceremony begins at 2:00 PM.", order: 0 },
  { question: "Where is the venue?", answer: "The venue is at...", order: 1 },
  { question: "Is there parking available?", answer: "Yes, free parking is available on-site.", order: 2 },
];

export default function ChatbotPage() {
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [contextBlock, setContextBlock] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your wedding concierge. Ask me anything about the big day." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await loadChatbot();
    if (data.qaPairs.length > 0) {
      setQaPairs(data.qaPairs);
    } else {
      const examples = EXAMPLE_QA.map((e, i) => ({ ...e, id: `example-${i}`, submission_id: "" }));
      setQaPairs(examples);
    }

    setContextBlock(data.contextBlock);
    setLastSaved(data.updatedAt);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function addPair() {
    const newPair: QAPair = {
      id: `new-${Date.now()}`,
      question: "",
      answer: "",
      order: qaPairs.length,
      submission_id: "",
    };
    setQaPairs((prev) => [...prev, newPair]);
  }

  function updatePair(id: string, field: "question" | "answer", value: string) {
    setQaPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function removePair(id: string) {
    setQaPairs((prev) => prev.filter((p) => p.id !== id));
  }

  async function save() {
    setSaving(true);
    const updatedAt = await saveChatbot({
      qaPairs: qaPairs.map((pair) => ({ question: pair.question, answer: pair.answer })),
      contextBlock,
    });
    setLastSaved(updatedAt);
    setSaving(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: question }]);
    setChatLoading(true);

    const knowledgeContext = [
      ...qaPairs.map((p) => `Q: ${p.question}\nA: ${p.answer}`),
      contextBlock ? `Additional context:\n${contextBlock}` : "",
    ].filter(Boolean).join("\n\n");

    const matched = qaPairs.find((p) =>
      question.toLowerCase().includes(p.question.toLowerCase().split(" ").slice(2, 5).join(" ").toLowerCase())
    );

    const reply = matched
      ? matched.answer
      : knowledgeContext
      ? "Based on what I know about your wedding, I don't have a specific answer to that question yet. The couple will update me with more details soon!"
      : "I'm still learning! The couple is setting up my knowledge base. Check back soon.";

    setTimeout(() => {
      setChatMessages((m) => [...m, { role: "assistant", content: reply }]);
      setChatLoading(false);
    }, 600);
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>Loading…</div>;

  return (
    <div>
      <ModuleHeader
        title="Concierge Knowledge Base"
        subtitle="Control what your AI concierge knows and says."
        actions={
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
          >
            <Save size={14} strokeWidth={1.5} />
            {saving ? "Saving…" : "Save & Publish"}
          </button>
        }
      />

      <div className="flex gap-6">
        {/* Editor */}
        <div className="flex-1 space-y-6">
          {/* Q&A Pairs */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                Questions & Answers
              </h2>
              <button
                onClick={addPair}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--surface-container-low)]"
                style={{ fontFamily: "var(--font-work-sans)", color: "var(--primary)" }}
              >
                <Plus size={12} strokeWidth={1.5} /> Add pair
              </button>
            </div>

            <div className="space-y-4">
              {qaPairs.map((pair) => (
                <div key={pair.id} className="flex gap-3 group">
                  <div className="mt-3 cursor-grab" style={{ color: "var(--outline-variant)" }}>
                    <GripVertical size={14} strokeWidth={1} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={pair.question}
                      onChange={(e) => updatePair(pair.id, "question", e.target.value)}
                      placeholder="Question your guests might ask…"
                      className="input-underline text-sm font-medium"
                    />
                    <textarea
                      value={pair.answer}
                      onChange={(e) => updatePair(pair.id, "answer", e.target.value)}
                      placeholder="The answer your concierge will give…"
                      rows={2}
                      className="input-underline text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={() => removePair(pair.id)}
                    className="mt-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--secondary-container)]"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    <Trash2 size={13} strokeWidth={1} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Context block */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
          >
            <label
              className="block text-base font-bold mb-1"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
            >
              Additional context your concierge should know
            </label>
            <p
              className="text-xs mb-3"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
            >
              Venue details, travel directions, accommodation codes, dress code, parking, etc.
            </p>
            <textarea
              value={contextBlock}
              onChange={(e) => setContextBlock(e.target.value)}
              rows={8}
              placeholder="Add any additional information here as plain text…"
              className="input-underline resize-none text-sm"
              style={{ lineHeight: "1.7" }}
            />
          </div>

          {lastSaved && (
            <p className="text-xs" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
              Last published {new Date(lastSaved).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>

        {/* Live Preview */}
        <div
          className="w-72 shrink-0 rounded-2xl flex flex-col overflow-hidden"
          style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)", height: "520px" }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(204,198,188,0.2)" }}
          >
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Live Preview
            </p>
            <button
              onClick={() => setChatMessages([{ role: "assistant", content: "Hi! I'm your wedding concierge. Ask me anything about the big day." }])}
              className="p-1 rounded hover:bg-[var(--surface-container-low)] transition-colors"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <RotateCcw size={12} strokeWidth={1} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "var(--primary)" : "var(--surface-container-low)",
                    color: msg.role === "user" ? "white" : "var(--on-surface)",
                    fontFamily: "var(--font-work-sans)",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div
            className="p-3 flex gap-2"
            style={{ borderTop: "1px solid rgba(204,198,188,0.2)" }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              placeholder="Ask a question…"
              className="flex-1 py-1.5 px-2 rounded-lg text-xs bg-[var(--surface-container-low)] outline-none"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
            />
            <button
              onClick={sendChat}
              className="p-2 rounded-lg transition-colors"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Send size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
