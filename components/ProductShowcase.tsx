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
      es: ["Historia, horarios, espacios e informacion para invitados", "Disenada para sentirse personal, no como una plantilla"],
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
      es: "Invitaciones impresas disenadas para acompanar la experiencia digital, desde la primera impresion hasta el RSVP.",
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
      es: "Los invitados confirman asistencia desde la web. Tu ves cada respuesta, acompanante y contacto en un solo lugar.",
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
    demo: "Open live demo",
    demoNote: "Contact us and we will prepare a free personalized demo website in your style. The demo is only a preview and has no cost.",
    liveLabel: "Live connected demo",
    closingTitle: "A website your guests understand, with a panel you can actually use.",
    closingSub: "Start with the essentials, then add the services that fit your wedding.",
    closingSecondary: "Try the AI",
  },
  es: {
    eyebrow: "EL PRODUCTO",
    headline: "Tu web de boda, conectada a cada detalle.",
    sub: "Una experiencia para invitados con un panel privado detras.",
    primary: "Comienza tu historia",
    demo: "Abrir demo en vivo",
    demoNote: "Contactanos y prepararemos una demo web gratuita con tu estilo. La demo es solo una vista previa, no tiene coste.",
    liveLabel: "Demo en vivo conectada",
    closingTitle: "Una web que tus invitados entienden, con un panel que puedes usar de verdad.",
    closingSub: "Empieza con lo esencial y anade los servicios que encajan con tu boda.",
    closingSecondary: "Probar la IA",
  },
} satisfies Record<Locale, Record<string, string>>;

type BrowserFrameProps = {
  route: string;
  title: string;
};

function BrowserFrame({ route, title }: BrowserFrameProps) {
  const src = `${DEMO_ORIGIN}${route}`;

  return (
    <div className="browser-frame product-demo-frame">
      <div className="browser-frame__body">
        <iframe src={src} title={title} className="browser-frame__iframe" loading="lazy" />
      </div>
    </div>
  );
}

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
            <a href={DEMO_ORIGIN} target="_blank" rel="noreferrer" className="product-hero__secondary">
              {copy.demo}
            </a>
          </div>
          <p className="product-demo-note">{copy.demoNote}</p>
        </div>
        <div className="product-hero__stage">
          <div className="product-hero__stage-label">
            <span />
            {copy.liveLabel}
          </div>
          <BrowserFrame route="#" title="Tu dia de blanco live wedding demo" />
        </div>
      </section>

      <ProductServicesCarousel />

      <section className="product-closing" aria-label={copy.closingTitle}>
        <div className="product-closing__inner">
          <h2 className="product-closing__title">{copy.closingTitle}</h2>
          <p className="product-closing__sub">{copy.closingSub}</p>
          <div className="product-closing__actions">
            <Button onClick={onOpenOrder} className="px-6 py-3 text-[0.9rem]">
              <span>{copy.primary}</span>
            </Button>
            <a href="/invisible-host" className="product-hero__secondary">
              {copy.closingSecondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
