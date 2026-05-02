import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_FEATURES, FEATURE_LABELS, sanitizeFeatures, type Feature } from "@/lib/auth";

type ActionResult = { success: true } | { error: string };
type Language = "en" | "es";

function languageOrDefault(language: string): Language {
  return language === "en" ? "en" : "es";
}

function normalizeRegistrationFeatures(features: string[]) {
  const selected = sanitizeFeatures(features);
  return selected.length > 0 ? selected : sanitizeFeatures(ALL_FEATURES);
}

async function ensureUniqueCredentials(username: string, email: string) {
  const supabase = createAdminClient();
  const [
    { data: usernameMatch, error: usernameError },
    { data: emailMatch, error: emailError },
  ] = await Promise.all([
    supabase.from("panel_users").select("id").eq("username", username).maybeSingle(),
    supabase.from("panel_users").select("id").ilike("email", email).maybeSingle(),
  ]);

  if (usernameError) return usernameError.message;
  if (emailError) return emailError.message;
  if (usernameMatch) return "This username already exists.";
  if (emailMatch) return "This email already has a manager account.";
  return null;
}

async function createRegistrationSubmission(data: {
  partnerOne: string;
  partnerTwo: string;
  email: string;
  weddingDate?: string;
  language: Language;
  features: Feature[];
}) {
  const supabase = createAdminClient();
  const { data: submission, error } = await supabase
    .from("solicitation_submissions")
    .insert({
      couple_name: `${data.partnerOne} & ${data.partnerTwo}`,
      partner_one: data.partnerOne,
      partner_two: data.partnerTwo,
      email: data.email,
      wedding_date: data.weddingDate || null,
      ceremony_venue: "",
      reception_venue: "",
      guest_count: 0,
      physical_invitations: false,
      invitation_style: null,
      overall_vibe: "",
      color_palette: "",
      locale: data.language,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (data.features.length > 0) {
    const { error: featuresError } = await supabase.from("solicitation_features").insert(
      data.features.map((feature) => ({
        submission_id: submission.id,
        feature: FEATURE_LABELS[feature],
      }))
    );
    if (featuresError) throw new Error(featuresError.message);
  }

  return submission.id as string;
}

export async function registerPasswordPanelUser(data: {
  username: string;
  email: string;
  password: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate?: string;
  language: string;
  features: string[];
}): Promise<ActionResult> {
  const username = data.username.trim();
  const email = data.email.trim().toLowerCase();
  const partnerOne = data.partnerOne.trim();
  const partnerTwo = data.partnerTwo.trim();

  if (!username || !email || !data.password || !partnerOne || !partnerTwo) {
    return { error: "Username, email, password, and both names are required." };
  }
  if (data.password.length < 8) return { error: "Password must be at least 8 characters." };

  const duplicate = await ensureUniqueCredentials(username, email);
  if (duplicate) return { error: duplicate };

  try {
    const language = languageOrDefault(data.language);
    const features = normalizeRegistrationFeatures(data.features);
    const submissionId = await createRegistrationSubmission({
      partnerOne,
      partnerTwo,
      email,
      weddingDate: data.weddingDate,
      language,
      features,
    });

    const supabase = createAdminClient();
    const hash = await bcrypt.hash(data.password, 12);
    const { error } = await supabase.from("panel_users").insert({
      username,
      email,
      password_hash: hash,
      language,
      features,
      submission_id: submissionId,
      is_active: false,
      access_status: "pending",
      auth_provider: "password",
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the request." };
  }
}

export async function registerGooglePanelUser(data: {
  username: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate?: string;
  language: string;
  features: string[];
  googleAccessToken?: string;
}): Promise<ActionResult> {
  if (!data.googleAccessToken) return { error: "Google sign-in could not be verified." };

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.getUser(data.googleAccessToken);
  const email = authData.user?.email?.toLowerCase();

  if (authError || !email) return { error: "Google sign-in could not be verified." };

  const username = data.username.trim();
  const partnerOne = data.partnerOne.trim();
  const partnerTwo = data.partnerTwo.trim();
  if (!username || !partnerOne || !partnerTwo) {
    return { error: "Username and both names are required." };
  }

  const duplicate = await ensureUniqueCredentials(username, email);
  if (duplicate) return { error: duplicate };

  try {
    const language = languageOrDefault(data.language);
    const features = normalizeRegistrationFeatures(data.features);
    const submissionId = await createRegistrationSubmission({
      partnerOne,
      partnerTwo,
      email,
      weddingDate: data.weddingDate,
      language,
      features,
    });

    const supabase = createAdminClient();
    const { error } = await supabase.from("panel_users").insert({
      username,
      email,
      password_hash: null,
      language,
      features,
      submission_id: submissionId,
      is_active: false,
      access_status: "pending",
      auth_provider: "google",
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the request." };
  }
}
