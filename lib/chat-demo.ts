export type DemoChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DemoChatContext = {
  partner1_name: string;
  partner2_name: string;
  contact_email: string;
  wedding_date: string;
  tone: string;
  ceremony_venue: string;
  reception_venue: string;
  dress_code: string;
  arrival_note: string;
  extra_details: string;
};

const CHATBOT_API_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL?.replace(/\/+$/, "") ?? "";
const CHAT_HISTORY_LIMIT = 20;
const CHAT_TEXT_LIMIT = 4000;

function cleanText(value: string) {
  return value.trim().slice(0, CHAT_TEXT_LIMIT);
}

function cleanHistory(history: DemoChatMessage[]) {
  return history
    .map((message) => ({
      role: message.role,
      content: cleanText(message.content),
    }))
    .filter((message) => message.content)
    .slice(-CHAT_HISTORY_LIMIT);
}

export async function sendDemoChat({
  message,
  history,
  demoContext,
}: {
  message: string;
  history: DemoChatMessage[];
  demoContext: DemoChatContext;
}) {
  const cleanMessage = cleanText(message);

  if (!CHATBOT_API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_CHATBOT_API_URL");
  }

  if (!cleanMessage) {
    throw new Error("Message is required");
  }

  const response = await fetch(`${CHATBOT_API_BASE_URL}/api/chat/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({
      message: cleanMessage,
      history: cleanHistory(history),
      demo_context: demoContext,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Demo chat request failed", { status: response.status, body });
    throw new Error(`Chat API ${response.status}`);
  }

  const data = (await response.json()) as { reply?: string };
  return cleanText(data.reply ?? "");
}
