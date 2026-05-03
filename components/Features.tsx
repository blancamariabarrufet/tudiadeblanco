"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/lib/i18n";
import {
  CheckCircleIcon,
  LayoutIcon,
  SendIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export function Features() {
  const { t } = useLanguage();

  return (
    <section
      id="experience"
      className="bg-[color:var(--surface-container-low)] px-8 py-16 sm:px-12 lg:px-20 md:py-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-newsreader)] text-[clamp(1.8rem,3.6vw,2.5rem)] tracking-[-0.01em] text-[color:var(--on-surface)]">
            {t("features.heading")}
          </h2>
          <p className="mt-3 font-[family-name:var(--font-newsreader)] text-[0.95rem] leading-[1.7] text-[rgba(26,28,26,0.7)]">
            {t("features.sub")}
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {/* Row 1 — AI Assistant (wider) + Bespoke Design (narrower) */}
          <article
            id="invisible-host"
            className="feature-card overflow-hidden lg:col-span-7"
          >
            <div className="grid gap-6 xl:grid-cols-[1fr_16rem]">
              <div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-[color:var(--primary)]" />
                  <p className="label">{t("features.hostLabel")}</p>
                </div>
                <h3 className="mt-3 font-[family-name:var(--font-newsreader)] text-[1.5rem] text-[color:var(--on-surface)]">
                  {t("features.aiTitle")}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-newsreader)] text-[0.88rem] leading-[1.7] text-[color:var(--on-surface)]">
                  {t("features.aiBody")}
                </p>
                <div className="feature-host-cta-wrap">
                <Link
                  href="/invisible-host"
                  className="feature-host-cta"
                >
                  <span>{t("features.aiLink")}</span>
                  <span className="feature-host-cta__arrow" aria-hidden="true">→</span>
                </Link>
                </div>
              </div>

              {/* Decorative chat mockup */}
              <Link
                href="/invisible-host"
                className="hidden rounded-[var(--radius-lg)] bg-[color:var(--surface-container-low)] p-3 shadow-[var(--shadow-ambient)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--primary)] xl:block"
                aria-label={t("features.aiLink")}
              >
                <div className="flex h-full flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[rgba(255,255,255,0.6)] p-3">
                  <div className="chat-bubble bot text-[0.78rem]">
                    {t("chat.greeting")}
                  </div>
                  <div className="chat-bubble guest ml-auto text-[0.78rem]">
                    {t("chat.question")}
                  </div>
                  <div className="chat-bubble bot text-[0.78rem]">
                    {t("chat.answer")}
                  </div>
                  <div className="mt-auto flex items-center gap-2 border-b border-[rgba(204,198,188,0.3)] pb-1 pt-3 text-[0.72rem] text-[rgba(26,28,26,0.4)]">
                    <span className="font-[family-name:var(--font-newsreader)]">
                      {t("chat.placeholder")}
                    </span>
                    <SendIcon className="ml-auto h-3.5 w-3.5 text-[color:var(--primary)]" />
                  </div>
                </div>
              </Link>
            </div>
          </article>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <article className="feature-card flex-1">
              <LayoutIcon className="h-7 w-7 text-[color:var(--primary)]" />
              <h3 className="mt-6 font-[family-name:var(--font-newsreader)] text-[1.5rem] text-[color:var(--on-surface)]">
                {t("features.designTitle")}
              </h3>
              <p className="mt-2 max-w-sm font-[family-name:var(--font-newsreader)] text-[0.88rem] leading-[1.7] text-[color:var(--on-surface)]">
                {t("features.designBody")}
              </p>
            </article>
            <article className="feature-card flex-1">
              <SparklesIcon className="h-7 w-7 text-[color:var(--primary)]" />
              <h3 className="mt-6 font-[family-name:var(--font-newsreader)] text-[1.5rem] text-[color:var(--on-surface)]">
                {t("features.curatedTitle")}
              </h3>
              <p className="mt-2 max-w-sm font-[family-name:var(--font-newsreader)] text-[0.88rem] leading-[1.7] text-[color:var(--on-surface)]">
                {t("features.curatedBody")}
              </p>
            </article>
          </div>

          {/* Row 2 — Seamless RSVPs (narrower) + Photo card (wider) */}
          <article className="feature-card lg:col-span-4">
            <CheckCircleIcon className="h-7 w-7 text-[color:var(--primary)]" />
            <h3 className="mt-6 font-[family-name:var(--font-newsreader)] text-[1.5rem] text-[color:var(--on-surface)]">
              {t("features.rsvpTitle")}
            </h3>
            <p className="mt-2 max-w-sm font-[family-name:var(--font-newsreader)] text-[0.88rem] leading-[1.7] text-[color:var(--on-surface)]">
              {t("features.rsvpBody")}
            </p>
          </article>

          <article className="relative min-h-[240px] overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] lg:col-span-8">
            <Image
              src="/images/hands2.png"
              alt="Hands with engagement ring"
              fill
              className="object-cover scale-105 object-[center_30%]"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </article>
        </div>
      </div>
    </section>
  );
}
