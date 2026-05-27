"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from "react";
import {
  Bot,
  CalendarDays,
  HeartHandshake,
  Mail,
  Newspaper,
  Utensils,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useLanguage, type Locale } from "@/lib/i18n";

const MEETING_URL = "https://calendar.app.google/76LAvzURpLJiTWe87";
const DEMO_ORIGIN = "https://demo.tudiadeblanco.com";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type ProductService = {
  id: string;
  icon: IconType;
  title: Record<Locale, string>;
  manager: Record<Locale, string>;
  body: Record<Locale, string>;
  points: Record<Locale, string[]>;
};

type ProductServicesCarouselVariant = "product" | "home";

type ProductServicesCarouselCopy = {
  eyebrow: string;
  title: string;
  sub?: string;
  imageSlot: string;
  managerLabel: string;
};

const services: ProductService[] = [
  {
    id: "website",
    icon: HeartHandshake,
    title: {
      en: "Wedding website",
      es: "Web de boda",
    },
    manager: {
      en: "Public experience",
      es: "Experiencia publica",
    },
    body: {
      en: "A calm, editorial wedding site connected to the details you manage behind the scenes.",
      es: "Una web de boda serena y editorial, conectada con los detalles que gestionas desde el panel.",
    },
    points: {
      en: ["Story, schedule, venues and guest guidance", "Designed to feel personal, not template based"],
      es: ["Historia, horarios, espacios e informacion para invitados", "Diseñada para sentirse personal, no como una plantilla"],
    },
  },
  {
    id: "physical-invitations",
    icon: Mail,
    title: {
      en: "Physical invitations",
      es: "Invitaciones fisicas",
    },
    manager: {
      en: "Printed stationery",
      es: "Papeleria impresa",
    },
    body: {
      en: "Printed invitations designed to match the digital wedding experience, from first impression to RSVP.",
      es: "Invitaciones impresas diseñadas para acompañar la experiencia digital, desde la primera impresion hasta el RSVP.",
    },
    points: {
      en: ["Coordinated with your website style", "Prepared for print"],
      es: ["Coordinadas con el estilo de vuestra web", "Preparadas para imprenta"],
    },
  },
  {
    id: "rsvp",
    icon: Users,
    title: {
      en: "RSVP and guest list",
      es: "RSVP y lista de invitados",
    },
    manager: {
      en: "Manager panel: Guests",
      es: "Panel: Invitados",
    },
    body: {
      en: "Guests confirm attendance through the site. You see every response, companion and contact detail in one place.",
      es: "Los invitados confirman asistencia desde la web. Tu ves cada respuesta, acompañante y contacto en un solo lugar.",
    },
    points: {
      en: ["Confirmed, declined and pending guests", "Manual edits for last minute changes"],
      es: ["Confirmados, rechazados y pendientes", "Edicion manual para cambios de ultima hora"],
    },
  },
  {
    id: "seating",
    icon: CalendarDays,
    title: {
      en: "Seating planner",
      es: "Plano de mesas",
    },
    manager: {
      en: "Manager panel: Seating",
      es: "Panel: Asientos",
    },
    body: {
      en: "Create tables, review capacity and place guests visually so the room plan stays readable.",
      es: "Crea mesas, revisa capacidad y coloca invitados visualmente para mantener el plano claro.",
    },
    points: {
      en: ["Round or rectangular tables", "Unassigned list for easy planning"],
      es: ["Mesas redondas o rectangulares", "Lista de invitados sin asignar para organizar mejor"],
    },
  },
  {
    id: "dietary",
    icon: Utensils,
    title: {
      en: "Dietary and accessibility notes",
      es: "Dieta y accesibilidad",
    },
    manager: {
      en: "Manager panel: Dietary",
      es: "Panel: Dieta",
    },
    body: {
      en: "Collect dietary requirements, accessibility needs and notes your caterer or planner should not miss.",
      es: "Recoge alergias, necesidades de accesibilidad y notas importantes para catering o wedding planner.",
    },
    points: {
      en: ["Filter requirements quickly", "Export details for suppliers"],
      es: ["Filtra requisitos rapidamente", "Exporta detalles para proveedores"],
    },
  },
  {
    id: "budget",
    icon: Wallet,
    title: {
      en: "Budget tracker",
      es: "Presupuesto",
    },
    manager: {
      en: "Manager panel: Budget",
      es: "Panel: Presupuesto",
    },
    body: {
      en: "Track estimates, paid amounts, categories and currency without turning the wedding into a spreadsheet.",
      es: "Controla estimaciones, pagos, categorias y moneda sin convertir la boda en una hoja de calculo.",
    },
    points: {
      en: ["Currency symbol selection", "Paid, pending and category totals"],
      es: ["Seleccion de simbolo de moneda", "Totales por pagado, pendiente y categoria"],
    },
  },
  {
    id: "chatbot",
    icon: Bot,
    title: {
      en: "The Invisible Host",
      es: "The Invisible Host",
    },
    manager: {
      en: "Manager panel: AI assistant",
      es: "Panel: Asistente IA",
    },
    body: {
      en: "A wedding assistant that answers guest questions with the information you approve.",
      es: "Un asistente de boda que responde a los invitados usando la informacion que tu apruebas.",
    },
    points: {
      en: ["Venue, dress code, arrival and custom answers", "Live demo "],
      es: ["Espacios, dress code, llegada y respuestas personalizadas", "Demo en vivo"],
    },
  },
  {
    id: "news",
    icon: Newspaper,
    title: {
      en: "News and updates",
      es: "Noticias y actualizaciones",
    },
    manager: {
      en: "Manager panel: News",
      es: "Panel: Noticias",
    },
    body: {
      en: "Publish thoughtful updates to your wedding site as the day gets closer.",
      es: "Publica actualizaciones cuidadas en la web a medida que se acerca el gran dia.",
    },
    points: {
      en: ["Draft, schedule or publish", "Useful for transport, timing and reminders"],
      es: ["Borrador, programacion o publicacion", "Ideal para transporte, horarios y recordatorios"],
    },
  },
  {
    id: "letters",
    icon: Mail,
    title: {
      en: "Letters to the couple",
      es: "Cartas para la pareja",
    },
    manager: {
      en: "Manager panel: Letters",
      es: "Panel: Cartas",
    },
    body: {
      en: "Guests can leave private notes and memories that arrive in a quiet inbox for the couple.",
      es: "Los invitados pueden dejar notas privadas y recuerdos que llegan a un inbox sereno para la pareja.",
    },
    points: {
      en: ["Private guest messages", "A keepsake after the wedding"],
      es: ["Mensajes privados de invitados", "Un recuerdo para despues de la boda"],
    },
  },
];

const productServicesCopy: Record<Locale, ProductServicesCarouselCopy> = {
  en: {
    eyebrow: "SERVICES",
    title: "What the manager panel controls",
    sub: "Each service can be enabled for a couple. The panel only shows the tools selected for that wedding.",
    imageSlot: "Image space",
    managerLabel: "Panel service",
  },
  es: {
    eyebrow: "SERVICIOS",
    title: "",
    sub: "Cada servicio se puede activar para una pareja. El panel solo muestra las herramientas seleccionadas para esa boda.",
    imageSlot: "Espacio para imagen",
    managerLabel: "Servicio del panel",
  },
};

const homeServicesCopy: Record<Locale, ProductServicesCarouselCopy> = {
  en: {
    eyebrow: "",
    title: "Everything we can build for your wedding.",
    imageSlot: "",
    managerLabel: "Product",
  },
  es: {
    eyebrow: "",
    title: "Todo lo que podemos crear para vuestra boda.",
    imageSlot: "",
    managerLabel: "Producto",
  },
};

const pageCopy = {
  en: {
    eyebrow: "THE PRODUCT",
    headline: "Your wedding website, connected to every detail.",
    sub: "A live guest experience with a private manager panel behind it.",
    primary: "Begin your story",
    meeting: "Reserve a meeting",
    differenceEyebrow: "WHY IT FEELS DIFFERENT",
    differenceTitle: "One place for the page, the guests, and the details.",
    differenceBody:
      "Most wedding tools split the experience between a public website, spreadsheets, messages, and supplier notes. Tu dia de blanco keeps the visible site and the preparation work connected, so every update is easier to manage.",
    closingTitle: "A website your guests understand, with a panel you can actually use.",
    closingSub: "Start with the essentials, then add the services that fit your wedding.",
    closingSecondary: "Try the AI",
    guestTitle: "Your guests' experience",
    coupleTitle: "The couple's experience",
    viewDemo: "View demo",
  },
  es: {
    eyebrow: "EL PRODUCTO",
    headline: "Tu web de boda, conectada a cada detalle.",
    sub: "Una experiencia para invitados con un panel privado detras.",
    primary: "Comienza tu historia",
    meeting: "Reservar una reunion",
    differenceEyebrow: "POR QUE ES DIFERENTE",
    differenceTitle: "Una sola experiencia para la web, los invitados y los detalles.",
    differenceBody:
      "La preparacion de una boda suele acabar repartida entre una web, hojas de calculo, mensajes y notas para proveedores. Tu dia de blanco conecta la parte visible con la gestion privada para que cada cambio sea mas facil.",
    closingTitle: "Una web que tus invitados entienden, con un panel que puedes usar de verdad.",
    closingSub: "Empieza con lo esencial y anade los servicios que encajan con tu boda.",
    closingSecondary: "Probar la IA",
    guestTitle: "La experiencia de tus invitados",
    coupleTitle: "La experiencia de los novios",
    viewDemo: "Ver demo",
  },
} satisfies Record<Locale, Record<string, string>>;

const guestFeatures = {
  en: [
    "Custom-made invitation matching your wedding aesthetic",
    "Access to all wedding information along with the latest news in real time",
    "AI assistant with custom tone and data to answer all guest questions",
    "Form to register attendance confirmation and notes to keep in mind",
    "Photo well to share all wedding photos taken by guests (coming soon)",
  ],
  es: [
    "Invitación hecha a medida con la estética de tu boda",
    "Acceso a toda la información de la boda junto a las últimas noticias en tiempo real",
    "Asistente de IA con tono y datos a medida para resolver todas las dudas de los invitados",
    "Formulario para registrar confirmación de asistencia y notas a tener en cuenta",
    "Pozo donde compartir todas las fotos de la boda sacadas por los invitados (pronto)",
  ],
} satisfies Record<Locale, string[]>;

const coupleFeatures = {
  en: [
    "Control panel for all guests with attendance confirmations, intolerances/allergies, number of companions...",
    "Budget control panel",
    "Interactive table planner for easy organization",
    "Wedding document manager",
    "AI assistant to quickly query all your documents or guest information",
    "AI assistant configurator for your guests",
    "News manager for guests",
  ],
  es: [
    "Panel de control de todos los invitados con sus confirmaciones de asistencia, intolerancias/alergias, cantidad de acompañantes...",
    "Panel de control de presupuestos",
    "Gestor interactivo de mesas para una organización sencilla",
    "Gestor de documentos de la boda",
    "Asistente de IA para poder consultar todos tus documentos o información sobre los invitados rápidamente",
    "Configurador del asistente de IA para tus invitados",
    "Gestor de noticias para los invitados",
  ],
} satisfies Record<Locale, string[]>;

const differencePoints = {
  en: [
    {
      title: "Less back-and-forth",
      body: "Guest information, RSVP changes, notes and updates live in one calm workflow.",
    },
    {
      title: "Designed around your wedding",
      body: "The site starts from your story, tone and practical needs, not from a generic template.",
    },
    {
      title: "Preparation feels lighter",
      body: "Guests get clear answers and you keep the important decisions visible until the day arrives.",
    },
  ],
  es: [
    {
      title: "Menos idas y venidas",
      body: "Informacion de invitados, cambios de RSVP, notas y actualizaciones viven en un flujo sereno.",
    },
    {
      title: "Diseñada alrededor de vuestra boda",
      body: "La web parte de vuestra historia, tono y necesidades reales, no de una plantilla generica.",
    },
    {
      title: "La preparacion se siente mas ligera",
      body: "Los invitados reciben respuestas claras y vosotros manteneis visibles las decisiones importantes.",
    },
  ],
} satisfies Record<Locale, { title: string; body: string }[]>;


type ProductShowcaseProps = {
  onOpenOrder: () => void;
};

export function ProductServicesCarousel({ variant = "product" }: { variant?: ProductServicesCarouselVariant }) {
  const { locale } = useLanguage();
  const copy = variant === "home" ? homeServicesCopy[locale] : productServicesCopy[locale];
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const updateActiveService = () => {
      const rect = carousel.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const scrollSpan = Math.max(1, rect.height - viewportHeight);
      const progress = Math.min(1, Math.max(0, (viewportHeight * 0.28 - rect.top) / scrollSpan));
      const nextIndex = Math.round(progress * (services.length - 1));

      setActiveServiceIndex((current) => (current === nextIndex ? current : nextIndex));
    };

    updateActiveService();
    window.addEventListener("scroll", updateActiveService, { passive: true });
    window.addEventListener("resize", updateActiveService);

    return () => {
      window.removeEventListener("scroll", updateActiveService);
      window.removeEventListener("resize", updateActiveService);
    };
  }, []);

  return (
    <section className="product-services" aria-label={copy.eyebrow}>
      <header className={`product-services__header${variant === "home" ? " product-services__header--centered" : ""}`}>
        {copy.eyebrow ? <p className="eyebrow">{copy.eyebrow}</p> : null}
        {copy.title ? <h2>{copy.title}</h2> : null}
        {copy.sub ? <p>{copy.sub}</p> : null}
      </header>

      <div
        className="product-services__carousel"
        ref={carouselRef}
        style={{ "--carousel-scroll": `${(services.length - 1) * 58}vh` } as CSSProperties}
      >
        <div
          className="product-services__carousel-sticky"
          role="region"
          aria-roledescription="carousel"
          aria-label={copy.title}
        >
          <div className="product-services__carousel-track">
            {services.map((service, index) => {
              const Icon = service.icon;
              const offset = index - activeServiceIndex;
              const distance = Math.min(Math.abs(offset), 3);
              const clampedOffset = Math.max(-3, Math.min(3, offset));
              const carouselStyle = {
                "--offset": clampedOffset,
                "--distance": distance,
                "--x": `${clampedOffset * 22}rem`,
                "--tablet-x": `${clampedOffset * 16}rem`,
                "--mobile-x": `${clampedOffset * 76}vw`,
                "--phone-x": `${clampedOffset * 61}vw`,
                "--y": `${distance * 0.42}rem`,
                "--scale": distance === 0 ? 1.14 : distance === 1 ? 0.76 : 0.56,
                "--tablet-scale": distance === 0 ? 1.08 : distance === 1 ? 0.72 : 0.52,
                "--phone-scale": distance === 0 ? 1 : distance === 1 ? 0.66 : 0.48,
                "--opacity": distance === 0 ? 1 : distance === 1 ? 0.62 : distance === 2 ? 0.2 : 0,
                "--z": 20 - distance,
                "--rotate": `${clampedOffset * -17}deg`,
                "--tablet-rotate": `${clampedOffset * -12}deg`,
                "--mobile-rotate": `${clampedOffset * -9}deg`,
                "--phone-rotate": `${clampedOffset * -6}deg`,
                "--blur": `${distance > 1 ? 1.5 : 0}px`,
              } as CSSProperties;

              return (
                <article
                  key={service.id}
                  className={`product-service${index === activeServiceIndex ? " is-active" : ""}`}
                  aria-hidden={distance > 1}
                  style={carouselStyle}
                >
                  <div className="product-service__number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="product-service__copy">
                    <div className="product-service__icon">
                      <Icon width={18} height={18} strokeWidth={1.4} />
                    </div>
                    {variant === "product" ? (
                      <p className="product-service__manager">
                        {copy.managerLabel}: {service.manager[locale]}
                      </p>
                    ) : null}
                    <h3>{service.title[locale]}</h3>
                    <p>{service.body[locale]}</p>
                    <ul>
                      {service.points[locale].map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`product-service__image product-service__image--${service.id}`}
                    aria-label={`${service.title[locale]} image space`}
                  >
                    <div className="product-service__image-inner">
                      <Icon width={22} height={22} strokeWidth={1.25} />
                      {copy.imageSlot ? <span>{copy.imageSlot}</span> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="product-services__carousel-progress" aria-hidden="true">
            <span>{String(activeServiceIndex + 1).padStart(2, "0")}</span>
            <div>
              {services.map((service, index) => (
                <i key={service.id} className={index === activeServiceIndex ? "is-active" : ""} />
              ))}
            </div>
            <span>{String(services.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductShowcase({ onOpenOrder }: ProductShowcaseProps) {
  const { locale } = useLanguage();
  const copy = pageCopy[locale];

  return (
    <>
      <section id="product-hero" className="product-hero" aria-label={copy.eyebrow}>
        <div className="product-hero__copy">
          <p className="eyebrow product-hero__eyebrow">{copy.eyebrow}</p>
          <h1 className="product-hero__headline">{copy.headline}</h1>
          <p className="product-hero__sub">{copy.sub}</p>
          <div className="product-hero__actions">
            <Button onClick={onOpenOrder} className="whitespace-nowrap px-6 py-3 text-[0.82rem]">
              <span>{copy.primary}</span>
            </Button>
            <a href={MEETING_URL} target="_blank" rel="noreferrer" className="product-hero__secondary">
              {copy.meeting}
            </a>
          </div>
        </div>
      </section>

      <section className="experience-section" aria-label="Experiencia">
        <div className="experience-section__inner">
          <div className="experience-panels">
            {/* Guest experience */}
            <div className="experience-panel">
              <div className="experience-panel__top">
                <span>01</span>
              </div>
              <h3>{copy.guestTitle}</h3>
              <ul>
                {guestFeatures[locale].map((feature) => (
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
                  <span>{copy.viewDemo}</span>
                  <span className="experience-demo-btn__arrow">→</span>
                </a>
              </div>
            </div>

            {/* Couple experience */}
            <div className="experience-panel">
              <div className="experience-panel__top">
                <span>02</span>
              </div>
              <h3>{copy.coupleTitle}</h3>
              <ul>
                {coupleFeatures[locale].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="experience-panel__demo-wrap">
                <a href="/demo-login" className="experience-demo-btn">
                  <span>{copy.viewDemo}</span>
                  <span className="experience-demo-btn__arrow">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-difference" aria-labelledby="product-difference-title">
        <div className="product-difference__intro">
          <p className="eyebrow">{copy.differenceEyebrow}</p>
          <h2 id="product-difference-title">{copy.differenceTitle}</h2>
          <p>{copy.differenceBody}</p>
        </div>
        <div className="product-difference__thread" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="product-difference__list">
          {differencePoints[locale].map((point, index) => (
            <article
              key={point.title}
              className="product-difference__item"
              style={{ "--difference-index": index } as CSSProperties}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-closing" aria-label={copy.closingTitle}>
        <div className="product-closing__inner">
          <h2 className="product-closing__title">{copy.closingTitle}</h2>
          <p className="product-closing__sub">{copy.closingSub}</p>
          <div className="product-closing__actions">
            <Button onClick={onOpenOrder} className="px-6 py-3 text-[0.9rem]">
              <span>{copy.primary}</span>
            </Button>
            <a href="/register" className="product-hero__secondary">
              {copy.closingSecondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
