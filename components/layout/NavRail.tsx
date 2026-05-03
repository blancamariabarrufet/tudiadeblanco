"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useT } from "@/context/UserContext";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Users,
  Grid3x3,
  Utensils,
  Wallet,
  Bot,
  Newspaper,
  Mail,
  Globe2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type { Feature } from "@/lib/features";

const featureItems: { feature: Feature; href: string; icon: React.ElementType; labelKey: keyof ReturnType<typeof useT>["nav"] }[] = [
  { feature: "guests",   href: "/manage/guests",   icon: Users,      labelKey: "guests" },
  { feature: "seating",  href: "/manage/seating",  icon: Grid3x3,    labelKey: "seating" },
  { feature: "dietary",  href: "/manage/dietary",  icon: Utensils,   labelKey: "dietary" },
  { feature: "budget",   href: "/manage/budget",   icon: Wallet,     labelKey: "budget" },
  { feature: "chatbot",  href: "/manage/chatbot",  icon: Bot,        labelKey: "concierge" },
  { feature: "news",     href: "/manage/news",     icon: Newspaper,  labelKey: "news" },
  { feature: "letters",  href: "/manage/letters",  icon: Mail,       labelKey: "letters" },
  { feature: "domain",   href: "/manage/domain",   icon: Globe2,     labelKey: "domain" },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
        style={{
          fontFamily: "var(--font-work-sans)",
          background: active ? "var(--surface-container)" : "transparent",
          color: active ? "var(--primary)" : "var(--on-surface-variant)",
        }}
      >
        <Icon size={16} strokeWidth={1} />
        {label}
      </Link>
    </li>
  );
}

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const t = useT();

  const visibleItems = featureItems.filter(
    (item) => !user.isAdmin && user.features.includes(item.feature)
  );

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop left rail */}
      <nav
        className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 py-8 px-4"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
      >
        <div className="mb-8 px-3">
          <p className="text-lg leading-tight" style={{ fontFamily: "var(--font-newsreader)", color: "var(--primary)" }}>
            The Digital<br />Heirloom
          </p>
          <p className="text-xs mt-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {user.username}
          </p>
        </div>

        <ul className="flex flex-col gap-1 flex-1">
          {!user.isAdmin && (
            <NavItem href="/manage/dashboard" label={t.nav.dashboard} icon={LayoutDashboard} active={pathname === "/manage/dashboard"} />
          )}
          {visibleItems.map(({ href, icon, labelKey }) => (
            <NavItem key={href} href={href} label={t.nav[labelKey]} icon={icon} active={pathname === href} />
          ))}
          {user.isAdmin && (
            <NavItem href="/manage/admin" label={t.nav.admin} icon={ShieldCheck} active={pathname === "/manage/admin"} />
          )}
        </ul>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container-low)] w-full"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          <LogOut size={16} strokeWidth={1} />
          {t.nav.signOut}
        </button>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 py-2 border-t"
        style={{
          background: "rgba(250,249,246,0.95)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(204,198,188,0.2)",
        }}
      >
        {[
          ...(user.isAdmin
            ? [{ href: "/manage/admin", icon: ShieldCheck, label: t.nav.admin }]
            : [{ href: "/manage/dashboard", icon: LayoutDashboard, label: t.nav.dashboard }]),
          ...visibleItems.slice(0, 4).map(({ href, icon, labelKey }) => ({
            href, icon, label: t.nav[labelKey],
          })),
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1"
              style={{ color: active ? "var(--primary)" : "var(--on-surface-variant)" }}
            >
              <Icon size={20} strokeWidth={1} />
              <span style={{ fontFamily: "var(--font-work-sans)", fontSize: "10px" }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
