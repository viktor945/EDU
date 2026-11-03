"use client";
import {LessonClock} from '../../lesson-clock';
import {experienceFor} from '../../experience-model';
import {institutionLabels,institutionText} from "../../institution-context";
import {visiblePortalSections} from "../../portal-navigation";
import { useLanguage } from "../../language-context";
import { sectionNames, tr } from "../../i18n";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronRight,
  LogIn,
  Home,
  CalendarDays,
  Bell,
  UsersRound,
  Trophy,
  Utensils,
  MapPin,
  Newspaper,
  FileText,
  School,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PublicRecords, usePublicContent } from "../../public-content";
import { schoolThemeClass } from "../../school-design";
const icons = {
  home: Home,
  schedule: CalendarDays,
  events: Bell,
  clubs: UsersRound,
  achievements: Trophy,
  menu: Utensils,
  map: MapPin,
  news: Newspaper,
  documents: FileText,
  about: School,
  feedback: MessageCircle,
  students: UsersRound,
  teachers: UsersRound,
};
export default function ManagedExperience({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const data = usePublicContent();
  const labels = institutionLabels(data.school?.institution_type,language);
  const tr=(text:string,lang:typeof language)=>institutionText(text,data.school?.institution_type,lang);
  const [navOpen, setNavOpen] = useState(false);
  const Icon = icons[slug as keyof typeof icons] || FileText;
  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [navOpen]);
  if(!data.ready||!data.school)return <main className="portal-loading" role="status">{data.status}</main>;
  return (
    <main
      className={`school-shell section-shell ${schoolThemeClass(data.school?.theme_key)}`}
    >
      <button
        className="mobile-menu-trigger portal-mobile-menu"
        aria-label="Открыть меню"
        aria-expanded={navOpen}
        onClick={() => setNavOpen(true)}
      >
        <Menu size={23} />
      </button>
      <button
        className={`mobile-nav-backdrop ${navOpen ? "is-open" : ""}`}
        aria-label="Закрыть меню"
        onClick={() => setNavOpen(false)}
      />
      <aside className={`school-sidebar ${navOpen ? "is-open" : ""}`}>
        <button
          className="school-sidebar-close"
          aria-label="Закрыть меню"
          onClick={() => setNavOpen(false)}
        >
          <X size={22} />
        </button>
        <Link className="brand-lockup brand-link" href={data.href("/")}>
          <span className="brand-mark">
            <ShieldCheck size={38} />
          </span>
          <span className="brand-copy">
            <strong>STEPLine</strong>
            <em>EDU</em>
          </span>
        </Link>
        <div className="school-name">
          <span />
          <p>{String(data.school?.name || "Школьный портал")}</p>
        </div>
        <nav className="sidebar-nav">
          {visiblePortalSections(data.school?.section_layouts,data.school?.institution_type).map((key) => {
            const label = labels[key];
            const NavIcon = icons[key as keyof typeof icons] || FileText;
            return (
              <Link
                prefetch={false}
                className={`nav-item ${key === slug ? "is-active" : ""}`}
                href={data.href(key === "home" ? "/" : `/section/${key}`)}
                key={key}
                onClick={() => setNavOpen(false)}
              >
                <NavIcon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <Link prefetch={false} className="staff-login" href="/admin">
          <LogIn size={21} /> {tr("Войти сотруднику", language)}{" "}
          <ChevronRight size={20} />
        </Link>
      </aside>
      <section className="portal-content section-portal">
        <div className="section-breadcrumb">
          <Link href={data.href("/")}>{labels.home}</Link>
          <ChevronRight size={14} />
          {labels[slug]}
        </div>
        <section className="section-page-hero section-tone-green section-hero-with-clock">
          <span className="section-hero-icon">
            <Icon size={35} />
          </span>
          <div>
            <p className="eyebrow">{tr("Цифровой центр школы", language)}</p>
            <h1>{labels[slug]}</h1>
            <p>{String(data.school?.name || "")}</p>
          </div>
          {experienceFor(data.school.section_layouts).clockEnabled&&<LessonClock compact items={data.items} settings={experienceFor(data.school.section_layouts)} institutionType={data.school.institution_type}/>}
        </section>
        {slug === "about" && data.school && (
          <article className="record-card">
            <h2>{String(data.school.name)}</h2>
            <p>{String(data.school.address || "")}</p>
            <p>
              {String(data.school.phone || "")} ·{" "}
              {String(data.school.email || "")}
            </p>
            <p>
              {tr("Руководитель", language)}:{" "}
              {String(data.school.director || "")}
            </p>
          </article>
        )}
        <PublicRecords
          key={slug}
          section={slug}
          items={data.items}
          school={data.school}
        />
        <footer className="section-status" role="status">
          {data.status}
        </footer>
      </section>
    </main>
  );
}
