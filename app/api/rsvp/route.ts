import { createAdminClient } from "@/lib/supabase/admin";
import type { RSVPStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const RSVP_STATUSES = new Set<RSVPStatus>(["confirmed", "declined", "pending", "awaiting"]);

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStatus(value: unknown): RSVPStatus {
  const status = asText(value) as RSVPStatus;
  return RSVP_STATUSES.has(status) ? status : "pending";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const submissionId = asText(body.submissionId);
  const email = asText(body.email).toLowerCase();
  const firstName = asText(body.firstName);
  const lastName = asText(body.lastName);

  if (!submissionId || !email || !firstName || !lastName) {
    return Response.json(
      { error: "submissionId, email, firstName, and lastName are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const input = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: asText(body.phone),
    rsvp_status: asStatus(body.rsvpStatus),
    dietary: asText(body.dietary),
    plus_one: Boolean(body.plusOne),
    notes: asText(body.notes),
    submission_id: submissionId,
    archived: false,
  };

  const { data: existing, error: findError } = await supabase
    .from("guests")
    .select("id")
    .eq("submission_id", submissionId)
    .ilike("email", email)
    .maybeSingle();

  if (findError) return Response.json({ error: findError.message }, { status: 500 });

  const result = existing
    ? await supabase.from("guests").update(input).eq("id", existing.id).select("id, rsvp_status").single()
    : await supabase.from("guests").insert(input).select("id, rsvp_status").single();

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 });

  return Response.json({ guest: result.data });
}
