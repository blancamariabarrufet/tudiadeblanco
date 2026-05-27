"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/i18n";

const DEMO_ORIGIN = "https://demo.tudiadeblanco.com";

export function Features() {
  const { t } = useLanguage();
  const coupleFeatures = [
    t("features.couplePoint1"),
    t("features.couplePoint2"),
    t("features.couplePoint3"),
    t("features.couplePoint4"),
    t("features.couplePoint5"),
    t("features.couplePoint6"),
    t("features.couplePoint7"),
  ];
  const guestFeatures = [
    t("features.guestPoint1"),
    t("features.guestPoint2"),
    t("features.guestPoint3"),
    t("features.guestPoint4"),
    t("features.guestPoint5"),
  ];

  return (
    <section
      id="experience"
      className="experience-section"
    >
      <div className="experience-section__inner">
        <div className="experience-section__header">
          <h2>
            {t("features.heading")}
          </h2>
        </div>

        <div className="experience-panels" aria-label={t("features.experienceLabel")}>
          <article className="experience-panel experience-panel--couple">
            <div className="experience-panel__top">
              <span>01</span>
              <p className="experience-panel__kicker">{t("features.coupleKicker")}</p>
            </div>
            <h3>{t("features.coupleTitle")}</h3>
            <ul>
              {coupleFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="experience-panel__demo-wrap">
              <Link href="/demo-login" className="experience-demo-btn">
                <span>{t("features.viewDemo")}</span>
                <span className="experience-demo-btn__arrow">→</span>
              </Link>
            </div>
          </article>

          <article className="experience-panel experience-panel--guest">
            <div className="experience-panel__top">
              <span>02</span>
              <p className="experience-panel__kicker">{t("features.guestKicker")}</p>
            </div>
            <h3>{t("features.guestTitle")}</h3>
            <ul>
              {guestFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="experience-panel__demo-wrap">
              <a
                href={DEMO_ORIGIN}
                target="_blank"
                rel="noreferrer"
                className="experience-demo-btn"
              >
                <span>{t("features.viewDemo")}</span>
                <span className="experience-demo-btn__arrow">→</span>
              </a>
            </div>
          </article>
        </div>

        <Link href="/register" className="experience-assistant-link">
          <span>{t("features.aiLink")}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
