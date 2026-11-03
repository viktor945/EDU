"use client";
import {HomeAnnouncements} from './home-announcements';
import {HomeOverview} from "./home-overview";
import {HomeStage} from "./home-stage";
import {institutionLabels,institutionText} from "./institution-context";
import { useLanguage } from "./language-context";
import {visiblePortalSections} from "./portal-navigation";
import { normalizeLanguage, tr } from "./i18n";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Home,
  Info,
  LogIn,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  School,
  ShieldCheck,
  Trophy,
  UsersRound,
  Utensils,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePublicContent } from "./public-content";
import { days } from "./content-model";
import { schoolThemeClass } from "./school-design";

const navigation = [
  { label: "Ученики", icon: UsersRound, href: "/section/students" },
  { label: "Главная", icon: Home, href: "/" },
  { label: "Расписание", icon: CalendarDays, href: "/section/schedule" },
  { label: "События", icon: Bell, href: "/section/events" },
  { label: "Кружки", icon: UsersRound, href: "/section/clubs" },
  { label: "Преподаватели", icon: UsersRound, href: "/section/teachers" },
  { label: "Достижения", icon: Trophy, href: "/section/achievements" },
  { label: "Меню", icon: Utensils, href: "/section/menu" },
  { label: "Карта школы", icon: MapPin, href: "/section/map" },
  { label: "Новости", icon: Newspaper, href: "/section/news" },
  { label: "Обратная связь", icon: MessageCircle, href: "/section/feedback" },
  { label: "О школе", icon: School, href: "/section/about" },
  { label: "Документы", icon: FileText, href: "/section/documents" },
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HomePage() {
  const [now, setNow] = useState(() => new Date());
  const [navOpen, setNavOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const managed = usePublicContent();
  const labels=institutionLabels(managed.school?.institution_type,language);
  const tr=(text:string,lang:typeof language)=>institutionText(text,managed.school?.institution_type,lang);
  const today = days[(new Date().getDay() + 6) % 7];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
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

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(
        language === "KZ" ? "kk-KZ" : language === "EN" ? "en-GB" : "ru-RU",
        { day: "numeric", month: "long", year: "numeric" },
      ).format(now),
    [now, language],
  );
  const timeLabel = useMemo(() => formatTime(now), [now]);
  const schoolName =
    typeof managed.school?.name === "string"
      ? managed.school.name
      : "Школьный портал";
  const welcome = managed.items.find((item) => item.section === "home");

  if(!managed.ready||!managed.school)return <main className="portal-loading" role="status">{managed.status}</main>;
  return (
    <main
      className={`school-shell ${schoolThemeClass(managed.school?.theme_key)}`}
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
      <aside
        className={`school-sidebar ${navOpen ? "is-open" : ""}`}
        aria-label="Навигация школы"
      >
        <button
          className="school-sidebar-close"
          aria-label="Закрыть меню"
          onClick={() => setNavOpen(false)}
        >
          <X size={22} />
        </button>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <ShieldCheck size={38} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong>STEPLine</strong>
            <em>EDU</em>
          </span>
        </div>

        <div className="school-name">
          <span />
          <p>{schoolName}</p>
        </div>

        <nav className="sidebar-nav">
          {visiblePortalSections(managed.school?.section_layouts,managed.school?.institution_type).map(key => ({label:labels[key],icon:navigation.find(n => n.href === (key === "home" ? "/" : `/section/${key}`))?.icon||FileText,href:key === "home" ? "/" : `/section/${key}`})).map(({ label, icon: Icon, href }) => (
            <Link
              prefetch={false}
              className={
                label === "Главная" ? "nav-item is-active" : "nav-item"
              }
              href={managed.href(href)}
              key={label}
              onClick={() => setNavOpen(false)}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{tr(label, language)}</span>
            </Link>
          ))}
        </nav>

        <Link prefetch={false} className="staff-login" href="/admin">
          <span className="login-icon">
            <LogIn size={21} />
          </span>
          <span>{tr("Войти сотруднику", language)}</span>
          <ChevronRight size={20} />
        </Link>
      </aside>

      <section className="portal-content">
        <header className="portal-topbar">
          <div className="date-time">
            <span>
              <CalendarDays size={20} />
              {todayLabel}
            </span>
            <i />
            <span>
              <Clock3 size={21} />
              {timeLabel}
            </span>
          </div>

          <div className="topbar-actions">
            <div className="language-switch" aria-label="Выбор языка">
              {["KZ", "RU", "EN"].map((item) => (
                <button
                  aria-pressed={language === item}
                  className={language === item ? "is-active" : ""}
                  key={item}
                  onClick={() => setLanguage(normalizeLanguage(item))}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="online-status">
              <Wifi size={18} />
              {tr("Система онлайн", language)}
            </span>
          </div>
        </header>

        <HomeStage school={managed.school} items={managed.items}/>

        <HomeAnnouncements items={managed.items}/>
        <HomeOverview school={managed.school} items={managed.items} href={managed.href}/>

        <div className="selection-toast" role="status">
          <span>{managed.status}</span>
          <span>STEPLine EDU · {language}</span>
        </div>
      </section>
    </main>
  );
}
