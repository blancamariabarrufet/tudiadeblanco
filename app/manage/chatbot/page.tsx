"use client";
export const dynamic = "force-dynamic";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { Button } from "@/components/ui/Button";
import { CheckIcon, SendIcon, SparklesIcon, SpinnerIcon } from "@/components/ui/icons";
import { streamDemoChat, type DemoChatContext, type DemoChatMessage } from "@/lib/chat-demo";
import { useLanguage, type Locale } from "@/lib/i18n";

type ConciergeBrief = {
  partnerOne: string;
  partnerTwo: string;
  email: string;
  weddingDate: string;
  ceremonyVenue: string;
  receptionVenue: string;
  dressCode: string;
  arrivalNote: string;
  tone: string;
  extraNotes: string;
};

type ChatMessage = {
  id: number;
  role: "host" | "guest";
  text: string;
  streaming?: boolean;
};

const initialBrief: ConciergeBrief = {
  partnerOne: "",
  partnerTwo: "",
  email: "",
  weddingDate: "",
  ceremonyVenue: "",
  receptionVenue: "",
  dressCode: "",
  arrivalNote: "",
  tone: "",
  extraNotes: "",
};

function getCoupleName(brief: ConciergeBrief, fallback: string) {
  const names = [brief.partnerOne, brief.partnerTwo]
    .map((name) => name.trim())
    .filter(Boolean);

  return names.length > 0 ? names.join(" & ") : fallback;
}

function getDateLabel(date: string, locale: Locale, fallback: string) {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function buildIntro(brief: ConciergeBrief, locale: Locale, t: (key: string) => string) {
  const names = getCoupleName(brief, t("invisible.fallback.names"));
  const date = getDateLabel(brief.weddingDate, locale, t("invisible.fallback.date"));
  const reception = brief.receptionVenue.trim() || t("invisible.fallback.reception");

  if (locale === "es") {
    return `Hola, soy el concierge de invitados de ${names}. Ya tengo la boda del ${date}, la ceremonia en ${brief.ceremonyVenue}, y la celebracion en ${reception}. Puedo ayudar a los invitados con horarios, vestimenta y llegada.`;
  }

  return `Hello, I am the guest concierge for ${names}. I have the wedding on ${date}, the ceremony at ${brief.ceremonyVenue}, and the reception at ${reception}. I can help guests with timing, dress code, and arrival details.`;
}

function buildAnswer(
  question: string,
  brief: ConciergeBrief,
  locale: Locale,
  t: (key: string) => string,
) {
  const normalized = question.toLowerCase();
  const names = getCoupleName(brief, t("invisible.fallback.names"));
  const date = getDateLabel(brief.weddingDate, locale, t("invisible.fallback.date"));
  const reception = brief.receptionVenue.trim() || t("invisible.fallback.reception");
  const dress = brief.dressCode.trim() || t("invisible.fallback.dress");
  const arrival = brief.arrivalNote.trim() || t("invisible.fallback.arrival");
  const notes = brief.extraNotes.trim();

  const asksDress = ["wear", "dress", "vestimenta", "pongo"].some((term) => normalized.includes(term));
  const asksPlace = ["where", "venue", "ceremony", "donde", "donde", "ceremonia"].some((term) =>
    normalized.includes(term),
  );
  const asksArrival = ["transport", "arrival", "get there", "llego", "llegar", "transporte"].some((term) =>
    normalized.includes(term),
  );
  const asksDate = ["when", "time", "date", "cuando", "hora", "fecha"].some((term) =>
    normalized.includes(term),
  );

  if (locale === "es") {
    if (asksDress) return `Para la boda de ${names}, el codigo de vestimenta es ${dress}.`;
    if (asksPlace) return `La ceremonia es en ${brief.ceremonyVenue}. Despues, la celebracion sera en ${reception}.`;
    if (asksArrival) return arrival;
    if (asksDate) return `La boda de ${names} es el ${date}.`;

    return notes
      ? `${notes} Si necesitas algo mas, puedo orientarte con la ceremonia, la celebracion, la llegada o el dress code.`
      : `Puedo ayudarte con la boda de ${names}: ceremonia en ${brief.ceremonyVenue}, celebracion en ${reception}, fecha ${date} y dress code ${dress}.`;
  }

  if (asksDress) return `For ${names}'s wedding, the dress code is ${dress}.`;
  if (asksPlace) return `The ceremony is at ${brief.ceremonyVenue}. Afterward, the reception will be at ${reception}.`;
  if (asksArrival) return arrival;
  if (asksDate) return `${names}'s wedding is on ${date}.`;

  return notes
    ? `${notes} I can also help with the ceremony, reception, arrival, or dress code.`
    : `I can help with ${names}'s wedding: ceremony at ${brief.ceremonyVenue}, reception at ${reception}, date ${date}, and dress code ${dress}.`;
}

function buildDemoContext(brief: ConciergeBrief): DemoChatContext {
  return {
    partner1_name: brief.partnerOne.trim(),
    partner2_name: brief.partnerTwo.trim(),
    contact_email: brief.email.trim(),
    wedding_date: brief.weddingDate.trim(),
    tone: brief.tone.trim() || "warm and friendly",
    ceremony_venue: brief.ceremonyVenue.trim(),
    reception_venue: brief.receptionVenue.trim(),
    dress_code: brief.dressCode.trim(),
    arrival_note: brief.arrivalNote.trim(),
    extra_details: brief.extraNotes.trim(),
  };
}

function toDemoHistory(messages: ChatMessage[]): DemoChatMessage[] {
  return messages
    .filter((message) => !message.streaming)
    .map((message) => ({
      role: message.role === "guest" ? "user" : "assistant",
      content: message.text,
    }));
}

export default function ChatbotPage() {
  const { locale, t } = useLanguage();
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const [brief, setBrief] = useState<ConciergeBrief>(initialBrief);
  const [activeBrief, setActiveBrief] = useState<ConciergeBrief>(initialBrief);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [generated, setGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const coupleName = useMemo(
    () => getCoupleName(activeBrief, t("invisible.fallback.names")),
    [activeBrief, t],
  );

  const quickQuestions = useMemo(
    () => [
      t("invisible.quick.dress"),
      t("invisible.quick.where"),
      t("invisible.quick.transport"),
    ],
    [t],
  );

  const canGenerate = Boolean(
    brief.partnerOne.trim() &&
      brief.partnerTwo.trim() &&
      brief.email.trim() &&
      brief.weddingDate &&
      brief.ceremonyVenue.trim(),
  );
  const generationDisabled = !canGenerate || isSaving;
  const chatDisabled = !generated || isChatLoading;
  const sendDisabled = !generated || isChatLoading || !chatInput.trim();

  useEffect(() => {
    return () => {
      chatAbortControllerRef.current?.abort();
    };
  }, []);

  function updateBrief<K extends keyof ConciergeBrief>(field: K, value: ConciergeBrief[K]) {
    setBrief((current) => ({ ...current, [field]: value }));
  }

  async function generateChatbot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!canGenerate || isSaving) return;

    const payload = {
      ...brief,
      locale,
      coupleName: getCoupleName(brief, t("invisible.fallback.names")),
    };

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/chatbot-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Chatbot save failed");
    } catch {
      setSaveError(t("invisible.form.saveError"));
      setIsSaving(false);
      return;
    }

    setActiveBrief(payload);
    setGenerated(true);
    setMessages([{ id: 1, role: "host", text: buildIntro(payload, locale, t) }]);
    setIsSaving(false);
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askQuestion(chatInput);
  }

  async function askQuestion(question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !generated || isChatLoading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: messages.length + 1, role: "guest", text: trimmedQuestion },
    ];
    const assistantId = nextMessages.length + 1;
    const controller = new AbortController();
    let streamedText = "";

    chatAbortControllerRef.current?.abort();
    chatAbortControllerRef.current = controller;
    setMessages([...nextMessages, { id: assistantId, role: "host", text: "", streaming: true }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const assistantText = await streamDemoChat({
        message: trimmedQuestion,
        history: toDemoHistory(nextMessages),
        demoContext: buildDemoContext(activeBrief),
        signal: controller.signal,
        onDelta: (delta) => {
          streamedText += delta;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, text: message.text + delta, streaming: true }
                : message,
            ),
          );
        },
      });
      const finalText = assistantText || buildAnswer(trimmedQuestion, activeBrief, locale, t);

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, text: finalText, streaming: false } : message,
        ),
      );
    } catch {
      const fallbackText =
        locale === "es"
          ? "No he podido conectar con el asistente ahora mismo. Intentalo de nuevo en un momento."
          : "I couldn't reach the assistant just now. Please try again in a moment.";
      const finalText =
        controller.signal.aborted && streamedText
          ? `${streamedText}\n\n${locale === "es" ? "(conexion perdida)" : "(connection lost)"}`
          : fallbackText;

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, text: finalText, streaming: false } : message,
        ),
      );
    } finally {
      if (chatAbortControllerRef.current === controller) {
        chatAbortControllerRef.current = null;
        setIsChatLoading(false);
      }
    }
  }

  return (
    <div>
      <ModuleHeader
        title="Your Guest's Concierge"
        subtitle="Generate the guest-facing concierge from your wedding details and test the answers guests will receive."
      />

      <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
        <div
          className="rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-5 shadow-[var(--shadow-ambient)] sm:p-7"
        >
          <form onSubmit={generateChatbot} className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-[family-name:var(--font-newsreader)] text-2xl text-[color:var(--on-surface)]">
                {t("invisible.form.title")}
              </h2>
              {generated && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary-container)] px-3 py-1 font-[family-name:var(--font-work-sans)] text-[0.7rem] uppercase tracking-[0.08em] text-[color:var(--primary)]">
                  <CheckIcon className="h-3.5 w-3.5" />
                  {t("invisible.chat.ready")}
                </span>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.partnerOne")}</span>
                <input
                  value={brief.partnerOne}
                  onChange={(event) => updateBrief("partnerOne", event.target.value)}
                  placeholder={t("invisible.form.partnerOnePlaceholder")}
                  required
                />
              </label>
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.partnerTwo")}</span>
                <input
                  value={brief.partnerTwo}
                  onChange={(event) => updateBrief("partnerTwo", event.target.value)}
                  placeholder={t("invisible.form.partnerTwoPlaceholder")}
                  required
                />
              </label>
            </div>

            <label className="soft-field">
              <span className="soft-label">{t("invisible.form.email")}</span>
              <input
                type="email"
                value={brief.email}
                onChange={(event) => updateBrief("email", event.target.value)}
                placeholder={t("invisible.form.emailPlaceholder")}
                required
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.date")}</span>
                <input
                  type="date"
                  value={brief.weddingDate}
                  onChange={(event) => updateBrief("weddingDate", event.target.value)}
                  required
                />
              </label>
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.tone")}</span>
                <input
                  value={brief.tone}
                  onChange={(event) => updateBrief("tone", event.target.value)}
                  placeholder={t("invisible.form.tonePlaceholder")}
                />
              </label>
            </div>

            <label className="soft-field">
              <span className="soft-label">{t("invisible.form.ceremony")}</span>
              <input
                value={brief.ceremonyVenue}
                onChange={(event) => updateBrief("ceremonyVenue", event.target.value)}
                placeholder={t("invisible.form.ceremonyPlaceholder")}
                required
              />
            </label>

            <label className="soft-field">
              <span className="soft-label">{t("invisible.form.reception")}</span>
              <input
                value={brief.receptionVenue}
                onChange={(event) => updateBrief("receptionVenue", event.target.value)}
                placeholder={t("invisible.form.receptionPlaceholder")}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.dress")}</span>
                <input
                  value={brief.dressCode}
                  onChange={(event) => updateBrief("dressCode", event.target.value)}
                  placeholder={t("invisible.form.dressPlaceholder")}
                />
              </label>
              <label className="soft-field">
                <span className="soft-label">{t("invisible.form.arrival")}</span>
                <input
                  value={brief.arrivalNote}
                  onChange={(event) => updateBrief("arrivalNote", event.target.value)}
                  placeholder={t("invisible.form.arrivalPlaceholder")}
                />
              </label>
            </div>

            <label className="soft-field">
              <span className="soft-label">{t("invisible.form.notes")}</span>
              <textarea
                value={brief.extraNotes}
                onChange={(event) => updateBrief("extraNotes", event.target.value)}
                placeholder={t("invisible.form.notesPlaceholder")}
                rows={3}
              />
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-[family-name:var(--font-work-sans)] text-xs leading-5 text-[rgba(26,28,26,0.55)]">
                {t("invisible.form.required")}
              </p>
              <Button
                type="submit"
                disabled={generationDisabled}
                className="justify-center px-5 py-2.5 text-[0.85rem] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                <span>
                  {isSaving
                    ? t("invisible.form.saving")
                    : generated
                      ? t("invisible.form.update")
                      : t("invisible.form.generate")}
                </span>
              </Button>
            </div>
            {saveError && (
              <p role="alert" className="font-[family-name:var(--font-work-sans)] text-xs leading-5 text-red-700">
                {saveError}
              </p>
            )}
          </form>
        </div>

        <section className="flex min-h-[680px] flex-col rounded-[var(--radius-lg)] bg-[color:var(--surface-container-low)] p-3 shadow-[var(--shadow-ambient)] sm:p-4 lg:min-h-[760px]">
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
            <div>
              <p className="eyebrow">{t("invisible.chat.title")}</p>
              <h2 className="mt-1 font-[family-name:var(--font-newsreader)] text-2xl text-[color:var(--on-surface)]">
                {generated ? coupleName : "Your Guest's Concierge"}
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--surface-container-lowest)]">
              <SparklesIcon className="h-5 w-5" />
            </div>
          </div>

          <div
            className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.42)] p-4"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[24rem] flex-1 items-center justify-center text-center">
                <p className="max-w-xs font-[family-name:var(--font-newsreader)] text-lg leading-7 text-[rgba(26,28,26,0.58)]">
                  {t("invisible.chat.empty")}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${message.role === "guest" ? "guest ml-auto" : "bot"}`}
                >
                  <ChatMarkdown streaming={message.streaming}>{message.text}</ChatMarkdown>
                </div>
              ))
            )}
            {isChatLoading && !messages.at(-1)?.streaming && (
              <div className="chat-bubble bot inline-flex items-center gap-2">
                <SpinnerIcon className="h-4 w-4" />
                <span>{locale === "es" ? "Pensando..." : "Thinking..."}</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={chatDisabled}
                onClick={() => askQuestion(question)}
                className="min-h-11 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.72)] px-3 py-2 text-left font-[family-name:var(--font-work-sans)] text-[0.78rem] leading-5 text-[color:var(--on-surface)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={submitQuestion} className="mt-3 flex items-end gap-2">
            <label className="soft-field flex-1">
              <span className="sr-only">{t("invisible.chat.placeholder")}</span>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={t("invisible.chat.placeholder")}
                maxLength={4000}
                disabled={chatDisabled}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              aria-label={t("invisible.chat.send")}
              disabled={sendDisabled}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--surface-container-lowest)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isChatLoading ? <SpinnerIcon className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
