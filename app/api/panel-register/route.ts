import { registerGooglePanelUser, registerPasswordPanelUser } from "@/lib/panel-registration";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const mode = body.mode === "google" ? "google" : "password";
  const payload = {
    username: String(body.username ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    partnerOne: String(body.partnerOne ?? ""),
    partnerTwo: String(body.partnerTwo ?? ""),
    weddingDate: String(body.weddingDate ?? ""),
    ceremonyVenue: String(body.ceremonyVenue ?? ""),
    receptionVenue: String(body.receptionVenue ?? ""),
    guestCount: String(body.guestCount ?? ""),
    physicalInvitations: body.physicalInvitations === true,
    language: String(body.language ?? "es"),
    features: Array.isArray(body.features) ? body.features.map(String) : [],
    designAnswers: body.designAnswers,
    googleAccessToken: typeof body.googleAccessToken === "string" ? body.googleAccessToken : undefined,
  };

  const result = mode === "google"
    ? await registerGooglePanelUser(payload)
    : await registerPasswordPanelUser(payload);

  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
