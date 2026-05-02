import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ALL_FEATURES, FEATURE_LABELS, type Feature } from "@/lib/features";

export { ALL_FEATURES, FEATURE_LABELS };
export type { Feature };

export interface SessionUser {
  id: string;
  username: string;
  isAdmin: boolean;
  features: Feature[];
  language: "en" | "es";
  submissionId: string | null;
}

const COOKIE = "panel_session";

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-in-production-32chars"
  );
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export function sanitizeFeatures(features: unknown): Feature[] {
  if (!Array.isArray(features)) return [];
  return features.filter((feature): feature is Feature =>
    (ALL_FEATURES as readonly string[]).includes(String(feature))
  );
}
