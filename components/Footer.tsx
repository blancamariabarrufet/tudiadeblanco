"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[color:var(--surface-container-high)] px-8 py-6 sm:px-12 lg:px-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-newsreader)] text-[0.95rem] text-[color:var(--primary)]">
            Tu dia de blanco
          </p>
          <p className="mt-1.5 max-w-md font-[family-name:var(--font-work-sans)] text-[0.65rem] leading-5 text-[rgba(26,28,26,0.38)]">
            {t("footer.copyright")}
          </p>
        </div>

        <div className="flex flex-wrap gap-5 font-[family-name:var(--font-work-sans)] text-[0.7rem] text-[rgba(26,28,26,0.48)] sm:justify-end">
          <Link href="/#top">{t("footer.privacy")}</Link>
          <Link href="/#top">{t("footer.terms")}</Link>
          <Link href="/#experience">{t("footer.concierge")}</Link>
          <Link href="/#experience">{t("footer.press")}</Link>
        </div>
      </div>
    </footer>
  );
}
