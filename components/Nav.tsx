"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { MenuIcon } from "@/components/ui/icons";

type NavProps = {
  onOpenOrder: () => void;
  onOpenMobileNav: () => void;
};

const linkKeys = [
  { href: "/#experience", key: "nav.experience" },
  { href: "/#process", key: "nav.process" },
  { href: "/pricing", key: "nav.pricing" },
];

export function Nav({ onOpenOrder, onOpenMobileNav }: NavProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-4 pt-3 sm:px-8 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[var(--radius-full)] bg-[rgba(250,249,246,0.80)] px-5 py-2.5 shadow-[var(--shadow-ambient)] backdrop-blur-[20px] sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-newsreader)] text-[1.15rem] font-semibold text-[color:var(--primary)]"
        >
          Tu dia de blanco
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {linkKeys.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            className="font-[family-name:var(--font-work-sans)] text-xs tracking-wide text-[color:var(--primary)] opacity-70 transition-opacity hover:opacity-100"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
          <Link
            href="/login"
            className="button-secondary px-5 py-2 text-[0.8rem]"
          >
            {t("nav.login")}
          </Link>
          <Button onClick={onOpenOrder} className="px-5 py-2 text-[0.8rem]">
            <span>{t("nav.cta")}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            className="font-[family-name:var(--font-work-sans)] text-xs tracking-wide text-[color:var(--primary)] opacity-70"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
          <button
            type="button"
            aria-label="Open menu"
            onClick={onOpenMobileNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--primary)]"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNavLinks({
  onNavigate,
  onOpenOrder,
}: {
  onNavigate: () => void;
  onOpenOrder: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
      <div className="space-y-8">
        <div>
          <p className="eyebrow mb-3">Tu dia de blanco</p>
          <h2 className="font-[family-name:var(--font-newsreader)] text-3xl leading-tight text-[color:var(--on-surface)]">
            {t("nav.mobileTitle")}
          </h2>
        </div>
        <nav className="flex flex-col gap-4">
          {linkKeys.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="font-[family-name:var(--font-newsreader)] text-2xl text-[color:var(--on-surface)]"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-3">
        <Link
          href="/login"
          onClick={onNavigate}
          className="button-secondary w-full justify-center px-5 py-3"
        >
          {t("nav.login")}
        </Link>
        <Button onClick={onOpenOrder} className="w-full justify-center px-5 py-3">
          <span>{t("nav.cta")}</span>
        </Button>
      </div>
    </div>
  );
}
