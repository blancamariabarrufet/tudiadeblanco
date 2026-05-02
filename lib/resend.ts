import templates from "@/lib/resendTemplates.json";

type Locale = "en" | "es";

type TemplateId =
  | "a48cadcb-6902-47de-96b7-be299d657277"
  | "ec42db60-e92f-42d6-94c3-cf19cb4feefd";

type ResendSendPayload = {
  from: string;
  to: string[];
  subject: string;
  bcc?: string[];
  reply_to?: string;
  template: {
    id: TemplateId;
    variables: Record<string, string | number>;
  };
};

type SendFormConfirmationInput = {
  to: string;
  locale: Locale;
  coupleName: string;
  weddingDate: string;
  ceremonyVenue: string;
  features: string[];
};

type SendChatbotConfirmationInput = {
  to: string;
  locale: Locale;
  coupleName: string;
  weddingDate: string;
  ceremonyVenue: string;
  tone: string;
};

const RESEND_API_URL = "https://api.resend.com";
const DEFAULT_FROM = "Tu dia de blanco <onboarding@resend.dev>";
const DEFAULT_INTERNAL_EMAIL = "contacto@tudiadeblanco.com";

export const resendTemplateDefinitions = templates;

function getEmailSettings() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    replyTo: process.env.RESEND_REPLY_TO,
    internalEmail: process.env.RESEND_INTERNAL_EMAIL || DEFAULT_INTERNAL_EMAIL,
  };
}

async function sendResendTemplate(payload: ResendSendPayload) {
  const settings = getEmailSettings();

  if (!settings) {
    return null;
  }

  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "wedsite-app/1.0",
    },
    body: JSON.stringify({
      ...payload,
      from: settings.from,
      bcc: [settings.internalEmail],
      reply_to: settings.replyTo,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as { id: string };
}

export async function sendSolicitationConfirmationEmail({
  to,
  locale,
  coupleName,
  weddingDate,
  ceremonyVenue,
  features,
}: SendFormConfirmationInput) {
  const isEnglish = locale === "en";
  const subject = isEnglish
    ? "We received your wedding website request"
    : "Hemos recibido vuestra solicitud";

  return sendResendTemplate({
    from: DEFAULT_FROM,
    to: [to],
    subject,
    template: {
      id: "a48cadcb-6902-47de-96b7-be299d657277",
      variables: {
        SUBJECT: subject,
        TITLE: isEnglish
          ? "We received your request."
          : "Hemos recibido vuestra solicitud.",
        INTRO: isEnglish
          ? "Thank you for sharing your wedding details with us. We have saved your brief and will review it carefully."
          : "Gracias por compartir los detalles de vuestra boda. Hemos guardado el briefing y lo revisaremos con cuidado.",
        SUMMARY_LABEL: isEnglish ? "Request summary" : "Resumen de la solicitud",
        COUPLE_NAME: coupleName,
        WEDDING_DATE: weddingDate,
        CEREMONY_VENUE: ceremonyVenue,
        FEATURES_LABEL: isEnglish
          ? "Selected features"
          : "Características seleccionadas",
        FEATURES: features.join(", "),
        NEXT_STEPS: isEnglish
          ? "We will contact you soon to confirm the final details and next steps."
          : "Nos pondremos en contacto pronto para confirmar los detalles finales y los próximos pasos.",
        SIGNATURE: isEnglish
          ? "Warmly, Tu dia de blanco"
          : "Con cariño, Tu dia de blanco",
      },
    },
  });
}

export async function sendChatbotConfirmationEmail({
  to,
  locale,
  coupleName,
  weddingDate,
  ceremonyVenue,
  tone,
}: SendChatbotConfirmationInput) {
  const isEnglish = locale === "en";
  const subject = isEnglish
    ? "Your wedding chatbot preview has been created"
    : "Vuestra prueba del chatbot se ha creado";

  return sendResendTemplate({
    from: DEFAULT_FROM,
    to: [to],
    subject,
    template: {
        id: "ec42db60-e92f-42d6-94c3-cf19cb4feefd",
        variables: {
        SUBJECT: subject,
        TITLE: isEnglish
          ? "Your chatbot preview has been created."
          : "Vuestra prueba del chatbot se ha creado.",
        INTRO: isEnglish
          ? "Thank you for trying The Invisible Host. We saved the details you used to generate the assistant preview."
          : "Gracias por probar The Invisible Host. Hemos guardado los detalles usados para generar la vista previa del asistente.",
        SUMMARY_LABEL: isEnglish ? "Chatbot brief" : "Briefing del chatbot",
        COUPLE_NAME: coupleName,
        WEDDING_DATE: weddingDate,
        CEREMONY_VENUE: ceremonyVenue,
        TONE_LABEL: isEnglish ? "Assistant tone" : "Tono del asistente",
        TONE: tone || (isEnglish ? "Warm and elegant" : "Cálido y elegante"),
        NEXT_STEPS: isEnglish
          ? "You can keep refining the assistant with more wedding details whenever you are ready."
          : "Podéis seguir refinando el asistente con más detalles de la boda cuando queráis.",
        SIGNATURE: isEnglish
          ? "Warmly, Tu dia de blanco"
          : "Con cariño, Tu dia de blanco",
      },
    },
  });
}
