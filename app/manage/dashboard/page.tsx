"use client";
export const dynamic = "force-dynamic";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { useT, useUser } from "@/context/UserContext";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Grid3x3, Wallet, Mail, Bot, Newspaper, Utensils, Globe2 } from "lucide-react";
import type { Feature } from "@/lib/features";

const modules = [
  {
    feature: "guests",
    href: "/manage/guests",
    icon: Users,
    label: "Guest List & RSVP",
    desc: "Manage invitations and track responses",
  },
  {
    feature: "seating",
    href: "/manage/seating",
    icon: Grid3x3,
    label: "Table Seating",
    desc: "Assign guests to tables visually",
  },
  {
    feature: "dietary",
    href: "/manage/dietary",
    icon: Utensils,
    label: "Dietary & Accessibility",
    desc: "Share requirements with caterers",
  },
  {
    feature: "budget",
    href: "/manage/budget",
    icon: Wallet,
    label: "Budget Tracker",
    desc: "Track spend across all categories",
  },
  {
    feature: "chatbot",
    href: "/manage/chatbot",
    icon: Bot,
    label: "Concierge Editor",
    desc: "Control what your AI concierge knows",
  },
  {
    feature: "news",
    href: "/manage/news",
    icon: Newspaper,
    label: "News Posts",
    desc: "Publish updates to your wedding site",
  },
  {
    feature: "letters",
    href: "/manage/letters",
    icon: Mail,
    label: "Letters Inbox",
    desc: "Read messages from your guests",
  },
  {
    feature: "domain",
    href: "/manage/domain",
    icon: Globe2,
    label: "Custom Domain & Email",
    desc: "Plan your wedding URL and inbox",
  },
] satisfies {
  feature: Feature;
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
}[];

export default function DashboardPage() {
  const user = useUser();
  const t = useT();
  if (user.isAdmin) redirect("/manage/admin");

  const visibleModules = modules.filter((module) => user.isAdmin || user.features.includes(module.feature));

  return (
    <div>
      <ModuleHeader
        title={t.dashboard.title}
        subtitle={t.dashboard.subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModules.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 p-5 rounded-2xl transition-all hover:shadow-ambient"
            style={{
              background: "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--surface-container-low)" }}
            >
              <Icon size={18} strokeWidth={1} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <p
                className="font-medium text-sm mb-0.5"
                style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
              >
                {label}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
              >
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
