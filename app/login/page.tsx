"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { useLanguage, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

const copy: Record<
  Locale,
  {
    ariaGoogle: string;
    bottomNote: string;
    brandBody: string;
    emailPlaceholder: string;
    existing: string;
    forgot: string;
    googleError: string;
    hidePassword: string;
    home: string;
    loadingGoogle: string;
    login: string;
    passwordPlaceholder: string;
    pending: string;
    showPassword: string;
    signingIn: string;
    signUp: string;
  }
> = {
  en: {
    ariaGoogle: "Continue with Google",
    bottomNote: "A private place for the details you are holding with care.",
    brandBody: "Welcome back to the quiet place where your celebration takes shape.",
    emailPlaceholder: "Username or email",
    existing: "That Google email already has an approved manager account. Please sign in from here.",
    forgot: "Forgot password?",
    googleError: "We could not complete the sign-in. Please try again.",
    hidePassword: "Hide password",
    home: "Return to home page",
    loadingGoogle: "...",
    login: "Log in",
    passwordPlaceholder: "Password",
    pending: "We are reviewing your request and will give you access soon.",
    showPassword: "Show password",
    signingIn: "Signing in...",
    signUp: "Sign up",
  },
  es: {
    ariaGoogle: "Continuar con Google",
    bottomNote: "Un espacio privado para cuidar cada detalle con calma.",
    brandBody: "Bienvenido de nuevo al lugar donde tu celebracion toma forma.",
    emailPlaceholder: "Usuario o email",
    existing: "Ese email de Google ya tiene una cuenta aprobada. Inicia sesion desde aqui.",
    forgot: "He olvidado mi contrasena",
    googleError: "No hemos podido completar el inicio de sesion. Intentalo de nuevo.",
    hidePassword: "Ocultar contrasena",
    home: "Volver a la pagina principal",
    loadingGoogle: "...",
    login: "Iniciar sesion",
    passwordPlaceholder: "Contrasena",
    pending: "Estamos revisando tu solicitud y te daremos acceso pronto.",
    showPassword: "Mostrar contrasena",
    signingIn: "Entrando...",
    signUp: "Registrarse",
  },
};

function GoogleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.2 12.2c0-.7-.1-1.3-.2-1.9h-8.8v3.6h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3.1c1.8-1.7 2.8-4.1 2.8-6.8Z"
        fill="oklch(0.62 0.08 250)"
      />
      <path
        d="M12.2 21.3c2.5 0 4.7-.8 6.2-2.3l-3.1-2.3c-.8.6-1.9.9-3.1.9a5.4 5.4 0 0 1-5-3.7H4v2.4a9.3 9.3 0 0 0 8.2 5Z"
        fill="oklch(0.67 0.08 145)"
      />
      <path
        d="M7.2 13.9a5.6 5.6 0 0 1 0-3.5V8H4a9.3 9.3 0 0 0 0 8.3l3.2-2.4Z"
        fill="oklch(0.78 0.09 82)"
      />
      <path
        d="M12.2 6.7c1.4 0 2.6.5 3.6 1.4l2.7-2.7a9.2 9.2 0 0 0-6.3-2.4A9.3 9.3 0 0 0 4 8l3.2 2.4a5.4 5.4 0 0 1 5-3.7Z"
        fill="oklch(0.65 0.08 28)"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const text = copy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [statusParam] = useState<"pending" | "existing" | "auth_failed" | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "pending") {
      return "pending";
    }
    if (params.get("status") === "existing") {
      return "existing";
    }
    if (params.get("error")) {
      return "auth_failed";
    }
    return null;
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissStatus, setDismissStatus] = useState(false);

  const statusMessage =
    statusParam === "pending" ? text.pending : statusParam === "existing" ? text.existing : statusParam ? text.googleError : null;
  const visibleError = error ?? (dismissStatus ? null : statusMessage);
  const localizedPath = (path: string) => `${path}${path.includes("?") ? "&" : "?"}lang=${locale}`;

  function handleLocaleChange(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDismissStatus(true);

    const result = await login(username, password);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/manage/dashboard");
    }
  }

  async function handleGoogle() {
    setError(null);
    setDismissStatus(true);
    setGoogleLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?lang=${locale}`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
      style={{ background: "oklch(0.985 0.007 82)" }}
    >
      <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4 sm:inset-x-8 sm:top-8">
        <Link
          href={localizedPath("/")}
          className="min-w-0 truncate text-xs transition-opacity hover:opacity-70"
          style={{
            color: "oklch(0.48 0.035 66)",
            fontFamily: "var(--font-work-sans)",
          }}
        >
          {text.home}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleLocaleChange("es")}
            className="text-xs transition-opacity hover:opacity-70"
            style={{
              color: locale === "es" ? "oklch(0.35 0.028 66)" : "oklch(0.52 0.018 72 / 0.6)",
              fontFamily: "var(--font-work-sans)",
            }}
            aria-pressed={locale === "es"}
          >
            ES
          </button>
          <span className="text-xs" style={{ color: "oklch(0.52 0.018 72 / 0.35)" }}>
            /
          </span>
          <button
            type="button"
            onClick={() => handleLocaleChange("en")}
            className="text-xs transition-opacity hover:opacity-70"
            style={{
              color: locale === "en" ? "oklch(0.35 0.028 66)" : "oklch(0.52 0.018 72 / 0.6)",
              fontFamily: "var(--font-work-sans)",
            }}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-6 top-8 hidden h-24 w-px sm:block"
        style={{ background: "linear-gradient(to bottom, transparent, oklch(0.76 0.025 72), transparent)" }}
      />
      <div
        className="pointer-events-none absolute bottom-10 right-8 hidden h-px w-28 sm:block"
        style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.02 72), transparent)" }}
      />
      <p
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-center text-xs italic sm:block"
        style={{ fontFamily: "var(--font-newsreader)", color: "oklch(0.5 0.025 72 / 0.55)" }}
      >
        {text.bottomNote}
      </p>

      <div className="relative w-full max-w-[410px]">
        <div className="mb-12 text-center">
          <Link
            href={localizedPath("/")}
            className="inline-block text-[2.35rem] leading-none tracking-[-0.02em] transition-opacity hover:opacity-75"
            style={{ fontFamily: "var(--font-newsreader)", color: "oklch(0.24 0.012 92)" }}
          >
            Tu dia de blanco
          </Link>
          <p
            className="mx-auto mt-4 max-w-[18rem] text-sm leading-6"
            style={{ fontFamily: "var(--font-newsreader)", color: "oklch(0.43 0.018 72 / 0.76)" }}
          >
            {text.brandBody}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 w-full rounded-full border px-6 text-[0.95rem] outline-none transition-colors focus:border-[var(--primary)]"
            style={{
              background: "oklch(0.995 0.004 82 / 0.74)",
              borderColor: "oklch(0.73 0.018 72 / 0.42)",
              color: "oklch(0.24 0.012 92)",
              fontFamily: "var(--font-work-sans)",
            }}
            placeholder={text.emailPlaceholder}
            autoComplete="username"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-full border px-6 pr-14 text-[0.95rem] outline-none transition-colors focus:border-[var(--primary)]"
              style={{
                background: "oklch(0.995 0.004 82 / 0.74)",
                borderColor: "oklch(0.73 0.018 72 / 0.42)",
                color: "oklch(0.24 0.012 92)",
                fontFamily: "var(--font-work-sans)",
              }}
              placeholder={text.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1"
              style={{ color: "oklch(0.38 0.018 72)" }}
              aria-label={showPassword ? text.hidePassword : text.showPassword}
            >
              {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
            </button>
          </div>

          {visibleError && (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "oklch(0.94 0.018 55)",
                color: "oklch(0.3 0.018 55)",
                fontFamily: "var(--font-work-sans)",
              }}
            >
              {visibleError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm" style={{ fontFamily: "var(--font-work-sans)" }}>
            <Link href={localizedPath("/forgot-password")} className="transition-opacity hover:opacity-70" style={{ color: "oklch(0.48 0.035 66)" }}>
              {text.forgot}
            </Link>
            <Link href={localizedPath("/register")} className="transition-opacity hover:opacity-70" style={{ color: "oklch(0.48 0.035 66)" }}>
              {text.signUp}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-3 h-14 w-full rounded-full text-[0.95rem] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "oklch(0.43 0.035 66)",
              color: "oklch(0.985 0.007 82)",
              fontFamily: "var(--font-work-sans)",
            }}
          >
            {loading ? text.signingIn : text.login}
          </button>
        </form>

        <div className="my-8 flex items-center gap-6">
          <div className="h-px flex-1" style={{ background: "oklch(0.78 0.018 72 / 0.55)" }} />
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[oklch(0.965_0.012_72)] disabled:opacity-50"
            style={{
              background: "oklch(0.995 0.004 82 / 0.82)",
              borderColor: "oklch(0.76 0.018 72 / 0.58)",
              fontFamily: "var(--font-work-sans)",
            }}
            aria-label={text.ariaGoogle}
          >
            {googleLoading ? (
              <span className="text-xs" style={{ color: "oklch(0.48 0.035 66)" }}>
                {text.loadingGoogle}
              </span>
            ) : (
              <GoogleMark />
            )}
          </button>
          <div className="h-px flex-1" style={{ background: "oklch(0.78 0.018 72 / 0.55)" }} />
        </div>
      </div>
    </main>
  );
}
