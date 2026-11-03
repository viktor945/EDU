"use client";
import {TeacherFacts} from "./person-facts";
import {TeacherResume} from "./teacher-resume";
import {MealDirectory} from "./meal-directory";
import {usePortalData} from './portal-data';
import {InstitutionProvider,useInstitution,useInstitutionText} from "./institution-context";
import {EventsCenter} from './events-center';
import {calendarKind} from './calendar-model';
import {SafetyCenter} from "./safety-center";
import {sectionEnabled} from "./portal-navigation";
import {RecordCard, StudentsDirectory} from "./record-details";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useLanguage, LanguageSwitch } from "./language-context";
import { localize, tr } from "./i18n";
import { fieldsFor } from "./content-model";
import { sectionLayoutFor, type SectionLayout } from "./school-design";
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Mail,
  MapPin,
  Maximize2,
  Minimize2,
  Phone,
  UserRound,
  X,
} from "lucide-react";
export type PublicItem = {
  id: string;
  section: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  file_id?: string | null;
  translationMissing?: boolean;
  file_mime_type?: string;
};
function sectionBlock(layout: SectionLayout, id: string) {
  return layout.blocks.find((block) => block.id === id);
}
function sectionBlockStyle(
  layout: SectionLayout,
  id: string,
): React.CSSProperties {
  const block = sectionBlock(layout, id);
  return {
    display: block?.visible === false ? "none" : undefined,
    gridColumn: `span ${block?.span || 12}`,
    gridRow: `span ${block?.height || 1}`,
    minHeight: `${160 + ((block?.height || 1) - 1) * 170}px`,
    order: Math.max(
      0,
      layout.blocks.findIndex((item) => item.id === id),
    ),
  };
}
export function usePublicContent() {
  const { language } = useLanguage();
  const type=useInstitution();const tr=useInstitutionText();
  const state=usePortalData();
  const {schoolId,status}=state;
  useEffect(() => {
    const root = document.documentElement;
    const updateViewport = () => {
      const viewport = window.visualViewport;
      const width = Math.round(viewport?.width || window.innerWidth);
      const height = Math.round(viewport?.height || window.innerHeight);
      root.style.setProperty("--portal-vw", `${width}px`);
      root.style.setProperty("--portal-vh", `${height}px`);
      root.style.setProperty(
        "--portal-ratio",
        String(width / Math.max(height, 1)),
      );
      root.dataset.portalOrientation =
        width >= height ? "landscape" : "portrait";
      root.dataset.portalDevice =
        width < 720 ? "phone" : width < 1180 ? "tablet" : "display";
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    document.addEventListener("fullscreenchange", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      document.removeEventListener("fullscreenchange", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, []);
  return {
    ...state,
    items: state.items.map((i) => localize(i, language)),
    schoolId,
    status: tr(status, language),
    href: (path: string) => `${path}?schoolId=${encodeURIComponent(schoolId)}&lang=${language}`,
  };
}
export function PublicRecords({
  section, items, school,
}: {section: string; items: PublicItem[]; school?: Record<string, unknown> | null}) {
  return <InstitutionProvider type={school?.institution_type}><BlockContentContext.Provider value={{items, readOnly: section === 'feedback'}}>
    {section==='events'?<EventsCenter items={items}><StandardPublicRecords section={section} items={items.filter(i=>i.section!=='events'||i.payload.kind!==calendarKind)} school={school}/></EventsCenter>:<StandardPublicRecords section={section} items={items} school={school} />}
  </BlockContentContext.Provider></InstitutionProvider>;
}
const BlockContentContext = createContext<{items: PublicItem[]; readOnly: boolean}>({items: [], readOnly: false});
function SectionGrid({layout, children, className = ''}: {layout: SectionLayout; children: React.ReactNode; className?: string}) {
  const {items, readOnly} = useContext(BlockContentContext);
  return <div className={`public-section-layout ${className}`}>{children}{layout.blocks.filter(block => block.visible && block.sourceSection!=='announcements' && block.id.startsWith('custom-')).map(block => {
      const rows = items.filter(item => item.section === block.sourceSection && (!block.recordIds?.length || block.recordIds.includes(item.id)));
      return <section key={block.id} className={`public-section-region custom-section-block custom-mode-${block.mode || 'cards'}`} style={sectionBlockStyle(layout, block.id)}>
        <h2>{block.title}</h2><div className="custom-block-items">{rows.map(item => <RecordCard key={item.id} item={item} items={items} readOnly={readOnly} />)}</div>{!rows.length && <p>Нет опубликованных материалов</p>}
      </section>;
    })}</div>;
}
function StandardPublicRecords({
  section,
  items,
  school,
}: {
  section: string;
  items: PublicItem[];
  school?: Record<string, unknown> | null;
}) {
  const { language } = useLanguage();
  const type=useInstitution();const tr=useInstitutionText();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const fields = fieldsFor(section,type);
  const layout = sectionLayoutFor(school?.section_layouts, section);
  const filterKeys =
    section === "schedule"
      ? ["className", "day", "shift", "teacher", "room"]
      : section === "menu"
        ? ["day", "date", "meal"]
        : section === "clubs"
          ? ["category", "className"]
          : section === "map"
            ? ["floor", "building"]
            : ["category","kind","className","faculty","specialty"];
  const rows = items.filter(
    (r) =>
      r.section === section ||
      (section === "feedback" && r.section === "links"),
  );
  const visible = rows
    .filter(
      (r) =>
        `${r.title} ${r.description}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        Object.entries(filters).every(
          ([key, value]) => !value || String(r.payload[key] ?? "") === value,
        ),
    )
    .sort((a, b) =>
      String(a.payload.start || a.payload.date || "").localeCompare(
        String(b.payload.start || b.payload.date || ""),
      ),
    );
  if (!sectionEnabled(school?.section_layouts, section,school?.institution_type)) return <p>{tr("Раздел отключён школой", language)}</p>;
  if (section === "menu") return <SectionGrid layout={layout}><section className="public-section-region region-content" style={sectionBlockStyle(layout,"content")}><MealDirectory rows={rows} items={items} layout={layout}/></section></SectionGrid>;
  if (section === "safety") return <SafetyCenter items={items} layout={layout}/>;
  if (section === "students") return <StudentsDirectory rows={rows} items={items} />;
  if (section === "teachers")
    return <TeachersDirectory rows={rows} layout={layout} />;
  if (section === "map") return <SchoolMap rows={rows} layout={layout} />;
  if (section === "feedback")
    return <ContactCenter rows={rows} school={school} layout={layout} />;
  return (
    <section className="managed-records">
      <LanguageSwitch />
      <SectionGrid layout={layout}>
        <section
          className="public-section-region region-filters"
          style={sectionBlockStyle(layout, "filters")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "filters")?.title||"",language)}
          </h2>
          <div className="data-filters">
            <label>
              {tr("Поиск", language)}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("Название или описание", language)}
              />
            </label>
            {fields
              .filter((f) => filterKeys.includes(f.key))
              .map((f) => (
                <label key={f.key}>
                  {tr(f.label, language)}
                  <select
                    value={filters[f.key] || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, [f.key]: e.target.value })
                    }
                  >
                    <option value="">{tr("Все", language)}</option>
                    {Array.from(
                      new Set(
                        rows
                          .map((r) => String(r.payload[f.key] ?? ""))
                          .filter(Boolean),
                      ),
                    )
                      .sort()
                      .map((v) => (
                        <option key={v} value={v}>
                          {tr(v, language)}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
          </div>
        </section>
        <section
          className="public-section-region region-content"
          style={sectionBlockStyle(layout, "content")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "content")?.title||"",language)}
          </h2>
          {!visible.length && (
            <div className="owner-empty">
              <h2>
                {tr(
                  rows.length
                    ? "Ничего не найдено"
                    : "Пока нет опубликованных материалов",
                  language,
                )}
              </h2>
              <p>
                {tr(
                  rows.length
                    ? "Измените фильтры или поисковый запрос."
                    : "Материалы появятся после публикации школой.",
                  language,
                )}
              </p>
            </div>
          )}
          {section === "schedule" &&
          layout.mode === "list" &&
          visible.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      "Класс",
                      "День",
                      "Время",
                      "Предмет",
                      "Учитель",
                      "Кабинет",
                      "Изменения",
                    ].map((t) => (
                      <th key={t}>{tr(t, language)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {String(r.payload.className || "")}
                        <small>
                          {type!=="kindergarten"&&tr("Смена", language)}{" "}
                          {String(r.payload.shift || "")}{" "}
                          {String(r.payload.group || "")}
                        </small>
                      </td>
                      <td>{tr(String(r.payload.day || ""), language)}</td>
                      <td>
                        {String(r.payload.start || "")}–
                        {String(r.payload.end || "")}
                      </td>
                      <td>{r.title}</td>
                      <td>{String(r.payload.teacher || "")}</td>
                      <td>{String(r.payload.room || "")}</td>
                      <td>{String(r.payload.change || r.description)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`record-grid managed-layout mode-${layout.mode} height-${layout.height} fit-${layout.imageFit}`}
              style={
                { "--section-columns": layout.columns } as React.CSSProperties
              }
            >
              {visible.map(r => <RecordCard key={r.id} item={r} items={items} />)}
            </div>
          )}
        </section>
      </SectionGrid>
    </section>
  );
}

type ContactService = { name: string; favicon: string; accent: string };
function contactService(raw: string, title: string): ContactService {
  let host = "";
  try {
    host = new URL(raw).hostname.replace(/^www\./, "");
  } catch {}
  if (host.includes("instagram"))
    return {
      name: "Instagram",
      favicon: "https://www.instagram.com/favicon.ico",
      accent: "#d62976",
    };
  if (host.includes("t.me") || host.includes("telegram"))
    return {
      name: "Telegram",
      favicon: "https://telegram.org/favicon.ico",
      accent: "#229ed9",
    };
  if (host.includes("whatsapp") || host.includes("wa.me"))
    return {
      name: "WhatsApp",
      favicon: "https://www.whatsapp.com/favicon.ico",
      accent: "#25d366",
    };
  if (host.includes("youtube") || host.includes("youtu.be"))
    return {
      name: "YouTube",
      favicon: "https://www.youtube.com/favicon.ico",
      accent: "#ff0033",
    };
  if (host.includes("tiktok"))
    return {
      name: "TikTok",
      favicon: "https://www.tiktok.com/favicon.ico",
      accent: "#111",
    };
  if (host.includes("facebook"))
    return {
      name: "Facebook",
      favicon: "https://www.facebook.com/favicon.ico",
      accent: "#1877f2",
    };
  if (host.includes("vk.com"))
    return {
      name: "VK",
      favicon: "https://vk.com/favicon.ico",
      accent: "#2787f5",
    };
  return {
    name: title || host || "Сайт",
    favicon: host ? `https://${host}/favicon.ico` : "",
    accent: "#1e5a46",
  };
}
function ContactCenter({
  rows,
  school,
  layout,
}: {
  rows: PublicItem[];
  school?: Record<string, unknown> | null;
  layout: SectionLayout;
}) {
  const { language } = useLanguage();
  const type=useInstitution();const tr=useInstitutionText();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const links = rows.filter((r) =>
    /^https?:\/\//i.test(String(r.payload.url || "")),
  );
  useEffect(() => {
    let active = true;
    Promise.all(
      links.map(
        async (r) =>
          [
            r.id,
            await QRCode.toDataURL(String(r.payload.url), {
              width: 480,
              margin: 2,
              errorCorrectionLevel: "M",
              color: { dark: "#173f35", light: "#ffffff" },
            }),
          ] as const,
      ),
    ).then((entries) => {
      if (active) setCodes(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [links.map((r) => `${r.id}:${r.payload.url}`).join("|")]);
  const phone = String(school?.phone || "");
  const email = String(school?.email || "");
  const address = String(school?.address || "");
  const website = String(school?.website || "");
  return (
    <section className="managed-records contact-center">
      <LanguageSwitch />
      <SectionGrid layout={layout}>
        <section
          className="public-section-region region-contacts"
          style={sectionBlockStyle(layout, "contacts")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "contacts")?.title||"",language)}
          </h2>
          <div className="school-contact-strip">
            {address && (
              <div>
                <MapPin />
                <span>
                  <small>{tr("Адрес", language)}</small>
                  <strong>{address}</strong>
                </span>
              </div>
            )}
            {phone && (
              <div>
                <Phone />
                <span>
                  <small>{tr("Телефон", language)}</small>
                  <strong>{phone}</strong>
                </span>
              </div>
            )}
            {email && (
              <div>
                <Mail />
                <span>
                  <small>{tr("Электронная почта", language)}</small>
                  <strong>{email}</strong>
                </span>
              </div>
            )}
            {website && (
              <div>
                <Globe2 />
                <span>
                  <small>{tr("Сайт", language)}</small>
                  <strong>{website}</strong>
                </span>
              </div>
            )}
          </div>
        </section>
        <section
          className="public-section-region region-links"
          style={sectionBlockStyle(layout, "links")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "links")?.title||"",language)}
          </h2>
          {links.length ? (
            <div
              className={`qr-contact-grid managed-layout mode-${layout.mode} height-${layout.height} ${links.length <= 2 ? "is-large" : links.length > 6 ? "is-dense" : ""}`}
              style={
                { "--section-columns": layout.columns } as React.CSSProperties
              }
            >
              {links.map((r) => {
                const url = String(r.payload.url);
                const service = contactService(url, r.title);
                return (
                  <article
                    className="qr-contact-card"
                    key={r.id}
                    style={
                      {
                        "--service-accent": service.accent,
                      } as React.CSSProperties
                    }
                  >
                    <div className="service-heading">
                      <span className="service-icon">
                        {service.favicon && (
                          <img
                            src={service.favicon}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <b>{service.name.slice(0, 2).toUpperCase()}</b>
                      </span>
                      <span>
                        <strong>{r.title || service.name}</strong>
                        <small>{service.name}</small>
                      </span>
                    </div>
                    <div className="qr-code-frame">
                      {codes[r.id] ? (
                        <img
                          src={codes[r.id]}
                          alt={`${tr("QR-код", language)}: ${r.title || service.name}`}
                        />
                      ) : (
                        <span className="qr-loading" />
                      )}
                    </div>
                    {r.description && <p>{r.description}</p>}
                    <small className="qr-hint">
                      {language === 'EN' ? 'Scan with your phone' : language === 'KZ' ? 'Телефон камерасымен сканерлеңіз' : 'Наведите камеру своего телефона'}
                    </small>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="owner-empty">
              <h2>{tr("Ссылки пока не добавлены", language)}</h2>
              <p>{tr("Контакты школы доступны выше.", language)}</p>
            </div>
          )}
        </section>
      </SectionGrid>
    </section>
  );
}

function TeachersDirectory({
  rows,
  layout,
}: {
  rows: PublicItem[];
  layout: SectionLayout;
}) {
  const { language } = useLanguage();
  const type=useInstitution();const tr=useInstitutionText();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const subjects = Array.from(
    new Set(
      rows.flatMap((r) =>
        String(r.payload.subjects || "")
          .split(/[,;\n]/)
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ),
  ).sort();
  const visible = rows.filter(
    (r) =>
      `${r.title} ${r.payload.subjects} ${r.payload.classes}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!subject ||
        String(r.payload.subjects || "")
          .split(/[,;\n]/)
          .map((x) => x.trim())
          .includes(subject)),
  );
  return (
    <section className="managed-records">
      <LanguageSwitch />
      <SectionGrid layout={layout}>
        <section
          className="public-section-region region-filters"
          style={sectionBlockStyle(layout, "filters")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "filters")?.title||"",language)}
          </h2>
          <div className="data-filters">
            <label>
              {tr("Поиск", language)}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("Преподаватель или класс", language)}
              />
            </label>
            <label>
              {tr("Предмет", language)}
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">{tr("Все", language)}</option>
                {subjects.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section
          className="public-section-region region-content"
          style={sectionBlockStyle(layout, "content")}
        >
          <h2 className="public-region-title">
            {tr(sectionBlock(layout, "content")?.title||"",language)}
          </h2>
          {!visible.length ? (
            <div className="owner-empty">
              <h2>
                {tr(
                  rows.length
                    ? "Ничего не найдено"
                    : "Пока нет опубликованных материалов",
                  language,
                )}
              </h2>
            </div>
          ) : (
            <div
              className={`teacher-grid managed-layout mode-${layout.mode} height-${layout.height} fit-${layout.imageFit}`}
              style={
                { "--section-columns": layout.columns } as React.CSSProperties
              }
            >
              {visible.map((r) => (
                <TeacherResume key={r.id} item={r}/>
              ))}
            </div>
          )}
        </section>
      </SectionGrid>
    </section>
  );
}

function SchoolMap({
  rows,
  layout,
}: {
  rows: PublicItem[];
  layout: SectionLayout;
}) {
  const { language } = useLanguage();
  const type=useInstitution();const tr=useInstitutionText();
  const isPlan = (r: PublicItem) =>
    r.payload.kind === "План эвакуации" ||
    Boolean(
      r.file_id &&
      /эвакуац|evacuation|эвакуация/i.test(`${r.title} ${r.description}`),
    );
  const plans = rows.filter(isPlan);
  const rooms = rows.filter((r) => !isPlan(r));
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | "square"
  >("landscape");
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fullscreenSize, setFullscreenSize] = useState({ width: 0, height: 0 });
  const lightboxCanvasRef = useRef<HTMLDivElement>(null);
  const active = plans[index % Math.max(plans.length, 1)];
  useEffect(() => {
    if (plans.length < 2 || expanded) return;
    const timer = window.setInterval(
      () => setIndex((v) => (v + 1) % plans.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [plans.length, expanded]);
  useEffect(() => {
    if (index >= plans.length) setIndex(0);
  }, [index, plans.length]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [expanded]);
  useEffect(() => {
    if (!expanded || !naturalSize.width || !naturalSize.height) return;
    const canvas = lightboxCanvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const availableWidth = Math.max(1, rect.width - 24);
      const availableHeight = Math.max(1, rect.height - 24);
      const scale = Math.min(
        availableWidth / naturalSize.width,
        availableHeight / naturalSize.height,
      );
      setFullscreenSize({
        width: Math.floor(naturalSize.width * scale),
        height: Math.floor(naturalSize.height * scale),
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, [expanded, naturalSize.width, naturalSize.height]);
  const renderMedia = (fullscreen = false) => (
    <>
      {active?.file_id && active.file_mime_type === "application/pdf" ? (
        <iframe
          title={active.title}
          src={`/api/files/${active.file_id}#toolbar=0`}
        />
      ) : active?.file_id ? (
        <img
          key={active.file_id}
          className={`plan-image is-${orientation}`}
          src={`/api/files/${active.file_id}`}
          alt={active.title}
          style={
            fullscreen && fullscreenSize.width && fullscreenSize.height
              ? ({
                  "--plan-width": `${fullscreenSize.width}px`,
                  "--plan-height": `${fullscreenSize.height}px`,
                } as React.CSSProperties)
              : undefined
          }
          title={
            fullscreen
              ? tr("Нажмите, чтобы уменьшить", language)
              : tr("Нажмите, чтобы развернуть", language)
          }
          onClick={() => fullscreen && setExpanded(false)}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setNaturalSize({ width: naturalWidth, height: naturalHeight });
            setOrientation(
              Math.abs(naturalWidth - naturalHeight) <
                Math.max(naturalWidth, naturalHeight) * 0.08
                ? "square"
                : naturalHeight > naturalWidth
                  ? "portrait"
                  : "landscape",
            );
          }}
        />
      ) : (
        <div className="plan-empty">
          {tr("Планы эвакуации не загружены", language)}
        </div>
      )}
    </>
  );
  const controls = plans.length > 1 && (
    <footer>
      <button
        aria-label="Предыдущий план"
        onClick={() => setIndex((v) => (v - 1 + plans.length) % plans.length)}
      >
        <ChevronLeft />
      </button>
      <div>
        {plans.map((plan, i) => (
          <button
            aria-label={plan.title}
            className={i === index ? "active" : ""}
            key={plan.id}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      <button
        aria-label="Следующий план"
        onClick={() => setIndex((v) => (v + 1) % plans.length)}
      >
        <ChevronRight />
      </button>
    </footer>
  );
  return (
    <section className="managed-records">
      <LanguageSwitch />
      <SectionGrid layout={layout} className="evacuation-layout">
        <article
          className="evacuation-viewer"
          style={sectionBlockStyle(layout, "plan")}
        >
          <header>
            <div>
              <p className="eyebrow">
                {active?.title || tr("План эвакуации", language)}
              </p>
              <h2>
                {sectionBlock(layout, "plan")?.title ||
                  tr("План эвакуации", language)}
              </h2>
              <span>
                {active?.payload.floor
                  ? `${tr("Этаж", language)} ${active.payload.floor}`
                  : ""}
              </span>
            </div>
            <button onClick={() => setExpanded(true)}>
              <Maximize2 size={18} /> {tr("Развернуть", language)}
            </button>
          </header>
          <div
            className={`evacuation-canvas ${active?.file_id ? "is-clickable" : ""}`}
            role={active?.file_id ? "button" : undefined}
            tabIndex={active?.file_id ? 0 : undefined}
            aria-label={
              active?.file_id
                ? tr("Развернуть план на весь экран", language)
                : undefined
            }
            onClick={() => active?.file_id && setExpanded(true)}
            onKeyDown={(event) => {
              if (
                active?.file_id &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                setExpanded(true);
              }
            }}
          >
            {renderMedia()}
          </div>
          {controls}
        </article>
        <aside
          className="room-directory"
          style={sectionBlockStyle(layout, "rooms")}
        >
          <header>
            <p className="eyebrow">{tr("Кабинеты", language)}</p>
            <h2>
              {sectionBlock(layout, "rooms")?.title ||
                tr("Этажи и кабинеты", language)}
            </h2>
          </header>
          <div
            className={`managed-layout mode-${layout.mode} height-${layout.height}`}
            style={
              { "--section-columns": layout.columns } as React.CSSProperties
            }
          >
            {rooms.map((r) => (
              <article key={r.id}>
                <span>
                  {String(r.payload.floor || "—")} {tr("Этаж", language)}
                </span>
                <strong>{String(r.payload.room || r.title)}</strong>
                <p>{String(r.payload.subject || r.title)}</p>
                {r.payload.teacher && (
                  <small>{String(r.payload.teacher)}</small>
                )}
              </article>
            ))}
          </div>
        </aside>
      </SectionGrid>
      {expanded &&
        createPortal(
          <div
            className="plan-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={active?.title || tr("План эвакуации", language)}
            onMouseDown={() => setExpanded(false)}
          >
            <article
              className="plan-lightbox-card"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header>
                <div>
                  <p className="eyebrow">{tr("План эвакуации", language)}</p>
                  <h2>
                    {active?.title ||
                      tr("Планы эвакуации не загружены", language)}
                  </h2>
                  <span>
                    {active?.payload.floor
                      ? `${tr("Этаж", language)} ${active.payload.floor}`
                      : ""}
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  aria-label={tr("Уменьшить", language)}
                >
                  <Minimize2 size={20} />
                  <span>{tr("Уменьшить", language)}</span>
                  <X size={20} />
                </button>
              </header>
              <div className="plan-lightbox-canvas" ref={lightboxCanvasRef}>
                {renderMedia(true)}
              </div>
              {controls}
            </article>
          </div>,
          document.body,
        )}
    </section>
  );
}
