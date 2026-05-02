"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";
import type { Lang } from "@/lib/panel-i18n";
import { translations } from "@/lib/panel-i18n";

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): SessionUser {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}

export function useT() {
  const user = useContext(UserContext);
  const lang: Lang = (user?.language as Lang) ?? "en";
  return translations[lang];
}
