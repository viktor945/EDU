export const sectionSlugs = [
  "schedule",
  "safety","daily","families","opportunities","programs","practice","research",
  "events",
  "clubs",
  "achievements",
  "menu",
  "map",
  "news",
  "feedback",
  "about",
  "documents",
  "students",
  "teachers",
] as const;

export type SectionSlug = (typeof sectionSlugs)[number];
