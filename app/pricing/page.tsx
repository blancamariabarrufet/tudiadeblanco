"use client";

import Link from "next/link";
import { useState } from "react";

import { Footer } from "@/components/Footer";
import { MobileNavLinks, Nav } from "@/components/Nav";
import { VellumOverlay } from "@/components/ui/VellumOverlay";
import { useLanguage, type Locale } from "@/lib/i18n";

type PricingPlan = {
  id: string;
  name: string;
  price: string;
  featured?: boolean;
  badge?: string;
  tagline: string;
  groups: {
    title: string;
    items: string[];
  }[];
  cta: string;
};

type PricingCopy = {
  eyebrow: string;
  heroTitle: string;
  heroSub: string;
  promiseTitleStart: string;
  promiseTitleEmphasis: string;
  promiseTitleEnd: string;
  promiseBody: string;
  process: string[];
  aiBanner: string;
  shared: string;
  footerNote: string;
  plans: PricingPlan[];
};

const pricingCopy = {
  en: {
    eyebrow: "PRICING",
    heroTitle: "The Digital Heirloom, priced once.",
    heroSub: "A fully personalised wedding website, guest tools, hosting, and The Invisible Host in every plan.",
    promiseTitleStart: "Your website is built ",
    promiseTitleEmphasis: "with you",
    promiseTitleEnd: ", not for a stranger.",
    promiseBody:
      "Every couple receives a personalised website designed around their story, their palette, and their day. After sign-up, our team guides you through a short discovery process: a few questions, a few choices. From there, we handle everything. You review, we refine. The result is a site that feels entirely yours, with zero design effort on your part.",
    process: [
      "You answer a short questionnaire about your day and aesthetic",
      "We design your site and share a first draft within 48 hours",
      "Unlimited refinements until it's exactly right",
      "We publish it and stay available until your day",
    ],
    aiBanner:
      "The Invisible Host is included in every plan. Your AI concierge answers guests' questions so you never have to.",
    shared: "One-time payment · 24-month hosting · 14-day money-back guarantee",
    footerNote: "All plans · One-time payment · 24-month hosting · 14-day money-back guarantee",
    plans: [
      {
        id: "heirloom",
        name: "The Heirloom",
        price: "$115",
        tagline: "A beautifully designed presence with everything guests need.",
        cta: "Get started",
        groups: [
          {
            title: "Design & website",
            items: [
              "Bespoke personalised design (questionnaire + unlimited revisions)",
              "Wedding website (mobile-first)",
              "Day-of timeline",
              "News & updates feed",
              "Letters to the couple",
            ],
          },
          {
            title: "Guests",
            items: ["RSVP & guest list (up to 150 guests)"],
          },
          {
            title: "AI concierge",
            items: ["The Invisible Host: AI answers guests 24/7", "Knowledge base editor"],
          },
        ],
      },
      {
        id: "estate",
        name: "The Estate",
        price: "$150",
        featured: true,
        badge: "Most popular",
        tagline: "Full planning command: seating, budget, every detail managed.",
        cta: "Get started",
        groups: [
          {
            title: "Design & website",
            items: [
              "Bespoke personalised design (questionnaire + unlimited revisions)",
              "Everything in The Heirloom",
            ],
          },
          {
            title: "Planning tools",
            items: [
              "Unlimited guests",
              "Seating planner (drag-and-drop)",
              "Dietary & accessibility manager",
              "Budget tracker",
              "PDF exports (seating chart, caterer brief)",
            ],
          },
          {
            title: "AI concierge",
            items: ["The Invisible Host: AI answers guests 24/7", "Knowledge base editor"],
          },
        ],
      },
      {
        id: "legacy",
        name: "The Legacy",
        price: "$200",
        tagline: "Every feature, every export, and a keepsake that outlasts the day.",
        cta: "Get started",
        groups: [
          {
            title: "Design & website",
            items: [
              "Bespoke personalised design (questionnaire + unlimited revisions)",
              "Everything in The Estate",
            ],
          },
          {
            title: "Planning tools",
            items: ["Vendor contact book", "Letters keepsake PDF (typeset, print-ready)"],
          },
          {
            title: "AI concierge & insights",
            items: [
              "The Invisible Host: AI answers guests 24/7",
              "Analytics summary (visits, RSVP funnel, top questions)",
              "Chatbot gap detector (flags questions the AI couldn't answer, links to knowledge base editor)",
              "Priority support",
            ],
          },
        ],
      },
    ],
  },
  es: {
    eyebrow: "PRECIOS",
    heroTitle: "La Herencia Digital, con pago unico.",
    heroSub: "Una web de boda personalizada, herramientas para invitados, hosting y The Invisible Host en todos los planes.",
    promiseTitleStart: "Tu web se crea ",
    promiseTitleEmphasis: "contigo",
    promiseTitleEnd: ", no para alguien cualquiera.",
    promiseBody:
      "Cada pareja recibe una web personalizada, diseñada alrededor de su historia, su paleta y su dia. Tras registrarte, nuestro equipo te guia por un breve proceso de descubrimiento: unas preguntas, algunas decisiones. A partir de ahi, nos encargamos de todo. Tu revisas, nosotros refinamos. El resultado es una web completamente vuestra, sin esfuerzo de diseño por vuestra parte.",
    process: [
      "Respondes un breve cuestionario sobre vuestro dia y vuestra estetica",
      "Diseñamos vuestra web y compartimos un primer borrador en 48 horas",
      "Refinamientos ilimitados hasta que quede exactamente como querais",
      "La publicamos y seguimos disponibles hasta vuestro dia",
    ],
    aiBanner:
      "The Invisible Host esta incluido en todos los planes. Vuestro concierge con IA responde las preguntas de los invitados para que no tengais que hacerlo vosotros.",
    shared: "Pago unico · 24 meses de hosting · Garantia de devolucion de 14 dias",
    footerNote: "Todos los planes · Pago unico · 24 meses de hosting · Garantia de devolucion de 14 dias",
    plans: [
      {
        id: "heirloom",
        name: "The Heirloom",
        price: "95 €",
        tagline: "Una presencia cuidadosamente diseñada con todo lo que necesitan los invitados.",
        cta: "Empezar",
        groups: [
          {
            title: "Diseño y web",
            items: [
              "Diseño personalizado a medida (cuestionario + revisiones ilimitadas)",
              "Web de boda mobile-first",
              "Timeline del dia",
              "Noticias y actualizaciones",
              "Cartas para la pareja",
            ],
          },
          {
            title: "Invitados",
            items: ["RSVP y lista de invitados (hasta 150 invitados)"],
          },
          {
            title: "Concierge con IA",
            items: ["The Invisible Host: la IA responde a invitados 24/7", "Editor de base de conocimiento"],
          },
        ],
      },
      {
        id: "estate",
        name: "The Estate",
        price: "130 €",
        featured: true,
        badge: "Mas popular",
        tagline: "Control completo de la planificacion: mesas, presupuesto y cada detalle.",
        cta: "Empezar",
        groups: [
          {
            title: "Diseño y web",
            items: [
              "Diseño personalizado a medida (cuestionario + revisiones ilimitadas)",
              "Todo lo incluido en The Heirloom",
            ],
          },
          {
            title: "Herramientas de planificacion",
            items: [
              "Invitados ilimitados",
              "Plano de mesas drag-and-drop",
              "Gestor de dieta y accesibilidad",
              "Control de presupuesto",
              "Exportaciones PDF (plano de mesas, briefing para catering)",
            ],
          },
          {
            title: "Concierge con IA",
            items: ["The Invisible Host: la IA responde a invitados 24/7", "Editor de base de conocimiento"],
          },
        ],
      },
      {
        id: "legacy",
        name: "The Legacy",
        price: "175 €",
        tagline: "Todas las funciones, todas las exportaciones y un recuerdo que dura mas alla del dia.",
        cta: "Empezar",
        groups: [
          {
            title: "Diseño y web",
            items: ["Diseño personalizado a medida (cuestionario + revisiones ilimitadas)", "Todo lo incluido en The Estate"],
          },
          {
            title: "Herramientas de planificacion",
            items: ["Agenda de proveedores", "PDF recuerdo de cartas (maquetado, listo para imprimir)"],
          },
          {
            title: "Concierge con IA e insights",
            items: [
              "The Invisible Host: la IA responde a invitados 24/7",
              "Resumen de analitica (visitas, RSVP, preguntas principales)",
              "Detector de vacios del chatbot (marca preguntas que la IA no pudo responder y enlaza al editor)",
              "Soporte prioritario",
            ],
          },
        ],
      },
    ],
  },
} satisfies Record<Locale, PricingCopy>;

export default function PricingPage() {
  const { locale } = useLanguage();
  const copy = pricingCopy[locale];
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function openOrder() {
    window.location.href = "/register";
  }

  return (
    <main className="min-h-screen bg-[color:var(--surface)]">
      <Nav onOpenOrder={() => openOrder()} onOpenMobileNav={() => setMobileNavOpen(true)} />

      <section className="pricing-hero" aria-labelledby="pricing-title">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="pricing-title">{copy.heroTitle}</h1>
        <p>{copy.heroSub}</p>
      </section>

      <section className="pricing-promise" aria-labelledby="pricing-promise-title">
        <div className="pricing-promise__copy">
          <h2 id="pricing-promise-title">
            {copy.promiseTitleStart}
            <strong>{copy.promiseTitleEmphasis}</strong>
            {copy.promiseTitleEnd}
          </h2>
          <p>{copy.promiseBody}</p>
        </div>
        <div className="pricing-process" aria-label={locale === "en" ? "Design process" : "Proceso de diseño"}>
          {copy.process.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="pricing-ai-banner">
        <span>The Invisible Host</span>
        <p>{copy.aiBanner}</p>
      </aside>

      <section className="pricing-plans" aria-label={locale === "en" ? "Pricing plans" : "Planes y precios"}>
        <p className="pricing-shared">{copy.shared}</p>
        <div className="pricing-grid">
          {copy.plans.map((plan) => (
            <article key={plan.name} className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}>
              {plan.badge ? <p className="pricing-card__badge">{plan.badge}</p> : null}
              <div className="pricing-card__head">
                <h2>{plan.name}</h2>
                <p>
                  <span>{plan.price}</span>
                  {locale === "en" ? " one-time" : " pago unico"}
                </p>
              </div>
              <p className="pricing-card__tagline">{plan.tagline}</p>
              <div className="pricing-card__sections">
                {plan.groups.map((group) => (
                  <div key={group.title} className="pricing-card__section">
                    <h3>{group.title}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Link href={`/register?plan=${plan.id}`} className="pricing-card__cta">
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
        <p className="pricing-footer-note">{copy.footerNote}</p>
      </section>

      <Footer />

      <VellumOverlay
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        align="top"
        panelClassName="mt-16 w-full max-w-xl rounded-[calc(var(--radius-lg)+0.4rem)] bg-[color:var(--surface)] p-0"
      >
        <MobileNavLinks onNavigate={() => setMobileNavOpen(false)} onOpenOrder={() => openOrder()} />
      </VellumOverlay>
    </main>
  );
}
