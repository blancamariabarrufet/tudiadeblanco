"use client";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

const DEMO_ORIGIN = "https://demo.tudiadeblanco.com";
const DEMO_DISPLAY_HOST = "demo.tudiadeblanco.com";

type FeatureSection = {
  id: string;
  route: string;
  eyebrowKey: string;
  titleKey: string;
  bodyKey: string;
  linkKey: string;
  align: "left" | "right";
  accent: string;
};

const sections: FeatureSection[] = [
  {
    id: "nosotros",
    route: "#nosotros",
    eyebrowKey: "product.nosotros.eyebrow",
    titleKey: "product.nosotros.title",
    bodyKey: "product.nosotros.body",
    linkKey: "product.nosotros.link",
    align: "left",
    accent: "#a89070",
  },
  {
    id: "el-gran-dia",
    route: "#el-gran-dia",
    eyebrowKey: "product.granDia.eyebrow",
    titleKey: "product.granDia.title",
    bodyKey: "product.granDia.body",
    linkKey: "product.granDia.link",
    align: "right",
    accent: "#8a7060",
  },
  {
    id: "rsvp",
    route: "#rsvp",
    eyebrowKey: "product.rsvp.eyebrow",
    titleKey: "product.rsvp.title",
    bodyKey: "product.rsvp.body",
    linkKey: "product.rsvp.link",
    align: "left",
    accent: "#6e5c4c",
  },
  {
    id: "alojamiento",
    route: "#alojamiento",
    eyebrowKey: "product.aloja.eyebrow",
    titleKey: "product.aloja.title",
    bodyKey: "product.aloja.body",
    linkKey: "product.aloja.link",
    align: "right",
    accent: "#5e4c3c",
  },
];

type BrowserFrameProps = {
  route: string;
  title: string;
  className?: string;
};

function BrowserFrame({ route, title, className }: BrowserFrameProps) {
  const displayUrl = `${DEMO_DISPLAY_HOST}${route === "#" ? "" : route}`;
  const src = `${DEMO_ORIGIN}${route}`;

  return (
    <div className={`browser-frame ${className ?? ""}`.trim()}>
      <div className="browser-frame__chrome">
        <div className="browser-frame__dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="browser-frame__url" title={displayUrl}>
          {displayUrl}
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="browser-frame__open"
          title="Open in new tab"
          aria-label="Open demo in new tab"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
      <div className="browser-frame__body">
        <iframe
          src={src}
          title={title}
          className="browser-frame__iframe"
          loading="lazy"
        />
      </div>
    </div>
  );
}

type ProductShowcaseProps = {
  onOpenOrder: () => void;
};

export function ProductShowcase({ onOpenOrder }: ProductShowcaseProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* ─── Hero — headline + CTA + interactive home demo ────────────── */}
      <section
        id="product-hero"
        className="product-hero"
        aria-label="Tu dia de blanco product hero"
      >
        <div className="product-hero__inner">
          <p className="eyebrow product-hero__eyebrow">
            {t("product.hero.eyebrow")}
          </p>
          <h1 className="product-hero__headline">
            {t("product.hero.headline1")}{" "}
            <em>{t("product.hero.headline2")}</em>
          </h1>
          <p className="product-hero__sub">{t("product.hero.sub")}</p>

          <div className="product-hero__actions">
            <Button
              onClick={onOpenOrder}
              className="whitespace-nowrap px-6 py-3 text-[0.8rem]"
            >
              <span>{t("product.hero.primary")}</span>
            </Button>
            <a href="/invisible-host" className="product-hero__secondary whitespace-nowrap">
              {t("product.hero.tryAi")}
            </a>
            <a
              href={DEMO_ORIGIN}
              target="_blank"
              rel="noreferrer"
              className="product-hero__secondary"
            >
              {t("product.hero.secondary")}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <p className="product-hero__hint">{t("product.hero.hint")}</p>
        </div>

        <div className="product-hero__stage">
          <BrowserFrame
            route="#"
            title="Tu dia de blanco — live demo home"
            className="product-hero__frame"
          />
        </div>
      </section>

      {/* ─── Feature sections — each with a live, interactive iframe ─── */}
      <section className="product-features" aria-label="Product feature walkthrough">
        <header className="product-features__header">
          <p className="eyebrow">{t("product.features.eyebrow")}</p>
          <h2 className="product-features__heading">
            {t("product.features.heading1")}{" "}
            <em>{t("product.features.heading2")}</em>
          </h2>
          <p className="product-features__sub">{t("product.features.sub")}</p>
        </header>

        <div className="product-features__list">
          {sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className={`product-feature product-feature--${section.align}`}
              style={{ "--feature-accent": section.accent } as React.CSSProperties}
            >
              <div className="product-feature__copy">
                <p className="eyebrow product-feature__eyebrow">
                  {t(section.eyebrowKey)}
                </p>
                <h3 className="product-feature__title">{t(section.titleKey)}</h3>
                <p className="product-feature__body">{t(section.bodyKey)}</p>
                <a
                  href={`${DEMO_ORIGIN}${section.route}`}
                  target="_blank"
                  rel="noreferrer"
                  className="product-feature__link"
                >
                  {t(section.linkKey)}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="product-feature__stage">
                <BrowserFrame
                  route={section.route}
                  title={`Tu dia de blanco — ${section.id} preview`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Closing prompt ───────────────────────────────────────────── */}
      <section className="product-closing" aria-label="Start your own">
        <div className="product-closing__inner">
          <h2 className="product-closing__title">
            {t("product.closing.title1")}{" "}
            <em>{t("product.closing.title2")}</em>
          </h2>
          <p className="product-closing__sub">{t("product.closing.sub")}</p>
          <div className="product-closing__actions">
            <Button
              onClick={onOpenOrder}
              className="px-6 py-3 text-[0.9rem]"
            >
              <span>{t("product.closing.primary")}</span>
            </Button>
            <a
              href={DEMO_ORIGIN}
              target="_blank"
              rel="noreferrer"
              className="product-hero__secondary"
            >
              {t("product.closing.secondary")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
