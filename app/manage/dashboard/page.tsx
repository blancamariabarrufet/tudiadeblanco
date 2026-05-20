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
    color: "#d96b72",
    bg: "#fdece9",
  },
  {
    feature: "seating",
    href: "/manage/seating",
    icon: Grid3x3,
    label: "Table Seating",
    desc: "Assign guests to tables visually",
    color: "#70bda9",
    bg: "#eaf5f2",
  },
  {
    feature: "dietary",
    href: "/manage/dietary",
    icon: Utensils,
    label: "Dietary & Accessibility",
    desc: "Share requirements with caterers",
    color: "#d9a05b",
    bg: "#fcf6ef",
  },
  {
    feature: "budget",
    href: "/manage/budget",
    icon: Wallet,
    label: "Budget Tracker",
    desc: "Track spend across all categories",
    color: "#6c5b4e",
    bg: "#f4f3f1",
  },
  {
    feature: "chatbot",
    href: "/manage/chatbot",
    icon: Bot,
    label: "Concierge Editor",
    desc: "Control what your AI concierge knows",
    color: "#8fa39a",
    bg: "#f0f4f2",
  },
  {
    feature: "news",
    href: "/manage/news",
    icon: Newspaper,
    label: "News Posts",
    desc: "Publish updates to your wedding site",
    color: "#a88778",
    bg: "#f6f1ef",
  },
  {
    feature: "letters",
    href: "/manage/letters",
    icon: Mail,
    label: "Letters Inbox",
    desc: "Read messages from your guests",
    color: "#c87969",
    bg: "#faebe8",
  },
  {
    feature: "domain",
    href: "/manage/domain",
    icon: Globe2,
    label: "Custom Domain & Email",
    desc: "Plan your wedding URL and inbox",
    color: "#726b64",
    bg: "#f4f3f1",
  },
] satisfies {
  feature: Feature;
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  bg: string;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleModules.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-4 p-6 rounded-2xl transition-all hover:shadow-ambient hover:-translate-y-1"
            style={{
              background: "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                style={{ background: bg }}
              >
                <Icon size={22} strokeWidth={2} style={{ color }} />
              </div>
              <p
                className="font-bold text-[16px]"
                style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
              >
                {label}
              </p>
            </div>
            <div>
              <p
                className="text-sm leading-relaxed font-medium"
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
