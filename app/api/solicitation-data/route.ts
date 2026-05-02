import { sendSolicitationConfirmationEmail } from "@/lib/resend";

type SolicitationDataPayload = {
  partnerOne?: unknown;
  partnerTwo?: unknown;
  date?: unknown;
  ceremonyVenue?: unknown;
  receptionVenue?: unknown;
  guestCount?: unknown;
  features?: unknown;
  physicalInvitations?: unknown;
  invitationStyle?: unknown;
  overallVibe?: unknown;
  colorPalette?: unknown;
  primaryTypography?: unknown;
  secondaryTypography?: unknown;
  textTypography?: unknown;
  email?: unknown;
  locale?: unknown;
  coupleName?: unknown;
};

type NormalizedSolicitationData = {
  partnerOne: string;
  partnerTwo: string;
  email: string;
  weddingDate: string;
  ceremonyVenue: string;
  receptionVenue: string;
  guestCount: number;
  features: string[];
  physicalInvitations: boolean;
  invitationStyle: string;
  overallVibe: string;
  colorPalette: string;
  primaryTypography: string;
  secondaryTypography: string;
  textTypography: string;
  typographySelections: string[];
  aesthetic: string;
  locale: "en" | "es";
  coupleName: string;
  images: File[];
};

type SupabaseSubmission = {
  id: string;
};

type SupabaseImageRecord = {
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  public_url: string;
};

const DEFAULT_NOTION_SOLICITATION_DATA_SOURCE_ID =
  "886c3c75-4622-493e-83a7-d3af9a551edf";
const SUPABASE_IMAGE_BUCKET = "solicitation-images";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return readStringArray(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function readBoolean(value: unknown) {
  return value === true || value === "true";
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

function normalizePayload(
  body: SolicitationDataPayload,
  images: File[] = [],
): NormalizedSolicitationData {
  const partnerOne = readString(body.partnerOne);
  const partnerTwo = readString(body.partnerTwo);
  const email = readString(body.email);
  const weddingDate = readString(body.date);
  const ceremonyVenue = readString(body.ceremonyVenue);
  const receptionVenue = readString(body.receptionVenue);
  const guestCount =
    typeof body.guestCount === "number" && Number.isFinite(body.guestCount)
      ? body.guestCount
      : Number(readString(body.guestCount)) || 0;
  const features = readStringArray(body.features);
  const physicalInvitations = readBoolean(body.physicalInvitations);
  const invitationStyle = readString(body.invitationStyle);
  const overallVibe = readString(body.overallVibe);
  const colorPalette = readString(body.colorPalette);
  const primaryTypography = readString(body.primaryTypography);
  const secondaryTypography = readString(body.secondaryTypography);
  const textTypography = readString(body.textTypography);
  const typographySelections = [
    primaryTypography,
    secondaryTypography,
    textTypography,
  ].filter(Boolean);
  const aesthetic = [
    overallVibe && `Vibe: ${overallVibe}`,
    colorPalette && `Palette: ${colorPalette}`,
    typographySelections.length > 0 &&
      `Typography: ${typographySelections.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" | ");
  const locale = readString(body.locale) === "en" ? "en" : "es";
  const coupleName =
    readString(body.coupleName) ||
    [partnerOne, partnerTwo].filter(Boolean).join(" & ");

  return {
    partnerOne,
    partnerTwo,
    email,
    weddingDate,
    ceremonyVenue,
    receptionVenue,
    guestCount,
    features,
    physicalInvitations,
    invitationStyle,
    overallVibe,
    colorPalette,
    primaryTypography,
    secondaryTypography,
    textTypography,
    typographySelections,
    aesthetic,
    locale,
    coupleName,
    images,
  };
}

async function readRequestPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: SolicitationDataPayload = {};
    const images = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File);

    for (const [key, value] of formData.entries()) {
      if (key === "features") {
        payload.features = typeof value === "string" ? value : "";
        continue;
      }

      if (key !== "images" && typeof value === "string") {
        payload[key as keyof SolicitationDataPayload] = value;
      }
    }

    return normalizePayload(payload, images);
  }

  const body = (await request.json()) as SolicitationDataPayload;
  return normalizePayload(body);
}

function validatePayload(data: NormalizedSolicitationData) {
  return Boolean(
    data.partnerOne &&
      data.partnerTwo &&
      data.email &&
      data.weddingDate &&
      data.ceremonyVenue &&
      data.receptionVenue &&
      data.features.length > 0 &&
      data.overallVibe &&
      data.colorPalette &&
      data.typographySelections.length > 0,
  );
}

async function supabaseFetch<T>(
  path: string,
  init: RequestInit,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function sanitizePathPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uploadSupabaseImages(
  data: NormalizedSolicitationData,
  submissionId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const imageRecords: SupabaseImageRecord[] = [];

  for (const [index, image] of data.images.entries()) {
    const extension = image.name.includes(".")
      ? image.name.split(".").pop()
      : "jpg";
    const fileName = `${String(index + 1).padStart(2, "0")}-${sanitizePathPart(
      image.name,
    )}`;
    const storagePath = `${submissionId}/${fileName || `${index + 1}.${extension}`}`;

    await supabaseFetch(
      `/storage/v1/object/${SUPABASE_IMAGE_BUCKET}/${storagePath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": image.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: image,
      },
      supabaseUrl,
      serviceRoleKey,
    );

    imageRecords.push({
      storage_bucket: SUPABASE_IMAGE_BUCKET,
      storage_path: storagePath,
      file_name: image.name,
      content_type: image.type || "application/octet-stream",
      file_size: image.size,
      public_url: `${supabaseUrl}/storage/v1/object/public/${SUPABASE_IMAGE_BUCKET}/${storagePath}`,
    });
  }

  return imageRecords;
}

async function saveToSupabase(data: NormalizedSolicitationData) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const submissions = await supabaseFetch<SupabaseSubmission[]>(
    "/rest/v1/solicitation_submissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        couple_name: data.coupleName,
        partner_one: data.partnerOne,
        partner_two: data.partnerTwo,
        email: data.email,
        wedding_date: data.weddingDate,
        ceremony_venue: data.ceremonyVenue,
        reception_venue: data.receptionVenue,
        guest_count: data.guestCount,
        physical_invitations: data.physicalInvitations,
        invitation_style: data.invitationStyle,
        overall_vibe: data.overallVibe,
        color_palette: data.colorPalette,
        locale: data.locale,
      }),
    },
    supabaseUrl,
    serviceRoleKey,
  );
  const submission = submissions[0];

  if (!submission?.id) {
    throw new Error("Supabase did not return a submission id.");
  }

  const imageRecords = await uploadSupabaseImages(
    data,
    submission.id,
    supabaseUrl,
    serviceRoleKey,
  );

  await Promise.all([
    data.features.length
      ? supabaseFetch(
          "/rest/v1/solicitation_features",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              data.features.map((feature) => ({
                submission_id: submission.id,
                feature,
              })),
            ),
          },
          supabaseUrl,
          serviceRoleKey,
        )
      : Promise.resolve(null),
    data.typographySelections.length
      ? supabaseFetch(
          "/rest/v1/solicitation_typography",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              data.typographySelections.map((selection, index) => ({
                submission_id: submission.id,
                selection,
                sort_order: index + 1,
              })),
            ),
          },
          supabaseUrl,
          serviceRoleKey,
        )
      : Promise.resolve(null),
    imageRecords.length
      ? supabaseFetch(
          "/rest/v1/solicitation_images",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              imageRecords.map((image) => ({
                submission_id: submission.id,
                ...image,
              })),
            ),
          },
          supabaseUrl,
          serviceRoleKey,
        )
      : Promise.resolve(null),
  ]);

  return submission.id;
}

async function saveToNotion(data: NormalizedSolicitationData) {
  const notionToken = process.env.NOTION_TOKEN;
  const dataSourceId =
    process.env.NOTION_SOLICITATION_DATA_SOURCE_ID ||
    DEFAULT_NOTION_SOLICITATION_DATA_SOURCE_ID;

  if (!notionToken) {
    return null;
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
        Couple: titleText(data.coupleName),
        Email: {
          email: data.email,
        },
        "Partner 1": richText(data.partnerOne),
        "Partner 2": richText(data.partnerTwo),
        "Wedding Date": {
          date: {
            start: data.weddingDate,
          },
        },
        "Ceremony Venue": richText(data.ceremonyVenue),
        "Reception Venue": richText(data.receptionVenue),
        "Guest Count": {
          number: data.guestCount,
        },
        "Selected Features": richText(data.features.join(", ")),
        "Physical Invitations": {
          checkbox: data.physicalInvitations,
        },
        "Invitation Style": richText(data.invitationStyle),
        Aesthetic: richText(data.aesthetic),
        "Overall Vibe": richText(data.overallVibe),
        "Color Palette": richText(data.colorPalette),
        "Primary Typography": richText(data.primaryTypography),
        "Secondary Typography": richText(data.secondaryTypography),
        "Text Typography": richText(data.textTypography),
        Locale: {
          select: {
            name: data.locale,
          },
        },
      },
    }),
  });

  if (!notionResponse.ok) {
    throw new Error(await notionResponse.text());
  }

  return (await notionResponse.json()) as { id?: string; url?: string };
}

export async function POST(request: Request) {
  let data: NormalizedSolicitationData;

  try {
    data = await readRequestPayload(request);
  } catch {
    return Response.json({ error: "Invalid solicitation payload." }, { status: 400 });
  }

  if (!validatePayload(data)) {
    return Response.json(
      { error: "Required solicitation fields are missing." },
      { status: 400 },
    );
  }

  try {
    const supabaseSubmissionId = await saveToSupabase(data);
    const notionResult = await saveToNotion(data);

    if (!supabaseSubmissionId && !notionResult) {
      return Response.json(
        {
          error:
            "Missing persistence configuration. Add Supabase or Notion environment variables.",
        },
        { status: 500 },
      );
    }

    let emailSent = false;

    try {
      const emailResult = await sendSolicitationConfirmationEmail({
        to: data.email,
        locale: data.locale,
        coupleName: data.coupleName,
        weddingDate: data.weddingDate,
        ceremonyVenue: data.ceremonyVenue,
        features: data.features,
      });
      emailSent = Boolean(emailResult);
    } catch (error) {
      console.error("Could not send solicitation confirmation email.", error);
    }

    return Response.json({
      ok: true,
      supabaseSubmissionId,
      notionPageId: notionResult?.id,
      notionPageUrl: notionResult?.url,
      emailSent,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not save solicitation data.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
