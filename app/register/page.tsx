"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ALL_FEATURES, FEATURE_LABELS, type Feature } from "@/lib/features";
import { useLanguage } from "@/lib/i18n";
import { Check, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState({
    username: "",
    partner1: "",
    partner2: "",
    email: "",
    password: "",
    confirmPassword: "",
    weddingDate: "",
    language: locale,
  });
  const [features, setFeatures] = useState<Feature[]>([...ALL_FEATURES]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [googleMode, setGoogleMode] = useState(false);

  useEffect(() => {
    setGoogleMode(new URLSearchParams(window.location.search).get("google") === "1");
  }, []);

  useEffect(() => {
    if (!googleMode) return;

    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      if (email) {
        setForm((current) => ({
          ...current,
          email,
          username: current.username || email.split("@")[0],
        }));
      }
    });
  }, [googleMode, supabase]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleFeature(feature: Feature) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature]
    );
  }

  async function startGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?mode=register&lang=${locale}`,
      },
    });
    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.username.trim() || !form.partner1.trim() || !form.partner2.trim()) {
      setError("Username and both names are required.");
      return;
    }
    if (!googleMode && !form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!googleMode && form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!googleMode && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    let googleAccessToken: string | undefined;
    if (googleMode) {
      const { data } = await supabase.auth.getSession();
      googleAccessToken = data.session?.access_token;
      if (!googleAccessToken) {
        setError("Please continue with Google again before sending the request.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      mode: googleMode ? "google" : "password",
      username: form.username,
      email: form.email,
      password: form.password,
      partnerOne: form.partner1,
      partnerTwo: form.partner2,
      weddingDate: form.weddingDate,
      language: locale,
      features,
      googleAccessToken,
    };
    try {
      const response = await fetch("/api/panel-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || "error" in result) {
        setError(result.error ?? "Could not send the request.");
        return;
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send the request.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--surface)" }}>
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl mb-3" style={{ fontFamily: "var(--font-newsreader)", color: "var(--primary)" }}>
            Request received
          </h1>
          <p className="text-sm leading-7" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            We are reviewing your manager access request. Once the admin grants access, you will be able to sign in and use the selected modules.
          </p>
          <button type="button" onClick={() => router.push(`/login?lang=${locale}`)} className="btn-primary mt-8">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-md">
        <h1
          className="text-center text-3xl mb-2"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--primary)" }}
        >
          The Digital Heirloom
        </h1>
        <p
          className="text-center mb-10 text-base italic"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", opacity: 0.6 }}
        >
          {googleMode ? "Complete your Google registration" : "Request manager access"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              className="input-underline"
              placeholder="garcia_2026"
              autoComplete="username"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                Your name
              </label>
              <input
                type="text"
                value={form.partner1}
                onChange={(e) => update("partner1", e.target.value)}
                className="input-underline"
                placeholder="Partner 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                Partner&apos;s name
              </label>
              <input
                type="text"
                value={form.partner2}
                onChange={(e) => update("partner2", e.target.value)}
                className="input-underline"
                placeholder="Partner 2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Email address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input-underline"
              placeholder="you@example.com"
              disabled={googleMode}
              required
            />
          </div>

          {!googleMode && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="input-underline pr-10"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2"
                    style={{ color: "var(--on-surface-variant)" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className="input-underline pr-10"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2"
                    style={{ color: "var(--on-surface-variant)" }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Wedding date{" "}
              <span style={{ color: "var(--on-surface-variant)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="date"
              value={form.weddingDate}
              onChange={(e) => update("weddingDate", e.target.value)}
              className="input-underline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Manager modules
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_FEATURES.map((feature) => {
                const selected = features.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors"
                    style={{
                      background: selected ? "var(--secondary-container)" : "var(--surface-container-lowest)",
                      color: "var(--on-surface)",
                      border: "1px solid var(--outline-variant)",
                      fontFamily: "var(--font-work-sans)",
                    }}
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{
                        background: selected ? "var(--primary)" : "transparent",
                        border: selected ? "none" : "1px solid var(--outline-variant)",
                      }}
                    >
                      {selected && <Check size={10} strokeWidth={2.5} color="white" />}
                    </span>
                    {FEATURE_LABELS[feature]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{ background: "var(--secondary-container)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Sending request…" : "Send access request"}
          </button>
        </form>

        {!googleMode && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "var(--outline-variant)" }} />
              <span className="text-xs" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                or
              </span>
              <div className="h-px flex-1" style={{ background: "var(--outline-variant)" }} />
            </div>

            <button
              type="button"
              onClick={startGoogle}
              disabled={googleLoading}
              className="w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                borderColor: "var(--outline-variant)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-work-sans)",
                background: "var(--surface-container-lowest)",
              }}
            >
              {googleLoading ? "Opening Google…" : "Register with Google"}
            </button>
          </>
        )}

        <p
          className="text-center mt-6 text-sm"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          Already have an account?{" "}
          <Link href={`/login?lang=${locale}`} className="underline underline-offset-4" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
