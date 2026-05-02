"use client";

import Image from "next/image";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { PolaroidFrame } from "@/components/ui/PolaroidFrame";

type HeroProps = {
  onOpenOrder: () => void;
};

export function Hero({ onOpenOrder }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section
      id="top"
      className="hero-section bg-[color:var(--surface)] px-5 pb-16 pt-24 sm:px-8 lg:px-20 md:pb-20 md:pt-28 lg:pb-24 lg:pt-32"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        {/* Left column — editorial text */}
        <div className="hero-copy-wrap max-w-xl pt-2 lg:pt-6">
          <p className="eyebrow">{t("hero.eyebrow")}</p>

          <h1 className="hero-title mt-5 font-[family-name:var(--font-newsreader)] text-[clamp(2.6rem,5.5vw,4.2rem)] leading-[1.08] tracking-[-0.02em] text-[color:var(--on-surface)]">
            {t("hero.headline1")}
            <br />
            <em className="font-normal italic">{t("hero.headline2")}</em>
          </h1>

          <p className="hero-body mt-6 max-w-[26rem] font-[family-name:var(--font-newsreader)] text-[0.95rem] leading-[1.7] text-[color:var(--on-surface)]">
            {t("hero.body")}{" "}
            <em className="italic">{t("hero.hostName")}</em>{" "}
            {t("hero.bodyEnd")}
          </p>

          <div className="hero-actions mt-8 inline-flex flex-col gap-3">
            <div className="hero-actions-row flex flex-nowrap items-center gap-3">
              <Button
                onClick={onOpenOrder}
                className="hero-button whitespace-nowrap px-5 py-2.5 text-[0.78rem]"
              >
                <span>{t("hero.cta")}</span>
              </Button>
              <Button
                variant="secondary"
                className="hero-button whitespace-nowrap px-5 py-2.5 text-[0.78rem]"
                onClick={() => {
                  window.location.href = "/invisible-host";
                }}
              >
                {t("hero.tryAi")}
              </Button>
            </div>
            <Button
              variant="secondary"
              className="hero-button hero-button-wide w-full justify-center whitespace-nowrap px-5 py-2.5 text-[0.78rem]"
              onClick={() => {
                window.location.href = "/product";
              }}
            >
              {t("hero.secondary")}
            </Button>
          </div>
        </div>

        {/* Right column: Polaroid image */}
        <div className="relative max-w-[31rem] justify-self-center lg:justify-self-end">
          <PolaroidFrame className="rotate-[-1.4deg] rounded-[0.45rem] px-3 pb-9 pt-3 shadow-[0_28px_70px_rgba(76,62,50,0.16),0_2px_10px_rgba(76,62,50,0.08)] sm:px-4 sm:pb-11 sm:pt-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[0.2rem]">
              <Image
                src="/images/table.png"
                alt="Elegant wedding dinner table"
                fill
                priority
                className="object-cover sepia-[0.1] saturate-[0.92]"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 42%, rgba(250, 246, 238, 0.04) 0%, rgba(108, 91, 78, 0.08) 58%, rgba(44, 34, 27, 0.34) 100%), linear-gradient(180deg, rgba(239, 217, 200, 0.08), rgba(76, 62, 50, 0.1))",
                }}
              />
            </div>
            <p className="mt-6 text-center font-[family-name:var(--font-newsreader)] text-[1.05rem] italic leading-snug text-[color:var(--on-surface)]">
              {t("hero.quote")}
            </p>
            <p className="mt-2 text-center font-[family-name:var(--font-work-sans)] text-[0.62rem] uppercase tracking-[0.1em] text-[rgba(108,91,78,0.62)]">
              {t("hero.attribution")}
            </p>
          </PolaroidFrame>
        </div>
      </div>
    </section>
  );
}
