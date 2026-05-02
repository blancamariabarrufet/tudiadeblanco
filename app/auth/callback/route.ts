import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, sanitizeFeatures, setSessionCookie } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const mode = searchParams.get("mode");
  const next = sanitizeNextPath(searchParams.get("next"));
  const origin = getSiteUrl();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  const localized = (path: string) => `${origin}${path}${path.includes("?") ? "&" : "?"}lang=${lang}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email?.toLowerCase();

      if (!email) {
        return NextResponse.redirect(localized("/login?error=auth_failed"));
      }

      const admin = createAdminClient();
      const { data: user, error: userError } = await admin
        .from("panel_users")
        .select("id, username, language, features, submission_id, is_active, access_status")
        .ilike("email", email)
        .maybeSingle();

      if (userError) {
        return NextResponse.redirect(localized("/login?error=auth_failed"));
      }

      if (mode === "register") {
        if (user?.is_active && user.access_status === "approved") {
          return NextResponse.redirect(localized("/login?status=existing"));
        }
        return NextResponse.redirect(localized("/register?google=1"));
      }

      if (!user) {
        return NextResponse.redirect(localized("/register?google=1"));
      }

      if (!user.is_active || user.access_status !== "approved") {
        return NextResponse.redirect(localized("/login?status=pending"));
      }

      const token = await createSession({
        id: user.id,
        username: user.username,
        isAdmin: false,
        features: sanitizeFeatures(user.features),
        language: user.language === "en" ? "en" : "es",
        submissionId: user.submission_id ?? null,
      });
      await setSessionCookie(token);

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(localized("/login?error=auth_failed"));
}

function sanitizeNextPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/manage/dashboard";
  }

  return path;
}
