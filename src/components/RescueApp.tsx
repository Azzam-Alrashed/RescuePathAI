"use client";

import { useState } from "react";
import { AlertPanel } from "@/components/AlertPanel";
import { MapView } from "@/components/map/MapView";
import { ReportsList } from "@/components/ReportsList";
import { SimulationPanel } from "@/components/SimulationPanel";
import { SosForm } from "@/components/SosForm";
import { HAZARD_ICONS, I18nProvider, useI18n } from "@/lib/i18n";
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

  const pending = reports.filter((r) => r.status === "queued" || r.status === "failed").length;

  return (
    <div className="flex h-dvh flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 bg-slate-900 px-4 py-2.5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-lg">🛟</div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{t("appName")}</h1>
          <p className="truncate text-xs text-slate-400">{t("prototypeBadge")}</p>
        </div>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          {t("switchLang")}
        </button>
      </header>

      <p className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        ⚠️ {t("disclaimer")}
      </p>
      {offline && (
        <p className="bg-slate-800 px-4 py-1.5 text-center text-xs text-white">📵 {t("offlineBanner")}</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 flex min-h-0 flex-1 flex-col border-slate-200 md:order-1 md:w-[400px] md:flex-none md:border-e dark:border-slate-800">
          <nav className="flex border-b border-slate-200 dark:border-slate-800" role="tablist">
            <TabButton active={tab === "alert"} onClick={() => setTab("alert")}>
              {scenario ? HAZARD_ICONS[scenario.hazard] : "🔔"} {t("tabAlert")}
              {scenario && inZone && <span className="ms-1 inline-block h-2 w-2 animate-ping rounded-full bg-red-600" />}
            </TabButton>
            <TabButton active={tab === "sos"} onClick={() => setTab("sos")} danger>
              🆘 {t("tabSos")}
            </TabButton>
            <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
              📋 {t("tabReports")}
              {pending > 0 && (
                <span className="ms-1 rounded-full bg-amber-500 px-1.5 text-xs text-white">{pending}</span>
              )}
            </TabButton>
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "alert" && <AlertPanel guidance={guidance} />}
            {tab === "sos" && <SosForm onSent={() => setTab("reports")} />}
            {tab === "reports" && <ReportsList />}
          </div>
        </aside>

        <main className="relative order-1 h-[45dvh] md:order-2 md:h-auto md:flex-1">
          <MapView guidance={guidance} />
          {scenario && inZone && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center">
              <div className="animate-pulse rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                {HAZARD_ICONS[scenario.hazard]} {pick(scenario.name)}
              </div>
            </div>
          )}
          <div className="absolute bottom-3 end-3 z-[1000]">
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
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 border-b-2 py-3 text-sm font-semibold transition ${
        active
          ? danger
            ? "border-red-600 text-red-600"
            : "border-slate-900 text-slate-900 dark:border-white dark:text-white"
          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
