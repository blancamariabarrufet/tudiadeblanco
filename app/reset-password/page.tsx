"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/manage/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-sm">
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--primary)" }}
        >
          Choose a new password
        </h1>
        <p
          className="text-sm mb-8"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          Make it strong and memorable.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-underline"
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-underline"
              placeholder="Repeat password"
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
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
