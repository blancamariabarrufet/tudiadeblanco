export type RegistrationLocale = "en" | "es";

type LocalizedText = Record<RegistrationLocale, string>;

export type SingleDesignQuestionId =
  | "mood"
  | "photographyStyle"
  | "accentColor"
  | "tonalWarmth"
  | "typographyFeel"
  | "heroImage";

export type MultiDesignQuestionId = "sectionPriority" | "hiddenSections";
export type DesignQuestionId = SingleDesignQuestionId | MultiDesignQuestionId;

export type OtherAnswerKey =
  | "moodOther"
  | "photographyStyleOther"
  | "accentColorOther"
  | "tonalWarmthOther"
  | "typographyFeelOther"
  | "sectionPriorityOther"
  | "hiddenSectionsOther"
  | "heroImageOther";

export type RegistrationDesignAnswers = {
  mood: string;
  moodOther: string;
  photographyStyle: string;
  photographyStyleOther: string;
  accentColor: string;
  accentColorOther: string;
  tonalWarmth: string;
  tonalWarmthOther: string;
  typographyFeel: string;
  typographyFeelOther: string;
  sectionPriority: string[];
  sectionPriorityOther: string;
  hiddenSections: string[];
  hiddenSectionsOther: string;
  heroImage: string;
  heroImageOther: string;
};

type DesignQuestionOption = {
  value: string;
  label: LocalizedText;
};

type SingleDesignQuestion = {
  id: SingleDesignQuestionId;
  kind: "single";
  label: LocalizedText;
  otherPlaceholder: LocalizedText;
  options: DesignQuestionOption[];
};

type MultiDesignQuestion = {
  id: MultiDesignQuestionId;
  kind: "multi";
  label: LocalizedText;
  otherPlaceholder: LocalizedText;
  options: DesignQuestionOption[];
};

export type RegistrationDesignQuestion = SingleDesignQuestion | MultiDesignQuestion;

export const REGISTRATION_DESIGN_QUESTIONS: RegistrationDesignQuestion[] = [
  {
    id: "mood",
    kind: "single",
    label: {
      en: "How would you like guests to feel when they visit your site?",
      es: "Como os gustaria que se sintieran los invitados al visitar vuestra web?",
    },
    options: [
      { value: "romantic_soft", label: { en: "Romantic & soft", es: "Romantico y suave" } },
      { value: "modern_minimal", label: { en: "Modern & minimal", es: "Moderno y minimal" } },
      { value: "rich_dramatic", label: { en: "Rich & dramatic", es: "Intenso y dramatico" } },
      { value: "playful_warm", label: { en: "Playful & warm", es: "Calido y divertido" } },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: { en: "Describe the feeling...", es: "Describe la sensacion..." },
  },
  {
    id: "photographyStyle",
    kind: "single",
    label: {
      en: "What kind of imagery speaks to you?",
      es: "Que tipo de imagenes conectan mas con vosotros?",
    },
    options: [
      { value: "editorial_moody", label: { en: "Editorial & moody", es: "Editorial y atmosferico" } },
      { value: "bright_airy", label: { en: "Bright & airy", es: "Luminoso y ligero" } },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: { en: "Describe your style...", es: "Describe vuestro estilo..." },
  },
  {
    id: "accentColor",
    kind: "single",
    label: {
      en: "Which accent colour feels most like your wedding?",
      es: "Que color de acento encaja mas con vuestra boda?",
    },
    options: [
      { value: "dusty_rose", label: { en: "Dusty rose", es: "Rosa empolvado" } },
      { value: "sage", label: { en: "Sage", es: "Salvia" } },
      { value: "terracotta", label: { en: "Terracotta", es: "Terracota" } },
      { value: "champagne_gold", label: { en: "Champagne gold", es: "Dorado champagne" } },
      { value: "deep_plum", label: { en: "Deep plum", es: "Ciruela intenso" } },
      { value: "slate_blue", label: { en: "Slate blue", es: "Azul pizarra" } },
      { value: "ivory", label: { en: "Ivory", es: "Marfil" } },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: {
      en: "Describe it or paste a hex code...",
      es: "Describelo o pega un codigo hex...",
    },
  },
  {
    id: "tonalWarmth",
    kind: "single",
    label: {
      en: "Is your venue/aesthetic warmer or cooler?",
      es: "Vuestro espacio o estetica es mas calido o mas frio?",
    },
    options: [
      {
        value: "warm",
        label: { en: "Warm, creams, blushes, wood", es: "Calido: cremas, rosas, madera" },
      },
      {
        value: "cool",
        label: { en: "Cool, stone, silver, greens", es: "Frio: piedra, plata, verdes" },
      },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: { en: "Tell us more...", es: "Cuestanos un poco mas..." },
  },
  {
    id: "typographyFeel",
    kind: "single",
    label: {
      en: "How should your names feel on the page?",
      es: "Como deberian sentirse vuestros nombres en la pagina?",
    },
    options: [
      { value: "classic_romantic", label: { en: "Classic & romantic", es: "Clasico y romantico" } },
      {
        value: "clean_understated",
        label: { en: "Clean & understated", es: "Limpio y discreto" },
      },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: {
      en: "Describe the look you have in mind...",
      es: "Describe el aspecto que teneis en mente...",
    },
  },
  {
    id: "sectionPriority",
    kind: "multi",
    label: {
      en: "Which sections matter most to your guests? Select all that apply.",
      es: "Que secciones son mas importantes para vuestros invitados? Seleccionad todas las que apliquen.",
    },
    options: [
      { value: "rsvp", label: { en: "RSVP", es: "RSVP" } },
      { value: "schedule", label: { en: "Schedule", es: "Horario" } },
      { value: "travel_stay", label: { en: "Travel & stay", es: "Viaje y alojamiento" } },
      { value: "our_story", label: { en: "Our story", es: "Nuestra historia" } },
      { value: "gift_registry", label: { en: "Gift registry", es: "Lista de regalos" } },
      { value: "ai_concierge", label: { en: "AI concierge", es: "Conserje IA" } },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: {
      en: "Any section you'd like to add...",
      es: "Alguna seccion que querais anadir...",
    },
  },
  {
    id: "hiddenSections",
    kind: "multi",
    label: {
      en: "Anything you'd like to hide entirely?",
      es: "Hay algo que querais ocultar por completo?",
    },
    options: [
      { value: "gift_registry", label: { en: "Gift registry", es: "Lista de regalos" } },
      { value: "our_story", label: { en: "Our story", es: "Nuestra historia" } },
      { value: "ai_concierge", label: { en: "AI concierge", es: "Conserje IA" } },
      { value: "nothing_to_hide", label: { en: "Nothing to hide", es: "Nada que ocultar" } },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: {
      en: "Which section should we hide?",
      es: "Que seccion deberiamos ocultar?",
    },
  },
  {
    id: "heroImage",
    kind: "single",
    label: {
      en: "Do you have a hero image in mind?",
      es: "Teneis una imagen principal en mente?",
    },
    options: [
      {
        value: "warm_landscape_placeholder",
        label: { en: "Use a warm landscape placeholder", es: "Usar un paisaje calido provisional" },
      },
      {
        value: "portrait_placeholder",
        label: { en: "Use a portrait placeholder", es: "Usar un retrato provisional" },
      },
      {
        value: "venue_exterior_placeholder",
        label: { en: "Use a venue exterior placeholder", es: "Usar un exterior del venue provisional" },
      },
      { value: "choose_for_me", label: { en: "Choose for me", es: "Elegid por mi" } },
      { value: "other", label: { en: "Other", es: "Otro" } },
    ],
    otherPlaceholder: {
      en: "Describe it or paste a URL...",
      es: "Describela o pega una URL...",
    },
  },
];

export function createEmptyRegistrationDesignAnswers(): RegistrationDesignAnswers {
  return {
    mood: "",
    moodOther: "",
    photographyStyle: "",
    photographyStyleOther: "",
    accentColor: "",
    accentColorOther: "",
    tonalWarmth: "",
    tonalWarmthOther: "",
    typographyFeel: "",
    typographyFeelOther: "",
    sectionPriority: [],
    sectionPriorityOther: "",
    hiddenSections: [],
    hiddenSectionsOther: "",
    heroImage: "",
    heroImageOther: "",
  };
}

const singleQuestionIds: SingleDesignQuestionId[] = [
  "mood",
  "photographyStyle",
  "accentColor",
  "tonalWarmth",
  "typographyFeel",
  "heroImage",
];

const multiQuestionIds: MultiDesignQuestionId[] = ["sectionPriority", "hiddenSections"];

const otherAnswerKeys = {
  mood: "moodOther",
  photographyStyle: "photographyStyleOther",
  accentColor: "accentColorOther",
  tonalWarmth: "tonalWarmthOther",
  typographyFeel: "typographyFeelOther",
  sectionPriority: "sectionPriorityOther",
  hiddenSections: "hiddenSectionsOther",
  heroImage: "heroImageOther",
} satisfies Record<DesignQuestionId, OtherAnswerKey>;

export function getRegistrationDesignOtherKey(questionId: DesignQuestionId) {
  return otherAnswerKeys[questionId];
}

const optionValuesByQuestion = REGISTRATION_DESIGN_QUESTIONS.reduce<Record<string, Set<string>>>((acc, question) => {
  acc[question.id] = new Set(question.options.map((option) => option.value));
  return acc;
}, {});

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function normalizeSingleAnswer(questionId: SingleDesignQuestionId, value: unknown) {
  const answer = cleanString(value);
  return optionValuesByQuestion[questionId]?.has(answer) ? answer : "";
}

function normalizeMultiAnswer(questionId: MultiDesignQuestionId, value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = optionValuesByQuestion[questionId] ?? new Set<string>();
  const answers = Array.from(new Set(value.map(cleanString).filter((answer) => allowed.has(answer))));

  if (questionId === "hiddenSections" && answers.includes("nothing_to_hide")) {
    return ["nothing_to_hide"];
  }

  return answers;
}

export function normalizeRegistrationDesignAnswers(value: unknown): RegistrationDesignAnswers {
  const source = value && typeof value === "object" ? value as Partial<RegistrationDesignAnswers> : {};
  const answers = createEmptyRegistrationDesignAnswers();

  for (const questionId of singleQuestionIds) {
    const otherKey = otherAnswerKeys[questionId];
    answers[questionId] = normalizeSingleAnswer(questionId, source[questionId]);
    answers[otherKey] = cleanString(source[otherKey]);
  }

  for (const questionId of multiQuestionIds) {
    const otherKey = otherAnswerKeys[questionId];
    answers[questionId] = normalizeMultiAnswer(questionId, source[questionId]);
    answers[otherKey] = cleanString(source[otherKey]);
  }

  return answers;
}

export function hasRequiredRegistrationDesignAnswers(answers: RegistrationDesignAnswers) {
  return REGISTRATION_DESIGN_QUESTIONS.every((question) => {
    if (question.kind === "single") return Boolean(answers[question.id]);
    return answers[question.id].length > 0;
  });
}
