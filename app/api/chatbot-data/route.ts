import { sendChatbotConfirmationEmail } from "@/lib/resend";

type ChatbotDataPayload = {
  partnerOne?: unknown;
  partnerTwo?: unknown;
  email?: unknown;
  weddingDate?: unknown;
  ceremonyVenue?: unknown;
  receptionVenue?: unknown;
  dressCode?: unknown;
  arrivalNote?: unknown;
  tone?: unknown;
  extraNotes?: unknown;
  locale?: unknown;
  coupleName?: unknown;
};

const DEFAULT_NOTION_CHATBOT_DATA_SOURCE_ID =
  "ea99b3b1-c1dc-470b-8e63-e593e0be2152";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function richText(content: string) {
  return {
    rich_text: content
      ? [
          {
            text: {
              content: content.slice(0, 1900),
            },
          },
        ]
      : [],
  };
}

function titleText(content: string) {
  return {
    title: [
      {
        text: {
          content: content.slice(0, 1900),
        },
      },
    ],
  };
}

export async function POST(request: Request) {
  let body: ChatbotDataPayload;

  try {
    body = (await request.json()) as ChatbotDataPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const partnerOne = readString(body.partnerOne);
  const partnerTwo = readString(body.partnerTwo);
  const email = readString(body.email);
  const weddingDate = readString(body.weddingDate);
  const ceremonyVenue = readString(body.ceremonyVenue);
  const receptionVenue = readString(body.receptionVenue);
  const dressCode = readString(body.dressCode);
  const arrivalNote = readString(body.arrivalNote);
  const tone = readString(body.tone);
  const extraNotes = readString(body.extraNotes);
  const locale = readString(body.locale) === "en" ? "en" : "es";
  const coupleName =
    readString(body.coupleName) || [partnerOne, partnerTwo].filter(Boolean).join(" & ");

  if (!partnerOne || !partnerTwo || !email || !weddingDate || !ceremonyVenue) {
    return Response.json(
      {
        error:
          "Partner names, email, wedding date, and ceremony venue are required.",
      },
      { status: 400 },
    );
  }

  const notionToken = process.env.NOTION_TOKEN;
  const dataSourceId =
    process.env.NOTION_CHATBOT_DATA_SOURCE_ID ||
    DEFAULT_NOTION_CHATBOT_DATA_SOURCE_ID;

  if (!notionToken) {
    return Response.json(
      { error: "Missing NOTION_TOKEN environment variable." },
      { status: 500 },
    );
  }

  const notionResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03",
    },
    body: JSON.stringify({
      parent: {
        type: "data_source_id",
        data_source_id: dataSourceId,
      },
      properties: {
        Couple: titleText(coupleName),
        Email: {
          email,
        },
        "Partner 1": richText(partnerOne),
        "Partner 2": richText(partnerTwo),
        "Wedding Date": {
          date: {
            start: weddingDate,
          },
        },
        "Ceremony Venue": richText(ceremonyVenue),
        "Reception Venue": richText(receptionVenue),
        "Dress Code": richText(dressCode),
        "Arrival Note": richText(arrivalNote),
        Tone: richText(tone),
        "Extra Details": richText(extraNotes),
        Locale: {
          select: {
            name: locale,
          },
        },
      },
    }),
  });

  if (!notionResponse.ok) {
    const detail = await notionResponse.text();

    return Response.json(
      {
        error: "Could not save chatbot data in Notion.",
        detail,
      },
      { status: 502 },
    );
  }

  const result = (await notionResponse.json()) as { id?: string; url?: string };
  let emailSent = false;

  try {
    const emailResult = await sendChatbotConfirmationEmail({
      to: email,
      locale,
      coupleName,
      weddingDate,
      ceremonyVenue,
      tone,
    });
    emailSent = Boolean(emailResult);
  } catch (error) {
    console.error("Could not send chatbot confirmation email.", error);
  }

  return Response.json({
    ok: true,
    notionPageId: result.id,
    notionPageUrl: result.url,
    emailSent,
  });
}
