"use client";

import { Bell, ClipboardList, Info, Languages, LayoutDashboard, Siren, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AlertPanel } from "@/components/AlertPanel";
import { BottomSheet, type SheetSnap } from "@/components/BottomSheet";
import { BrandMark } from "@/components/BrandMark";
import { HAZARD_ICON } from "@/components/icons";
import { MapView } from "@/components/map/MapView";
import { ReportsList } from "@/components/ReportsList";
import { MobileSimulationButton, SimulationPanel } from "@/components/SimulationPanel";
import { SosForm } from "@/components/SosForm";
import { buttonClass } from "@/components/ui";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { AppStateProvider, useAppState } from "@/lib/store";
import { useGuidanceRoute } from "@/lib/use-guidance-route";

type Tab = "alert" | "sos" | "reports";

export function RescueApp() {
  return (
    <I18nProvider>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </I18nProvider>
  );
}

function Shell() {
  const { t, locale, setLocale, pick } = useI18n();
  const { scenario, inZone, offline, reports } = useAppState();
  const guidance = useGuidanceRoute();
  const [tab, setTab] = useState<Tab>("alert");
  const [snap, setSnap] = useState<SheetSnap>("half");
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Forms and lists get the whole screen on phones; the alert leaves room for the map.
  const openTab = (next: Tab) => {
    setTab(next);
    setSnap(next === "alert" ? "half" : "full");
  };

  const pending = reports.filter((r) => r.status === "queued" || r.status === "failed").length;
  const ScenarioIcon = scenario ? HAZARD_ICON[scenario.hazard] : Bell;

  // svh: the screen with the browser's toolbars showing, so nothing ends up behind them.
  return (
    <div className="flex h-svh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 bg-brand-navy px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 text-white">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight font-bold">{t("appName")}</h1>
          <p className="truncate text-xs text-slate-300/80">{t("prototypeBadge")}</p>
        </div>
        <Link href="/dashboard" className={`${buttonClass("header", "md")} md:h-8 md:px-3 md:text-xs`}>
          <LayoutDashboard size={15} aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("opsLink")}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          aria-label={t("switchLang")}
          className={`${buttonClass("header", "md")} md:h-8 md:px-3 md:text-xs`}
        >
          <Languages size={15} aria-hidden />
          <span className="sm:hidden">{t("switchLangShort")}</span>
          <span className="hidden sm:inline">{t("switchLang")}</span>
        </button>
      </header>

      <p className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/60 dark:text-amber-200">
        <Info size={14} className="shrink-0" aria-hidden />
        <span className={disclaimerOpen ? "" : "hidden md:inline"}>{t("disclaimer")}</span>
        {!disclaimerOpen && <span className="truncate md:hidden">{t("disclaimerShort")}</span>}
        <button
          type="button"
          onClick={() => setDisclaimerOpen((o) => !o)}
          className="shrink-0 font-semibold underline underline-offset-2 md:hidden"
        >
          {disclaimerOpen ? t("showLess") : t("showMore")}
        </button>
      </p>
      {offline && (
        <p className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-1.5 text-center text-xs text-white">
          <WifiOff size={14} className="shrink-0" aria-hidden />
          {t("offlineBanner")}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="relative min-h-0 flex-1 md:order-2">
          <MapView guidance={guidance} />
          {scenario && (
            <div className="pointer-events-none absolute inset-x-14 top-3 z-[1000] flex justify-center md:inset-x-3">
              <div
                className={`flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg md:px-4 md:py-2 md:text-sm ${
                  inZone ? "bg-red-600 shadow-red-600/30" : "bg-slate-900/85 backdrop-blur"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                <ScenarioIcon size={15} className="shrink-0" aria-hidden />
                <span className="truncate">{pick(scenario.name)}</span>
              </div>
            </div>
          )}
          <MobileSimulationButton />
          <div className="absolute end-3 bottom-3 z-[1000] hidden md:block">
            <SimulationPanel />
          </div>
        </main>

        <BottomSheet
          snap={snap}
          onSnap={setSnap}
          className="md:order-1 md:w-[420px] md:border-e md:border-slate-200 dark:md:border-slate-800"
        >
          <nav
            className="mx-3 grid shrink-0 grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 md:m-3 md:mb-0 dark:bg-slate-800/70"
            role="tablist"
          >
            <TabButton active={tab === "alert"} onClick={() => openTab("alert")} icon={ScenarioIcon}>
              {t("tabAlert")}
              {scenario && inZone && <AlertDot />}
            </TabButton>
            <TabButton active={tab === "sos"} onClick={() => openTab("sos")} icon={Siren} danger>
              {t("tabSos")}
            </TabButton>
            <TabButton active={tab === "reports"} onClick={() => openTab("reports")} icon={ClipboardList}>
              {t("tabReports")}
              {pending > 0 && <CountBadge n={pending} />}
            </TabButton>
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {tab === "alert" && <AlertPanel guidance={guidance} />}
            {tab === "sos" && <SosForm onSent={() => openTab("reports")} />}
            {tab === "reports" && <ReportsList />}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}

function AlertDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
    </span>
  );
}

function CountBadge({ n }: { n: number }) {
  const { formatNumber } = useI18n();
  return (
    <span className="rounded-full bg-amber-500 px-1.5 text-[11px] leading-4 font-bold text-white">
      {formatNumber(n)}
    </span>
  );
}

function TabButton({
  active,
  danger,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
        active
          ? `bg-white shadow-sm dark:bg-slate-900 ${danger ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`
          : danger
            ? "text-red-600 hover:bg-white/60 dark:text-red-400 dark:hover:bg-slate-900/60"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      <Icon size={16} strokeWidth={2.2} aria-hidden />
      {children}
    </button>
  );
}
