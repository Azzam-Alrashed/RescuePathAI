"use client";

import { Info, LoaderCircle, Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { Bilingual, HazardType } from "@/lib/types";

// Speech-to-text is simulated in the prototype: these stand in for the transcript.
const SAMPLE_TRANSCRIPTS: Record<HazardType | "unknown", Bilingual> = {
  flood: {
    ar: "الحقونا، المياه دخلت البيت ووصلت للركبة، معنا أطفال وجدّتي ما تقدر تمشي",
    en: "Please help, water is inside the house up to our knees, we have kids and my grandmother can't walk",
  },
  fire: {
    ar: "فيه حريق في الشقة اللي جنبنا والدخان مالي الدرج، ما نقدر ننزل",
    en: "There's a fire in the flat next to us and the stairwell is full of smoke, we can't get down",
  },
  missile: {
    ar: "سمعنا انفجار قوي وطاحت شظايا على الشارع، فيه شخص مصاب عند البوابة",
    en: "We heard a loud blast and debris fell on the street, someone is injured by the gate",
  },
  road: {
    ar: "صار حادث بين سيارتين عند الإشارة، واحد من السواقين ينزف",
    en: "Two cars crashed at the traffic light, one of the drivers is bleeding",
  },
  trapped: {
    ar: "إحنا محبوسين في المصعد بعد انقطاع الكهرباء، ثلاثة أشخاص",
    en: "We're stuck in the lift after the power cut, three people",
  },
  unknown: {
    ar: "نحتاج مساعدة بسرعة، فيه ناس محتاجين إنقاذ هنا",
    en: "We need help quickly, there are people here who need rescuing",
  },
};

type Phase = "idle" | "recording" | "transcribing" | "done";

/** Records a voice note, then shows a (simulated) transcript the resident can edit. */
export function VoiceInput({
  hint,
  transcript,
  onTranscript,
}: {
  hint: HazardType | "unknown";
  transcript: string;
  onTranscript: (text: string) => void;
}) {
  const { t, pick, locale, formatNumber } = useI18n();
  const [phase, setPhase] = useState<Phase>(transcript ? "done" : "idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => () => void (audioUrl && URL.revokeObjectURL(audioUrl)), [audioUrl]);

  function transcribe() {
    setPhase("transcribing");
    setTimeout(() => {
      onTranscript(pick(SAMPLE_TRANSCRIPTS[hint]));
      setPhase("done");
    }, 1400);
  }

  async function start() {
    setMicError(false);
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        transcribe();
      };
      recorder.current = rec;
      rec.start();
      setPhase("recording");
    } catch {
      // No microphone or permission denied: still show the flow with a sample.
      setMicError(true);
      transcribe();
    }
  }

  const mmss = `${formatNumber(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {phase !== "done" && (
        <div className="flex flex-col items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => (phase === "recording" ? recorder.current?.stop() : phase === "idle" && start())}
            disabled={phase === "transcribing"}
            aria-label={phase === "recording" ? t("voiceStop") : t("voiceStart")}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition ${
              phase === "recording" ? "bg-red-600 shadow-red-600/30" : "bg-brand-navy hover:scale-105 dark:bg-slate-700"
            }`}
          >
            {phase === "recording" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-40" aria-hidden />
            )}
            {phase === "recording" ? (
              <Square size={26} fill="currentColor" aria-hidden />
            ) : phase === "transcribing" ? (
              <LoaderCircle size={30} className="animate-spin" aria-hidden />
            ) : (
              <Mic size={32} aria-hidden />
            )}
          </button>
          <span className="text-sm font-semibold" aria-live="polite">
            {phase === "recording" ? (
              <span className="flex items-center gap-2 text-red-600">
                {t("voiceRecording")}{" "}
                <span className="tabular-nums" dir="ltr">
                  {mmss}
                </span>
              </span>
            ) : phase === "transcribing" ? (
              t("voiceTranscribing")
            ) : (
              t("voiceStart")
            )}
          </span>
          {phase === "recording" && (
            <div className="flex h-6 items-end gap-1" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  className="rpa-wave w-1 rounded-full bg-red-500"
                  style={{ animationDelay: `${(i % 6) * 0.12}s` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <>
          {audioUrl && <audio src={audioUrl} controls className="h-10 w-full" />}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
              {t("voiceTranscript")}
            </span>
            <textarea
              value={transcript}
              onChange={(e) => onTranscript(e.target.value)}
              rows={3}
              maxLength={2000}
              dir={locale === "ar" ? "rtl" : "auto"}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:focus:bg-slate-900"
            />
          </label>
          <Button
            size="sm"
            icon={RotateCcw}
            onClick={() => {
              onTranscript("");
              setAudioUrl(null);
              setPhase("idle");
            }}
          >
            {t("voiceRetake")}
          </Button>
        </>
      )}

      <p className="flex gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
        {micError ? t("voiceMicError") : t("voiceSimNote")}
      </p>
    </div>
  );
}
