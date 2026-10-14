"use client";

import { Bell, ClipboardList, Info, Languages, LayoutDashboard, Siren, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AlertPanel } from "@/components/AlertPanel";
import { BrandMark } from "@/components/BrandMark";
import { HAZARD_ICON } from "@/components/icons";
import { MapView } from "@/components/map/MapView";
import { ReportsList } from "@/components/ReportsList";
import { SimulationPanel } from "@/components/SimulationPanel";
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
  const { t, locale, setLocale, pick, formatNumber } = useI18n();
  const { scenario, inZone, offline, reports } = useAppState();
  const guidance = useGuidanceRoute();
  const [tab, setTab] = useState<Tab>("alert");

  const pending = reports.filter((r) => r.status === "queued" || r.status === "failed").length;
  const ScenarioIcon = scenario ? HAZARD_ICON[scenario.hazard] : Bell;

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 bg-brand-navy px-4 py-2.5 text-white">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight font-bold">{t("appName")}</h1>
          <p className="truncate text-xs text-slate-300/80">{t("prototypeBadge")}</p>
        </div>
        <Link href="/dashboard" className={buttonClass("header", "sm")} aria-label={t("opsLink")}>
          <LayoutDashboard size={15} aria-hidden />
          <span className="hidden sm:inline">{t("opsLink")}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className={buttonClass("header", "sm")}
        >
          <Languages size={15} aria-hidden />
          {t("switchLang")}
        </button>
      </header>

      <p className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/60 dark:text-amber-200">
        <Info size={14} className="shrink-0" aria-hidden />
        {t("disclaimer")}
      </p>
      {offline && (
        <p className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-1.5 text-center text-xs text-white">
          <WifiOff size={14} className="shrink-0" aria-hidden />
          {t("offlineBanner")}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 flex min-h-0 flex-1 flex-col border-slate-200 md:order-1 md:w-[420px] md:flex-none md:border-e dark:border-slate-800">
          <nav
            className="m-3 mb-0 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800/70"
            role="tablist"
          >
            <TabButton active={tab === "alert"} onClick={() => setTab("alert")} icon={ScenarioIcon}>
              {t("tabAlert")}
              {scenario && inZone && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
              )}
            </TabButton>
            <TabButton active={tab === "sos"} onClick={() => setTab("sos")} icon={Siren} danger>
              {t("tabSos")}
            </TabButton>
            <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={ClipboardList}>
              {t("tabReports")}
              {pending > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 text-[11px] leading-4 font-bold text-white">
                  {formatNumber(pending)}
                </span>
              )}
            </TabButton>
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === "alert" && <AlertPanel guidance={guidance} />}
            {tab === "sos" && <SosForm onSent={() => setTab("reports")} />}
            {tab === "reports" && <ReportsList />}
          </div>
        </aside>

        <main className="relative order-1 h-[45dvh] md:order-2 md:h-auto md:flex-1">
          <MapView guidance={guidance} />
          {scenario && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg ${
                  inZone ? "bg-red-600 shadow-red-600/30" : "bg-slate-900/85 backdrop-blur"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                <ScenarioIcon size={16} aria-hidden />
                {pick(scenario.name)}
              </div>
            </div>
          )}
          <div className="absolute end-3 bottom-3 z-[1000]">
            <SimulationPanel />
          </div>
        </main>
      </div>
    </div>
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
          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      <Icon size={16} strokeWidth={2.2} aria-hidden />
      {children}
    </button>
  );
}
