"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm mb-8"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          <ArrowLeft size={16} strokeWidth={1} />
          Back to sign in
        </Link>

        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--primary)" }}
        >
          Reset your password
        </h1>
        <p
          className="text-sm mb-8"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div
            className="px-4 py-4 rounded-lg text-sm"
            style={{ background: "var(--surface-container-low)", fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
          >
            Check your inbox — a reset link is on its way. If you don&apos;t see it, check your spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-underline"
                placeholder="you@example.com"
                required
              />
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
