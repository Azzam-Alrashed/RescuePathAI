import type { SafePlace } from "@/lib/types";

/** Fictional shelters and assembly points used by the prototype. */
export const SAFE_PLACES: SafePlace[] = [
  // Shelters (used for missile alerts)
  {
    id: "s1",
    kind: "shelter",
    name: { ar: "ملجأ حي الياسمين", en: "Al Yasmin shelter" },
    position: [24.823, 46.642],
    capacity: 400,
  },
  {
    id: "s2",
    kind: "shelter",
    name: { ar: "ملجأ حي الصحافة", en: "Al Sahafah shelter" },
    position: [24.806, 46.635],
    capacity: 350,
  },
  {
    id: "s3",
    kind: "shelter",
    name: { ar: "ملجأ حي النخيل", en: "Al Nakheel shelter" },
    position: [24.76, 46.633],
    capacity: 500,
  },
  {
    id: "s4",
    kind: "shelter",
    name: { ar: "ملجأ حي الملقا", en: "Al Malqa shelter" },
    position: [24.809, 46.61],
    capacity: 300,
  },
  {
    id: "s5",
    kind: "shelter",
    name: { ar: "ملجأ حي الغدير", en: "Al Ghadir shelter" },
    position: [24.773, 46.66],
    capacity: 450,
  },
  {
    id: "s6",
    kind: "shelter",
    name: { ar: "ملجأ حي الربيع", en: "Al Rabie shelter" },
    position: [24.795, 46.672],
    capacity: 380,
  },
  {
    id: "s7",
    kind: "shelter",
    name: { ar: "ملجأ حي العليا", en: "Al Olaya shelter" },
    position: [24.698, 46.686],
    capacity: 600,
  },
  {
    id: "s8",
    kind: "shelter",
    name: { ar: "ملجأ حي الملز", en: "Al Malaz shelter" },
    position: [24.664, 46.728],
    capacity: 550,
  },

  // Assembly points on safe ground (used for evacuations)
  {
    id: "a1",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي عرقة", en: "Assembly point – Irqah" },
    position: [24.69, 46.545],
    capacity: 1200,
  },
  {
    id: "a2",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي الرحمانية", en: "Assembly point – Al Rahmaniyah" },
    position: [24.718, 46.645],
    capacity: 1500,
  },
  {
    id: "a3",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي السويدي", en: "Assembly point – Al Suwaidi" },
    position: [24.6, 46.7],
    capacity: 1300,
  },
  {
    id: "a4",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي العريجاء", en: "Assembly point – Al Uraija" },
    position: [24.613, 46.6],
    capacity: 1000,
  },
  {
    id: "a5",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي الجزيرة", en: "Assembly point – Al Jazirah" },
    position: [24.61, 46.775],
    capacity: 1400,
  },
  {
    id: "a6",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي الفيحاء", en: "Assembly point – Al Fayha" },
    position: [24.632, 46.82],
    capacity: 1100,
  },
  {
    id: "a7",
    kind: "assembly",
    name: { ar: "نقطة تجمع – حي الدرعية", en: "Assembly point – Diriyah" },
    position: [24.745, 46.6],
    capacity: 900,
  },
];
