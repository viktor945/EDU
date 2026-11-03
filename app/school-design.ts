import {normalizeExperience,type Experience} from './experience-model';
export type HomeBlockMode = "button" | "feature" | "list";
export type HomeBlock = {
  id: string;
  section: string;
  title: string;
  mode: HomeBlockMode;
  span: number;
  height?: number;
  imageId?: string;
};
export type SectionLayout = {
  experience?: Experience;
  meals?: {name:string;visible:boolean}[];
  enabled?: boolean;
  columns: number;
  mode: "cards" | "list" | "compact";
  imageFit: "cover" | "contain";
  height: "auto" | "medium" | "tall";
  blocks: SectionBlock[];
};
export type SectionBlock = {
  sourceSection?: string;
  recordIds?: string[];
  mode?: "cards" | "list" | "compact";
  id: string;
  title: string;
  span: number;
  height: number;
  visible: boolean;
};
export type SectionLayouts = Record<string, SectionLayout>;
export const defaultSectionLayout: SectionLayout = {
  columns: 3,
  mode: "cards",
  imageFit: "cover",
  height: "auto",
  blocks: [],
};

const sectionBlockTitles: Record<string, Array<[string, string, number]>> = {
  safety:[["filters","Подразделы помощи",12],["content","Памятки и контакты",12]],
  schedule: [
    ["filters", "Фильтры расписания", 12],
    ["content", "Расписание занятий", 12],
  ],
  events: [
    ["filters", "Поиск и категории", 12],
    ["content", "События школы", 12],
  ],
  clubs: [
    ["filters", "Поиск и направления", 12],
    ["content", "Кружки и секции", 12],
  ],
  achievements: [
    ["filters", "Фильтры достижений", 12],
    ["content", "Достижения и награды", 12],
  ],
  menu: [
    ["filters", "День и приём пищи", 12],
    ["content", "Школьное меню", 12],
  ],
  map: [
    ["plan", "План эвакуации", 8],
    ["rooms", "Этажи и кабинеты", 4],
  ],
  news: [
    ["filters", "Поиск новостей", 12],
    ["content", "Новости школы", 12],
  ],
  about: [
    ["filters", "Навигация по разделу", 12],
    ["content", "Информация о школе", 12],
  ],
  documents: [
    ["filters", "Поиск документов", 12],
    ["content", "Документы", 12],
  ],
  students: [
    ["filters", "Поиск и категории", 12],
    ["content", "Ученики и команды", 12],
  ],
  teachers: [
    ["filters", "Поиск и предмет", 12],
    ["content", "Карточки преподавателей", 12],
  ],
  feedback: [
    ["contacts", "Контакты школы", 12],
    ["links", "Ссылки и QR-коды", 12],
  ],
};

export function defaultSectionBlocks(section: string): SectionBlock[] {
  return (
    sectionBlockTitles[section] || [["filters", "Поиск и категории", 12],["content", "Материалы раздела", 12]]
  ).map(([id, title, span]) => ({
    id,
    title,
    span,
    height: id === "plan" || id === "rooms" ? 3 : 1,
    visible: true,
  }));
}

function normalizeSectionBlocks(
  value: unknown,
  section: string,
): SectionBlock[] {
  const defaults = defaultSectionBlocks(section);
  if (!Array.isArray(value) || !value.length) return defaults;
  const allowed = new Map(defaults.map((block) => [block.id, block]));
  const normalized: SectionBlock[] = value
    .filter(
      (block) =>
        block &&
        typeof block === "object" &&
        (allowed.has(String((block as SectionBlock).id)) || String((block as SectionBlock).id).startsWith("custom-")),
    )
    .map((block) => {
      const raw = block as Partial<SectionBlock>;
      const fallback = allowed.get(String(raw.id)) || {id: String(raw.id), title: "Новый блок", span: 6};
      return {
        id: fallback.id,
        title: String(raw.title || fallback.title),
        span: Math.max(3, Math.min(12, Number(raw.span) || fallback.span)),
        height: Math.max(1, Math.min(3, Number(raw.height) || 1)),
        visible: raw.visible !== false,
        sourceSection: String(raw.sourceSection || section),
        recordIds: Array.isArray(raw.recordIds) ? raw.recordIds.map(String) : [],
        mode: raw.mode === "list" || raw.mode === "compact" ? raw.mode : "cards" as const,
      };
    });
  for (const fallback of defaults) {
    if (!normalized.some((block) => block.id === fallback.id))
      normalized.push(fallback);
  }
  return normalized;
}

export const schoolThemes = [
  {
    key: "warm",
    name: "Тёплая школа",
    description: "Мягкий природный стиль",
    colors: ["#1e5a46", "#c8613f", "#f5f0e6"],
  },
  {
    key: "academic",
    name: "Академический синий",
    description: "Строгий и официальный",
    colors: ["#174a7e", "#d49a33", "#eef4f9"],
  },
  {
    key: "graphite",
    name: "Цифровой графит",
    description: "Технологичный тёмный акцент",
    colors: ["#28323d", "#3aa6a0", "#edf0f3"],
  },
  {
    key: "eco",
    name: "Эко-кампус",
    description: "Свежий зелёный дизайн",
    colors: ["#2c6b48", "#9ebc55", "#eff6ec"],
  },
  {
    key: "creative",
    name: "Творческая студия",
    description: "Яркие цветовые акценты",
    colors: ["#6d3da8", "#ef6b63", "#f8f1fb"],
  },
  {
    key: "science",
    name: "Научный центр",
    description: "Чистый современный интерфейс",
    colors: ["#075985", "#06b6d4", "#eef9fc"],
  },
  {
    key: "sport",
    name: "Спортивная энергия",
    description: "Контрастный динамичный стиль",
    colors: ["#b7372f", "#f0a629", "#fff4e8"],
  },
  {
    key: "classic",
    name: "Классический бордо",
    description: "Сдержанный премиальный стиль",
    colors: ["#6f2638", "#c89b4d", "#f7f0ed"],
  },
  {
    key: "northern",
    name: "Северный свет",
    description: "Холодные светлые оттенки",
    colors: ["#315b78", "#64a7a5", "#eef5f6"],
  },
  {
    key: "bright",
    name: "Яркая школа",
    description: "Дружелюбный цветной интерфейс",
    colors: ["#3454d1", "#f05d5e", "#fff5df"],
  },
] as const;

export const defaultHomeLayout: HomeBlock[] = [
  {id:"home-news",section:"news",title:"Новости",mode:"feature",span:6},
  {
    id: "home-schedule",
    section: "schedule",
    title: "Ближайшие занятия",
    mode: "list",
    span: 8,
  },
  {
    id: "home-events",
    section: "events",
    title: "События школы",
    mode: "feature",
    span: 4,
  },
  {
    id: "home-achievements",
    section: "achievements",
    title: "Наши достижения",
    mode: "feature",
    span: 6,
  },
  {
    id: "home-clubs",
    section: "clubs",
    title: "Кружки и секции",
    mode: "list",
    span: 6,
  },
];

export function parseHomeLayout(value: unknown): HomeBlock[] {
  try {
    const parsed = Array.isArray(value)
      ? [...value]
      : typeof value === "string"
        ? JSON.parse(value)
        : [];
    if (!Array.isArray(parsed) || !parsed.length) return defaultHomeLayout;
    const legacy=["home-schedule","home-events","home-achievements","home-clubs"];
    if(parsed.length===4&&parsed.every(x=>legacy.includes(x.id)))parsed.unshift(...defaultHomeLayout.slice(0,1));
    return parsed
      .filter(
        (x) => x && x.id!=="home-notices" && x.section!=="announcements" && typeof x.id === "string" && typeof x.section === "string",
      )
      .map((x) => ({
        ...x,
        span: Math.max(3, Math.min(12, Number(x.span) || 4)),
        height: Math.max(1, Math.min(3, Number(x.height) || 1)),
        mode: ["button", "feature", "list"].includes(x.mode)
          ? x.mode
          : "button",
      }));
  } catch {
    return defaultHomeLayout;
  }
}

export function parseSectionLayouts(value: unknown): SectionLayouts {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, Partial<SectionLayout>>).map(
        ([key, item]) => [
          key,
          {
            ...(key==='home'?{experience:normalizeExperience(item.experience)}:{}),
            enabled: item.enabled !== false,
            meals: Array.isArray(item.meals)?item.meals.filter(m=>m&&typeof m.name==='string').slice(0,20).map(m=>({name:m.name.trim().slice(0,80),visible:m.visible!==false})):undefined,
            columns: Math.max(1, Math.min(4, Number(item.columns) || 3)),
            mode: ["cards", "list", "compact"].includes(String(item.mode))
              ? item.mode!
              : "cards",
            imageFit: item.imageFit === "contain" ? "contain" : "cover",
            height: ["auto", "medium", "tall"].includes(String(item.height))
              ? item.height!
              : "auto",
            blocks: normalizeSectionBlocks(item.blocks, key),
          },
        ],
      ),
    );
  } catch {
    return {};
  }
}
export function sectionLayoutFor(
  value: unknown,
  section: string,
): SectionLayout {
  const saved = parseSectionLayouts(value)[section];
  return {
    ...defaultSectionLayout,
    ...saved,
    blocks: normalizeSectionBlocks(saved?.blocks, section),
  };
}

export function schoolThemeKey(value: unknown) {
  return schoolThemes.some((t) => t.key === value) ? String(value) : "warm";
}
export function schoolThemeClass(value: unknown) {
  return `school-theme-${schoolThemeKey(value)}`;
}
