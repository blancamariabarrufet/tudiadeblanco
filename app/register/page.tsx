"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

import { Footer } from "@/components/Footer";
import { MobileNavLinks, Nav } from "@/components/Nav";
import { VellumOverlay } from "@/components/ui/VellumOverlay";
import { createClient } from "@/lib/supabase/client";
import { ALL_FEATURES, type Feature } from "@/lib/features";
import { useLanguage, type Locale } from "@/lib/i18n";
import {
  REGISTRATION_DESIGN_QUESTIONS,
  createEmptyRegistrationDesignAnswers,
  getRegistrationDesignOtherKey,
  hasRequiredRegistrationDesignAnswers,
  type MultiDesignQuestionId,
  type RegistrationDesignAnswers,
  type SingleDesignQuestionId,
} from "@/lib/register-design-questions";
import { buildSiteUrl } from "@/lib/site-url";

type PlanId = "heirloom" | "estate" | "legacy";
type RegisterStep = "details" | "design";

type PlanCopy = {
  id: PlanId;
  name: string;
  price: Record<Locale, string>;
  cadence: Record<Locale, string>;
  badge?: Record<Locale, string>;
  tagline: Record<Locale, string>;
  includes: Record<Locale, string[]>;
  features: Feature[];
};

const planFeaturesWithoutDomain: Feature[] = ALL_FEATURES.filter((feature) => feature !== "domain");

const planOptions: PlanCopy[] = [
  {
    id: "heirloom",
    name: "The Heirloom",
    price: { en: "$115", es: "95 €" },
    cadence: { en: "one-time", es: "pago unico" },
    tagline: {
      en: "A beautifully designed presence with everything guests need.",
      es: "Una presencia cuidadosamente diseñada con todo lo que necesitan los invitados.",
    },
    includes: {
      en: ["Wedding website", "Day-of timeline", "RSVP up to 150 guests", "The Invisible Host"],
      es: ["Web de boda", "Timeline del dia", "RSVP hasta 150 invitados", "The Invisible Host"],
    },
    features: ["guests", "chatbot", "news", "letters"],
  },
  {
    id: "estate",
    name: "The Estate",
    price: { en: "$150", es: "130 €" },
    cadence: { en: "one-time", es: "pago unico" },
    badge: { en: "Most popular", es: "Mas popular" },
    tagline: {
      en: "Full planning command: seating, budget, every detail managed.",
      es: "Control completo de la planificacion: mesas, presupuesto y cada detalle.",
    },
    includes: {
      en: ["Everything in The Heirloom", "Unlimited guests", "Seating planner", "Budget tracker"],
      es: ["Todo lo de The Heirloom", "Invitados ilimitados", "Plano de mesas", "Control de presupuesto"],
    },
    features: planFeaturesWithoutDomain,
  },
  {
    id: "legacy",
    name: "The Legacy",
    price: { en: "$200", es: "175 €" },
    cadence: { en: "one-time", es: "pago unico" },
    tagline: {
      en: "Every feature, every export, and a keepsake that outlasts the day.",
      es: "Todas las funciones, exportaciones y un recuerdo que dura mas alla del dia.",
    },
    includes: {
      en: ["Everything in The Estate", "Timeline builder", "Letters keepsake PDF", "Priority support"],
      es: ["Todo lo de The Estate", "Timeline del dia", "PDF recuerdo de cartas", "Soporte prioritario"],
    },
    features: planFeaturesWithoutDomain,
  },
];

const copy = {
  en: {
    eyebrow: "START YOUR STORY",
    title: "Tell us where the celebration begins.",
    subtitle:
      "Choose a plan, leave the essential details, and we will prepare the first version around your story.",
    googleMode: "Complete your Google registration",
    requestMode: "Create your wedding website request",
    username: "Username",
    usernamePlaceholder: "garcia_2026",
    partnerOne: "Your name",
    partnerOnePlaceholder: "Partner 1",
    partnerTwo: "Partner's name",
    partnerTwoPlaceholder: "Partner 2",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Repeat password",
    weddingDate: "Wedding date",
    ceremonyVenue: "Ceremony venue",
    ceremonyVenuePlaceholder: "Where will the ceremony take place?",
    receptionVenue: "Reception venue",
    receptionVenuePlaceholder: "Where will guests celebrate after?",
    guestCount: "Estimated guest count",
    guestCountPlaceholder: "120",
    physicalInvitations: "Will you need physical invitations?",
    physicalInvitationsYes: "Yes",
    physicalInvitationsNo: "No",
    optional: "optional",
    planLabel: "Choose your plan",
    planHint: "This replaces the old services checklist. You can refine details with us after the request.",
    detailsStep: "STEP 1 OF 2",
    designStep: "STEP 2 OF 2",
    designTitle: "Shape the first draft",
    designIntro:
      "These choices guide the look of the first version. If you are unsure, choose for me and we will curate it.",
    continue: "Continue to design questions",
    back: "Back to details",
    designRequiredError: "Answer each design question, or choose for me.",
    imageEmailHint:
      "To send us your images — hero or any others — email them to hello@thedigitalheirloom.com",
    selected: "Selected",
    submit: "Send request",
    sending: "Sending request...",
    google: "Register with Google",
    googleOpening: "Opening Google...",
    or: "or",
    signInPrompt: "Already have an account?",
    signIn: "Sign in",
    successTitle: "Request received",
    successBody:
      "We are reviewing your request. Once it is approved, you will be able to sign in and continue the setup.",
    successCta: "Back to sign in",
    requiredError: "Username and both names are required.",
    emailError: "Email is required.",
    passwordMatchError: "Passwords don't match.",
    passwordLengthError: "Password must be at least 8 characters.",
    googleAgainError: "Please continue with Google again before sending the request.",
    genericSubmitError: "Could not send the request.",
    hidePassword: "Hide password",
    showPassword: "Show password",
  },
  es: {
    eyebrow: "COMIENZA TU HISTORIA",
    title: "Cuéntanos dónde empieza la celebración.",
    subtitle:
      "Elige un plan, deja los detalles esenciales y prepararemos una primera versión alrededor de vuestra historia.",
    googleMode: "Completa tu registro con Google",
    requestMode: "Crea la solicitud de vuestra web",
    username: "Usuario",
    usernamePlaceholder: "garcia_2026",
    partnerOne: "Tu nombre",
    partnerOnePlaceholder: "Pareja 1",
    partnerTwo: "Nombre de tu pareja",
    partnerTwoPlaceholder: "Pareja 2",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    password: "Contraseña",
    passwordPlaceholder: "Minimo 8 caracteres",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Repite la contraseña",
    weddingDate: "Fecha de la boda",
    ceremonyVenue: "Lugar de la ceremonia",
    ceremonyVenuePlaceholder: "Donde sera la ceremonia?",
    receptionVenue: "Lugar de la celebracion",
    receptionVenuePlaceholder: "Donde lo celebrareis despues?",
    guestCount: "Numero estimado de invitados",
    guestCountPlaceholder: "120",
    physicalInvitations: "Necesitareis invitaciones fisicas?",
    physicalInvitationsYes: "Si",
    physicalInvitationsNo: "No",
    optional: "opcional",
    planLabel: "Elige vuestro plan",
    planHint: "Esto sustituye la antigua lista de servicios. Podremos ajustar los detalles despues de la solicitud.",
    detailsStep: "PASO 1 DE 2",
    designStep: "PASO 2 DE 2",
    designTitle: "Damos forma al primer borrador",
    designIntro:
      "Estas respuestas guian el aspecto de la primera version. Si no lo teneis claro, elegid por mi y lo curaremos nosotros.",
    continue: "Continuar a las preguntas de diseno",
    back: "Volver a los detalles",
    designRequiredError: "Responde cada pregunta de diseno, o elige que lo hagamos nosotros.",
    imageEmailHint:
      "Para enviarnos vuestras imagenes, hero o cualquier otra, mandadlas a hello@thedigitalheirloom.com",
    selected: "Seleccionado",
    submit: "Enviar solicitud",
    sending: "Enviando solicitud...",
    google: "Registrarse con Google",
    googleOpening: "Abriendo Google...",
    or: "o",
    signInPrompt: "¿Ya tienes una cuenta?",
    signIn: "Iniciar sesión",
    successTitle: "Solicitud recibida",
    successBody:
      "Estamos revisando tu solicitud. Cuando se apruebe, podras iniciar sesion y continuar la configuracion.",
    successCta: "Volver al login",
    requiredError: "El usuario y ambos nombres son obligatorios.",
    emailError: "El email es obligatorio.",
    passwordMatchError: "Las contraseñas no coinciden.",
    passwordLengthError: "La contraseña debe tener al menos 8 caracteres.",
    googleAgainError: "Continua con Google otra vez antes de enviar la solicitud.",
    genericSubmitError: "No se pudo enviar la solicitud.",
    hidePassword: "Ocultar contraseña",
    showPassword: "Mostrar contraseña",
  },
} satisfies Record<Locale, Record<string, string>>;

function normalizePlan(value: string | null): PlanId {
  return value === "heirloom" || value === "legacy" ? value : "estate";
}

function planFeatures(planId: PlanId) {
  return planOptions.find((plan) => plan.id === planId)?.features ?? planFeaturesWithoutDomain;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="register-page" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const text = copy[locale];
  const urlPlan = normalizePlan(searchParams.get("plan"));
  const googleMode = searchParams.get("google") === "1";

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(urlPlan);
  const [step, setStep] = useState<RegisterStep>("details");
  const [form, setForm] = useState({
    username: "",
    partner1: "",
    partner2: "",
    email: "",
    password: "",
    confirmPassword: "",
    weddingDate: "",
    ceremonyVenue: "",
    receptionVenue: "",
    guestCount: "",
    physicalInvitations: "false",
    language: locale,
  });
  const [designAnswers, setDesignAnswers] = useState<RegistrationDesignAnswers>(() =>
    createEmptyRegistrationDesignAnswers()
  );
  const [features, setFeatures] = useState<Feature[]>(planFeatures(urlPlan));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (!googleMode) return;

    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      if (email) {
        setForm((current) => ({
          ...current,
          email,
          username: current.username || email.split("@")[0],
        }));
      }
    });
  }, [googleMode, supabase]);

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function choosePlan(planId: PlanId) {
    setSelectedPlan(planId);
    setFeatures(planFeatures(planId));
  }

  function validateDetailsStep() {
    if (!form.username.trim() || !form.partner1.trim() || !form.partner2.trim()) {
      setError(text.requiredError);
      return false;
    }
    if (!googleMode && !form.email.trim()) {
      setError(text.emailError);
      return false;
    }
    if (!googleMode && form.password !== form.confirmPassword) {
      setError(text.passwordMatchError);
      return false;
    }
    if (!googleMode && form.password.length < 8) {
      setError(text.passwordLengthError);
      return false;
    }

    return true;
  }

  function moveToDesignStep() {
    setStep("design");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function updateSingleDesignAnswer(questionId: SingleDesignQuestionId, value: string) {
    const otherKey = getRegistrationDesignOtherKey(questionId);
    setDesignAnswers((current) => ({
      ...current,
      [questionId]: value,
      [otherKey]: value === "other" ? current[otherKey] : "",
    }));
  }

  function updateMultiDesignAnswer(questionId: MultiDesignQuestionId, value: string) {
    const otherKey = getRegistrationDesignOtherKey(questionId);
    setDesignAnswers((current) => {
      const exists = current[questionId].includes(value);
      let next = exists ? current[questionId].filter((item) => item !== value) : [...current[questionId], value];

      if (questionId === "hiddenSections") {
        next = value === "nothing_to_hide" && !exists
          ? ["nothing_to_hide"]
          : next.filter((item) => item !== "nothing_to_hide");
      }

      return {
        ...current,
        [questionId]: next,
        [otherKey]: next.includes("other") ? current[otherKey] : "",
      };
    });
  }

  function updateDesignOther(questionId: SingleDesignQuestionId | MultiDesignQuestionId, value: string) {
    const otherKey = getRegistrationDesignOtherKey(questionId);
    setDesignAnswers((current) => ({ ...current, [otherKey]: value }));
  }

  async function startGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildSiteUrl(`/auth/callback?mode=register&lang=${locale}&plan=${selectedPlan}`),
      },
    });
    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateDetailsStep()) {
      return;
    }

    if (step === "details") {
      moveToDesignStep();
      return;
    }

    if (!hasRequiredRegistrationDesignAnswers(designAnswers)) {
      setError(text.designRequiredError);
      return;
    }

    setLoading(true);

    let googleAccessToken: string | undefined;
    if (googleMode) {
      const { data } = await supabase.auth.getSession();
      googleAccessToken = data.session?.access_token;
      if (!googleAccessToken) {
        setError(text.googleAgainError);
        setLoading(false);
        return;
      }
    }

    const payload = {
      mode: googleMode ? "google" : "password",
      username: form.username,
      email: form.email,
      password: form.password,
      partnerOne: form.partner1,
      partnerTwo: form.partner2,
      weddingDate: form.weddingDate,
      ceremonyVenue: form.ceremonyVenue,
      receptionVenue: form.receptionVenue,
      guestCount: form.guestCount,
      physicalInvitations: form.physicalInvitations === "true",
      language: locale,
      features,
      selectedPlan,
      designAnswers,
      googleAccessToken,
    };
    try {
      const response = await fetch("/api/panel-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || "error" in result) {
        setError(result.error ?? text.genericSubmitError);
        return;
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.genericSubmitError);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="register-page">
        <div className="register-success">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.successTitle}</h1>
          <p>{text.successBody}</p>
          <button type="button" onClick={() => router.push(`/login?lang=${locale}`)} className="btn-primary">
            {text.successCta}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="register-page">
      <Nav
        onOpenOrder={() => router.push(`/register?plan=${selectedPlan}&lang=${locale}`)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <section className="register-shell" aria-labelledby="register-title">
        <div className="register-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1 id="register-title">{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="register-panel" noValidate>
          <div className="register-panel__heading">
            <span>{step === "details" ? (googleMode ? text.googleMode : text.requestMode) : text.designStep}</span>
          </div>

          {step === "details" ? (
            <>
              <div className="register-step-kicker">{text.detailsStep}</div>
              <div className="register-form-grid">
              <label className="soft-field">
                  <span className="soft-label">{text.username}</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    placeholder={text.usernamePlaceholder}
                    autoComplete="username"
                    required
                  />
              </label>

                <div className="register-two-col">
                  <label className="soft-field">
                    <span className="soft-label">{text.partnerOne}</span>
                    <input
                      type="text"
                      value={form.partner1}
                      onChange={(e) => update("partner1", e.target.value)}
                      placeholder={text.partnerOnePlaceholder}
                      required
                    />
                  </label>
                  <label className="soft-field">
                    <span className="soft-label">{text.partnerTwo}</span>
                    <input
                      type="text"
                      value={form.partner2}
                      onChange={(e) => update("partner2", e.target.value)}
                      placeholder={text.partnerTwoPlaceholder}
                      required
                    />
                  </label>
                </div>

                <label className="soft-field">
                  <span className="soft-label">{text.email}</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder={text.emailPlaceholder}
                    disabled={googleMode}
                    required
                  />
                </label>

                {!googleMode && (
                  <div className="register-two-col">
                    <label className="soft-field">
                      <span className="soft-label">{text.password}</span>
                      <span className="register-password-field">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          placeholder={text.passwordPlaceholder}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? text.hidePassword : text.showPassword}
                        >
                          {showPassword ? (
                            <EyeOff size={16} strokeWidth={1.5} />
                          ) : (
                            <Eye size={16} strokeWidth={1.5} />
                          )}
                        </button>
                      </span>
                    </label>

                    <label className="soft-field">
                      <span className="soft-label">{text.confirmPassword}</span>
                      <span className="register-password-field">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) => update("confirmPassword", e.target.value)}
                          placeholder={text.confirmPasswordPlaceholder}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          aria-label={showConfirmPassword ? text.hidePassword : text.showPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} strokeWidth={1.5} />
                          ) : (
                            <Eye size={16} strokeWidth={1.5} />
                          )}
                        </button>
                      </span>
                    </label>
                  </div>
                )}

                <label className="soft-field">
                  <span className="soft-label">
                    {text.weddingDate} <em>{text.optional}</em>
                  </span>
                  <input
                    type="date"
                    value={form.weddingDate}
                    onChange={(e) => update("weddingDate", e.target.value)}
                  />
                </label>

                <div className="register-two-col">
                  <label className="soft-field">
                    <span className="soft-label">
                      {text.ceremonyVenue} <em>{text.optional}</em>
                    </span>
                    <input
                      type="text"
                      value={form.ceremonyVenue}
                      onChange={(e) => update("ceremonyVenue", e.target.value)}
                      placeholder={text.ceremonyVenuePlaceholder}
                    />
                  </label>
                  <label className="soft-field">
                    <span className="soft-label">
                      {text.receptionVenue} <em>{text.optional}</em>
                    </span>
                    <input
                      type="text"
                      value={form.receptionVenue}
                      onChange={(e) => update("receptionVenue", e.target.value)}
                      placeholder={text.receptionVenuePlaceholder}
                    />
                  </label>
                </div>

                <div className="register-two-col">
                  <label className="soft-field">
                    <span className="soft-label">
                      {text.guestCount} <em>{text.optional}</em>
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={form.guestCount}
                      onChange={(e) => update("guestCount", e.target.value)}
                      placeholder={text.guestCountPlaceholder}
                    />
                  </label>
                  <fieldset className="register-inline-choice">
                    <legend className="soft-label">{text.physicalInvitations}</legend>
                    <div>
                      <button
                        type="button"
                        className={`register-choice-chip${form.physicalInvitations === "true" ? " is-selected" : ""}`}
                        aria-pressed={form.physicalInvitations === "true"}
                        onClick={() => update("physicalInvitations", "true")}
                      >
                        {form.physicalInvitations === "true" ? <Check size={13} strokeWidth={2.3} /> : null}
                        {text.physicalInvitationsYes}
                      </button>
                      <button
                        type="button"
                        className={`register-choice-chip${form.physicalInvitations === "false" ? " is-selected" : ""}`}
                        aria-pressed={form.physicalInvitations === "false"}
                        onClick={() => update("physicalInvitations", "false")}
                      >
                        {form.physicalInvitations === "false" ? <Check size={13} strokeWidth={2.3} /> : null}
                        {text.physicalInvitationsNo}
                      </button>
                    </div>
                  </fieldset>
                </div>
              </div>

              <section className="register-plan-section" aria-labelledby="register-plan-title">
                <div>
                  <h2 id="register-plan-title">{text.planLabel}</h2>
                  <p>{text.planHint}</p>
                </div>
                <div className="register-plan-grid">
                  {planOptions.map((plan) => {
                    const selected = selectedPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => choosePlan(plan.id)}
                        className={`register-plan-card${selected ? " is-selected" : ""}`}
                        aria-pressed={selected}
                      >
                        {plan.badge ? <span className="register-plan-card__badge">{plan.badge[locale]}</span> : null}
                        <span className="register-plan-card__top">
                          <strong>{plan.name}</strong>
                          {selected ? (
                            <span className="register-plan-card__selected">
                              <Check size={13} strokeWidth={2.3} />
                              {text.selected}
                            </span>
                          ) : null}
                        </span>
                        <span className="register-plan-card__price">
                          {plan.price[locale]} <small>{plan.cadence[locale]}</small>
                        </span>
                        <span className="register-plan-card__tagline">{plan.tagline[locale]}</span>
                        <span className="register-plan-card__list">
                          {plan.includes[locale].map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <section className="register-design-step" aria-labelledby="register-design-title">
              <div className="register-design-intro">
                <p className="soft-label">{text.designStep}</p>
                <h2 id="register-design-title">{text.designTitle}</h2>
                <p>{text.designIntro}</p>
              </div>

              <div className="register-question-list">
                {REGISTRATION_DESIGN_QUESTIONS.map((question, index) => {
                  const otherKey = getRegistrationDesignOtherKey(question.id);
                  const showOther = question.kind === "single"
                    ? designAnswers[question.id] === "other"
                    : designAnswers[question.id].includes("other");

                  return (
                    <fieldset key={question.id} className="register-question">
                      <legend>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {question.label[locale]}
                      </legend>

                      <div className="register-choice-row" role={question.kind === "single" ? "radiogroup" : "group"}>
                        {question.options.map((option) => {
                          const selected = question.kind === "single"
                            ? designAnswers[question.id] === option.value
                            : designAnswers[question.id].includes(option.value);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`register-choice-chip${selected ? " is-selected" : ""}`}
                              role={question.kind === "single" ? "radio" : undefined}
                              aria-checked={question.kind === "single" ? selected : undefined}
                              aria-pressed={question.kind === "multi" ? selected : undefined}
                              onClick={() => {
                                if (question.kind === "single") {
                                  updateSingleDesignAnswer(question.id, option.value);
                                } else {
                                  updateMultiDesignAnswer(question.id, option.value);
                                }
                              }}
                            >
                              {selected ? <Check size={13} strokeWidth={2.3} /> : null}
                              {option.label[locale]}
                            </button>
                          );
                        })}
                      </div>

                      {showOther ? (
                        <label className="soft-field register-other-field">
                          <span className="soft-label">{question.options.at(-1)?.label[locale]}</span>
                          <input
                            type="text"
                            value={String(designAnswers[otherKey])}
                            onChange={(event) => updateDesignOther(question.id, event.target.value)}
                            placeholder={question.otherPlaceholder[locale]}
                          />
                        </label>
                      ) : null}

                      {question.id === "heroImage" ? (
                        <p className="register-image-hint">{text.imageEmailHint}</p>
                      ) : null}
                    </fieldset>
                  );
                })}
              </div>
            </section>
          )}

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <div className="register-actions">
            {step === "design" ? (
              <button type="button" className="register-back" onClick={() => setStep("details")}>
                {text.back}
              </button>
            ) : null}
            <button type="submit" disabled={loading} className="btn-primary register-submit disabled:opacity-50">
              {step === "details" ? text.continue : loading ? text.sending : text.submit}
            </button>
          </div>

          {!googleMode && step === "details" && (
            <div className="register-google">
              <div>
                <span />
                <small>{text.or}</small>
                <span />
              </div>
              <button type="button" onClick={startGoogle} disabled={googleLoading}>
                {googleLoading ? text.googleOpening : text.google}
              </button>
            </div>
          )}

          <p className="register-login">
            {text.signInPrompt}{" "}
            <Link href={`/login?lang=${locale}`}>{text.signIn}</Link>
          </p>
        </form>
      </section>

      <Footer />

      <VellumOverlay
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        align="top"
        panelClassName="mt-16 w-full max-w-xl rounded-[calc(var(--radius-lg)+0.4rem)] bg-[color:var(--surface)] p-0"
      >
        <MobileNavLinks
          onNavigate={() => setMobileNavOpen(false)}
          onOpenOrder={() => router.push(`/register?plan=${selectedPlan}&lang=${locale}`)}
        />
      </VellumOverlay>
    </main>
  );
}
