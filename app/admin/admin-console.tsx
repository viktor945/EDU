"use client";
import {Localized,adminText} from './admin-locale';
import {useLanguage,LanguageSwitch} from '../language-context';
import {editingLanguage} from './editing-language';
import type {Language} from '../i18n';
import {adminLocale} from './admin-text';
import {institutionRoleLabels} from '../institutions';
import {safetyText} from '../safety-fields';
import {EventDateFields} from './event-date-fields';
import {CalendarWorkbench} from './calendar-workbench';
import {safetyKinds,calendarKind} from '../calendar-model';
import {InstitutionProvider,useInstitution,useInstitutionText,institutionLabels,institutionText} from '../institution-context';
import {institutionTypes,institutionProfiles,institutionType,allowedSections,extraSections,sectionTitles} from '../institutions';

import {fillLanguageVersions} from "./auto-translate";
import {sectionEnabled,portalOrder} from "../portal-navigation";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Menu,
  MonitorSmartphone,
  Newspaper,
  Pencil,
  Plus,
  Save,
  School,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Trophy,
  Upload,
  UserCog,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import DeviceManager from "./device-manager";
import HomepageBuilder from "./homepage-builder";
import SectionLayoutEditor from "./section-layout-editor";
import {MealSettings} from "./meal-settings";
import {ExperienceSettings} from "./experience-settings";
import {standbySections,type Experience} from "../experience-model";
import {
  ContentFilters,
  StructuredFields,
  SpreadsheetImport,
} from "./structured-content";
import { LanguageVersions } from "./language-versions";
import {
  permissionLabel,
  sectionFields,
  validateContent,
} from "../content-model";
import { roleLabels, normalizeRole } from "../access-policy";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  defaultHomeLayout,
  schoolThemes,
  schoolThemeClass,
  sectionLayoutFor,
  type HomeBlock,
  type SectionLayout,
  type SectionLayouts,
} from "../school-design";

type SchoolRecord = {
  institutionType?: string;
  id: string;
  name: string;
  shortName: string;
  bin: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  director: string;
  studentsCount: number;
  teachersCount: number;
  languages: string[];
  primaryColor: string;
  themeKey: string;
  homeLayout: HomeBlock[];
  sectionLayouts: SectionLayouts;
  status: string;
  updatedAt?: string;
};
type MemberRecord = {
  id: string;
  schoolId: string | null;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  permissions: string[];
  status: string;
  updatedAt?: string;
};
type AdminUser = {
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
  permissions: string[];
  isOwner: boolean;
};
type ContentRecord = {
  id: string;
  schoolId: string;
  section: string;
  title: string;
  description: string;
  status: string;
  visible: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  fileId: string | null;
  payload: Record<string, unknown>;
  sortOrder: number;
  updatedAt?: string;
};
type FileRecord = {
  id: string;
  schoolId: string;
  name: string;
  category: string;
  mimeType: string;
  size: number;
  uploadedBy?: string;
  createdAt: string;
  url: string;
};
type PlatformData = {
  schools: SchoolRecord[];
  members: MemberRecord[];
  content: ContentRecord[];
  files: FileRecord[];
};
type ViewKey =
  | "overview"
  | "schools"
  | "content"
  | "people"
  | "files"
  | "devices"
  | "licenses"

  | "settings";
type Editor =
  | { kind: "school"; value: SchoolRecord }
  | { kind: "member"; value: MemberRecord }
  | { kind: "content"; value: ContentRecord }
  | null;

const basePortalSections: {
  key: string;
  label: string;
  help: string;
  icon: LucideIcon;
  accepts: string;
}[] = [
  {
    key: "home",
    label: "Главная",
    help: "Баннеры и объявления",
    icon: LayoutDashboard,
    accepts: "изображения и видео",
  },
  {
    key: "schedule",
    label: "Расписание",
    help: "Уроки, замены и звонки",
    icon: CalendarDays,
    accepts: "Excel, XLSX и CSV",
  },
  {
    key: "events",
    label: "События",
    help: "Календарь мероприятий",
    icon: Bell,
    accepts: "изображения и документы",
  },
  {
    key: "clubs",
    label: "Кружки",
    help: "Секции и факультативы",
    icon: GraduationCap,
    accepts: "изображения",
  },
  {
    key: "achievements",
    label: "Достижения",
    help: "Награды учеников",
    icon: Trophy,
    accepts: "фотографии и дипломы",
  },
  {
    key: "menu",
    label: "Меню",
    help: "Питание по дням",
    icon: Utensils,
    accepts: "Excel, PDF и изображения",
  },
  {
    key: "map",
    label: "Карта школы",
    help: "Этажи, кабинеты и схемы",
    icon: Map,
    accepts: "PDF, DWG, DXF и изображения",
  },
  {
    key: "news",
    label: "Новости",
    help: "Публикации школы",
    icon: Newspaper,
    accepts: "фото и видео",
  },
  {
    key: "about",
    label: "О школе",
    help: "История, контакты и руководство",
    icon: School,
    accepts: "фото школы и сотрудников",
  },
  {
    key: "documents",
    label: "Документы",
    help: "Публичные файлы",
    icon: FileText,
    accepts: "PDF, Word и Excel",
  },
  {
    key: "students",
    label: "Ученики",
    help: "Карточки учащихся и состав групп",
    icon: Users,
    accepts: "фотографии",
  },
  {
    key: "teachers",
    label: "Преподаватели",
    help: "Карточки, предметы и классы",
    icon: CircleUserRound,
    accepts: "портретные фотографии",
  },
  {
    key: "feedback",
    label: "Обратная связь",
    help: "Контакты, соцсети и QR-коды",
    icon: UserCog,
    accepts: "ссылки",
  },
];

function RoleName({role}:{role:string}){const type=useInstitution(),{language}=useLanguage();return <>{adminText(institutionRoleLabels(type)[role]||role,language)}</>;}
function usePortalSections(){const type=useInstitution();const labels=institutionLabels(type);return portalOrder.flatMap(key=>basePortalSections.filter(s=>s.key===key&&allowedSections(type).includes(key))).map(s=>({...s,label:labels[s.key]||s.label,help:institutionText(s.help,type)}));}
const extraPortalSections=[{key:'safety',label:'Безопасность и помощь',help:'Памятки и контакты служб',icon:ShieldCheck,accepts:'изображения и документы'},...extraSections.map(key=>({key,label:sectionTitles('university')[key],help:'Информация учреждения',icon:FileText,accepts:'изображения и документы'}))];
basePortalSections.push({key:'announcements',label:'Важные объявления',help:'Карусель важных сообщений на главной',icon:Bell,accepts:'изображения и документы'},...extraPortalSections);

const navigation: { key: ViewKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Обзор", icon: LayoutDashboard },
  { key: "schools", label: "Учреждения", icon: Building2 },
  { key: "content", label: "Контент портала", icon: FilePenLine },

  { key: "people", label: "Люди и роли", icon: UserCog },
  { key: "files", label: "Файлы", icon: HardDrive },
  { key: "devices", label: "Устройства", icon: MonitorSmartphone },
  { key: "licenses", label: "Лицензии", icon: ShieldCheck },
  { key: "settings", label: "Настройки", icon: Settings },
];

const rolePermissionPresets: Record<string, string[]> = {
  platform_owner: ["*"],
  distributor_admin: ["*"],
  school_head: [
    "content.*",
    "members.*",
    "files.*",
    "devices.*",
    "school.settings",
  ],
  content_editor: ["content.*", "files.read", "files.manage"],
  teacher: ["content.read"],
};

const emptySchool = (): SchoolRecord => ({
  id: "",
  institutionType: "school",
  name: "",
  shortName: "",
  bin: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  director: "",
  studentsCount: 0,
  teachersCount: 0,
  languages: ["RU", "KZ"],
  primaryColor: "#1e5a46",
  themeKey: "warm",
  homeLayout: defaultHomeLayout,
  sectionLayouts: {},
  status: "active",
});
const emptyMember = (schoolId: string): MemberRecord => ({
  id: "",
  schoolId,
  fullName: "",
  email: "",
  phone: "",
  role: "teacher",
  position: "",
  permissions: ["content.read"],
  status: "invited",
});
const emptyContent = (schoolId: string, section: string, language:Language='RU'): ContentRecord => ({
  id: "",
  schoolId,
  section,
  title: "",
  description: "",
  status: "draft",
  visible: false,
  publishAt: null,
  expiresAt: null,
  fileId: null,
  payload: {_sourceLanguage:language},
  sortOrder: 0,
});
const fallbackData: PlatformData = {
  schools: [
    {
      ...emptySchool(),
      id: "school-97",
      name: "Школа-гимназия №97",
      shortName: "№97",
      bin: "990240001234",
      city: "Алматы",
      address: "ул. Толе би, 189",
      phone: "+7 727 000 00 97",
      email: "info@school97.edu.kz",
      website: "school97.edu.kz",
      director: "Сауле Ермековна Абдрахманова",
      studentsCount: 1248,
      teachersCount: 86,
      languages: ["RU", "KZ", "EN"],
    },
  ],
  members: [
    {
      ...emptyMember("school-97"),
      id: "member-director",
      fullName: "Сауле Ермековна Абдрахманова",
      email: "director@school97.edu.kz",
      role: "school_head",
      position: "Директор",
      permissions: ["content.*", "members.read", "files.*"],
    },
  ],
  content: [
    {
      ...emptyContent("school-97", "home"),
      id: "content-welcome",
      title: "Добро пожаловать в цифровой центр школы",
      description: "Всё важное о школьной жизни — в одном месте",
      status: "published",
      visible: true,
    },
  ],
  files: [],
};

function formatBytes(value: number) {
  return value < 1048576
    ? `${Math.max(1, Math.round(value / 1024))} КБ`
    : `${(value / 1048576).toFixed(1)} МБ`;
}
function dateLabel(value?: string) {
  return value
    ? new Intl.DateTimeFormat(adminLocale(), {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "только что";
}

export default function AdminConsole({
  user,
  signOutHref,
}: {
  user: AdminUser;
  signOutHref: string;
}) {
  const {language}=useLanguage();
  const [data, setData] = useState<PlatformData>(fallbackData);
  const [view, setView] = useState<ViewKey>("overview");
  const [selectedSchoolId, setSelectedSchoolId] = useState("school-97");
  const [activeSection, setActiveSection] = useState("home");
  const [editor, setEditor] = useState<Editor>(null);
  const [contentFilters, setContentFilters] = useState<Record<string, string>>(
    {},
  );
  async function reloadContent() {
    const r = await fetch("/api/platform", { cache: "no-store" });
    if (!r.ok) throw Error("Не удалось обновить список");
    setData(await r.json());
    const channel=new BroadcastChannel("stepline-content");channel.postMessage({schoolId:selectedSchoolId});channel.close();
  }
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(
    "Кабинет владельца платформы готов к работе",
  );
  const [storageOnline, setStorageOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [previewMember, setPreviewMember] = useState<MemberRecord | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [navOpen]);

  useEffect(() => {
    fetch("/api/platform", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const next = (await response.json()) as PlatformData;
        next.members = next.members.map((member) => ({
          ...member,
          role: normalizeRole(member.role),
        }));
        setData(next);
        if (next.schools[0])
          setSelectedSchoolId((current) =>
            next.schools.some((s) => s.id === current)
              ? current
              : next.schools[0].id,
          );
      })
      .catch(() => {
        setStorageOnline(false);
        setNotice("Хранилище недоступно: открыт деморежим этой вкладки");
      });
  }, []);

  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: Record<string, unknown>,
            options?: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool || !user.isOwner) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "open_school_creation",
          title: "Добавить учреждение",
          description:
            "Открывает форму создания новой школы в кабинете владельца платформы.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: () => {
            setView("schools");
            setEditor({ kind: "school", value: emptySchool() });
            return { opened: true, view: "schools" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    void Promise.resolve(
      context.registerTool(
        {
          name: "open_portal_content",
          title: "Открыть контент портала",
          description:
            "Открывает выбранный раздел наполнения школьного портала.",
          inputSchema: {
            type: "object",
            properties: {
              section: {
                type: "string",
                enum: basePortalSections.map((item) => item.key),
              },
            },
            required: ["section"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input: unknown) => {
            const section = String(
              (input as { section?: string }).section || "home",
            );
            if (!basePortalSections.some((item) => item.key === section))
              throw new Error("Неизвестный раздел");
            setActiveSection(section);
            setView("content");
            return { opened: true, section };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const school =
    data.schools.find((item) => item.id === selectedSchoolId) ??
    data.schools[0];
  const schoolMembers = data.members.filter(
    (item) => item.schoolId === selectedSchoolId || item.schoolId === null,
  );
  const schoolContent = data.content.filter(
    (item) => item.schoolId === selectedSchoolId,
  );
  const sectionContent = schoolContent.filter(
    (item) =>
      (item.section === activeSection ||
        (activeSection === "feedback" && item.section === "links")) &&
      Object.entries(contentFilters).every(
        ([key, value]) => !value || String(item.payload[key] ?? "") === value,
      ) &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const schoolFiles = data.files.filter(
    (item) =>
      item.schoolId === selectedSchoolId &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  );
  const drafts = schoolContent.filter(
    (item) => item.status !== "published",
  ).length;
  const effectivePermissions = previewMember?.permissions ?? user.permissions;
  const effectiveRole = previewMember?.role ?? user.role;
  const has = (permission: string) =>
    (user.isOwner && !previewMember) ||
    (effectiveRole === "school_head" && permission === "school.settings") ||
    effectivePermissions.includes("*") ||
    effectivePermissions.includes(permission) ||
    effectivePermissions.includes(`${permission.split(".")[0]}.*`);
  const visibleNavigation = navigation.filter(
    ({ key }) =>
      key === "overview" ||
      (key === "content" && (has("content.read") || has("content.edit"))) ||
      (key === "people" && (has("members.read") || has("members.manage"))) ||
      (key === "files" && (has("files.read") || has("files.manage"))) ||
      (key === "devices" && (has("devices.read") || has("devices.manage"))) ||
      (key === "settings" && has("school.settings")) ||

      (key === "schools" &&
        ((user.isOwner && !previewMember) || has("school.settings"))) ||
      (key === "licenses" && user.isOwner && !previewMember),
  );

  const recoveredSchools=useRef(new Set<string>());
  async function recoverFiles(schoolId:string){
    if(recoveredSchools.current.has(schoolId)||previewMember||!has("files.manage"))return;
    recoveredSchools.current.add(schoolId);let cursor:string|undefined,total=0;
    try{do{const response=await fetch("/api/files/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({schoolId,cursor})});if(!response.ok)throw Error();const data=await response.json() as {recovered:number;cursor:string|null};total+=data.recovered;cursor=data.cursor||undefined;}while(cursor);if(total){await reloadContent();setNotice(`Восстановлены ранее загруженные файлы: ${total}`);}}catch{recoveredSchools.current.delete(schoolId);}
  }
  async function persist(
    kind: "school" | "member" | "content",
    value: SchoolRecord | MemberRecord | ContentRecord,
  ) {
    const normalizedValue =
      kind === "content" && (value as ContentRecord).status === "published"
        ? ({ ...value, visible: true } as ContentRecord)
        : value;
    if (kind === "content") {
      const c = normalizedValue as ContentRecord;
      const issues = validateContent(c.section, c.title, c.payload,data.schools.find(s=>s.id===c.schoolId)?.institutionType);
      if (issues.length) {
        setNotice(issues.join("; "));
        return issues.join("; ");
      }
    }
    setBusy(true);
    const isNew = !normalizedValue.id;
    if (kind === "school" && isNew && (!user.isOwner || previewMember)) {
      setBusy(false);
      setNotice("Создавать учреждения может только владелец платформы");
      return "Создавать учреждения может только владелец платформы";
    }
    const id = normalizedValue.id || crypto.randomUUID();
    let saveWarning='';
    const saved = {
      ...normalizedValue,
      id,
      updatedAt: new Date().toISOString(),
    };
    try {
      const response = await fetch("/api/platform", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? { entity: kind, data: saved }
            : { entity: kind, id, data: saved },
        ),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Сервер отклонил сохранение");
      if (
        kind === "content" &&
        (saved as ContentRecord).status === "published" &&
        !(saved as ContentRecord).payload._calendarSourceId &&
        !(saved as ContentRecord).publishAt
      ) {
        try {
        const publicResponse = await fetch(
          `/api/public?schoolId=${encodeURIComponent((saved as ContentRecord).schoolId)}&verify=${Date.now()}`,
          { cache: "no-store" },
        );
        const publicData = (await publicResponse.json()) as {
          items?: { id: string }[];
          error?: string;
        };
        if (
          !publicResponse.ok ||
          !publicData.items?.some((item) => item.id === id)
        )
          saveWarning=publicData.error || "Запись сохранена. Проверьте видимость раздела и срок публикации.";
        }catch{saveWarning="Запись сохранена. Подтвердить обновление портала пока не удалось.";}
      }
      setData((current) => {
        if (kind === "school")
          return {
            ...current,
            schools: isNew
              ? [saved as SchoolRecord, ...current.schools]
              : current.schools.map((x) =>
                  x.id === value.id ? (saved as SchoolRecord) : x,
                ),
          };
        if (kind === "member")
          return {
            ...current,
            members: isNew
              ? [saved as MemberRecord, ...current.members]
              : current.members.map((x) =>
                  x.id === value.id ? (saved as MemberRecord) : x,
                ),
          };
        return {
          ...current,
          content: isNew
            ? [saved as ContentRecord, ...current.content]
            : current.content.map((x) =>
                x.id === value.id ? (saved as ContentRecord) : x,
              ),
        };
      });
      if (kind === "content") {
        try{await reloadContent();}catch{saveWarning="Запись сохранена. Обновите список материалов.";}
        const channel = new BroadcastChannel("stepline-content");
        channel.postMessage({ schoolId: (saved as ContentRecord).schoolId });
        channel.close();
      }
      setStorageOnline(true);
      setNotice(
        saveWarning || (kind === "content" && (saved as ContentRecord).status === "published"
          ? "Материал опубликован на портале"
          : isNew
            ? "Запись добавлена"
            : "Изменения сохранены"),
      );
      setEditor(null);
      return null;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Не удалось сохранить: ${error.message}`
          : "Не удалось сохранить. Форма оставлена открытой — повторите попытку.",
      );
      return error instanceof Error ? error.message : "Не удалось сохранить. Повторите попытку.";
    } finally {
      setBusy(false);
    }
  }

  async function remove(kind: "member" | "content", id: string) {
    if (!window.confirm(adminText("Удалить эту запись?",language))) return;
    try {
      const response = await fetch(
        `/api/platform?entity=${kind}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();
      setData((current) =>
        kind === "member"
          ? { ...current, members: current.members.filter((x) => x.id !== id) }
          : { ...current, content: current.content.filter((x) => x.id !== id) },
      );
      setNotice("Запись удалена");
      if(kind==='content')await reloadContent();
    } catch {
      setNotice("Не удалось удалить запись. Данные не изменены.");
    }
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !school) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    form.set("schoolId", school.id);
    form.set("category", activeSection);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as FileRecord & { error?: string };
      if (!response.ok) throw new Error(result.error);
      setData((current) => ({ ...current, files: [result, ...current.files] }));
      if (view === "content") {
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        setEditor({
          kind: "content",
          value: {
            ...emptyContent(school.id, activeSection, language),
            title,
            fileId: result.id,
            payload: { ...contentFilters },
          },
        });
        setNotice(
          `Файл «${file.name}» загружен. Заполните карточку и выберите статус «Опубликовано».`,
        );
      } else setNotice(`Файл «${file.name}» загружен`);
    } catch (error) {
      setNotice(
        error instanceof Error && error.message
          ? error.message
          : "Не удалось загрузить файл",
      );
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function uploadInlineFile(file: File, category: string) {
    if (!school) throw Error("Учреждение не выбрано");
    const form = new FormData();
    form.set("file", file);
    form.set("schoolId", school.id);
    form.set("category", category);
    const response = await fetch("/api/files", { method: "POST", body: form });
    const result = (await response.json()) as FileRecord & { error?: string };
    if (!response.ok) throw Error(result.error || "Не удалось загрузить файл");
    setData((current) => ({ ...current, files: [result, ...current.files] }));
    setNotice(`Файл «${file.name}» загружен и выбран`);
    return result;
  }

  async function saveExperience(value:Experience){if(school)await saveSchoolDesign({...school,sectionLayouts:{...school.sectionLayouts,home:{...sectionLayoutFor(school.sectionLayouts,"home"),experience:value}}});}

  async function saveSchoolDesign(next: SchoolRecord) {
    const response = await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "school", id: next.id, data: next }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      throw Error(result.error || "Не удалось сохранить оформление");
    setData((current) => ({
      ...current,
      schools: current.schools.map((item) =>
        item.id === next.id ? next : item,
      ),
    }));
    const channel = new BroadcastChannel("stepline-content");
    channel.postMessage({ schoolId: next.id });
    channel.close();
    setNotice("Оформление школы сохранено и опубликовано");
  }

  async function deleteFile(file: FileRecord) {
    if (!window.confirm(`${adminText("Удалить",language)} ${adminText("файл",language)} «${file.name}»?`)) return;
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setData((current) => ({
        ...current,
        files: current.files.filter((x) => x.id !== file.id),
      }));
      setNotice("Файл удалён");
    } catch {
      setNotice("Не удалось удалить файл");
    }
  }

  function go(next: ViewKey) {
    setView(next);
    setNavOpen(false);
    setQuery("");
    setEditor(null);
  }
  function startPreview(person: MemberRecord) {
    setPreviewMember(person);
    setView("overview");
    setNotice(`Режим проверки: ${person.fullName}`);
  }
  function sendInvite(person: MemberRecord) {
    const subject = encodeURIComponent(
      `${language==='KZ'?'STEPLine EDU шақыруы':language==='EN'?'STEPLine EDU invitation':'Приглашение в STEPLine EDU'} — ${school?.name || ''}`,
    );
    const body = encodeURIComponent(
      (language==='KZ'?`Сәлеметсіз бе, ${person.fullName}!\n\nСізге STEPLine EDU жүйесіне «${adminText(institutionRoleLabels(school?.institutionType)[person.role]||person.role,language)}» рөлі берілді.\n${window.location.origin}/admin мекенжайын ашып, ${person.email} поштасымен кіріңіз.\n\nБөлек STEPLine паролі қажет емес: кіруді авторизация провайдері қорғайды.`:language==='EN'?`Hello, ${person.fullName}!\n\nYou have access to STEPLine EDU as ${adminText(institutionRoleLabels(school?.institutionType)[person.role]||person.role,language)}.\nOpen ${window.location.origin}/admin and sign in with ${person.email}.\n\nNo separate STEPLine password is required; sign-in is protected by the authentication provider.`:`Здравствуйте, ${person.fullName}!\n\nВам предоставлен доступ к STEPLine EDU с ролью «${adminText(institutionRoleLabels(school?.institutionType)[person.role]||person.role,language)}».\nОткройте ${window.location.origin}/admin и войдите с адресом ${person.email}.\n\nПароль STEPLine создавать не нужно: вход защищён провайдером авторизации.`),
    );
    window.location.href = `mailto:${encodeURIComponent(person.email)}?subject=${subject}&body=${body}`;
    setNotice(`Подготовлено приглашение для ${person.email}`);
  }
  return (
    <InstitutionProvider type={school?.institutionType}><Localized as="main" className={`owner-shell ${schoolThemeClass(school?.themeKey)}`}>
      <Localized as="button"
        className={`mobile-nav-backdrop ${navOpen ? "is-open" : ""}`}
        aria-label="Закрыть меню"
        onClick={() => setNavOpen(false)}
      />
      <Localized as="aside" className={`owner-sidebar ${navOpen ? "is-open" : ""}`}>
        <Localized as="button"
          className="owner-sidebar-close"
          aria-label="Закрыть меню"
          onClick={() => setNavOpen(false)}
        >
          <X size={22} />
        </Localized>
        <Link className="owner-brand" href="/">
          <Localized as="span">
            <ShieldCheck size={25} />
          </Localized>
          <Localized as="div">
            <Localized as="strong">STEPLine EDU</Localized>
            <Localized as="small">Управление платформой</Localized>
          </Localized>
        </Link>
        <Localized as="div" className="owner-role">
          <CircleUserRound size={30} />
          <Localized as="div">
            <Localized as="small">
              {previewMember
                ? "Проверка доступов"
                : user.isOwner
                  ? "Максимальный доступ"
                  : "Рабочий доступ"}
            </Localized>
            <Localized as="strong">{<RoleName role={effectiveRole}/>}</Localized>
          </Localized>
        </Localized>
        <Localized as="nav">
          {visibleNavigation.map(({ key, label, icon: Icon }) => (
            <Localized as="button"
              className={view === key ? "active" : ""}
              key={key}
              onClick={() => go(key)}
            >
              <Icon size={19} />
              <Localized as="span">{label}</Localized>
              {key === "content" && drafts > 0 && <Localized as="em">{drafts}</Localized>}
            </Localized>
          ))}
        </Localized>
        <Link
          className="owner-portal-link"
          href={`/?schoolId=${encodeURIComponent(selectedSchoolId)}`}
        >
          <ArrowLeft size={17} /> Открыть портал учреждения
        </Link>
      </Localized>
      <Localized as="section" className="owner-workspace">
        <Localized as="header" className="owner-topbar">
          <Localized as="button"
            className="mobile-menu-trigger owner-mobile-menu"
            aria-label="Открыть меню администратора"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Menu size={22} />
          </Localized>
          <Localized as="label" className="owner-school-picker">
            <School size={18} />
            <Localized as="span">Выбрано учреждение</Localized>
            <Localized as="select"
              value={selectedSchoolId}
              disabled={!user.isOwner || !!previewMember}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              {data.schools.map((item) => (
                <Localized as="option" key={item.id} value={item.id}>
                  {item.name}
                </Localized>
              ))}
            </Localized>
            <ChevronDown size={16} />
          </Localized>
          <LanguageSwitch/>
          <Localized as="div" className="owner-account">
            <Localized as="button"
              className="owner-user"
              aria-label={`Учётная запись: ${user.name}`}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <Localized as="span" className="account-initials">{user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "Я"}</Localized>
              <Localized as="span"
                className={storageOnline ? "storage-dot online" : "storage-dot"}
              />
              {storageOnline ? "Данные сохраняются" : "Деморежим"}
              <Localized as="div">
                <Localized as="strong">{user.name}</Localized>
                <Localized as="small">{user.email}</Localized>
              </Localized>
              <ChevronDown size={16} />
            </Localized>
            {accountOpen && (
              <Localized as="div" className="owner-account-menu">
                <Localized as="div">
                  <Localized as="strong">{user.name}</Localized>
                  <Localized as="span">{<RoleName role={user.role}/>}</Localized>
                  <Localized as="small">{user.email}</Localized>
                </Localized>
                <Localized as="a" href={signOutHref}>
                  <LogOut size={17} /> Выйти из аккаунта
                </Localized>
              </Localized>
            )}
          </Localized>
        </Localized>
        <Localized as="div" className="owner-main">
          {previewMember && (
            <Localized as="div" className="preview-banner">
              <Eye size={18} />
              <Localized as="span">
                Вы видите кабинет как <Localized as="strong">{previewMember.fullName}</Localized>{" "}
                — {<RoleName role={previewMember.role}/>}
              </Localized>
              <Localized as="button"
                onClick={() => {
                  setPreviewMember(null);
                  setView("people");
                }}
              >
                Вернуться к полному доступу
              </Localized>
            </Localized>
          )}
          {view === "people" && (
            <Localized as="p" role="note">
              Сохраните сотрудника с рабочей почтой, затем отправьте ему
              приглашение. При первом входе с этой же почтой профиль
              активируется автоматически. Роль определяет права, должность
              описывает работу: IT-специалист может получить тот же набор прав,
              что руководитель, без отдельной искусственной роли.
            </Localized>
          )}
          {view === "licenses" && (
            <Localized as="p" role="note">
              Демонстрационный раздел. Показанные лицензии и устройства —
              примеры; выдача лицензий, подключение и удалённые команды ещё не
              реализованы.
            </Localized>
          )}
          {view === "overview" && (
            <Overview
              canCreateSchool={user.isOwner && !previewMember}
              school={school}
              data={data}
              go={go}
              addSchool={() =>
                setEditor({ kind: "school", value: emptySchool() })
              }
            />
          )}
          {view === "schools" && (
            <SchoolsView
              canCreateSchool={user.isOwner && !previewMember}
              schools={data.schools}
              selected={school}
              onSelect={setSelectedSchoolId}
              onEdit={(value) => setEditor({ kind: "school", value })}
              onAdd={() => setEditor({ kind: "school", value: emptySchool() })}
            />
          )}


          {view === "content" && (
            <>
              {activeSection!=='standby'&&<><ContentFilters
                section={activeSection}
                filters={contentFilters}
                onChange={setContentFilters}
                items={schoolContent.filter(
                  (x) =>
                    x.section === activeSection ||
                    (activeSection === "feedback" && x.section === "links"),
                )}
              />
              <SpreadsheetImport
                key={`${selectedSchoolId}-${activeSection}`}
                schoolId={selectedSchoolId}
                section={activeSection}
                teachers={schoolContent.filter((x) => x.section === "teachers")}
                onImported={reloadContent}
              /></>}
              <ContentView
                homeSettings={school&&has("school.settings")?<ExperienceSettings key={school.id+"home"} mode="home" school={school} items={schoolContent} files={schoolFiles} onSave={saveExperience} onUpload={uploadInlineFile}/>:null}
                standbySettings={school&&has("school.settings")?<ExperienceSettings key={school.id+"standby"} mode="standby" school={school} items={schoolContent} files={schoolFiles} onSave={saveExperience} onUpload={uploadInlineFile} onEnable={async(item,enabled)=>{const current=schoolContent.find(c=>c.id===item.id);if(!current)return;const error=await persist("content",{...current,payload:{...current.payload,_standbyEnabled:enabled}});if(error)throw Error(error);}}/>:null}
                onRefresh={reloadContent}
                onBulkStatus={async (ids, status) => {
                  const response=await fetch('/api/content-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schoolId:selectedSchoolId,ids,status})});
                  const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error||'Статусы не изменены');await reloadContent();
                }}
                onToggleSection={async (key, enabled) => {
                  if(school)await saveSchoolDesign({...school,sectionLayouts:{...school.sectionLayouts,[key]:{...sectionLayoutFor(school.sectionLayouts,key),enabled}}});
                  if(!enabled&&key===activeSection)setActiveSection('home');
                }}
                allItems={schoolContent}
                school={school}
                activeSection={activeSection}
                setActiveSection={(key) => {
                  setActiveSection(key);
                  setContentFilters({});
                }}
                items={sectionContent}
                files={schoolFiles}
                query={query}
                setQuery={setQuery}
                onAdd={(safetyKind,date) =>
                  school &&
                  setEditor({
                    kind: "content",
                    value: {
                      ...emptyContent(school.id, activeSection, language),
                      payload: { ...contentFilters,...((activeSection==='safety'||activeSection==='events'&&safetyKind===calendarKind)?{kind:safetyKind||'Безопасность',...(date?{date}:{})}:{}) },
                    },
                  })
                }
                onEdit={(value) =>
                  setEditor({
                    kind: "content",
                    value:
                      activeSection === "feedback" && value.section === "links"
                        ? { ...value, section: "feedback" }
                        : value,
                  })
                }
                onDelete={(id) => remove("content", id)}
                onUpload={() => fileInput.current?.click()}
                onSaveHome={async (layout) => {
                  if (school)
                    await saveSchoolDesign({ ...school, homeLayout: layout });
                }}
                onSaveSection={async (layout) => {
                  if (school)
                    await saveSchoolDesign({
                      ...school,
                      sectionLayouts: {
                        ...school.sectionLayouts,
                        [activeSection]: layout,
                      },
                    });
                }}
              />
            </>
          )}
          {view === "people" && (
            <PeopleView
              people={schoolMembers}
              school={school}
              onAdd={() =>
                school &&
                setEditor({ kind: "member", value: emptyMember(school.id) })
              }
              onEdit={(value) => setEditor({ kind: "member", value })}
              onDelete={(id) => remove("member", id)}
              onPreview={startPreview}
              onInvite={sendInvite}
            />
          )}
          {view === "files" && (
            <FilesView
              files={schoolFiles}
              query={query}
              setQuery={setQuery}
              onUpload={() => fileInput.current?.click()}
              onDelete={deleteFile}
            />
          )}
          {view === "devices" && (
            <DeviceManager key={selectedSchoolId} school={school} />
          )}
          {view === "settings" && school && <ExperienceSettings key={school.id+"settings"} mode="settings" school={school} items={schoolContent} files={schoolFiles} onSave={saveExperience} onUpload={uploadInlineFile}/>}
          {view === "settings" && (
            <SettingsView
              school={school}
              onEdit={() =>
                school && setEditor({ kind: "school", value: school })
              }
              onAction={setNotice}
              onTheme={async (key) => {
                if (school)
                  await saveSchoolDesign({ ...school, themeKey: key });
              }}
            />
          )}
          {view === "licenses" && (
            <LicensesView schools={data.schools} onAction={setNotice} />
          )}
          <Localized as="input"
            ref={fileInput}
            hidden
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.svg,.dwg,.dxf,video/*"
            onChange={uploadFile}
          />
          <Localized as="div" className="owner-notice" role="status">
            <CheckCircle2 size={17} />
            {busy ? "Сохраняю изменения…" : notice}
          </Localized>
        </Localized>
      </Localized>
      {editor && (
        <EditorDialog
          editor={editor}
          schools={data.schools}
          files={data.files.filter((x) => x.schoolId === selectedSchoolId)}
          content={schoolContent}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={persist}
          onRecoverFiles={recoverFiles}
          onUploadFile={uploadInlineFile}
        />
      )}
    </Localized></InstitutionProvider>
  );
}

function Heading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Localized as="header" className="owner-heading">
      <Localized as="div">
        <Localized as="p">{eyebrow}</Localized>
        <Localized as="h1">{title}</Localized>
        <Localized as="span">{text}</Localized>
      </Localized>
      {action}
    </Localized>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Localized as="div" className="owner-empty">
      <Localized as="span">
        <ClipboardList size={29} />
      </Localized>
      <Localized as="strong">{title}</Localized>
      <Localized as="p">{text}</Localized>
      {action}
    </Localized>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <Localized as="div">
      <Localized as="small">{label}</Localized>
      <Localized as="strong">{value}</Localized>
    </Localized>
  );
}

function Overview({
  canCreateSchool,
  school,
  data,
  go,
  addSchool,
}: {
  school?: SchoolRecord;
  data: PlatformData;
  go: (v: ViewKey) => void;
  addSchool: () => void;
  canCreateSchool: boolean;
}) {
  const cards = [
    {
      label: "Подключено учреждений",
      value: data.schools.length,
      icon: Building2,
      view: "schools",
    },
    {
      label: "Пользователей",
      value: data.members.length,
      icon: Users,
      view: "people",
    },
    {
      label: "Материалов",
      value: data.content.length,
      icon: FilePenLine,
      view: "content",
    },
    {
      label: "Файлов",
      value: data.files.length,
      icon: HardDrive,
      view: "files",
    },
  ] as const;
  return (
    <>
      <Heading
        eyebrow="Центр управления"
        title="Обзор платформы"
        text="Состояние сети учреждений без смешивания с редактированием контента."
        action={
          canCreateSchool && <Localized as="button" className="owner-primary" onClick={addSchool}>
            <Plus size={18} /> Добавить учреждение
          </Localized>
        }
      />
      <Localized as="section" className="owner-metrics">
        {cards.map(({ label, value, icon: Icon, view }) => (
          <Localized as="button" key={label} onClick={() => go(view)}>
            <Localized as="span">
              <Icon size={20} />
            </Localized>
            <Localized as="strong">{value}</Localized>
            <Localized as="small">{label}</Localized>
          </Localized>
        ))}
      </Localized>
      <Localized as="section" className="owner-overview-grid">
        <Localized as="article" className="owner-panel school-health">
          <Localized as="div" className="panel-title">
            <Localized as="div">
              <Localized as="p">Текущее учреждение</Localized>
              <Localized as="h2">{school?.name}</Localized>
            </Localized>
            <Localized as="span" className="status-pill active">Активна</Localized>
          </Localized>
          <Localized as="dl">
            <Info label="Город" value={school?.city || "Не указан"} />
            <Info label="Учеников" value={String(school?.studentsCount || 0)} />
            <Info
              label="Педагогов"
              value={String(school?.teachersCount || 0)}
            />
            <Info label="Языки" value={school?.languages.join(" · ") || "—"} />
          </Localized>
          <Localized as="button" onClick={() => go("schools")}>Открыть карточку учреждения</Localized>
        </Localized>
        <Localized as="article" className="owner-panel quick-actions">
          <Localized as="div" className="panel-title">
            <Localized as="div">
              <Localized as="p">Быстрые действия</Localized>
              <Localized as="h2">Работа с порталом</Localized>
            </Localized>
          </Localized>
          <Localized as="button" onClick={() => go("content")}>
            <FilePenLine size={20} />
            <Localized as="span">
              <Localized as="strong">Добавить материал</Localized>
              <Localized as="small">Новость, расписание, меню или документ</Localized>
            </Localized>
          </Localized>
          <Localized as="button" onClick={() => go("people")}>
            <UserCog size={20} />
            <Localized as="span">
              <Localized as="strong">Добавить сотрудника</Localized>
              <Localized as="small">Назначить роль и права доступа</Localized>
            </Localized>
          </Localized>
          <Localized as="button" onClick={() => go("files")}>
            <Upload size={20} />
            <Localized as="span">
              <Localized as="strong">Загрузить файл</Localized>
              <Localized as="small">Excel, схема здания, фото или PDF</Localized>
            </Localized>
          </Localized>
        </Localized>
      </Localized>
    </>
  );
}

function SchoolsView({
  canCreateSchool,
  schools,
  selected,
  onSelect,
  onEdit,
  onAdd,
}: {
  schools: SchoolRecord[];
  selected?: SchoolRecord;
  onSelect: (id: string) => void;
  onEdit: (s: SchoolRecord) => void;
  onAdd: () => void;
  canCreateSchool: boolean;
}) {
  return (
    <>
      <Heading
        eyebrow="Клиенты платформы"
        title="Школы"
        text="Создавайте отдельное пространство и полную карточку для каждого учреждения."
        action={
          canCreateSchool && <Localized as="button" className="owner-primary" onClick={onAdd}>
            <Plus size={18} /> Добавить учреждение
          </Localized>
        }
      />
      <Localized as="div" className="schools-layout">
        <Localized as="section" className="school-directory">
          <Localized as="div" className="list-label">
            Все организации <Localized as="span">{schools.length}</Localized>
          </Localized>
          {schools.map((item) => (
            <Localized as="button"
              className={selected?.id === item.id ? "selected" : ""}
              key={item.id}
              onClick={() => onSelect(item.id)}
            >
              <Localized as="span" className="school-monogram">{item.shortName || "Ш"}</Localized>
              <Localized as="span">
                <Localized as="strong">{item.name}</Localized>
                <Localized as="small">
                  {institutionProfiles[institutionType(item.institutionType)].name} · {item.city || "Город не указан"} · {item.studentsCount}{" "}
                  {institutionText("учеников",item.institutionType)}
                </Localized>
              </Localized>
              <Localized as="em">Активна</Localized>
            </Localized>
          ))}
        </Localized>
        {selected ? (
          <Localized as="section" className="school-card owner-panel">
            <Localized as="div"
              className="school-card-hero"
              style={{ borderColor: selected.primaryColor }}
            >
              <Localized as="span"
                className="school-large-mark"
                style={{ background: selected.primaryColor }}
              >
                {selected.shortName}
              </Localized>
              <Localized as="div">
                <Localized as="p">Карточка организации</Localized>
                <Localized as="h2">{selected.name}</Localized>
                <Localized as="span">
                  {selected.city} · БИН {selected.bin || "не указан"}
                </Localized>
              </Localized>
              <Localized as="button" onClick={() => onEdit(selected)}>
                <Pencil size={17} /> Редактировать
              </Localized>
            </Localized>
            <Localized as="div" className="school-details">
              <Info
                label={institutionProfiles[institutionType(selected.institutionType)].head}
                value={selected.director || "Не указан"}
              />
              <Info label="Адрес" value={selected.address || "Не указан"} />
              <Info label="Телефон" value={selected.phone || "Не указан"} />
              <Info
                label="Электронная почта"
                value={selected.email || "Не указана"}
              />
              <Info label="Сайт" value={selected.website || "Не указан"} />
              <Info
                label="Языки портала"
                value={selected.languages.join(", ")}
              />
            </Localized>
            <Localized as="div" className="school-numbers">
              <Localized as="span">
                <Localized as="strong">{selected.studentsCount}</Localized>{institutionText("учеников",selected.institutionType)}
              </Localized>
              <Localized as="span">
                <Localized as="strong">{selected.teachersCount}</Localized>педагогов
              </Localized>
              <Localized as="span">
                <Localized as="strong">В сети</Localized>статус
              </Localized>
            </Localized>
          </Localized>
        ) : (
          <Empty
            title="Добавьте первое учреждение"
            text="После создания появятся её сотрудники, файлы и разделы портала."
          />
        )}
      </Localized>
    </>
  );
}

function ContentView({
  homeSettings,
  standbySettings,
  onRefresh,
  allItems,
  school,
  activeSection,
  setActiveSection,
  items:sectionItems,
  files,
  query,
  setQuery,
  onAdd,
  onEdit,
  onDelete,
  onUpload,
  onSaveHome,
  onSaveSection,
  onBulkStatus,
  onToggleSection,
}: {
  homeSettings?:React.ReactNode;
  standbySettings?:React.ReactNode;
  onRefresh:()=>Promise<void>;
  school?: SchoolRecord;
  allItems: ContentRecord[];
  activeSection: string;
  setActiveSection: (v: string) => void;
  items: ContentRecord[];
  files: FileRecord[];
  query: string;
  setQuery: (v: string) => void;
  onAdd: (kind?:string,date?:string) => void;
  onEdit: (v: ContentRecord) => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  onSaveHome: (layout: HomeBlock[]) => Promise<void>;
  onSaveSection: (layout: SectionLayout) => Promise<void>;
  onBulkStatus: (ids:string[],status:string)=>Promise<void>;
  onToggleSection: (key:string,enabled:boolean)=>Promise<void>;
}) {
  const portalSections=usePortalSections();const contentSections=standbySettings?[...portalSections,{key:'standby',label:'Режим ожидания',help:'Слайд-шоу и бегущая строка',icon:MonitorSmartphone,accepts:'изображения'}]:portalSections;const type=useInstitution();const t=useInstitutionText();
  const [safetyKind,setSafetyKind]=useState('Безопасность');
  const [eventPane,setEventPane]=useState('events');
  const items=activeSection==='safety'?sectionItems.filter(i=>i.payload.kind===safetyKind):activeSection==='events'?sectionItems.filter(i=>eventPane==='calendar'?i.payload.kind===calendarKind:i.payload.kind!==calendarKind):sectionItems;
  const waiting=allItems.filter(i=>i.section==='events'&&i.payload.kind===calendarKind&&i.status==='review').length;
  const [selected,setSelected]=useState<string[]>([]),[bulkStatus,setBulkStatus]=useState('published'),[pending,setPending]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{setSelected([]);setNotice('');},[activeSection,school?.id]);
  useEffect(()=>{setEventPane('events');setSafetyKind('Безопасность');},[school?.id]);
  async function bulk(){setPending(true);setNotice('');try{await onBulkStatus(selected,bulkStatus);setNotice(`Обновлено материалов: ${selected.length}`);setSelected([]);}catch(e){setNotice(e instanceof Error?e.message:'Ошибка');}finally{setPending(false);}}
  const section = contentSections.find((item) => item.key === activeSection)||portalSections[0];
  useEffect(()=>{if(!contentSections.some(s=>s.key===activeSection))setActiveSection("home");},[activeSection,type,Boolean(standbySettings)]);
  return (
    <>
      <Heading
        eyebrow={school?.name || "Учреждение не выбрано"}
        title="Контент портала"
        text="Только наполнение публичного портала и интерактивной панели — отдельно от аналитики и настроек."
        action={
          <Link
            className="owner-secondary"
            href={`/?schoolId=${encodeURIComponent(school?.id || "")}`}
          >
            <Eye size={18} /> Предпросмотр
          </Link>
        }
      />
      <Localized as="details" className="section-visibility-settings"><Localized as="summary">Настроить разделы учреждения</Localized><Localized as="p">Отключённые разделы скрываются в портале, на устройствах и в меню наполнения. Материалы сохраняются; раздел можно включить снова здесь.</Localized><Localized as="div" className="section-visibility-options">{portalSections.filter(s=>s.key!=='home').map(s=><Localized as="label" key={s.key}><Localized as="input" type="checkbox" disabled={pending} checked={sectionEnabled(school?.sectionLayouts,s.key,school?.institutionType)} onChange={async e=>{const enabled=e.target.checked;setPending(true);try{await onToggleSection(s.key,enabled);}catch(error){setNotice(String(error));}finally{setPending(false);}}}/>{s.label}</Localized>)}</Localized></Localized>
      <Localized as="button" type="button" className="calendar-notification owner-secondary" onClick={()=>{setActiveSection('events');setEventPane('calendar');setQuery('');}} aria-label={`Календарь: ${waiting} на согласовании`}><Bell size={18}/> Календарь{waiting>0&&<Localized as="strong" className="calendar-count">{waiting}</Localized>}<Localized as="span">{waiting?'Ожидают согласования':'Все даты обработаны'}</Localized></Localized>
      {activeSection === "menu" && school && <MealSettings key={school.id} value={sectionLayoutFor(school.sectionLayouts,"menu")} onSave={onSaveSection}/>}

      <Localized as="div" className="content-studio">
        <Localized as="aside" className="portal-structure">
          <Localized as="div">
            <Localized as="p">Структура портала</Localized>
            <Localized as="span">Выберите раздел</Localized>
          </Localized>
          {contentSections.filter(s=>s.key==='standby'||sectionEnabled(school?.sectionLayouts,s.key,school?.institutionType)).map(({ key, label, help, icon: Icon }) => (
            <Localized as="button"
              className={activeSection === key ? "active" : ""}
              key={key}
              onClick={() => {
                setActiveSection(key);
                setQuery("");
              }}
            >
              <Icon size={18} />
              <Localized as="span">
                <Localized as="strong">{label}{key==='events'&&waiting>0&&<Localized as="b" className="calendar-count">{waiting}</Localized>}</Localized>
                <Localized as="small">{help}</Localized>
              </Localized>
            </Localized>
          ))}
        </Localized>
        <Localized as="section" className="content-workbench">
          {activeSection==='standby'?standbySettings:<>
          {activeSection==='home'&&homeSettings}
      {activeSection==='home'&&<Localized as="div" className="home-important-shortcut"><Localized as="button" type="button" className="owner-secondary" onClick={()=>setActiveSection('announcements')}><Bell size={18}/> Важные объявления главной</Localized><Localized as="p">При нескольких опубликованных карточках сообщения сменяются автоматически в карусели.</Localized></Localized>}
      {activeSection==='announcements'&&<Localized as="p" className="owner-notice">Эти сообщения показываются только на главной странице. Карусель появляется автоматически, когда опубликовано несколько карточек.</Localized>}
      {activeSection === "home" && school && (
        <HomepageBuilder school={school} files={files} onSave={onSaveHome} />
      )}
      {activeSection !== "home" && activeSection !== "announcements" && school && (
        <SectionLayoutEditor
          items={allItems}
          section={activeSection}
          value={sectionLayoutFor(school.sectionLayouts, activeSection)}
          onSave={onSaveSection}
        />
      )}

          <Localized as="div" className="workbench-head">
            <Localized as="div" className="section-sign">
              <section.icon size={23} />
              <Localized as="div">
                <Localized as="p">
                  {activeSection === "home"
                    ? "Карточки главной страницы"
                    : "Редактирование раздела"}
                </Localized>
                <Localized as="h2">{section.label}</Localized>
                <Localized as="span">Файлы: {section.accepts}</Localized>
              </Localized>
            </Localized>
            <Localized as="div">
              {activeSection !== "feedback" && (
                <Localized as="button" className="owner-secondary" onClick={onUpload}>
                  <Upload size={17} /> Загрузить и создать материал
                </Localized>
              )}
              <Localized as="button" className="owner-primary" onClick={()=>onAdd(activeSection==='safety'?safetyKind:activeSection==='events'&&eventPane==='calendar'?calendarKind:undefined)}>
                <Plus size={17} />{" "}
                {activeSection === "feedback"
                  ? "Добавить ссылку"
                  : activeSection==="home"?"Добавить карточку баннера":"Добавить вручную"}
              </Localized>
            </Localized>
          </Localized>
          {activeSection==='safety'&&<Localized as="nav" className="admin-safety-tabs" aria-label="Подраздел безопасности">{safetyKinds.map(kind=><Localized as="button" key={kind} type="button" className={kind===safetyKind?'active':''} onClick={()=>{setSafetyKind(kind);setSelected([]);setQuery('');}}>{kind}</Localized>)}</Localized>}
          {activeSection==='events'&&<><Localized as="nav" className="admin-safety-tabs" aria-label="События и календарь">{[['events','События'],['calendar','Учебный календарь']].map(([key,label])=><Localized as="button" key={key} type="button" className={key===eventPane?'active':''} onClick={()=>{setEventPane(key);setSelected([]);setQuery('');}}>{t(label)}{key==='calendar'&&waiting>0&&<Localized as="b" className="calendar-count">{waiting}</Localized>}</Localized>)}</Localized>{eventPane==='calendar'&&school&&<CalendarWorkbench schoolId={school.id} items={allItems} onEdit={id=>{const item=allItems.find(i=>i.id===id);if(item)onEdit(item);}} onCreate={date=>onAdd(calendarKind,date)} onStatus={onBulkStatus} onRefresh={onRefresh}/>}</>}
          {!(activeSection==='events'&&eventPane==='calendar')&&<><Localized as="label" className="owner-search">
            <Search size={17} />
            <Localized as="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Поиск в разделе «${section.label}»`}
            />
          </Localized>
          {activeSection === "feedback" && (
            <Localized as="p" className="integration-note">
              <Localized as="strong">Контакты учреждения</Localized> — адрес, телефон, почта и сайт —
              автоматически берутся из карточки организации. Для каждой
              опубликованной ссылки портал сам определит сервис, покажет его
              значок и создаст QR-код.
            </Localized>
          )}
          <Localized as="div" className="bulk-toolbar"><Localized as="label"><Localized as="input" type="checkbox" checked={items.length>0&&items.every(i=>selected.includes(i.id))} onChange={e=>setSelected(e.target.checked?items.map(i=>i.id):[])}/> Выбрать все показанные</Localized><Localized as="span">Выбрано: {selected.length}</Localized><Localized as="select" aria-label="Статус выбранных материалов" value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}><Localized as="option" value="published">Опубликовать</Localized><Localized as="option" value="draft">В черновики</Localized><Localized as="option" value="review">На согласование</Localized></Localized><Localized as="button" className="owner-primary" disabled={pending||!selected.length} onClick={bulk}>{pending?'Сохранение…':'Применить'}</Localized></Localized><Localized as="p" role="status">{notice}</Localized>
          <Localized as="div" className="content-list">
            {items.length ? (
              items.map((item) => (
                <Localized as="article" key={item.id}>
                  <Localized as="input" type="checkbox" aria-label={`Выбрать ${item.title}`} checked={selected.includes(item.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,item.id]:old.filter(id=>id!==item.id))}/>
                  <Localized as="span" className="content-type-icon">
                    <section.icon size={20} />
                  </Localized>
                  <Localized as="div">
                    <Localized as="strong">{item.title}</Localized>
                    <Localized as="p">
                      {(
                        sectionFields[item.section] ||
                        sectionFields.feedback ||
                        []
                      )
                        .filter(
                          (f) =>
                            item.payload[f.key] !== undefined &&
                            item.payload[f.key] !== "",
                        )
                        .map(
                          (f) => `${f.label}: ${String(item.payload[f.key])}`,
                        )
                        .join(" · ")}
                    </Localized>
                    <Localized as="p">{item.description}</Localized>
                    <Localized as="small">Обновлено {dateLabel(item.updatedAt)}</Localized>
                  </Localized>
                  <Localized as="span" className={`publish-badge ${item.status}`}>
                    {item.status === "published"
                      ? "Опубликовано"
                      : item.status === "review"
                        ? "На согласовании"
                        : "Черновик"}
                  </Localized>
                  <Localized as="button" onClick={() => onEdit(item)}>
                    <Pencil size={17} />
                  </Localized>
                  <Localized as="button"
                    className="danger-icon"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 size={17} />
                  </Localized>
                </Localized>
              ))
            ) : (
              <Empty
                title={
                  activeSection === "feedback"
                    ? "Ссылки пока не добавлены"
                    : "В этом разделе пока пусто"
                }
                text={
                  activeSection === "feedback"
                    ? "Добавьте Instagram, Telegram, WhatsApp, YouTube или другой ресурс школы."
                    : "Добавьте запись вручную или загрузите подготовленный файл."
                }
                action={
                  <Localized as="button" className="owner-primary" onClick={()=>onAdd(activeSection==='safety'?safetyKind:activeSection==='events'&&eventPane==='calendar'?calendarKind:undefined)}>
                    <Plus size={17} />{" "}
                    {activeSection === "feedback"
                      ? "Добавить ссылку"
                      : "Добавить материал"}
                  </Localized>
                }
              />
            )}
          </Localized>
          </>}
          {files.length > 0 && activeSection !== "feedback" && (
            <Localized as="div" className="attached-files">
              <Localized as="p">Файлы учреждения</Localized>
              {files.slice(0, 4).map((file) => (
                <Localized as="a" href={file.url} key={file.id} target="_blank">
                  <FileText size={16} />
                  {file.name}
                  <Localized as="span">{formatBytes(file.size)}</Localized>
                </Localized>
              ))}
            </Localized>
          )}
          </>}
        </Localized>
      </Localized>
    </>
  );
}

function PeopleView({
  people,
  school,
  onAdd,
  onEdit,
  onDelete,
  onPreview,
  onInvite,
}: {
  people: MemberRecord[];
  school?: SchoolRecord;
  onAdd: () => void;
  onEdit: (v: MemberRecord) => void;
  onDelete: (id: string) => void;
  onPreview: (v: MemberRecord) => void;
  onInvite: (v: MemberRecord) => void;
}) {
  return (
    <>
      <Heading
        eyebrow={school?.name || "Школа"}
        title="Люди и роли"
        text="Создайте сотрудника, отправьте приглашение и проверьте его кабинет до передачи доступа."
        action={
          <Localized as="button" className="owner-primary" onClick={onAdd}>
            <Plus size={18} /> Добавить человека
          </Localized>
        }
      />
      <Localized as="section" className="people-table owner-panel">
        <Localized as="div" className="table-head">
          <Localized as="span">Сотрудник</Localized>
          <Localized as="span">Роль</Localized>
          <Localized as="span">Доступ</Localized>
          <Localized as="span">Статус</Localized>
          <Localized as="span" />
        </Localized>
        {people.map((person) => (
          <Localized as="div" className="person-row" key={person.id}>
            <Localized as="span" className="person-name">
              <Localized as="i">
                {person.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((x) => x[0])
                  .join("")}
              </Localized>
              <Localized as="span">
                <Localized as="strong">{person.fullName}</Localized>
                <Localized as="small">{person.position || person.email}</Localized>
              </Localized>
            </Localized>
            <Localized as="span">
              <Localized as="strong">{<RoleName role={person.role}/>}</Localized>
              <Localized as="small">
                {person.schoolId ? school?.shortName : "Вся платформа"}
              </Localized>
            </Localized>
            <Localized as="span">
              <Localized as="strong">
                {person.permissions.includes("*")
                  ? "Все разделы"
                  : `${person.permissions.length} разрешения`}
              </Localized>
              <Localized as="small">
                {person.permissions
                  .slice(0, 2)
                  .map(permissionLabel)
                  .join(" · ")}
              </Localized>
            </Localized>
            <Localized as="span">
              <Localized as="em"
                className={`status-pill ${person.status === "active" ? "active" : "invited"}`}
              >
                {person.status === "active"
                  ? "Активен"
                  : person.status === "blocked"
                    ? "Заблокирован"
                    : "Ожидает входа"}
              </Localized>
            </Localized>
            <Localized as="span" className="row-actions">
              <Localized as="button"
                title="Проверить кабинет"
                onClick={() => onPreview(person)}
              >
                <Eye size={17} />
              </Localized>
              <Localized as="button"
                title="Отправить приглашение"
                onClick={() => onInvite(person)}
              >
                <Mail size={17} />
              </Localized>
              <Localized as="button" title="Редактировать" onClick={() => onEdit(person)}>
                <Pencil size={17} />
              </Localized>
              {person.role !== "platform_owner" && (
                <Localized as="button"
                  title="Удалить"
                  className="danger-icon"
                  onClick={() => onDelete(person.id)}
                >
                  <Trash2 size={17} />
                </Localized>
              )}
            </Localized>
          </Localized>
        ))}
      </Localized>
      <Localized as="p" className="integration-note">
        <Localized as="strong">Как приходит приглашение:</Localized> сейчас кнопка открывает
        готовое письмо в вашей почтовой программе. Для полностью автоматической
        отправки нужно подключить почтовый сервис и подтвердить домен
        отправителя. SMS-восстановление лучше добавить вторым этапом — после
        email-входа.
      </Localized>
    </>
  );
}

function FilesView({
  files,
  query,
  setQuery,
  onUpload,
  onDelete,
}: {
  files: FileRecord[];
  query: string;
  setQuery: (v: string) => void;
  onUpload: () => void;
  onDelete: (f: FileRecord) => void;
}) {
  const portalSections=usePortalSections();const type=useInstitution();const t=useInstitutionText();
  const iconFor = (file: FileRecord) =>
    file.mimeType.includes("spreadsheet") || /\.xlsx?$|\.csv$/i.test(file.name)
      ? FileSpreadsheet
      : file.mimeType.startsWith("image/")
        ? FileImage
        : file.mimeType.includes("pdf")
          ? FileText
          : FileArchive;
  return (
    <>
      <Heading
        eyebrow="Единое хранилище учреждения"
        title="Файлы"
        text="Расписания и меню Excel, схемы здания, документы и фотографии."
        action={
          <Localized as="button" className="owner-primary" onClick={onUpload}>
            <Upload size={18} /> Загрузить файл
          </Localized>
        }
      />
      <Localized as="div" className="file-toolbar">
        <Localized as="label" className="owner-search">
          <Search size={17} />
          <Localized as="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию"
          />
        </Localized>
        <Localized as="span">До 25 МБ</Localized>
      </Localized>
      {files.length ? (
        <Localized as="section" className="file-grid">
          {files.map((file) => {
            const Icon = iconFor(file);
            return (
              <Localized as="article" key={file.id}>
                <Localized as="span" className="file-icon">
                  <Icon size={27} />
                </Localized>
                <Localized as="div">
                  <Localized as="strong">{file.name}</Localized>
                  <Localized as="small">
                    {portalSections.find((s) => s.key === file.category)
                      ?.label || "Файлы"}{" "}
                    · {formatBytes(file.size)}
                  </Localized>
                  <Localized as="small">{dateLabel(file.createdAt)}</Localized>
                </Localized>
                <Localized as="div">
                  <Localized as="a" href={file.url} target="_blank">
                    <Download size={17} />
                  </Localized>
                  <Localized as="button"
                    className="danger-icon"
                    onClick={() => onDelete(file)}
                  >
                    <Trash2 size={17} />
                  </Localized>
                </Localized>
              </Localized>
            );
          })}
        </Localized>
      ) : (
        <Empty
          title="Файлы ещё не загружены"
          text="Добавьте Excel, план этажей, документы или фотографии."
          action={
            <Localized as="button" className="owner-primary" onClick={onUpload}>
              <Upload size={17} /> Выбрать файл
            </Localized>
          }
        />
      )}
    </>
  );
}

function LicensesView({
  schools,
  onAction,
}: {
  schools: SchoolRecord[];
  onAction: (v: string) => void;
}) {
  return (
    <>
      <Heading
        eyebrow="Коммерческое управление STEPLine"
        title="Лицензии"
        text="Сроки действия веб-сервиса, количество экранов и состояние лицензии каждого учреждения."
        action={
          <Localized as="button"
            className="owner-primary"
            onClick={() => onAction("Открыта выдача новой лицензии")}
          >
            <Plus size={18} /> Выдать лицензию
          </Localized>
        }
      />
      <Localized as="section" className="license-table owner-panel">
        <Localized as="div" className="table-head">
          <Localized as="span">Школа</Localized>
          <Localized as="span">Тариф</Localized>
          <Localized as="span">Экраны</Localized>
          <Localized as="span">Действует до</Localized>
          <Localized as="span">Статус</Localized>
          <Localized as="span" />
        </Localized>
        {schools.map((school, index) => (
          <Localized as="div" className="license-row" key={school.id}>
            <Localized as="span">
              <Localized as="strong">{school.name}</Localized>
              <Localized as="small">{school.city}</Localized>
            </Localized>
            <Localized as="span">
              <Localized as="strong">
                {index === 0 ? "Digital School Pro" : "Digital School"}
              </Localized>
              <Localized as="small">облачная лицензия</Localized>
            </Localized>
            <Localized as="span">
              <Localized as="strong">{index === 0 ? "1 из 3" : "0 из 1"}</Localized>
              <Localized as="small">подключено</Localized>
            </Localized>
            <Localized as="span">
              <Localized as="strong">10 сентября 2027</Localized>
              <Localized as="small">365 дней</Localized>
            </Localized>
            <Localized as="span">
              <Localized as="em" className="status-pill active">Активна</Localized>
            </Localized>
            <Localized as="span">
              <Localized as="button"
                className="owner-secondary"
                onClick={() =>
                  onAction(`Открыто управление лицензией: ${school.name}`)
                }
              >
                Управление
              </Localized>
            </Localized>
          </Localized>
        ))}
      </Localized>
    </>
  );
}
function SettingsView({
  school,
  onEdit,
  onAction,
  onTheme,
}: {
  school?: SchoolRecord;
  onEdit: () => void;
  onAction: (v: string) => void;
  onTheme: (key: string) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(true);
  const [savingTheme, setSavingTheme] = useState("");
  const choose = async (key: string) => {
    setSavingTheme(key);
    try {
      await onTheme(key);
    } catch (e) {
      onAction(e instanceof Error ? e.message : "Не удалось применить тему");
    } finally {
      setSavingTheme("");
    }
  };
  return (
    <>
      <Heading
        eyebrow="Параметры клиента"
        title="Настройки"
        text="Оформление, языки и адрес портала учреждения."
      />
      <Localized as="section" className="settings-grid">
        <Localized as="article" className="owner-panel">
          <Localized as="h2">Карточка учреждения</Localized>
          <Localized as="p">
            Название, контакты, собственный цвет и языки берутся из карточки
            организации.
          </Localized>
          <Localized as="div" className="theme-preview">
            <Localized as="span" style={{ background: school?.primaryColor }} />
            <Localized as="div">
              <Localized as="strong">{school?.name}</Localized>
              <Localized as="small">{school?.languages.join(" · ")}</Localized>
            </Localized>
          </Localized>
          <Localized as="button" className="owner-secondary" onClick={onEdit}>
            <Pencil size={17} /> Изменить
          </Localized>
        </Localized>
        <Localized as="article" className="owner-panel">
          <Localized as="h2">Адрес портала</Localized>
          <Localized as="p">Публичная страница доступна посетителям без входа.</Localized>
          <Localized as="code">/?schoolId={school?.id}</Localized>
          <Link
            className="owner-secondary"
            href={`/?schoolId=${encodeURIComponent(school?.id || "")}`}
          >
            <Eye size={17} /> Открыть портал
          </Link>
        </Localized>
        <Localized as="article" className="owner-panel">
          <Localized as="h2">Публикация</Localized>
          <Localized as="p">
            Опубликованные материалы сразу появляются на веб-странице и панели.
          </Localized>
          <Localized as="label" className="toggle-row">
            <Localized as="span">
              <Localized as="strong">Портал {enabled ? "включён" : "приостановлен"}</Localized>
              <Localized as="small">Показывать публичные разделы</Localized>
            </Localized>
            <Localized as="input"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                onAction(
                  e.target.checked
                    ? "Публичный портал включён"
                    : "Публичный портал приостановлен",
                );
              }}
              type="checkbox"
            />
          </Localized>
        </Localized>
      </Localized>
      <Localized as="section" className="theme-library owner-panel">
        <Localized as="div">
          <Localized as="p" className="eyebrow">Только для выбранного учреждения</Localized>
          <Localized as="h2">Визуальная тема портала и админки</Localized>
          <Localized as="span">
            Менять тему могут только пользователи с правом «Настройки учреждения».
          </Localized>
        </Localized>
        <Localized as="div" className="theme-options">
          {schoolThemes.map((theme) => (
            <Localized as="button"
              className={school?.themeKey === theme.key ? "active" : ""}
              disabled={!!savingTheme}
              key={theme.key}
              onClick={() => choose(theme.key)}
            >
              <Localized as="span" className="theme-swatches">
                {theme.colors.map((color) => (
                  <Localized as="i" style={{ background: color }} key={color} />
                ))}
              </Localized>
              <Localized as="strong">{theme.name}</Localized>
              <Localized as="small">{theme.description}</Localized>
              <Localized as="em">
                {savingTheme === theme.key
                  ? "Применение…"
                  : school?.themeKey === theme.key
                    ? "Выбрана"
                    : "Выбрать"}
              </Localized>
            </Localized>
          ))}
        </Localized>
      </Localized>
    </>
  );
}

function EditorDialog({
  editor,
  schools,
  files,
  content,
  busy,
  onClose,
  onSave,
  onUploadFile,
  onRecoverFiles,
}: {
  editor: Exclude<Editor, null>;
  schools: SchoolRecord[];
  files: FileRecord[];
  content: ContentRecord[];
  busy: boolean;
  onClose: () => void;
  onSave: (
    k: "school" | "member" | "content",
    v: SchoolRecord | MemberRecord | ContentRecord,
  ) => Promise<string|null>;
  onRecoverFiles:(schoolId:string)=>Promise<void>;
  onUploadFile: (file: File, category: string) => Promise<FileRecord>;
}) {
  const {language}=useLanguage();
  const [value, setValue] = useState(()=>editor.kind==='content'?editingLanguage(editor.value as ContentRecord,language):editor.value);
  useEffect(()=>{if(editor.kind==='content')setValue(previous=>editingLanguage(previous as ContentRecord,language));},[language]);
  useEffect(()=>{if(editor.kind==="content")void onRecoverFiles((editor.value as ContentRecord).schoolId);},[editor.kind,editor.kind==='content'?(editor.value as ContentRecord).schoolId:'']);
  const update = (field: string, next: unknown) =>
    setValue((current) => ({ ...current, [field]: next }) as typeof current);
  const [fileUploading,setFileUploading]=useState(false);
  const [translating,setTranslating]=useState(false),[translationError,setTranslationError]=useState(''),[requireTranslations,setRequireTranslations]=useState(false);
  useEffect(()=>{if(editor.kind==='content')fetch('/api/translate').then(r=>r.json() as Promise<{configured?:boolean}>).then(d=>setRequireTranslations(d.configured===true)).catch(()=>{});},[editor.kind]);
  async function submit(e: FormEvent) {
    e.preventDefault();if(translating||busy||fileUploading)return;setTranslationError('');
    const form=e.currentTarget as HTMLFormElement;
    if(!form.checkValidity()){const invalid=form.querySelector<HTMLInputElement>(':invalid');setTranslationError(`Проверьте поле: ${invalid?.closest('label')?.textContent?.trim().slice(0,100)||'обязательные данные'}. ${invalid?.validationMessage||''}`);invalid?.scrollIntoView({block:'center'});invalid?.focus();return;}
    if(editor.kind==='content'&&(value as ContentRecord).status==='published'&&requireTranslations){
      setTranslating(true);try{const ready=await fillLanguageVersions(value as ContentRecord,true);setValue(ready);const error=await onSave(editor.kind,ready);if(error)setTranslationError(error);}catch(error){setTranslationError(error instanceof Error?error.message:'Перевод не выполнен. Можно сохранить черновик.');}finally{setTranslating(false);}
    }else {const error=await onSave(editor.kind,value);if(error)setTranslationError(error);}
  }
  return (
    <Localized as="div" className="owner-modal-backdrop" onMouseDown={onClose}>
      <Localized as="form"
        className="owner-editor"
        noValidate
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Localized as="header">
          <Localized as="div">
            <Localized as="p">
              {editor.kind === "school"
                ? "Организация"
                : editor.kind === "member"
                  ? "Пользователь и права"
                  : "Материал портала"}
            </Localized>
            <Localized as="h2">{editor.value.id ? "Редактирование" : "Новая запись"}</Localized>
          </Localized>
          <Localized as="button" type="button" onClick={onClose}>
            <X size={20} />
          </Localized>
        </Localized>
        <Localized as="div" className="editor-fields" inert={translating}>
          {editor.kind === "school" && (
            <SchoolFields value={value as SchoolRecord} update={update} />
          )}
          {editor.kind === "member" && (
            <MemberFields
              value={value as MemberRecord}
              schools={schools}
              update={update}
            />
          )}
          {editor.kind === "content" && (
            <ContentFields
              value={value as ContentRecord}
              files={files}
              content={content}
              update={update}
              onUploadFile={onUploadFile}
              onUploadingChange={setFileUploading}
            />
          )}
        </Localized>
        {editor.kind==='content'&&<Localized as="label" className="translation-publish-option"><Localized as="input" type="checkbox" checked={requireTranslations} disabled={translating} onChange={e=>setRequireTranslations(e.target.checked)}/> Подготовить все три языка перед публикацией (нужен подключённый переводчик или готовые ручные версии)</Localized>}
        {translationError&&<Localized as="p" role="alert" className="translation-error">{translationError}</Localized>}
        <Localized as="footer">
          <Localized as="button" className="owner-secondary" type="button" onClick={onClose}>
            Отмена
          </Localized>
          <Localized as="button" className="owner-primary" disabled={busy||translating||fileUploading}>
            <Save size={17} /> {fileUploading?"Загрузка файла…":busy?"Сохранение…":translating?"Подготовка переводов…":"Сохранить"}
          </Localized>
        </Localized>
      </Localized>
    </Localized>
  );
}
function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Localized as="label" className={wide ? "wide" : ""}>
      <Localized as="span">{label}</Localized>
      {children}
    </Localized>
  );
}
function SchoolFields({
  value,
  update,
}: {
  value: SchoolRecord;
  update: (f: string, v: unknown) => void;
}) {
  return (
    <>
      <Localized as="fieldset" className="wide institution-fieldset"><Localized as="legend">Тип учреждения</Localized><Localized as="div" className="institution-picker">{institutionTypes.map(type=><Localized as="label" key={type} className={institutionType(value.institutionType)===type?'is-selected':''}><Localized as="input" type="radio" name="institutionType" value={type} checked={institutionType(value.institutionType)===type} onChange={()=>{update('institutionType',type);if(!value.id)update('themeKey',({kindergarten:'bright',school:'warm',college:'academic',university:'science'})[type]);}}/><Localized as="strong">{institutionProfiles[type].name}</Localized><Localized as="small">{institutionProfiles[type].description}</Localized></Localized>)}</Localized></Localized>

      <Field label="Полное название" wide>
        <Localized as="input"
          required
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </Field>
      <Field label="Короткое название">
        <Localized as="input"
          required
          value={value.shortName}
          onChange={(e) => update("shortName", e.target.value)}
        />
      </Field>
      <Field label="БИН">
        <Localized as="input"
          value={value.bin}
          onChange={(e) => update("bin", e.target.value)}
        />
      </Field>
      <Field label="Город">
        <Localized as="input"
          value={value.city}
          onChange={(e) => update("city", e.target.value)}
        />
      </Field>
      <Field label="Адрес">
        <Localized as="input"
          value={value.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </Field>
      <Field label={institutionProfiles[institutionType(value.institutionType)].head} wide>
        <Localized as="input"
          value={value.director}
          onChange={(e) => update("director", e.target.value)}
        />
      </Field>
      <Field label="Телефон">
        <Localized as="input"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>
      <Field label="Электронная почта">
        <Localized as="input"
          type="email"
          value={value.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>
      <Field label="Сайт">
        <Localized as="input"
          value={value.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </Field>
      <Field label={institutionProfiles[institutionType(value.institutionType)].learners}>
        <Localized as="input"
          min="0"
          type="number"
          value={value.studentsCount}
          onChange={(e) => update("studentsCount", Number(e.target.value))}
        />
      </Field>
      <Field label="Педагогов">
        <Localized as="input"
          min="0"
          type="number"
          value={value.teachersCount}
          onChange={(e) => update("teachersCount", Number(e.target.value))}
        />
      </Field>
      <Field label="Цвет портала">
        <Localized as="input"
          type="color"
          value={value.primaryColor}
          onChange={(e) => update("primaryColor", e.target.value)}
        />
      </Field>
      <Field label="Языки">
        <Localized as="input"
          value={value.languages.join(", ")}
          onChange={(e) =>
            update(
              "languages",
              e.target.value
                .split(",")
                .map((x) => x.trim().toUpperCase())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <Field label="Статус">
        <Localized as="select"
          value={value.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <Localized as="option" value="active">Активна</Localized>
          <Localized as="option" value="paused">Отключена</Localized>
        </Localized>
      </Field>
    </>
  );
}
function MemberFields({
  value,
  schools,
  update,
}: {
  value: MemberRecord;
  schools: SchoolRecord[];
  update: (f: string, v: unknown) => void;
}) {
  const permissions = [
    "content.read",
    "content.edit",
    "content.publish",
    "members.read",
    "members.manage",
    "files.read",
    "files.manage",
    "devices.read",
    "devices.manage",
    "school.settings",
  ];
  const checked = (p: string) =>
    value.permissions.includes("*") ||
    value.permissions.includes(p) ||
    value.permissions.includes(p.split(".")[0] + ".*");
  const toggle = (p: string) => {
    const expanded = permissions.filter(checked);
    update(
      "permissions",
      checked(p) ? expanded.filter((x) => x !== p) : [...expanded, p],
    );
  };
  const changeRole = (role: string) => {
    update("role", role);
    update("permissions", rolePermissionPresets[role] || ["content.read"]);
  };
  return (
    <>
      <Field label="ФИО" wide>
        <Localized as="input"
          required
          value={value.fullName}
          onChange={(e) => update("fullName", e.target.value)}
        />
      </Field>
      <Field label="Электронная почта">
        <Localized as="input"
          required
          type="email"
          value={value.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>
      <Field label="Телефон">
        <Localized as="input"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>
      <Field label="Должность">
        <Localized as="input"
          placeholder="Например, директор или IT-специалист"
          value={value.position}
          onChange={(e) => update("position", e.target.value)}
        />
      </Field>
      <Field label="Школа">
        <Localized as="select"
          value={value.schoolId ?? ""}
          onChange={(e) => update("schoolId", e.target.value || null)}
        >
          <Localized as="option" value="">Вся платформа</Localized>
          {schools.map((s) => (
            <Localized as="option" key={s.id} value={s.id}>
              {s.name}
            </Localized>
          ))}
        </Localized>
      </Field>
      <Field label="Роль">
        <Localized as="select" value={value.role} onChange={(e) => changeRole(e.target.value)}>
          {Object.entries(institutionRoleLabels(schools.find(s=>s.id===value.schoolId)?.institutionType)).map(([key, label]) => (
            <Localized as="option" key={key} value={key}>
              {label}
            </Localized>
          ))}
        </Localized>
      </Field>
      <Field label="Состояние доступа">
        <Localized as="select"
          value={value.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <Localized as="option" value="invited">Приглашён, ожидает входа</Localized>
          <Localized as="option" value="active">Активен</Localized>
          <Localized as="option" value="blocked">Заблокирован</Localized>
        </Localized>
      </Field>
      <Localized as="div" className="permission-grid wide">
        <Localized as="span">Разрешения</Localized>
        {permissions.map((p) => (
          <Localized as="label" key={p}>
            <Localized as="input"
              checked={checked(p)}
              disabled={value.permissions.includes("*")}
              onChange={() => toggle(p)}
              type="checkbox"
            />
            <Localized as="span">{permissionLabel(p)}</Localized>
          </Localized>
        ))}
      </Localized>
      <Localized as="p" className="field-help wide">
        При выборе роли устанавливается безопасный набор прав, который можно
        изменить вручную. Пользователь должен войти с указанной почтой;
        отдельный пароль STEPLine не создаётся и не хранится.
      </Localized>
    </>
  );
}
function ContentFields({
  value,
  files,
  content,
  update,
  onUploadFile,
  onUploadingChange,
}: {
  value: ContentRecord;
  files: FileRecord[];
  content: ContentRecord[];
  update: (f: string, v: unknown) => void;
  onUploadFile: (file: File, category: string) => Promise<FileRecord>;
  onUploadingChange:(busy:boolean)=>void;
}) {
  const portalSections=usePortalSections();const type=useInstitution();const t=useInstitutionText();
  const teachers = content.filter((x) => x.section === "teachers");
  const [uploading, setUploading] = useState(false),[uploadError,setUploadError]=useState('');
  useEffect(()=>{onUploadingChange(uploading);return()=>onUploadingChange(false);},[uploading,onUploadingChange]);
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input=e.currentTarget;setUploading(true);setUploadError("");
    try {
      const saved = await onUploadFile(file, value.section);
      update("fileId", saved.id);
    } catch(error){setUploadError(error instanceof Error?error.message:"Не удалось загрузить файл");} finally {
      setUploading(false);
      input.value = "";
    }
  };
  return (
    <>
      {value.section === "schedule" && (
        <Field label={type==='kindergarten'?'Занятие':'Предмет'} wide>
          <Localized as="input"
            required
            value={value.title}
            onChange={(e) => {
              update("title", e.target.value);
              update("payload", { ...value.payload, teacher: "" });
            }}
          />
        </Field>
      )}
      {uploadError&&<Localized as="p" role="alert" className="translation-error wide">{uploadError}</Localized>}
      <StructuredFields
        section={value.section}
        payload={value.payload}
        subject={value.title}
        teachers={teachers}
        onChange={(p) => update("payload", p)}
      />
      {value.section==="home"&&<><Field label="Действие при нажатии" wide><Localized as="select" value={String(value.payload.bannerTargetId||"")} onChange={e=>update("payload",{...value.payload,bannerTargetId:e.target.value})}><Localized as="option" value="">Развернуть изображение и описание</Localized>{content.filter(i=>i.status==="published"&&i.section!=="home").map(i=><Localized as="option" key={i.id} value={i.id}>{i.title}</Localized>)}</Localized></Field><Field label="Время показа, секунд"><Localized as="input" type="number" min={5} max={120} value={Number(value.payload.bannerSeconds)||12} onChange={e=>update("payload",{...value.payload,bannerSeconds:Number(e.target.value)})}/></Field><Localized as="label" className="wide"><Localized as="input" type="checkbox" checked={value.payload._bannerEnabled!==false} onChange={e=>update("payload",{...value.payload,_bannerEnabled:e.target.checked})}/> Показывать в карусели главной (после публикации)</Localized></>}
      {standbySections.includes(value.section)&&<Localized as="label" className="wide"><Localized as="input" type="checkbox" checked={value.payload._standbyEnabled===true} onChange={e=>update("payload",{...value.payload,_standbyEnabled:e.target.checked})}/> Отображать в режиме ожидания (также выберите карточку в «Контент портала → Режим ожидания»)</Localized>}
      <EventDateFields section={value.section} payload={value.payload} onChange={p=>update('payload',p)}/>
      {value.section !== "schedule" && (
        <Field
          label={
            (value.section === "safety" || value.section === "events"&&value.payload.kind===calendarKind || value.section==="announcements") ? safetyText(value.section==='announcements'?'Важные объявления':value.payload.kind).title : value.section === "students" ? t("ФИО ученика") : value.section === "teachers"
              ? t("ФИО преподавателя")
              : value.section === "feedback"
                ? "Название ресурса"
                : "Название"
          }
          wide
        >
          <Localized as="input"
            required
            placeholder={
              value.section === "feedback" ? "Например, Instagram школы" : ""
            }
            value={value.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </Field>
      )}
      {value.section!=="students"&&<Field label={(value.section==='safety'||value.section==='events'&&value.payload.kind===calendarKind||value.section==='announcements')?safetyText(value.section==='announcements'?'Важные объявления':value.payload.kind).description:"Описание"} wide>
        <Localized as="textarea"
          rows={5}
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>}
      <Field label="Раздел">
        <Localized as="select"
          value={value.section}
          onChange={(e) => update("section", e.target.value)}
        >
          {portalSections.map((s) => (
            <Localized as="option" key={s.key} value={s.key}>
              {s.label}
            </Localized>
          ))}
        </Localized>
      </Field>
      <Field label="Статус">
        <Localized as="select"
          value={value.status}
          onChange={(e) => {
            update("status", e.target.value);
            if (e.target.value === "published") update("visible", true);
          }}
        >
          <Localized as="option" value="draft">Черновик</Localized>
          <Localized as="option" value="review">На согласовании</Localized>
          <Localized as="option" value="published">Опубликовано</Localized>
        </Localized>
      </Field>
      <Field label="Дата публикации">
        <Localized as="input"
          type="datetime-local"
          value={value.publishAt?.slice(0, 16) || ""}
          onChange={(e) => update("publishAt", e.target.value || null)}
        />
      </Field>
      <Field label="Скрыть после">
        <Localized as="input"
          type="datetime-local"
          value={value.expiresAt?.slice(0, 16) || ""}
          onChange={(e) => update("expiresAt", e.target.value || null)}
        />
      </Field>
      {value.section !== "feedback" && (
        <Field label={(value.section==='safety'||value.section==='events'&&value.payload.kind===calendarKind||value.section==='announcements')?safetyText(value.section==='announcements'?'Важные объявления':value.payload.kind).file:"Изображение или файл"} wide>
          <Localized as="div" className="inline-file-picker">
            <Localized as="select"
              value={value.fileId || ""}
              onChange={(e) => update("fileId", e.target.value || null)}
            >
              <Localized as="option" value="">Без файла</Localized>
              {files.map((f) => (
                <Localized as="option" key={f.id} value={f.id}>
                  {f.name}
                </Localized>
              ))}
            </Localized>
            <Localized as="label" className="owner-secondary">
              <Upload size={16} />
              {uploading ? "Загрузка…" : "Загрузить новый"}
              <Localized as="input"
                hidden
                disabled={uploading}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.svg,.dwg,.dxf,video/*"
                onChange={upload}
              />
            </Localized>
          </Localized>
          {value.fileId&&<Localized as="div" className="attached-file-preview"><Localized as="strong">Прикреплён: {files.find(f=>f.id===value.fileId)?.name||"файл"}</Localized>{["students","teachers"].includes(value.section)&&<Localized as="img" src={`/api/files/${encodeURIComponent(value.fileId)}`} alt="Выбранная фотография"/>}</Localized>}
          <Localized as="small">
            Новый файл сразу загрузится в хранилище учреждения и будет выбран для
            этой записи.
          </Localized>
        </Field>
      )}
      {value.section === "feedback" && (
        <Localized as="p" className="field-help wide">
          Введите полную ссылку, начиная с https://. Значок сервиса и
          сканируемый QR-код будут созданы автоматически.
        </Localized>
      )}
      <Localized as="label" className="toggle-row wide">
        <Localized as="span">
          <Localized as="strong">Показывать на портале</Localized>
          <Localized as="small">После публикации материал увидят посетители</Localized>
        </Localized>
        <Localized as="input"
          checked={value.visible}
          onChange={(e) => update("visible", e.target.checked)}
          type="checkbox"
        />
      </Localized>

      {['events','clubs','news','about','achievements'].includes(value.section)&&<Localized as="section" className="wide gallery-editor"><Localized as="h3">Дополнительные фотографии</Localized><Localized as="p">До 20 изображений. На портале галерея откроется внутри подробной карточки.</Localized><Localized as="div" className="gallery-options">{files.filter(f=>['image/png','image/jpeg','image/webp'].includes(f.mimeType)).map(f=><Localized as="label" key={f.id}><Localized as="input" type="checkbox" checked={Array.isArray(value.payload.galleryIds)&&value.payload.galleryIds.includes(f.id)} onChange={e=>{const ids=Array.isArray(value.payload.galleryIds)?value.payload.galleryIds as string[]:[];update('payload',{...value.payload,galleryIds:e.target.checked?[...ids,f.id].slice(0,20):ids.filter(id=>id!==f.id)});}}/>{f.name}</Localized>)}</Localized><Localized as="label" className="owner-secondary">{uploading?'Загрузка…':'Загрузить фотографии'}<Localized as="input" hidden type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={async e=>{const input=e.target,chosen=Array.from(input.files||[]);setUploading(true);try{const ids=Array.isArray(value.payload.galleryIds)?value.payload.galleryIds as string[]:[];for(const file of chosen.slice(0,20-ids.length)){const saved=await onUploadFile(file,value.section);ids.push(saved.id);}update('payload',{...value.payload,galleryIds:[...ids]});}finally{setUploading(false);input.value='';}}}/></Localized></Localized>}
      <LanguageVersions value={value} files={files} update={update} />
    </>
  );
}
