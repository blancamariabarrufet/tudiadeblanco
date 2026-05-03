"use client";

import Image from "next/image";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

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
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
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

        {/* Right column — polaroid */}
        <div className="flex w-full justify-center lg:justify-end">
          <figure
            className="relative bg-white pt-4 pr-4 pb-16 pl-4 shadow-[0_24px_60px_rgba(76,62,50,0.18)] rotate-[-3deg] transition-transform duration-500 hover:rotate-[-1deg] hover:scale-[1.02]"
            style={{ width: "min(22rem, 100%)" }}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-[color:var(--surface-container-low)]">
              <Image
                src="/images/table.png"
                alt="Wedding table arrangement"
                fill
                priority
                sizes="(min-width: 1024px) 22rem, 80vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
