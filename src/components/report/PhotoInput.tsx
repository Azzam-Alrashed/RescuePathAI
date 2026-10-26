"use client";

import { Camera, ImageUp, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { AnalysisCard } from "@/components/report/AnalysisCard";
import { useI18n } from "@/lib/i18n";
import type { HazardType, ImageAnalysis } from "@/lib/types";

const MAX_SIDE_PX = 1024;

/** Downscales a photo to a JPEG data URL so it is quick to send and analyse. */
async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export interface PhotoState {
  photo: string;
  analysis: ImageAnalysis | null;
  /** The analysis request is still running. */
  pending: boolean;
}

/**
 * Take or upload an incident photo, then show the AI analysis of it.
 * "camera" opens the rear camera on phones; elsewhere both behave like an upload.
 */
export function PhotoInput({
  mode,
  hint,
  value,
  onChange,
}: {
  mode: "camera" | "upload";
  hint: HazardType | "unknown";
  value: PhotoState | null;
  onChange: (next: PhotoState | null) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const analyzing = !!value?.pending;

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(false);
    let photo: string;
    try {
      photo = await downscale(file);
    } catch {
      setError(true);
      return;
    }
    onChange({ photo, analysis: null, pending: true });
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, hint }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onChange({ photo, analysis: (await res.json()) as ImageAnalysis, pending: false });
    } catch {
      // Offline or server down: keep the photo, report without the analysis.
      setError(true);
      onChange({ photo, analysis: null, pending: false });
    }
  }

  if (value) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img
            src={value.photo}
            alt={t("photoAttached")}
            className={`max-h-64 w-full object-contain ${analyzing ? "opacity-60" : ""}`}
          />
          {analyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <span className="rpa-scan absolute inset-x-0 h-0.5 bg-violet-400 shadow-[0_0_12px_2px] shadow-violet-400" />
              <LoaderCircle size={28} className="animate-spin" aria-hidden />
              <span className="text-sm font-bold">{t("photoAnalyzing")}</span>
              <span className="px-4 text-center text-xs opacity-80">{t("photoAnalyzingSteps")}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setError(false);
              onChange(null);
            }}
            className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label={t("photoRemove")}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {error && <p className="text-xs text-amber-700 dark:text-amber-300">{t("photoError")}</p>}
        {value.analysis && <AnalysisCard analysis={value.analysis} />}
      </div>
    );
  }

  const Icon = mode === "camera" ? Camera : ImageUp;
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={mode === "camera" ? "environment" : undefined}
        className="sr-only"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center transition hover:border-violet-400 hover:bg-violet-50/50 dark:border-slate-700 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/5"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <Icon size={24} aria-hidden />
        </span>
        <span className="text-sm font-bold">{mode === "camera" ? t("photoTake") : t("photoChoose")}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t("photoHint")}</span>
      </button>
      {error && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("photoError")}</p>}
    </div>
  );
}
