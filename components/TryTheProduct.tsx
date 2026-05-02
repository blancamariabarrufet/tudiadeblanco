"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { VellumOverlay } from "@/components/ui/VellumOverlay";
import { ArrowRightIcon, SendIcon, SpinnerIcon } from "@/components/ui/icons";

type DemoFormState = {
  partnerOne: string;
  partnerTwo: string;
  date: string;
  venue: string;
  vibe: string;
  funFact: string;
  email: string;
};

type Message = {
  role: "assistant" | "user";
  content: string;
};

const initialForm: DemoFormState = {
  partnerOne: "",
  partnerTwo: "",
  date: "",
  venue: "",
  vibe: "",
  funFact: "",
  email: "",
};

function makeGreeting(form: DemoFormState) {
  const names = [form.partnerOne, form.partnerTwo].filter(Boolean).join(" & ") || "the couple";
  const venue = form.venue || "your celebration";
  const vibe = form.vibe || "elegant and welcoming";

  return `Hello, I'm your invisible host for ${names}. I'll help guests navigate ${venue} with a ${vibe.toLowerCase()} tone throughout the weekend.`;
}

function buildReply(message: string, form: DemoFormState) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("dress") || lowerMessage.includes("wear")) {
    return `The tone of the day is ${form.vibe || "beautifully considered"}, so I would guide guests toward polished attire with ease. If you'd like, I can also suggest a few outfit cues for each event.`;
  }

  if (lowerMessage.includes("where") || lowerMessage.includes("venue") || lowerMessage.includes("direction")) {
    return `The celebration is centered around ${form.venue || "the wedding venue"}, and I would share calm, precise directions with guests as they arrive. I can also mention parking, transfers, or timing notes once those details are added.`;
  }

  if (lowerMessage.includes("story") || lowerMessage.includes("met") || lowerMessage.includes("fun fact")) {
    return `One lovely detail I can share is this: ${form.funFact || "their story is filled with thoughtful little moments"}. It gives the assistant a more personal, human warmth.`;
  }

  return `Absolutely. I would answer that in a concise, polished tone and keep the guidance aligned with ${form.partnerOne || "Partner One"} and ${form.partnerTwo || "Partner Two"}'s day. This shell is local for now, but the final assistant can respond in real time.`;
}

export function TryTheProduct({ onOpenOrder }: { onOpenOrder: () => void }) {
  const [form, setForm] = useState<DemoFormState>(initialForm);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState("");

  const canSubmit = useMemo(() => {
    return Boolean(form.partnerOne && form.partnerTwo && form.venue && form.email);
  }, [form]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessages([{ role: "assistant", content: makeGreeting(form) }]);
      setIsLoading(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [form, isLoading]);

  function updateField(field: keyof DemoFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setOverlayOpen(true);
    setIsLoading(true);
    setMessages([]);
    setDraftMessage("");
  }

  function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftMessage.trim()) {
      return;
    }

    const nextUserMessage = draftMessage.trim();
    setMessages((current) => [
      ...current,
      { role: "user", content: nextUserMessage },
      { role: "assistant", content: buildReply(nextUserMessage, form) },
    ]);
    setDraftMessage("");
  }

  return (
    <>
      <section id="try-the-product" className="bg-[color:var(--surface)] px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family:var(--font-serif)] text-[clamp(2rem,4vw,3rem)] tracking-[-0.01em] text-[color:var(--on-surface)]">
            See it come alive in seconds.
          </h2>
          <p className="mt-4 font-[family:var(--font-serif)] text-base leading-8 text-[rgba(26,28,26,0.7)]">
            Tell us a little about your day. We&apos;ll build your assistant on the spot.
          </p>
        </div>

        <form className="mx-auto mt-12 max-w-2xl" onSubmit={handleSubmit}>
          <div className="grid gap-8 md:grid-cols-2">
            <label className="soft-field">
              <span className="soft-label">Partner 1</span>
              <input
                value={form.partnerOne}
                onChange={(event) => updateField("partnerOne", event.target.value)}
                placeholder="Sara"
              />
            </label>
            <label className="soft-field">
              <span className="soft-label">Partner 2</span>
              <input
                value={form.partnerTwo}
                onChange={(event) => updateField("partnerTwo", event.target.value)}
                placeholder="James"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-8">
            <label className="soft-field">
              <span className="soft-label">Wedding date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </label>

            <label className="soft-field">
              <span className="soft-label">Venue name</span>
              <input
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                placeholder="Mas Torroella"
              />
            </label>

            <label className="soft-field">
              <span className="soft-label">Wedding vibe / theme</span>
              <input
                value={form.vibe}
                onChange={(event) => updateField("vibe", event.target.value)}
                placeholder="e.g. Coastal Chic, Rustic Garden, Black Tie"
              />
            </label>

            <label className="soft-field">
              <span className="soft-label">One fun fact</span>
              <input
                value={form.funFact}
                onChange={(event) => updateField("funFact", event.target.value)}
                placeholder="e.g. We met in Barcelona"
              />
            </label>

            <label className="soft-field">
              <span className="soft-label">Your email - we&apos;ll save your demo here</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="hello@example.com"
              />
            </label>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button type="submit" className="px-8 py-3 disabled:cursor-not-allowed disabled:opacity-50" fullWidth disabled={!canSubmit}>
              <span>Build My Assistant</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </section>

      <VellumOverlay
        isOpen={overlayOpen}
        onClose={() => {
          setOverlayOpen(false);
          setIsLoading(false);
        }}
        panelClassName="max-w-4xl bg-transparent p-0 shadow-none"
      >
        <div className="rounded-[calc(var(--radius-lg)+0.5rem)] bg-[rgba(255,255,255,0.48)] p-4 shadow-[var(--shadow-ambient)] backdrop-blur-sm sm:p-6">
          <div className="rounded-[calc(var(--radius-lg)+0.25rem)] bg-[color:var(--surface-container-lowest)] p-6 sm:p-8">
            {isLoading ? (
              <div className="flex min-h-[460px] flex-col items-center justify-center gap-5 text-center">
                <SpinnerIcon className="h-8 w-8 text-[color:var(--primary)]" />
                <p className="font-[family:var(--font-serif)] text-3xl italic text-[color:var(--on-surface)]">
                  Your assistant is waking up...
                </p>
              </div>
            ) : (
              <div className="flex min-h-[460px] flex-col">
                <div className="mx-auto max-w-2xl text-center">
                  <p className="eyebrow">Interactive shell</p>
                  <h3 className="mt-3 font-[family:var(--font-serif)] text-3xl text-[color:var(--on-surface)]">
                    Your assistant is live.
                  </h3>
                </div>

                <div className="mx-auto mt-8 flex w-full max-w-2xl flex-1 flex-col rounded-[calc(var(--radius-lg)+0.25rem)] bg-[color:var(--surface-container-low)] p-4">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`chat-bubble ${message.role === "assistant" ? "bot" : "guest"} ${message.role === "user" ? "ml-auto" : ""}`}
                      >
                        {message.content}
                      </div>
                    ))}
                  </div>

                  <form
                    className="mt-5 flex items-center gap-3 rounded-[var(--radius-full)] bg-[color:var(--surface-container-lowest)] px-4 py-3"
                    onSubmit={handleSendMessage}
                  >
                    <input
                      className="min-w-0 flex-1 border-none bg-transparent font-[family:var(--font-serif)] text-base text-[color:var(--on-surface)] outline-none"
                      placeholder="Ask me anything..."
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--primary)] transition-opacity hover:opacity-70"
                      aria-label="Send message"
                    >
                      <SendIcon className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-[family:var(--font-sans)] text-sm text-[rgba(26,28,26,0.55)]">
                    This is an interactive shell for the promo phase. The production assistant
                    will stream live answers.
                  </p>
                  <Button
                    onClick={() => {
                      setOverlayOpen(false);
                      onOpenOrder();
                    }}
                    className="justify-center px-6 py-3"
                  >
                    <span>Begin Your Story</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </VellumOverlay>
    </>
  );
}
