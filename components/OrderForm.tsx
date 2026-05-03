"use client";

import type { ReactNode } from "react";
import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { VellumOverlay } from "@/components/ui/VellumOverlay";
import { CheckIcon, ChevronLeftIcon } from "@/components/ui/icons";

type OrderFormProps = {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
};

type FormState = {
  partnerOne: string;
  partnerTwo: string;
  date: string;
  ceremonyVenue: string;
  receptionVenue: string;
  guestCount: number;
  features: string[];
  physicalInvitations: boolean | null;
  invitationStyle: string;
  overallVibe: string;
  colorPalette: string;
  primaryTypography: string;
  secondaryTypography: string;
  textTypography: string;
  email: string;
};

const featureCards = [
  "AI Assistant Chatbot",
  "Guest RSVP Management",
  "Seating & Table Planner",
  "Dietary & Accessibility Tracker",
  "Budget Manager",
  "News & Updates Feed",
  "Letters to the Couple",
  "Travel & Accommodation Guide",
];

const DECIDE_FOR_ME = "Decide for me";
const MAX_INSPIRATION_IMAGES = 6;

const vibeOptions = [
  {
    value: "Editorial Minimal",
    sample:
      "bg-[linear-gradient(135deg,#faf9f6_0%,#ffffff_50%,#d8d1c7_100%)]",
  },
  {
    value: "Romantic Garden",
    sample:
      "bg-[linear-gradient(135deg,#f9f0ed_0%,#e9d5ca_48%,#9f7f73_100%)]",
  },
  {
    value: "Mediterranean Weekend",
    sample:
      "bg-[linear-gradient(135deg,#fff8ee_0%,#d8e0d2_45%,#6f897f_100%)]",
  },
  {
    value: "Black Tie Evening",
    sample:
      "bg-[linear-gradient(135deg,#f8f4ec_0%,#2a2824_58%,#0e0e0c_100%)]",
  },
  {
    value: "Old Money Villa",
    sample:
      "bg-[linear-gradient(135deg,#f3eee5_0%,#c9bda8_45%,#71634f_100%)]",
  },
  {
    value: "Playful Aperitivo",
    sample:
      "bg-[linear-gradient(135deg,#fff2da_0%,#f5a66d_45%,#c65343_100%)]",
  },
  {
    value: "Soft Modern Romance",
    sample:
      "bg-[linear-gradient(135deg,#fff7f8_0%,#eecdd8_48%,#a77b86_100%)]",
  },
  {
    value: "Rustic Countryside",
    sample:
      "bg-[linear-gradient(135deg,#fbf4e8_0%,#c4a978_50%,#6d563a_100%)]",
  },
];

const paletteOptions = [
  {
    value: "Warm neutrals",
    colors: ["#faf9f6", "#efd9c8", "#c9b8a6", "#6c5b4e"],
  },
  {
    value: "Olive garden",
    colors: ["#f6f1e8", "#d9d8bf", "#8a9a74", "#4d5a43"],
  },
  {
    value: "Coastal soft blue",
    colors: ["#f8f6f1", "#d9e4e8", "#8fb0ba", "#415866"],
  },
  {
    value: "Wine and ivory",
    colors: ["#fffaf3", "#dec5ba", "#8b4c57", "#3b2428"],
  },
  {
    value: "Blush and sage",
    colors: ["#fff7f5", "#f1d6d0", "#b8c2a5", "#66745b"],
  },
  {
    value: "Terracotta sunset",
    colors: ["#fff0df", "#e7a16f", "#b85f44", "#5f3429"],
  },
  {
    value: "Stone and charcoal",
    colors: ["#f7f6f2", "#d8d4cb", "#8a8580", "#282725"],
  },
  {
    value: "Champagne and gold",
    colors: ["#fff9ed", "#ead8ad", "#c5a35c", "#6f5427"],
  },
];

const typographyOptions = [
  {
    value: "Script names + serif body",
    eyebrow: "01 — SCRIPT",
    title: "Sarah & James",
    body: "June 14th, 2025 · Tuscany",
    meta: "Great Vibes + Cormorant",
    tag: "Romantic",
    titleClass:
      "font-[family-name:var(--font-newsreader)] italic text-[1.05rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Cormorant serif + soft italic",
    eyebrow: "02 — SERIF",
    title: "Together Forever",
    body: "You are invited to celebrate the union of two souls",
    meta: "Cormorant Garamond",
    tag: "Elegant",
    titleClass: "font-[family-name:var(--font-newsreader)] text-[1.05rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Playfair display pairing",
    eyebrow: "03 — DISPLAY SERIF",
    title: "The Wedding of",
    body: "Emily & William",
    meta: "Playfair Display",
    tag: "Timeless",
    titleClass: "font-[family-name:var(--font-newsreader)] text-[1.05rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Formal script invitation",
    eyebrow: "04 — FORMAL SCRIPT",
    title: "With joy in our hearts",
    body: "we invite you to join us",
    meta: "Petit Formal Script",
    tag: "Intimate",
    titleClass:
      "font-[family-name:var(--font-newsreader)] italic text-[1rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Cinzel structure + serif prose",
    eyebrow: "05 — CLASSICAL ROMAN",
    title: "FOREVER BEGINS TODAY",
    body: "AUGUST · MMXXV · SANTORINI",
    meta: "Cinzel + Cormorant",
    tag: "Majestic",
    titleClass:
      "font-[family-name:var(--font-newsreader)] text-[0.82rem] uppercase tracking-[0.08em]",
    bodyClass:
      "font-[family-name:var(--font-work-sans)] text-[0.62rem] uppercase tracking-[0.16em]",
  },
  {
    value: "Book serif literary",
    eyebrow: "06 — BOOK SERIF",
    title: "A love story, continued.",
    body: "Please join us as we begin the next chapter of our lives together.",
    meta: "Libre Baskerville",
    tag: "Literary",
    titleClass: "font-[family-name:var(--font-newsreader)] text-[1rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Old style heritage",
    eyebrow: "07 — OLD STYLE",
    title: "Amor vincit omnia",
    body: "Love conquers all — join us in celebrating",
    meta: "EB Garamond",
    tag: "Heritage",
    titleClass: "font-[family-name:var(--font-newsreader)] text-[1.05rem]",
    bodyClass: "font-[family-name:var(--font-newsreader)] italic text-[0.72rem]",
  },
  {
    value: "Geometric sans modern",
    eyebrow: "08 — GEOMETRIC SANS",
    title: "CLAIRE & NOAH",
    body: "SATURDAY, THE FIFTH OF OCTOBER · PARIS",
    meta: "Josefin Sans",
    tag: "Modern",
    titleClass:
      "font-[family-name:var(--font-work-sans)] text-[0.88rem] uppercase tracking-[0.14em]",
    bodyClass:
      "font-[family-name:var(--font-work-sans)] text-[0.6rem] uppercase tracking-[0.16em]",
  },
];

const initialState: FormState = {
  partnerOne: "",
  partnerTwo: "",
  date: "",
  ceremonyVenue: "",
  receptionVenue: "",
  guestCount: 120,
  features: [],
  physicalInvitations: null,
  invitationStyle: "",
  overallVibe: "",
  colorPalette: "",
  primaryTypography: "",
  secondaryTypography: "",
  textTypography: "",
  email: "",
};

function ProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-3 font-[family-name:var(--font-work-sans)] text-sm text-[color:var(--primary)]">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <span key={index} aria-hidden="true" className="leading-none">
          {index + 1 === currentStep ? "●" : "·"}
        </span>
      ))}
    </div>
  );
}

export function OrderForm({ isOpen, onClose, initialStep = 1 }: OrderFormProps) {
  const { locale, t } = useLanguage();
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [inspirationImages, setInspirationImages] = useState<File[]>([]);

  const totalSteps = 11;
  const names = useMemo(
    () =>
      [form.partnerOne, form.partnerTwo].filter(Boolean).join(" & ") ||
      t("order.names"),
    [form.partnerOne, form.partnerTwo, t],
  );

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleFeature(feature: string) {
    setForm((current) => {
      const has = current.features.includes(feature);
      return {
        ...current,
        features: has
          ? current.features.filter((f) => f !== feature)
          : [...current.features, feature],
      };
    });
  }

  function toggleTypography(value: string) {
    setForm((current) => {
      const currentSelections = [
        current.primaryTypography,
        current.secondaryTypography,
        current.textTypography,
      ].filter((selection) => selection && selection !== DECIDE_FOR_ME);
      const isSelected = currentSelections.includes(value);
      const nextSelections = isSelected
        ? currentSelections.filter((selection) => selection !== value)
        : currentSelections.length < 3
          ? [...currentSelections, value]
          : currentSelections;
      const [primaryTypography = "", secondaryTypography = "", textTypography = ""] =
        nextSelections;

      return {
        ...current,
        primaryTypography,
        secondaryTypography,
        textTypography,
      };
    });
  }

  function decideTypographyForMe() {
    setForm((current) => ({
      ...current,
      primaryTypography: DECIDE_FOR_ME,
      secondaryTypography: DECIDE_FOR_ME,
      textTypography: DECIDE_FOR_ME,
    }));
  }

  function decideFieldForMe(field: "overallVibe" | "colorPalette") {
    update(field, DECIDE_FOR_ME);
  }

  function addInspirationImages(files: FileList | null) {
    if (!files) {
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    setInspirationImages((current) =>
      [...current, ...imageFiles].slice(0, MAX_INSPIRATION_IMAGES),
    );
  }

  function removeInspirationImage(fileIndex: number) {
    setInspirationImages((current) =>
      current.filter((_, index) => index !== fileIndex),
    );
  }

  function nextStep() {
    setStep((s) => Math.min(totalSteps, s + 1));
  }
  function previousStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  const selectedTypography = [
    form.primaryTypography,
    form.secondaryTypography,
    form.textTypography,
  ].filter((selection) => selection && selection !== DECIDE_FOR_ME);
  const typographyDecidedForMe =
    form.primaryTypography === DECIDE_FOR_ME &&
    form.secondaryTypography === DECIDE_FOR_ME &&
    form.textTypography === DECIDE_FOR_ME;

  async function submitForm() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const payload = new FormData();

      payload.append("partnerOne", form.partnerOne);
      payload.append("partnerTwo", form.partnerTwo);
      payload.append("date", form.date);
      payload.append("ceremonyVenue", form.ceremonyVenue);
      payload.append("receptionVenue", form.receptionVenue);
      payload.append("guestCount", String(form.guestCount));
      payload.append("features", JSON.stringify(form.features));
      payload.append("physicalInvitations", String(form.physicalInvitations));
      payload.append("invitationStyle", form.invitationStyle);
      payload.append("overallVibe", form.overallVibe);
      payload.append("colorPalette", form.colorPalette);
      payload.append("primaryTypography", form.primaryTypography);
      payload.append("secondaryTypography", form.secondaryTypography);
      payload.append("textTypography", form.textTypography);
      payload.append("email", form.email);
      payload.append("locale", locale);
      payload.append("coupleName", names);
      inspirationImages.forEach((file) => {
        payload.append("images", file);
      });

      const response = await fetch("/api/solicitation-data", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }
    } catch {
      setSaveError(t("order.saveError"));
      setIsSaving(false);
      return;
    }

    setSubmitted(true);
    setIsSaving(false);
  }

  function handleEnterKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }

    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      return;
    }

    if (
      target instanceof HTMLButtonElement &&
      target.dataset.enterContinue !== "true"
    ) {
      return;
    }

    if (step < totalSteps && !canContinue) {
      return;
    }

    event.preventDefault();

    if (step < totalSteps) {
      nextStep();
      return;
    }

    void submitForm();
  }

  const canContinue =
    step === 1
      ? Boolean(form.partnerOne && form.partnerTwo)
      : step === 2
        ? Boolean(form.date)
        : step === 3
          ? Boolean(form.ceremonyVenue)
          : step === 4
            ? Boolean(form.receptionVenue)
      : step === 6
        ? form.features.length > 0
        : step === 7
          ? Boolean(
              form.overallVibe &&
                form.colorPalette &&
                (typographyDecidedForMe || selectedTypography.length > 0),
            )
          : step === 8
            ? true
            : step === 9
              ? form.physicalInvitations !== null
              : step === 10
                ? Boolean(form.email.trim())
                : true;

  return (
    <VellumOverlay
      isOpen={isOpen}
      onClose={onClose}
      align="top"
      panelClassName="mx-auto mt-0 w-full max-w-7xl rounded-[calc(var(--radius-lg)+0.75rem)] bg-transparent p-0 shadow-none"
    >
      <div className="rounded-[calc(var(--radius-lg)+0.75rem)] bg-[rgba(255,255,255,0.48)] p-3 shadow-[var(--shadow-ambient)] backdrop-blur-sm sm:p-4">
        <div className="min-h-[min(860px,90vh)] rounded-[calc(var(--radius-lg)+0.4rem)] bg-[color:var(--surface)] px-5 pb-8 pt-3 sm:px-8 sm:pb-10">
          <ProgressDots currentStep={submitted ? totalSteps : step} totalSteps={totalSteps} />

          {submitted ? (
            <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--secondary-container)] px-4 py-2 font-[family-name:var(--font-work-sans)] text-sm text-[color:var(--on-surface)]">
                <span>{t("order.received")}</span>
                <CheckIcon className="h-4 w-4" />
              </div>
              <h2 className="mt-6 font-[family-name:var(--font-newsreader)] text-[clamp(2.2rem,5vw,3.6rem)] leading-tight text-[color:var(--on-surface)]">
                {t("order.confirmTitle")}
              </h2>
              <p className="mt-4 max-w-xl font-[family-name:var(--font-newsreader)] text-lg leading-8 text-[color:var(--on-surface)]">
                {t("order.confirmBody")}
              </p>
              <Button onClick={onClose} className="mt-8 px-8 py-3">
                {t("order.close")}
              </Button>
            </div>
          ) : (
            <div
              className="mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-between gap-8 pt-8"
              onKeyDown={handleEnterKey}
            >
              <div className="order-form-step animate-[fadeIn_.3s_ease]">
                {step === 1 && (
                  <StepShell title={t("order.step1")}>
                    <div className="grid gap-8 md:grid-cols-2">
                      <label className="soft-field">
                        <span className="soft-label">{t("order.partner1")}</span>
                        <input
                          value={form.partnerOne}
                          onChange={(e) => update("partnerOne", e.target.value)}
                          placeholder="Sara"
                        />
                      </label>
                      <label className="soft-field">
                        <span className="soft-label">{t("order.partner2")}</span>
                        <input
                          value={form.partnerTwo}
                          onChange={(e) => update("partnerTwo", e.target.value)}
                          placeholder="James"
                        />
                      </label>
                    </div>
                  </StepShell>
                )}

                {step === 2 && (
                  <StepShell title={t("order.step2")}>
                    <label className="soft-field">
                      <span className="soft-label">{t("order.dateLabel")}</span>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => update("date", e.target.value)}
                      />
                    </label>
                  </StepShell>
                )}

                {step === 3 && (
                  <StepShell title={t("order.step3")}>
                    <label className="soft-field">
                      <span className="soft-label">{t("order.ceremonyLabel")}</span>
                      <input
                        value={form.ceremonyVenue}
                        onChange={(e) => update("ceremonyVenue", e.target.value)}
                        placeholder="Santa Maria del Mar"
                      />
                    </label>
                  </StepShell>
                )}

                {step === 4 && (
                  <StepShell title={t("order.step4")}>
                    <label className="soft-field">
                      <span className="soft-label">{t("order.receptionLabel")}</span>
                      <input
                        value={form.receptionVenue}
                        onChange={(e) => update("receptionVenue", e.target.value)}
                        placeholder="Mas Torroella"
                      />
                    </label>
                  </StepShell>
                )}

                {step === 5 && (
                  <StepShell title={t("order.step5")}>
                    <div className="space-y-8">
                      <p className="font-[family-name:var(--font-newsreader)] text-7xl leading-none text-[color:var(--on-surface)]">
                        {form.guestCount}
                      </p>
                      <input
                        type="range"
                        min={10}
                        max={500}
                        value={form.guestCount}
                        onChange={(e) => update("guestCount", Number(e.target.value))}
                        className="w-full accent-[color:var(--primary)]"
                      />
                    </div>
                  </StepShell>
                )}

                {step === 6 && (
                  <StepShell title={t("order.step6")}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {featureCards.map((feature) => {
                        const selected = form.features.includes(feature);
                        return (
                          <button
                            key={feature}
                            type="button"
                            data-enter-continue="true"
                            onClick={() => toggleFeature(feature)}
                            className={`rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-5 text-left shadow-[var(--shadow-ambient)] transition-all ${selected ? "border-[1.5px] border-[color:var(--primary)] bg-[rgba(239,217,200,0.2)]" : "border border-transparent"}`}
                          >
                            <p className="font-[family-name:var(--font-newsreader)] text-lg text-[color:var(--on-surface)]">
                              {feature}
                            </p>
                            <p className="mt-2 font-[family-name:var(--font-work-sans)] text-xs leading-5 text-[rgba(26,28,26,0.6)]">
                              {t("order.featureHint")}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </StepShell>
                )}

                {step === 7 && (
                  <StepShell title={t("order.step7")}>
                    <div className="max-h-[min(54vh,34rem)] space-y-9 overflow-y-auto pr-1">
                      <AestheticSection title={t("order.vibeQuestion")}>
                        <DecideForMeButton
                          label={t("order.decideTypography")}
                          active={form.overallVibe === DECIDE_FOR_ME}
                          onClick={() => decideFieldForMe("overallVibe")}
                        />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {vibeOptions.map((option) => (
                            <SelectionCard
                              key={option.value}
                              muted={form.overallVibe === DECIDE_FOR_ME}
                              selected={
                                form.overallVibe !== DECIDE_FOR_ME &&
                                form.overallVibe === option.value
                              }
                              onClick={() => update("overallVibe", option.value)}
                            >
                              <div
                                className={`h-20 rounded-[var(--radius-md)] ${option.sample}`}
                              />
                              <p className="mt-3 font-[family-name:var(--font-newsreader)] text-[1rem] leading-snug text-[color:var(--on-surface)]">
                                {option.value}
                              </p>
                            </SelectionCard>
                          ))}
                        </div>
                        <CustomSelectionField
                          label={t("order.customSelection")}
                          value={form.overallVibe}
                          onChange={(value) => update("overallVibe", value)}
                          placeholder={t("order.customVibePlaceholder")}
                        />
                      </AestheticSection>

                      <AestheticSection title={t("order.paletteQuestion")}>
                        <DecideForMeButton
                          label={t("order.decideTypography")}
                          active={form.colorPalette === DECIDE_FOR_ME}
                          onClick={() => decideFieldForMe("colorPalette")}
                        />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {paletteOptions.map((option) => (
                            <SelectionCard
                              key={option.value}
                              muted={form.colorPalette === DECIDE_FOR_ME}
                              selected={
                                form.colorPalette !== DECIDE_FOR_ME &&
                                form.colorPalette === option.value
                              }
                              onClick={() => update("colorPalette", option.value)}
                            >
                              <div className="flex h-16 overflow-hidden rounded-[var(--radius-md)]">
                                {option.colors.map((color) => (
                                  <span
                                    key={color}
                                    className="flex-1"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <p className="mt-3 font-[family-name:var(--font-newsreader)] text-[1rem] leading-snug text-[color:var(--on-surface)]">
                                {option.value}
                              </p>
                            </SelectionCard>
                          ))}
                        </div>
                        <CustomSelectionField
                          label={t("order.customSelection")}
                          value={form.colorPalette}
                          onChange={(value) => update("colorPalette", value)}
                          placeholder={t("order.customPalettePlaceholder")}
                        />
                      </AestheticSection>

                      <AestheticSection title={t("order.typographyQuestion")}>
                        <div className="rounded-[var(--radius-md)] bg-[rgba(239,217,200,0.24)] px-4 py-3 font-[family-name:var(--font-newsreader)] text-[0.95rem] leading-6 text-[rgba(26,28,26,0.72)]">
                          {t("order.typographyGuide")}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <DecideForMeButton
                            label={t("order.decideTypography")}
                            active={typographyDecidedForMe}
                            onClick={decideTypographyForMe}
                            className="mb-0"
                          />
                          <p className="font-[family-name:var(--font-work-sans)] text-xs leading-5 text-[rgba(26,28,26,0.58)]">
                            {t("order.typographyLimit")}
                          </p>
                        </div>
                        <TypographySelectionGrid
                          selectedValues={selectedTypography}
                          muted={typographyDecidedForMe}
                          onToggle={toggleTypography}
                        />
                      </AestheticSection>
                    </div>
                  </StepShell>
                )}

                {step === 8 && (
                  <StepShell title={t("order.step8")}>
                    <div className="rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-6 shadow-[var(--shadow-ambient)]">
                      <label className="block">
                        <span className="soft-label">{t("order.imagesLabel")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => addInspirationImages(event.target.files)}
                          className="mt-3 block w-full font-[family-name:var(--font-work-sans)] text-sm text-[rgba(26,28,26,0.7)] file:mr-4 file:rounded-[var(--radius-full)] file:border-0 file:bg-[color:var(--primary)] file:px-5 file:py-2.5 file:font-[family-name:var(--font-work-sans)] file:text-sm file:text-[color:var(--surface-container-lowest)]"
                        />
                      </label>
                      <p className="mt-3 font-[family-name:var(--font-work-sans)] text-xs leading-5 text-[rgba(26,28,26,0.58)]">
                        {t("order.imagesHint")}
                      </p>

                      {inspirationImages.length > 0 && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {inspirationImages.map((file, index) => (
                            <div
                              key={`${file.name}-${file.lastModified}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(204,198,188,0.75)] bg-[rgba(255,255,255,0.62)] px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-[family-name:var(--font-newsreader)] text-base text-[color:var(--on-surface)]">
                                  {file.name}
                                </p>
                                <p className="font-[family-name:var(--font-work-sans)] text-xs text-[rgba(26,28,26,0.54)]">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                data-enter-continue="true"
                                onClick={() => removeInspirationImage(index)}
                                className="shrink-0 rounded-[var(--radius-full)] px-3 py-1 font-[family-name:var(--font-work-sans)] text-xs text-[color:var(--primary)] hover:bg-[color:var(--primary-container)]"
                              >
                                {t("order.removeImage")}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </StepShell>
                )}

                {step === 9 && (
                  <StepShell title={t("order.step9")}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: t("order.yesPlease"), value: true },
                        { label: t("order.digitalOnly"), value: false },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          data-enter-continue="true"
                          onClick={() => update("physicalInvitations", opt.value)}
                          className={`rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-6 text-left shadow-[var(--shadow-ambient)] ${form.physicalInvitations === opt.value ? "border-[1.5px] border-[color:var(--primary)] bg-[rgba(239,217,200,0.2)]" : "border border-transparent"}`}
                        >
                          <p className="font-[family-name:var(--font-newsreader)] text-2xl text-[color:var(--on-surface)]">
                            {opt.label}
                          </p>
                        </button>
                      ))}
                    </div>

                    {form.physicalInvitations !== null && (
                      <p className="mt-6 font-[family-name:var(--font-work-sans)] text-sm leading-6 text-[rgba(26,28,26,0.66)]">
                        {form.physicalInvitations
                          ? t("order.paperInvitationHint")
                          : t("order.digitalInvitationHint")}
                      </p>
                    )}
                  </StepShell>
                )}

                {step === 10 && (
                  <StepShell title={t("order.step10")}>
                    <label className="soft-field">
                      <span className="soft-label">{t("order.emailLabel")}</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="hello@example.com"
                      />
                    </label>
                    <p className="mt-4 font-[family-name:var(--font-work-sans)] text-sm italic text-[rgba(26,28,26,0.6)]">
                      {t("order.emailHint")}
                    </p>
                  </StepShell>
                )}

                {step === 11 && (
                  <StepShell title={t("order.step11")}>
                    <div className="max-h-[min(54vh,34rem)] overflow-y-auto rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-6 shadow-[var(--shadow-ambient)]">
                      <SummaryRow label={t("order.names")} value={names} />
                      <SummaryRow
                        label={t("order.weddingDate")}
                        value={form.date || t("order.notProvided")}
                      />
                      <SummaryRow
                        label={t("order.ceremonyVenue")}
                        value={form.ceremonyVenue || t("order.notProvided")}
                      />
                      <SummaryRow
                        label={t("order.receptionVenue")}
                        value={form.receptionVenue || t("order.notProvided")}
                      />
                      <SummaryRow
                        label={t("order.guestCount")}
                        value={`${form.guestCount}`}
                      />
                      <SummaryRow
                        label={t("order.selectedFeatures")}
                        value={
                          form.features.length
                            ? form.features.join(", ")
                            : t("order.noneSelected")
                        }
                      />
                      <SummaryRow
                        label={t("order.physicalInvitations")}
                        value={
                          form.physicalInvitations
                            ? `${t("order.yes")}${form.invitationStyle ? ` \u2014 ${form.invitationStyle}` : ""}`
                            : t("order.digitalOnly")
                        }
                      />
                      <SummaryRow
                        label={t("order.images")}
                        value={
                          inspirationImages.length
                            ? inspirationImages.map((file) => file.name).join(", ")
                            : t("order.noneSelected")
                        }
                      />
                      <SummaryRow
                        label={t("order.overallVibe")}
                        value={form.overallVibe || t("order.notProvided")}
                      />
                      <SummaryRow
                        label={t("order.colorPalette")}
                        value={form.colorPalette || t("order.notProvided")}
                      />
                      <SummaryRow
                        label={t("order.typography")}
                        value={
                          typographyDecidedForMe
                            ? t("order.decideTypography")
                            : selectedTypography.join(", ") || t("order.notProvided")
                        }
                      />
                      <SummaryRow
                        label={t("order.email")}
                        value={form.email || t("order.notProvided")}
                      />
                    </div>
                  </StepShell>
                )}
              </div>

              {/* Navigation */}
              <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {step > 1 ? (
                  <Button variant="tertiary" onClick={previousStep} className="px-0">
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span>{t("order.back")}</span>
                  </Button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canContinue}
                    className="justify-center px-7 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("order.continue")}
                  </Button>
                ) : (
                  <Button
                    onClick={submitForm}
                    disabled={isSaving}
                    className="justify-center px-7 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? t("order.saving") : t("order.send")}
                  </Button>
                )}
              </div>
              {saveError && (
                <p
                  role="alert"
                  className="font-[family-name:var(--font-work-sans)] text-xs leading-5 text-red-700"
                >
                  {saveError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </VellumOverlay>
  );
}

function StepShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-newsreader)] text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-[-0.02em] text-[color:var(--on-surface)]">
        {title}
      </h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function AestheticSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="font-[family-name:var(--font-work-sans)] text-xs uppercase tracking-[0.12em] text-[rgba(108,91,78,0.78)]">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SelectionCard({
  selected,
  onClick,
  muted = false,
  className = "",
  children,
}: {
  selected: boolean;
  onClick: () => void;
  muted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-enter-continue="true"
      onClick={onClick}
      className={`rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-4 text-left shadow-[var(--shadow-ambient)] transition-all ${
        muted
          ? "border border-transparent grayscale opacity-45"
          : selected
          ? "border-[1.5px] border-[color:var(--primary)] bg-[rgba(239,217,200,0.2)]"
          : "border border-transparent"
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}

function DecideForMeButton({
  label,
  active,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-enter-continue="true"
      onClick={onClick}
      className={`${className || "mb-4"} rounded-[var(--radius-full)] px-5 py-2.5 font-[family-name:var(--font-work-sans)] text-sm transition-opacity hover:opacity-90 ${
        active
          ? "bg-[rgba(26,28,26,0.12)] text-[rgba(26,28,26,0.72)]"
          : "bg-[color:var(--primary)] text-[color:var(--surface-container-lowest)]"
      }`.trim()}
    >
      {label}
    </button>
  );
}

function CustomSelectionField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="soft-field mt-4 block">
      <span className="soft-label">{label}</span>
      <input
        value={value === DECIDE_FOR_ME ? "" : value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TypographySelectionGrid({
  selectedValues,
  muted,
  onToggle,
}: {
  selectedValues: string[];
  muted: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {typographyOptions.map((option) => {
        const selected = selectedValues.includes(option.value);
        const limitReached = selectedValues.length >= 3 && !selected;

        return (
          <SelectionCard
            key={option.value}
            muted={muted}
            selected={!muted && selected}
            onClick={() => onToggle(option.value)}
            className={`min-h-[8rem] p-2.5 ${
              limitReached && !muted ? "opacity-55" : ""
            }`}
          >
            <p className="font-[family-name:var(--font-work-sans)] text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(26,28,26,0.54)]">
              {option.eyebrow}
            </p>
            <p className={`mt-2 line-clamp-2 text-[color:var(--on-surface)] ${option.titleClass}`}>
              {option.title}
            </p>
            <p className={`mt-2 line-clamp-2 leading-snug text-[rgba(26,28,26,0.78)] ${option.bodyClass}`}>
              {option.body}
            </p>
            <div className="mt-2 border-t border-[rgba(204,198,188,0.7)] pt-2">
              <p className="font-[family-name:var(--font-work-sans)] text-[0.68rem] leading-5 text-[rgba(26,28,26,0.58)]">
                {option.meta}{" "}
                <span className="mt-1 inline-block rounded-full bg-[color:var(--primary-container)] px-2 py-0.5 text-[color:var(--primary)]">
                  {option.tag}
                </span>
              </p>
            </div>
            <p className="sr-only">
              {option.value}
            </p>
          </SelectionCard>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="font-[family-name:var(--font-work-sans)] text-xs uppercase tracking-[0.08em] text-[rgba(108,91,78,0.7)]">
        {label}
      </span>
      <span className="font-[family-name:var(--font-newsreader)] text-base leading-7 text-[color:var(--on-surface)]">
        {value}
      </span>
    </div>
  );
}
