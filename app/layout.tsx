import {OfflineStatus} from './offline-status';
import {PortalLinkGuard} from "./portal-link-guard";
import {PortalExperience} from "./portal-experience";
import {ClockTimeProvider} from './clock-time';
import { LanguageProvider } from "./language-context";
import {PortalDataProvider} from './portal-data';
import {Suspense} from 'react';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./content-workspace.css";
import "./display.css";
import "./editor-responsive.css";
import './calendar.css';
import './portal-polish.css';
import './experience.css';
import './experience-responsive.css';
import './admin/experience-editor.css';

export const metadata: Metadata = {
  formatDetection: { telephone: false, email: false, address: false },
  title: "STEPLine EDU — цифровой центр школы",
  description:
    "Расписание, события, кружки, достижения и школьные сервисы в единой цифровой платформе.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider><ClockTimeProvider><Suspense fallback={<main className="portal-loading" role="status">Загрузка учреждения…</main>}><PortalDataProvider><PortalLinkGuard/><PortalExperience/><OfflineStatus/>{children}</PortalDataProvider></Suspense></ClockTimeProvider></LanguageProvider>
      </body>
    </html>
  );
}
