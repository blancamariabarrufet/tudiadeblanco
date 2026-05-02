"use server";

import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  sanitizeFeatures,
  ALL_FEATURES,
  FEATURE_LABELS,
  type Feature,
} from "@/lib/auth";
import { redirect } from "next/navigation";

type ActionResult = { success: true } | { error: string };
type Language = "en" | "es";

type PanelUserRecord = {
  id: string;
  username: string;
  email: string | null;
  password_hash: string | null;
  language: string;
  features: unknown;
  submission_id: string | null;
  is_active: boolean;
  access_status: string | null;
};

const PENDING_MESSAGE = "We are reviewing your request and will give you access soon.";

export async function login(username: string, password: string): Promise<ActionResult> {
  const normalizedUsername = username.trim();

  // Admin check (credentials from environment)
  if (
    normalizedUsername === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PSSW
  ) {
    const token = await createSession({
      id: "admin",
      username: normalizedUsername,
      isAdmin: true,
      features: [...ALL_FEATURES],
      language: process.env.ADMIN_LANG === "es" ? "es" : "en",
      submissionId: null,
    });
    await setSessionCookie(token);
    return { success: true };
  }

  // Regular user check
  const supabase = createAdminClient();
  let { data: user } = await supabase
    .from("panel_users")
    .select("*")
    .eq("username", normalizedUsername)
    .maybeSingle<PanelUserRecord>();

  if (!user && normalizedUsername.includes("@")) {
    const result = await supabase
      .from("panel_users")
      .select("*")
      .ilike("email", normalizedUsername)
      .maybeSingle<PanelUserRecord>();
    user = result.data;
  }

  if (!user) return { error: "Invalid username or password." };
  if (!user.password_hash) return { error: "Use Google to sign in with this account." };

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return { error: "Invalid username or password." };
  if (!hasPanelAccess(user)) return { error: PENDING_MESSAGE };

  await createPanelSession(user);
  return { success: true };
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return { error: "Only the admin user can manage panel users." };
  }
  return null;
}

function languageOrDefault(language: string): Language {
  return language === "en" ? "en" : "es";
}

function hasPanelAccess(user: Pick<PanelUserRecord, "is_active" | "access_status">) {
  return user.is_active && (user.access_status ?? "approved") === "approved";
}

async function createPanelSession(user: PanelUserRecord) {
  const token = await createSession({
    id: user.id,
    username: user.username,
    isAdmin: false,
    features: sanitizeFeatures(user.features),
    language: languageOrDefault(user.language),
    submissionId: user.submission_id ?? null,
  });
  await setSessionCookie(token);
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
      ceremony_venue: null,
      reception_venue: null,
      guest_count: null,
      physical_invitations: false,
      invitation_style: null,
      overall_vibe: null,
      color_palette: null,
      locale: data.language,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (data.features.length > 0) {
    await supabase.from("solicitation_features").insert(
      data.features.map((feature) => ({
        submission_id: submission.id,
        feature: FEATURE_LABELS[feature],
      }))
    );
  }

  return submission.id as string;
}

async function ensureUniqueCredentials(username: string, email: string) {
  const supabase = createAdminClient();
  const [{ data: usernameMatch }, { data: emailMatch }] = await Promise.all([
    supabase.from("panel_users").select("id").eq("username", username).maybeSingle(),
    supabase.from("panel_users").select("id").ilike("email", email).maybeSingle(),
  ]);

  if (usernameMatch) return "This username already exists.";
  if (emailMatch) return "This email already has a manager account.";
  return null;
}

function normalizeRegistrationFeatures(features: string[]) {
  const selected = sanitizeFeatures(features);
  return selected.length > 0 ? selected : sanitizeFeatures(ALL_FEATURES);
}

export async function createUser(data: {
  username: string;
  email?: string;
  password: string;
  language: string;
  features: string[];
  submissionId: string | null;
}): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const hash = await bcrypt.hash(data.password, 12);
  const { error } = await supabase.from("panel_users").insert({
    username: data.username.trim(),
    email: data.email?.trim() || null,
    password_hash: hash,
    language: languageOrDefault(data.language),
    features: sanitizeFeatures(data.features),
    submission_id: data.submissionId || null,
    is_active: true,
    access_status: "approved",
    auth_provider: "password",
    approved_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function registerPanelUser(data: {
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

export async function completeGoogleRegistration(data: {
  username: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate?: string;
  language: string;
  features: string[];
  googleAccessToken?: string;
}): Promise<ActionResult> {
  const supabaseAuth = data.googleAccessToken ? createAdminClient() : await createServerSupabaseClient();
  const { data: authData, error: authError } = data.googleAccessToken
    ? await supabaseAuth.auth.getUser(data.googleAccessToken)
    : await supabaseAuth.auth.getUser();
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

export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    language: string;
    features: string[];
    submissionId: string | null;
    isActive: boolean;
  }
): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    email: data.email?.trim() || null,
    language: languageOrDefault(data.language),
    features: sanitizeFeatures(data.features),
    submission_id: data.submissionId || null,
    is_active: data.isActive,
    access_status: data.isActive ? "approved" : "pending",
  };
  if (data.password) {
    update.password_hash = await bcrypt.hash(data.password, 12);
  }
  const { error } = await supabase.from("panel_users").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function approveUser(id: string): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("panel_users")
    .update({
      is_active: true,
      access_status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rejectUser(id: string): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("panel_users")
    .update({ is_active: false, access_status: "rejected" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { error } = await supabase.from("panel_users").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
