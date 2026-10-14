import type { Scenario } from "@/lib/types";

/**
 * Simulated scenarios for the prototype. Locations are in Riyadh but every
 * alert, zone and incident here is fictional demo data.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "missile-north",
    hazard: "missile",
    name: { ar: "إنذار صاروخي – شمال الرياض", en: "Missile alert – North Riyadh" },
    alert: {
      ar: "إنذار رسمي (تجريبي): تهديد صاروخي على شمال الرياض. توجّه فورًا إلى أقرب ملجأ أو غرفة داخلية بعيدًا عن النوافذ، وابقَ حتى إعلان انتهاء الخطر.",
      en: "Official alert (simulated): missile threat over North Riyadh. Move now to the nearest shelter or an interior room away from windows, and stay until the all-clear.",
    },
    action: "shelter",
    zone: { kind: "circle", center: [24.79, 46.655], radiusM: 6500 },
    incidents: [
      {
        id: "m1",
        type: "missile",
        position: [24.802, 46.642],
        label: { ar: "سقوط شظايا (تجريبي)", en: "Debris impact (simulated)" },
      },
    ],
    closedRoads: [],
    focus: { center: [24.775, 46.66], zoom: 12 },
  },
  {
    id: "flood-hanifah",
    hazard: "flood",
    name: { ar: "سيول – وادي حنيفة", en: "Flash flood – Wadi Hanifah" },
    alert: {
      ar: "تحذير (تجريبي): سيول جارية في وادي حنيفة. ابتعد عن مجاري الأودية والأنفاق والطرق المغمورة، واتجه إلى مكان مرتفع.",
      en: "Warning (simulated): flash flooding in Wadi Hanifah. Stay away from valley beds, underpasses and flooded roads, and move to higher ground.",
    },
    action: "evacuate",
    zone: {
      kind: "polygon",
      points: [
        [24.775, 46.548],
        [24.745, 46.562],
        [24.705, 46.574],
        [24.665, 46.59],
        [24.625, 46.618],
        [24.59, 46.655],
        [24.582, 46.672],
        [24.597, 46.678],
        [24.634, 46.638],
        [24.672, 46.608],
        [24.711, 46.592],
        [24.75, 46.58],
        [24.782, 46.566],
      ],
    },
    incidents: [
      {
        id: "f1",
        type: "trapped",
        position: [24.688, 46.594],
        label: { ar: "مركبة عالقة في المياه", en: "Vehicle stranded in water" },
      },
      {
        id: "f2",
        type: "flood",
        position: [24.64, 46.627],
        label: { ar: "منسوب مياه مرتفع", en: "Rising water level" },
      },
    ],
    closedRoads: [
      {
        id: "r1",
        label: { ar: "طريق وادي حنيفة – مغلق", en: "Wadi Hanifah road – closed" },
        path: [
          [24.735, 46.566],
          [24.7, 46.58],
          [24.668, 46.598],
        ],
      },
      {
        id: "r2",
        label: { ar: "نفق مغمور", en: "Flooded underpass" },
        path: [
          [24.632, 46.62],
          [24.62, 46.64],
        ],
      },
    ],
    focus: { center: [24.68, 46.6], zoom: 12 },
  },
  {
    id: "fire-sulay",
    hazard: "fire",
    name: { ar: "حريق – المنطقة الصناعية بالسلي", en: "Fire – Al Sulay industrial area" },
    alert: {
      ar: "تحذير (تجريبي): حريق كبير في المنطقة الصناعية بالسلي. أخلِ المنطقة المحددة، وغطِّ أنفك وفمك، وابتعد عن اتجاه الدخان.",
      en: "Warning (simulated): major fire in Al Sulay industrial area. Evacuate the marked zone, cover your nose and mouth, and move away from the smoke.",
    },
    action: "evacuate",
    zone: { kind: "circle", center: [24.585, 46.81], radiusM: 2200 },
    incidents: [
      {
        id: "x1",
        type: "fire",
        position: [24.585, 46.81],
        label: { ar: "مستودع مشتعل", en: "Warehouse on fire" },
      },
    ],
    closedRoads: [
      {
        id: "r3",
        label: { ar: "طريق مغلق بسبب الحريق", en: "Road closed due to fire" },
        path: [
          [24.597, 46.795],
          [24.575, 46.826],
        ],
      },
    ],
    focus: { center: [24.59, 46.8], zoom: 13 },
  },
];
