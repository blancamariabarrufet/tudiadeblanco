"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Locale = "en" | "es";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "es";
  }

  const urlLocale = new URLSearchParams(window.location.search).get("lang");
  if (urlLocale === "en" || urlLocale === "es") {
    return urlLocale;
  }

  const savedLocale = window.localStorage.getItem("tdb-locale");
  if (savedLocale === "en" || savedLocale === "es") {
    return savedLocale;
  }

  return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("tdb-locale", locale);
  }, [locale]);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale];
      return dict[key] ?? translations.en[key] ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    "nav.experience": "Experience",
    "nav.host": "Our Invisible Host",
    "nav.process": "Process",
    "nav.product": "Product",
    "nav.pricing": "Pricing",
    "nav.login": "Login",
    "nav.cta": "Begin Your Story",
    "nav.mobileTitle": "The Digital Heirloom.",

    // Hero
    "hero.eyebrow": "Introducing the Digital Heirloom",
    "hero.headline1": "Your Love Story,",
    "hero.headline2": "Elegantly Digital.",
    "hero.body":
      "Beyond a simple website, Tu dia de blanco creates a bespoke digital experience. Featuring",
    "hero.hostName": "The Invisible Host",
    "hero.bodyEnd": "\u2014 an AI assistant crafted to help your guests with grace.",
    "hero.cta": "Begin Your Story",
    "hero.secondary": "Discover our product",
    "hero.tryAi": "Try your AI",
    "hero.quote": "\u201CA masterpiece of digital grace.\u201D",
    "hero.attribution": "Vogue Weddings",

    // Features
    "features.heading": "Modern Sophistication",
    "features.sub":
      "We combine timeless aesthetics with the convenience of tomorrow.",
    "features.hostLabel": "The Invisible Host",
    "features.aiTitle": "Personal assistant",
    "features.aiBody":
      "A personal assistant for your guests, trained on your wedding details. Whether they need directions, dress code advice, or registry links, it responds instantly with a warm, human tone.",
    "features.aiLink": "Try your personalized assistant.",
    "features.designTitle": "Bespoke Design",
    "features.designBody":
      "Curated typography and layouts that mirror high-end stationery. No templates, just digital craft.",
    "features.curatedTitle": "Curated Details",
    "features.curatedBody":
      "Every aspect is carefully tailored to reflect your unique style and wedding theme.",
    "features.rsvpTitle": "Seamless RSVPs",
    "features.rsvpBody":
      "Intelligently manage guest lists and dietary requirements with one-tap digital confirmation.",

    // Process section
    "process.heading": "The Process",
    "process.sub": "Your bespoke digital heirlooom, crafted step by step.",
    "process.step1.title": "Brief & vision",
    "process.step1.body": "Style, must-haves & event details",
    "process.step2.title": "Design & content",
    "process.step2.body": "Palette, fonts, photos & copy",
    "process.step3.title": "First draft",
    "process.step3.body": "Homepage & key sections for review",
    "process.step4.title": "Revisions & RSVP",
    "process.step4.body": "Feedback, polish & guest form setup",
    "process.step5.title": "Launch",
    "process.step5.body": "Go live, share & ongoing updates",

    // Chat mockup
    "chat.greeting":
      "Hello! I\u2019m your host for Sarah & James\u2019s wedding. How can I help you today?",
    "chat.question": "What\u2019s the dress code for the Friday welcome dinner?",
    "chat.answer":
      "The welcome dinner is Coastal Chic. Think light linens and soft summer tones.",
    "chat.placeholder": "Ask me anything\u2026",

    // Closing CTA
    "cta.eyebrow": "The digital companion your love story deserves.",
    "cta.headline1": "Ready to welcome",
    "cta.headline2": "your guests?",
    "cta.button": "Begin Your Story",
    "cta.subtext": "Takes less than 5 minutes to start your draft.",

    // Footer
    "footer.copyright":
      "\u00A9 2025, The Ethereal Concierge. Crafted for the Modern Heirloom.",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.concierge": "Assistant Access",
    "footer.press": "Press",

    // Order form
    "order.step1": "What are your names?",
    "order.partner1": "Partner 1",
    "order.partner2": "Partner 2",
    "order.step2": "When is your wedding?",
    "order.dateLabel": "Wedding date",
    "order.step3": "Where is the ceremony?",
    "order.ceremonyLabel": "Ceremony venue",
    "order.step4": "And the reception?",
    "order.receptionLabel": "Reception venue",
    "order.step5": "How many guests?",
    "order.step6": "What would you like?",
    "order.featureHint":
      "Selected experiences become part of your tailored digital heirloom.",
    "order.step7": "How should the website feel?",
    "order.vibeQuestion": "What's the overall vibe?",
    "order.paletteQuestion": "Any color preferences or palette ideas?",
    "order.typographyQuestion": "Typography",
    "order.customSelection": "Write another selection",
    "order.customVibePlaceholder": "Something else, e.g. art deco dinner party",
    "order.customPalettePlaceholder": "Something else, e.g. cream, aubergine, olive",
    "order.typographyGuide":
      "A common pattern is pairing a script for names with a serif for body copy, or using Cinzel for structural elements like dates and venue alongside Cormorant for prose.",
    "order.typographyLimit": "Select 1 to 3 options.",
    "order.decideTypography": "Decide for me",
    "order.primaryTypography": "Primary",
    "order.secondaryTypography": "Secondary",
    "order.textTypography": "Text",
    "order.yesPlease": "Yes, please",
    "order.digitalOnly": "Digital only",
    "order.step8": "Add inspiration images?",
    "order.imagesLabel": "Upload images",
    "order.imagesHint":
      "Optional. Add up to 6 images with references, mood, venues, stationery, or visual inspiration.",
    "order.removeImage": "Remove",
    "order.images": "Images",
    "order.step9": "Physical invitations?",
    "order.paperInvitationHint":
      "If you would like paper invitations, we will contact you to collect all the necessary details.",
    "order.digitalInvitationHint":
      "If you prefer digital only, we will continue with the website details and no paper invitation information is needed.",
    "order.step10": "Your email.",
    "order.emailLabel": "Email address",
    "order.emailHint": "We\u2019ll be in touch within 24 hours.",
    "order.step11": "Review & send",
    "order.names": "Names",
    "order.weddingDate": "Wedding date",
    "order.ceremonyVenue": "Ceremony venue",
    "order.receptionVenue": "Reception venue",
    "order.guestCount": "Guest count",
    "order.selectedFeatures": "Selected features",
    "order.physicalInvitations": "Physical invitations",
    "order.overallVibe": "Overall vibe",
    "order.colorPalette": "Color palette",
    "order.typography": "Typography",
    "order.email": "Email",
    "order.notProvided": "Not provided",
    "order.noneSelected": "None selected",
    "order.yes": "Yes",
    "order.back": "Back",
    "order.continue": "Continue",
    "order.send": "Send My Request",
    "order.saving": "Saving...",
    "order.saveError": "We could not save your request. Please try again.",
    "order.received": "Received",
    "order.confirmTitle": "We\u2019ll be in touch soon.",
    "order.confirmBody":
      "Your request is with our team. Expect a note from us within 24 hours.",
    "order.close": "Close",

    // Invisible Host page
    "invisible.hero.eyebrow": "THE INVISIBLE HOST",
    "invisible.hero.title": "Try your wedding chatbot.",
    "invisible.hero.body":
      "Share the details your guests ask about most. The preview builds an assistant voice from your wedding brief.",
    "invisible.form.title": "Wedding brief",
    "invisible.form.partnerOne": "Partner 1",
    "invisible.form.partnerTwo": "Partner 2",
    "invisible.form.email": "Email",
    "invisible.form.date": "Wedding date",
    "invisible.form.ceremony": "Ceremony venue",
    "invisible.form.reception": "Reception venue",
    "invisible.form.dress": "Dress code",
    "invisible.form.arrival": "Arrival note",
    "invisible.form.tone": "Tone",
    "invisible.form.notes": "Extra details",
    "invisible.form.required":
      "Names, email, date, and ceremony are required to start.",
    "invisible.form.generate": "Generate chatbot",
    "invisible.form.update": "Update chatbot",
    "invisible.form.saving": "Saving...",
    "invisible.form.saveError":
      "We could not save your data. Please try again.",
    "invisible.form.partnerOnePlaceholder": "Sara",
    "invisible.form.partnerTwoPlaceholder": "James",
    "invisible.form.emailPlaceholder": "you@example.com",
    "invisible.form.ceremonyPlaceholder": "Santa Maria del Mar",
    "invisible.form.receptionPlaceholder": "Mas Torroella",
    "invisible.form.dressPlaceholder": "Summer cocktail, linen welcome",
    "invisible.form.arrivalPlaceholder": "Shuttle from the hotel at 17:15",
    "invisible.form.tonePlaceholder": "Warm, elegant, concise",
    "invisible.form.notesPlaceholder":
      "Children welcome, garden ceremony, late-night churros...",
    "invisible.chat.title": "Live chatbot",
    "invisible.chat.ready": "Assistant preview",
    "invisible.chat.empty": "Your generated host will appear here.",
    "invisible.chat.placeholder": "Ask a guest question...",
    "invisible.chat.send": "Send question",
    "invisible.quick.dress": "What should I wear?",
    "invisible.quick.where": "Where is the ceremony?",
    "invisible.quick.transport": "How do I get there?",
    "invisible.fallback.names": "the couple",
    "invisible.fallback.date": "the wedding date",
    "invisible.fallback.reception": "the reception venue",
    "invisible.fallback.dress": "elegant wedding attire",
    "invisible.fallback.arrival":
      "I recommend checking the wedding site for final transport details.",

    // Product page — showcase
    "product.hero.eyebrow": "THE PRODUCT",
    "product.hero.headline1": "A live wedding site,",
    "product.hero.headline2": "in your hands.",
    "product.hero.sub":
      "Every page your guests will experience \u2014 rendered live, right here. Click, scroll, and explore the demo as if it were your own.",
    "product.hero.primary": "Begin Your Story",
    "product.hero.tryAi": "Try your AI",
    "product.hero.secondary": "Open full demo",
    "product.hero.hint": "Try it \u2014 the demo below is fully interactive.",

    "product.features.eyebrow": "A GUIDED TOUR",
    "product.features.heading1": "Every page your guests need,",
    "product.features.heading2": "crafted to perfection.",
    "product.features.sub":
      "From the first save-the-date to the final thank-you. Each section below is a live preview you can navigate for yourself.",

    "product.nosotros.eyebrow": "OUR STORY",
    "product.nosotros.title": "Your love story, beautifully told.",
    "product.nosotros.body":
      "Guide guests through your journey \u2014 from the first meeting to the proposal \u2014 written in your voice and styled to match your wedding\u2019s aesthetic. Each chapter is crafted with elegant typography and rich spacing.",
    "product.nosotros.link": "Open the story page \u2197",

    "product.granDia.eyebrow": "THE BIG DAY",
    "product.granDia.title": "Venues, schedule, directions \u2014 all in one place.",
    "product.granDia.body":
      "Guests arrive knowing exactly where to go and when. Ceremony venue, reception location, travel time \u2014 presented clearly so no one gets lost. Clickable maps link straight to Google Maps.",
    "product.granDia.link": "Explore the schedule \u2197",

    "product.rsvp.eyebrow": "RSVP",
    "product.rsvp.title": "Confirmations made effortless.",
    "product.rsvp.body":
      "A refined RSVP form collects everything you need \u2014 dietary restrictions, song requests, personal messages \u2014 without any of the usual back-and-forth. Responses are gathered in real time so you always know who\u2019s coming.",
    "product.rsvp.link": "Try the RSVP form \u2197",

    "product.aloja.eyebrow": "ACCOMMODATION",
    "product.aloja.title": "Handpicked hotels, shared with care.",
    "product.aloja.body":
      "Take care of your guests by listing curated accommodation options \u2014 with your group discount code front and centre so booking is instant. Your AI assistant can also answer accommodation questions in the chat.",
    "product.aloja.link": "See the stays \u2197",

    "product.closing.title1": "Ready to craft",
    "product.closing.title2": "your own?",
    "product.closing.sub":
      "What you just explored can be yours \u2014 tailored to your names, dates, and story. Start your draft in under five minutes.",
    "product.closing.primary": "Begin Your Story",
    "product.closing.secondary": "Revisit the demo",
  },
  es: {
    // Nav
    "nav.experience": "Experiencia",
    "nav.host": "The invisible host",
    "nav.process": "Proceso",
    "nav.product": "Producto",
    "nav.pricing": "Precios",
    "nav.login": "Login",
    "nav.cta": "Comienza Tu Historia",
    "nav.mobileTitle": "La Herencia Digital.",

    // Hero
    "hero.eyebrow": "Presentamos la Herencia Digital",
    "hero.headline1": "Tu Historia de Amor,",
    "hero.headline2": "Elegantemente Digital.",
    "hero.body":
      "M\u00E1s que un simple sitio web, Tu dia de blanco crea una experiencia digital a medida. Con",
    "hero.hostName": "The Invisible Host",
    "hero.bodyEnd":
      "\u2014 un asistente con IA dise\u00F1ado para ayudar a tus invitados con elegancia.",
    "hero.cta": "Comienza Tu Historia",
    "hero.secondary": "Descubre nuestro producto",
    "hero.tryAi": "Prueba tu IA",
    "hero.quote": "\u201CUna obra maestra de elegancia digital.\u201D",
    "hero.attribution": "Vogue Weddings",

    // Features
    "features.heading": "Sofisticaci\u00F3n Moderna",
    "features.sub":
      "Combinamos est\u00E9tica atemporal con la comodidad del ma\u00F1ana.",
    "features.hostLabel": "El Anfitri\u00F3n Invisible",
    "features.aiTitle": "Asistente Personal",
    "features.aiBody":
      "Un asistente personal para vuestros invitados, entrenado con los detalles de vuestra boda. Si necesitan indicaciones, dress code o enlaces de regalo, responde al instante con un tono cercano y humano.",
    "features.aiLink": "Prueba tu asistente personalizado.",
    "features.designTitle": "Diseño a Medida",
    "features.designBody":
      "Tipografía y maquetación seleccionadas que reflejan papelería de alta gama. Sin plantillas, solo artesanía digital.",
    "features.curatedTitle": "Detalles Curados",
    "features.curatedBody":
      "Cada aspecto está cuidadosamente adaptado para reflejar tu estilo único y la temática de tu boda.",
    "features.rsvpTitle": "RSVPs Sin Esfuerzo",
    "features.rsvpBody":
      "Gestiona de forma inteligente la lista de invitados y requisitos diet\u00E9ticos con confirmaci\u00F3n digital en un toque.",

    // Process section
    "process.heading": "El Proceso",
    "process.sub": "Tu reliquia digital, creada paso a paso.",
    "process.step1.title": "Visión y brief",
    "process.step1.body": "Estilo, requisitos y detalles del evento",
    "process.step2.title": "Diseño y contenido",
    "process.step2.body": "Paleta, tipografía, fotos y textos",
    "process.step3.title": "Primer borrador",
    "process.step3.body": "Página principal y secciones clave para revisión",
    "process.step4.title": "Revisiones y RSVP",
    "process.step4.body": "Comentarios, pulido y configuración de invitados",
    "process.step5.title": "Lanzamiento",
    "process.step5.body": "Publicación, compartir y actualizaciones",

    // Chat mockup
    "chat.greeting":
      "\u00A1Hola! Soy tu anfitri\u00F3n para la boda de Sara y James. \u00BFEn qu\u00E9 puedo ayudarte?",
    "chat.question":
      "\u00BFCu\u00E1l es el c\u00F3digo de vestimenta para la cena de bienvenida del viernes?",
    "chat.answer":
      "La cena de bienvenida es Coastal Chic. Piensa en linos ligeros y tonos suaves de verano.",
    "chat.placeholder": "Preg\u00FAntame lo que quieras\u2026",

    // Closing CTA
    "cta.eyebrow": "El compa\u00F1ero digital que tu historia de amor merece.",
    "cta.headline1": "\u00BFListos para recibir",
    "cta.headline2": "a vuestros invitados?",
    "cta.button": "Comienza Tu Historia",
    "cta.subtext": "Tarda menos de 5 minutos en crear tu borrador.",

    // Footer
    "footer.copyright":
      "\u00A9 2025, The Ethereal Concierge. Creado para la Herencia Moderna.",
    "footer.privacy": "Privacidad",
    "footer.terms": "T\u00E9rminos",
    "footer.concierge": "Acceso Asistente",
    "footer.press": "Prensa",

    // Order form
    "order.step1": "\u00BFC\u00F3mo os llam\u00E1is?",
    "order.partner1": "Pareja 1",
    "order.partner2": "Pareja 2",
    "order.step2": "\u00BFCu\u00E1ndo es vuestra boda?",
    "order.dateLabel": "Fecha de la boda",
    "order.step3": "\u00BFD\u00F3nde es la ceremonia?",
    "order.ceremonyLabel": "Lugar de la ceremonia",
    "order.step4": "\u00BFY la recepci\u00F3n?",
    "order.receptionLabel": "Lugar de la recepci\u00F3n",
    "order.step5": "\u00BFCu\u00E1ntos invitados?",
    "order.step6": "\u00BFQu\u00E9 os gustar\u00EDa?",
    "order.featureHint":
      "Las experiencias seleccionadas formar\u00E1n parte de vuestra herencia digital a medida.",
    "order.step7": "\u00BFC\u00F3mo debe sentirse la web?",
    "order.vibeQuestion": "\u00BFCu\u00E1l es la vibra general?",
    "order.paletteQuestion": "\u00BFPreferencias de color o ideas de paleta?",
    "order.typographyQuestion": "Tipograf\u00EDa",
    "order.customSelection": "Escribir otra selecci\u00F3n",
    "order.customVibePlaceholder": "Otra idea, por ejemplo cena art d\u00E9co",
    "order.customPalettePlaceholder":
      "Otra paleta, por ejemplo crema, berenjena, oliva",
    "order.typographyGuide":
      "Una combinaci\u00F3n habitual es usar una script para los nombres con una serif para los textos, o Cinzel para elementos estructurales como fechas y lugar junto con Cormorant para la prosa.",
    "order.typographyLimit": "Selecciona de 1 a 3 opciones.",
    "order.decideTypography": "Decide por m\u00ED",
    "order.primaryTypography": "Principal",
    "order.secondaryTypography": "Secundaria",
    "order.textTypography": "Textos",
    "order.yesPlease": "S\u00ED, por favor",
    "order.digitalOnly": "Solo digital",
    "order.step8": "\u00BFA\u00F1adir im\u00E1genes de inspiraci\u00F3n?",
    "order.imagesLabel": "Subir im\u00E1genes",
    "order.imagesHint":
      "Opcional. A\u00F1adid hasta 6 im\u00E1genes con referencias, mood, espacios, papeler\u00EDa o inspiraci\u00F3n visual.",
    "order.removeImage": "Quitar",
    "order.images": "Im\u00E1genes",
    "order.step9": "\u00BFInvitaciones f\u00EDsicas?",
    "order.paperInvitationHint":
      "Si quer\u00E9is invitaciones en papel, nos pondremos en contacto para recoger todos los detalles necesarios.",
    "order.digitalInvitationHint":
      "Si prefer\u00EDs solo digital, seguiremos con los detalles de la web y no necesitaremos informaci\u00F3n para invitaciones en papel.",
    "order.step10": "Vuestro email.",
    "order.emailLabel": "Direcci\u00F3n de email",
    "order.emailHint": "Nos pondremos en contacto en 24 horas.",
    "order.step11": "Revisar y enviar",
    "order.names": "Nombres",
    "order.weddingDate": "Fecha de la boda",
    "order.ceremonyVenue": "Lugar de la ceremonia",
    "order.receptionVenue": "Lugar de la recepci\u00F3n",
    "order.guestCount": "N\u00FAmero de invitados",
    "order.selectedFeatures": "Caracter\u00EDsticas seleccionadas",
    "order.physicalInvitations": "Invitaciones f\u00EDsicas",
    "order.overallVibe": "Vibra general",
    "order.colorPalette": "Paleta de color",
    "order.typography": "Tipograf\u00EDa",
    "order.email": "Email",
    "order.notProvided": "No proporcionado",
    "order.noneSelected": "Ninguna seleccionada",
    "order.yes": "S\u00ED",
    "order.back": "Atr\u00E1s",
    "order.continue": "Continuar",
    "order.send": "Enviar Mi Solicitud",
    "order.saving": "Guardando...",
    "order.saveError":
      "No hemos podido guardar tu solicitud. Int\u00E9ntalo de nuevo.",
    "order.received": "Recibido",
    "order.confirmTitle": "Estaremos en contacto pronto.",
    "order.confirmBody":
      "Tu solicitud est\u00E1 con nuestro equipo. Espera noticias nuestras en 24 horas.",
    "order.close": "Cerrar",

    // Invisible Host page
    "invisible.hero.eyebrow": "THE INVISIBLE HOST",
    "invisible.hero.title": "Prueba tu chatbot de boda.",
    "invisible.hero.body":
      "Comparte los detalles que m\u00E1s preguntan tus invitados. La vista previa crea una voz de asistente a partir del briefing de vuestra boda.",
    "invisible.form.title": "Briefing de boda",
    "invisible.form.partnerOne": "Pareja 1",
    "invisible.form.partnerTwo": "Pareja 2",
    "invisible.form.email": "Email",
    "invisible.form.date": "Fecha de la boda",
    "invisible.form.ceremony": "Lugar de la ceremonia",
    "invisible.form.reception": "Lugar de la celebraci\u00F3n",
    "invisible.form.dress": "C\u00F3digo de vestimenta",
    "invisible.form.arrival": "Nota de llegada",
    "invisible.form.tone": "Tono",
    "invisible.form.notes": "Detalles extra",
    "invisible.form.required":
      "Nombres, email, fecha y ceremonia son obligatorios para empezar.",
    "invisible.form.generate": "Generar chatbot",
    "invisible.form.update": "Actualizar chatbot",
    "invisible.form.saving": "Guardando...",
    "invisible.form.saveError":
      "No hemos podido guardar tus datos. Int\u00E9ntalo de nuevo.",
    "invisible.form.partnerOnePlaceholder": "Sara",
    "invisible.form.partnerTwoPlaceholder": "James",
    "invisible.form.emailPlaceholder": "tu@email.com",
    "invisible.form.ceremonyPlaceholder": "Santa Maria del Mar",
    "invisible.form.receptionPlaceholder": "Mas Torroella",
    "invisible.form.dressPlaceholder": "C\u00F3ctel de verano, lino para la bienvenida",
    "invisible.form.arrivalPlaceholder": "Lanzadera desde el hotel a las 17:15",
    "invisible.form.tonePlaceholder": "C\u00E1lido, elegante, conciso",
    "invisible.form.notesPlaceholder":
      "Ni\u00F1os bienvenidos, ceremonia en el jard\u00EDn, churros de madrugada...",
    "invisible.chat.title": "Chatbot en vivo",
    "invisible.chat.ready": "Vista previa del asistente",
    "invisible.chat.empty": "Tu host generado aparecer\u00E1 aqu\u00ED.",
    "invisible.chat.placeholder": "Pregunta algo como invitado...",
    "invisible.chat.send": "Enviar pregunta",
    "invisible.quick.dress": "\u00BFQu\u00E9 me pongo?",
    "invisible.quick.where": "\u00BFD\u00F3nde es la ceremonia?",
    "invisible.quick.transport": "\u00BFC\u00F3mo llego?",
    "invisible.fallback.names": "la pareja",
    "invisible.fallback.date": "la fecha de la boda",
    "invisible.fallback.reception": "el lugar de la celebraci\u00F3n",
    "invisible.fallback.dress": "vestimenta elegante de boda",
    "invisible.fallback.arrival":
      "Te recomiendo revisar la web de la boda para los detalles finales de transporte.",

    // Product page — showcase
    "product.hero.eyebrow": "EL PRODUCTO",
    "product.hero.headline1": "Una web de boda en vivo,",
    "product.hero.headline2": "en tus manos.",
    "product.hero.sub":
      "Cada p\u00E1gina que vivir\u00E1n tus invitados \u2014 renderizada en directo, aqu\u00ED mismo. Haz clic, desplázate y explora la demo como si fuera tuya.",
    "product.hero.primary": "Comienza Tu Historia",
    "product.hero.tryAi": "Prueba tu IA",
    "product.hero.secondary": "Abrir demo completa",
    "product.hero.hint": "Pru\u00E9balo \u2014 la demo de abajo es completamente interactiva.",

    "product.features.eyebrow": "UN RECORRIDO GUIADO",
    "product.features.heading1": "Cada p\u00E1gina que tus invitados necesitan,",
    "product.features.heading2": "creada con detalle.",
    "product.features.sub":
      "Desde el primer save-the-date hasta el \u00FAltimo gracias. Cada secci\u00F3n inferior es una vista en vivo que puedes navegar por ti mismo.",

    "product.nosotros.eyebrow": "NUESTRA HISTORIA",
    "product.nosotros.title": "Vuestra historia de amor, bellamente contada.",
    "product.nosotros.body":
      "Gu\u00EDa a tus invitados por vuestro camino \u2014 desde el primer encuentro hasta la pedida \u2014 escrito con vuestra voz y con el estilo de vuestra boda. Cada cap\u00EDtulo se dise\u00F1a con tipograf\u00EDa elegante y un ritmo pausado.",
    "product.nosotros.link": "Abrir la p\u00E1gina \u2197",

    "product.granDia.eyebrow": "EL GRAN D\u00CDA",
    "product.granDia.title": "Lugares, agenda y c\u00F3mo llegar \u2014 todo en un sitio.",
    "product.granDia.body":
      "Los invitados llegan sabiendo exactamente d\u00F3nde ir y a qu\u00E9 hora. Ceremonia, recepci\u00F3n, tiempos \u2014 presentado con claridad para que nadie se pierda. Los mapas abren directamente Google Maps.",
    "product.granDia.link": "Ver la agenda \u2197",

    "product.rsvp.eyebrow": "RSVP",
    "product.rsvp.title": "Confirmaciones sin esfuerzo.",
    "product.rsvp.body":
      "Un formulario RSVP cuidado recoge todo lo que necesitas \u2014 alergias, canciones, mensajes personales \u2014 sin idas y venidas. Las respuestas se recogen en tiempo real para que sepas siempre qui\u00E9n viene.",
    "product.rsvp.link": "Probar el RSVP \u2197",

    "product.aloja.eyebrow": "ALOJAMIENTO",
    "product.aloja.title": "Hoteles seleccionados, compartidos con mimo.",
    "product.aloja.body":
      "Cuida a tus invitados con una lista de alojamientos escogidos \u2014 con vuestro c\u00F3digo de descuento destacado para que reserven al instante. Tu asistente IA tambi\u00E9n responder\u00E1 preguntas de alojamiento en el chat.",
    "product.aloja.link": "Ver los alojamientos \u2197",

    "product.closing.title1": "\u00BFListos para crear",
    "product.closing.title2": "la vuestra?",
    "product.closing.sub":
      "Lo que acabas de ver puede ser vuestro \u2014 a medida, con vuestros nombres, fechas e historia. Empieza vuestro borrador en menos de cinco minutos.",
    "product.closing.primary": "Comienza Tu Historia",
    "product.closing.secondary": "Volver a la demo",
  },
};
