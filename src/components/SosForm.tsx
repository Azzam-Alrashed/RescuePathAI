"use client";

import {
  Camera,
  CircleCheck,
  ClipboardList,
  Hourglass,
  ImageUp,
  MapPin,
  Mic,
  PenLine,
  Plus,
  Siren,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { HAZARD_ICON, HAZARD_TONE } from "@/components/icons";
import { AffectedCounter } from "@/components/report/AffectedCounter";
import { PhotoInput, type PhotoState } from "@/components/report/PhotoInput";
import { QuickSos } from "@/components/report/QuickSos";
import { VoiceInput } from "@/components/report/VoiceInput";
import { Button, Card, SectionTitle } from "@/components/ui";
import { affected, SENSITIVE_GROUPS } from "@/lib/affected";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { AffectedCounts, HazardType, ImageAnalysis, ReportChannel, SosInput } from "@/lib/types";

const HAZARD_OPTIONS: (HazardType | "unknown")[] = ["trapped", "flood", "fire", "missile", "collapse", "unknown"];

type Method = "camera" | "upload" | "voice" | "text";

const METHODS: { id: Method; icon: LucideIcon }[] = [
  { id: "camera", icon: Camera },
  { id: "upload", icon: ImageUp },
  { id: "voice", icon: Mic },
  { id: "text", icon: PenLine },
];

export function SosForm({ onSent }: { onSent: () => void }) {
  const { t, pick } = useI18n();
  const { userPos, submitSos, offline, scenario } = useAppState();

  const [method, setMethod] = useState<Method>("upload");
  const [hazard, setHazard] = useState<HazardType | "unknown">(scenario?.hazard ?? "unknown");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [counts, setCounts] = useState<AffectedCounts>(affected({ adults: 1 }));
  const [shareVulnerable, setShareVulnerable] = useState(false);
  const [queuedNotice, setQueuedNotice] = useState(false);
  const [applied, setApplied] = useState(false);
  const [sent, setSent] = useState(false);

  const hasSensitive = SENSITIVE_GROUPS.some((g) => counts[g] > 0);

  function onPhoto(next: PhotoState | null) {
    setPhoto(next);
    setApplied(false);
    if (next?.analysis) applyAnalysis(next.analysis);
  }

  /** Pre-fill the report from what the photo shows; the resident can still change it. */
  function applyAnalysis(a: ImageAnalysis) {
    setHazard(a.hazard);
    setDescription((d) => d || pick(a.findings));
    setApplied(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const usesPhoto = (method === "camera" || method === "upload") && photo;
    const channel: ReportChannel = usesPhoto ? "photo" : method === "voice" ? "voice" : "text";
    const input: SosInput = {
      hazard,
      description: description.trim(),
      affected: counts,
      shareVulnerable: hasSensitive && shareVulnerable,
      position: userPos,
      channel,
      photo: usesPhoto ? photo.photo : undefined,
      photoAnalysis: usesPhoto ? (photo.analysis ?? undefined) : undefined,
    };
    submitSos(input);
    setDescription("");
    setPhoto(null);
    setApplied(false);
    if (offline) setQueuedNotice(true);
    else setSent(true);
  }

  const isPhoto = method === "camera" || method === "upload";

  if (sent) return <SentScreen onTrack={onSent} onNew={() => setSent(false)} />;

  return (
    <form onSubmit={submit} className="space-y-3">
      <QuickSos onSent={onSent} />

      <div className="flex items-center gap-3 px-1 pt-2">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">{t("orDescribe")}</h2>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      {queuedNotice && offline && (
        <p className="flex gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-500/10 dark:text-amber-200">
          <Hourglass size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t("sosQueued")}
        </p>
      )}

      <Card>
        <SectionTitle icon={Sparkles}>{t("methodTitle")}</SectionTitle>
        <div className="mb-4 grid grid-cols-4 gap-1.5" role="tablist">
          {METHODS.map(({ id, icon: Icon }) => {
            const active = method === id;
            return (
              <button
                type="button"
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setMethod(id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-[11px] leading-tight font-semibold transition ${
                  active
                    ? "border-brand-navy bg-brand-navy text-white dark:border-white dark:bg-white dark:text-brand-navy"
                    : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300"
                }`}
              >
                <Icon size={19} aria-hidden />
                {t(`method_${id}`)}
              </button>
            );
          })}
        </div>

        {isPhoto && <PhotoInput key={method} mode={method} hint={hazard} value={photo} onChange={onPhoto} />}
        {method === "voice" && <VoiceInput hint={hazard} transcript={description} onTranscript={setDescription} />}

        {applied && isPhoto && (
          <p className="mt-3 flex gap-1.5 text-xs text-violet-700 dark:text-violet-300">
            <Sparkles size={13} className="mt-0.5 shrink-0" aria-hidden />
            {t("analysisApplied")}
          </p>
        )}

        {method !== "voice" && (
          <label className={`block ${isPhoto ? "mt-3" : ""}`}>
            <span className="mb-2 block text-sm font-bold">{t("sosDescription")}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              dir="auto"
              placeholder={t("sosDescriptionPlaceholder")}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:focus:bg-slate-900"
            />
          </label>
        )}
      </Card>

      <Card>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">{t("sosHazard")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {HAZARD_OPTIONS.map((h) => {
              const Icon = HAZARD_ICON[h];
              const selected = hazard === h;
              return (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHazard(h)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-2.5 text-xs leading-tight font-medium transition ${
                    selected
                      ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                      : "border-transparent bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-red-600 text-white" : HAZARD_TONE[h]}`}
                  >
                    <Icon size={18} strokeWidth={2.2} aria-hidden />
                  </span>
                  {h === "unknown" ? t("sosUnknown") : pick(HAZARD_LABELS[h])}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card>
        <SectionTitle icon={Users}>{t("affectedTitle")}</SectionTitle>
        <p className="-mt-1.5 mb-3 text-xs text-slate-500 dark:text-slate-400">{t("affectedHint")}</p>
        <AffectedCounter value={counts} onChange={setCounts} />
        {hasSensitive && (
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-sky-50 p-3 text-xs text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
            <input
              type="checkbox"
              checked={shareVulnerable}
              onChange={(e) => setShareVulnerable(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
            />
            {t("sosConsent")}
          </label>
        )}
      </Card>

      <div className="flex gap-2.5 px-1 text-xs text-slate-500 dark:text-slate-400">
        <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{t("sosLocation")}: </span>
          <span dir="ltr" className="tabular-nums">
            {userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}
          </span>
          <br />
          {t("sosLocationHint")}
        </p>
      </div>

      {/* Stays in reach while scrolling the form on a phone. */}
      <div className="sticky -bottom-3 z-10 -mx-3 bg-gradient-to-t from-slate-50 from-70% to-transparent px-3 pt-4 pb-3 dark:from-slate-950">
        <Button
          type="submit"
          variant="danger"
          size="lg"
          icon={Siren}
          className="w-full"
          disabled={isPhoto && !!photo?.pending}
        >
          {t("sosSend")}
        </Button>
      </div>
    </form>
  );
}

const SENT_REDIRECT_MS = 4000;

/** Confirmation after sending, then on to "My reports" unless the resident starts another report. */
function SentScreen({ onTrack, onNew }: { onTrack: () => void; onNew: () => void }) {
  const { t } = useI18n();
  const track = useEffectEvent(onTrack);

  useEffect(() => {
    const timer = setTimeout(track, SENT_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="flex flex-col items-center py-10 text-center">
      <span className="rpa-pop flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <CircleCheck size={44} aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-bold" role="status">
        {t("sentTitle")}
      </h2>
      <p className="mt-2 max-w-72 text-sm text-slate-600 dark:text-slate-300">{t("sentBody")}</p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
        <Button variant="primary" size="lg" icon={ClipboardList} onClick={onTrack} className="flex-1">
          {t("trackReport")}
        </Button>
        <Button size="lg" icon={Plus} onClick={onNew} className="flex-1">
          {t("newReport")}
        </Button>
      </div>
    </Card>
  );
}
