"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { createPersistentStore } from "@/lib/browser-store";
import type { Bilingual, HazardType, Locale, ResponseTeam, Severity, SosStatus } from "@/lib/types";

const UI = {
  appName: { ar: "مسار الإنقاذ الذكي", en: "RescuePath AI" },
  prototypeBadge: { ar: "نموذج أولي – بيانات تجريبية", en: "Prototype – simulated data" },
  disclaimer: {
    ar: "هذا نموذج أولي للعرض فقط وليس خدمة طوارئ فعلية. في حالة الطوارئ الحقيقية اتصل بـ 911.",
    en: "This is a demo prototype, not a real emergency service. In a real emergency call 911.",
  },
  switchLang: { ar: "English", en: "العربية" },

  tabAlert: { ar: "التنبيه", en: "Alert" },
  tabSos: { ar: "استغاثة", en: "SOS" },
  tabReports: { ar: "بلاغاتي", en: "My reports" },

  noActiveAlert: { ar: "لا توجد تنبيهات نشطة", en: "No active alerts" },
  noActiveAlertHint: {
    ar: "استخدم لوحة المحاكاة لتشغيل سيناريو كارثة وتجربة المنصة.",
    en: "Use the simulation panel to start a disaster scenario and try the platform.",
  },
  youAreInZone: { ar: "أنت داخل المنطقة المتأثرة", en: "You are inside the affected area" },
  youAreOutsideZone: { ar: "أنت خارج المنطقة المتأثرة", en: "You are outside the affected area" },
  outsideZoneHint: {
    ar: "لا يلزمك التحرك الآن. تجنّب المنطقة المحددة على الخريطة وتابع التحديثات.",
    en: "No action needed right now. Avoid the marked area on the map and follow updates.",
  },
  actionShelter: { ar: "احتمِ في أقرب ملجأ", en: "Take shelter at the nearest shelter" },
  actionEvacuate: { ar: "أخلِ إلى نقطة تجمع آمنة", en: "Evacuate to a safe assembly point" },
  actionAvoid: { ar: "تجنّب المنطقة", en: "Avoid the area" },
  shelterInPlaceTitle: { ar: "احتمِ في مكانك الآن", en: "Shelter in place now" },
  shelterInPlaceBody: {
    ar: "لا يوجد ملجأ معتمد على بُعد ٥ دقائق سيرًا. ادخل فورًا غرفة داخلية بلا نوافذ أو بيت الدرج، وابقَ حتى إعلان انتهاء الخطر.",
    en: "No approved shelter is within a 5-minute walk. Go now to an interior room without windows or a stairwell, and stay until the all-clear.",
  },
  nearestShelterIfDirected: {
    ar: "أقرب ملجأ معتمد (توجّه إليه فقط إذا طلبت الجهات الرسمية ذلك)",
    en: "Nearest approved shelter (go only if officials direct you there)",
  },
  destination: { ar: "الوجهة", en: "Destination" },
  distance: { ar: "المسافة", en: "Distance" },
  eta: { ar: "الوقت المتوقع", en: "Est. time" },
  routeWalk: { ar: "سيرًا على الأقدام", en: "on foot" },
  routeDrive: { ar: "بالسيارة", en: "by car" },
  routeCalculating: { ar: "جارٍ حساب المسار…", en: "Calculating route…" },
  routeStraight: {
    ar: "تعذّر الوصول لخدمة المسارات؛ يُعرض خط مباشر تقريبي.",
    en: "Routing service unavailable; showing an approximate straight line.",
  },
  routeDisclaimer: {
    ar: "المسار مقترح تجريبيًا. اتبع دائمًا تعليمات الجهات الرسمية والإشارات على الطريق.",
    en: "Suggested route is a simulation. Always follow official instructions and road signs.",
  },
  safetySteps: { ar: "إرشادات السلامة", en: "Safety steps" },
  forKids: { ar: "للأطفال وكبار السن", en: "For children & older adults" },
  emergencyNumbers: { ar: "أرقام الطوارئ", en: "Emergency numbers" },
  km: { ar: "كم", en: "km" },
  min: { ar: "دقيقة", en: "min" },

  sosTitle: { ar: "إرسال بلاغ استغاثة", en: "Send an SOS report" },
  sosHazard: { ar: "نوع الخطر", en: "Type of danger" },
  sosUnknown: { ar: "غير متأكد", en: "Not sure" },
  sosDescription: { ar: "صف ما يحدث", en: "Describe what is happening" },
  sosDescriptionPlaceholder: {
    ar: "مثال: نحن ثلاثة أشخاص محاصرون في الطابق الثاني والمياه ترتفع",
    en: "e.g. Three of us are trapped on the second floor and the water is rising",
  },
  sosPeople: { ar: "عدد الأشخاص", en: "Number of people" },
  decrease: { ar: "إنقاص", en: "Decrease" },
  increase: { ar: "زيادة", en: "Increase" },
  sosVulnerable: { ar: "يوجد من يحتاج دعمًا إضافيًا", en: "Someone needs extra support" },
  children: { ar: "أطفال", en: "Children" },
  elderly: { ar: "كبار سن", en: "Older adults" },
  disabled: { ar: "ذوو إعاقة", en: "People with disabilities" },
  sosConsent: {
    ar: "أوافق على مشاركة هذه المعلومات مع فرق الاستجابة لترتيب الأولوية",
    en: "I agree to share this with responders to help prioritise",
  },
  sosLocation: { ar: "الموقع", en: "Location" },
  sosLocationHint: {
    ar: "يُستخدم موقعك على الخريطة. اسحب العلامة الزرقاء لتغييره.",
    en: "Your position on the map is used. Drag the blue marker to change it.",
  },
  sosSend: { ar: "إرسال الاستغاثة", en: "Send SOS" },
  sosSentOk: { ar: "تم استلام بلاغك", en: "Your report was received" },
  sosQueued: {
    ar: "لا يوجد اتصال. حُفظ البلاغ ولم يُرسل بعد، وسيُرسل تلقائيًا عند عودة الاتصال.",
    en: "No connection. Your report is saved but NOT sent yet. It will send automatically when you're back online.",
  },

  reportsEmpty: { ar: "لم ترسل أي بلاغات بعد", en: "You haven't sent any reports yet" },
  status_queued: { ar: "لم يُرسل بعد", en: "Not sent yet" },
  status_sending: { ar: "جارٍ الإرسال", en: "Sending" },
  status_received: { ar: "تم الاستلام", en: "Received" },
  status_failed: { ar: "فشل الإرسال", en: "Failed to send" },
  aiAssessment: { ar: "التقييم المبدئي", en: "Initial assessment" },
  priority: { ar: "الأولوية", en: "Priority" },
  suggestedTeam: { ar: "الفريق المقترح", en: "Suggested team" },
  sourceAi: { ar: "ذكاء اصطناعي", en: "AI" },
  sourceRules: { ar: "قواعد تلقائية", en: "Rule-based" },
  humanReview: {
    ar: "تقييم مبدئي لدعم القرار، ويخضع لمراجعة فريق الطوارئ.",
    en: "Preliminary assessment to support decisions; subject to review by the emergency team.",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  clearReports: { ar: "مسح البلاغات", en: "Clear reports" },

  simTitle: { ar: "لوحة المحاكاة", en: "Simulation panel" },
  simStart: { ar: "تشغيل", en: "Start" },
  simStop: { ar: "إنهاء السيناريو", en: "End scenario" },
  simOffline: { ar: "محاكاة انقطاع الإنترنت", en: "Simulate no internet" },
  simLocation: { ar: "موقعي التجريبي", en: "My demo location" },
  simMoveInto: { ar: "انقلني داخل المنطقة", en: "Move me into the zone" },
  simUseGps: { ar: "استخدم موقعي الحقيقي", en: "Use my real location" },
  offlineBanner: {
    ar: "وضع عدم الاتصال: الإرشادات وأرقام الطوارئ متاحة، والبلاغات ستُحفظ حتى عودة الاتصال.",
    en: "Offline mode: guidance and emergency numbers are available; reports are saved until you reconnect.",
  },

  mapYou: { ar: "موقعك", en: "You" },
  mapShelter: { ar: "ملجأ", en: "Shelter" },
  mapAssembly: { ar: "نقطة تجمع", en: "Assembly point" },
  mapCapacity: { ar: "السعة", en: "Capacity" },
  mapClosedRoad: { ar: "طريق مغلق", en: "Closed road" },
  legend: { ar: "دليل الخريطة", en: "Map legend" },
  affectedZone: { ar: "منطقة متأثرة", en: "Affected zone" },

  // Resident view of the response to their report
  resp_new: { ar: "بانتظار مراجعة فريق الطوارئ", en: "Waiting for review by the emergency team" },
  resp_reviewed: { ar: "تمت المراجعة، وسيُكلَّف فريق قريبًا", en: "Reviewed – a team will be assigned shortly" },
  resp_assigned: { ar: "المساعدة في الطريق", en: "Help is on the way" },
  resp_on_scene: { ar: "وصل الفريق إلى موقعك", en: "The team has arrived" },
  resp_resolved: { ar: "أُغلق البلاغ", en: "Case closed" },

  // Operations dashboard
  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
  opsTitle: { ar: "لوحة العمليات", en: "Operations centre" },
  opsLink: { ar: "لوحة العمليات", en: "Operations dashboard" },
  residentLink: { ar: "تطبيق السكان", en: "Resident app" },
  queue: { ar: "قائمة البلاغات", en: "Report queue" },
  filterOpen: { ar: "مفتوحة", en: "Open" },
  filterClosed: { ar: "مغلقة", en: "Closed" },
  openCases: { ar: "بلاغات مفتوحة", en: "Open reports" },
  teamsAvailable: { ar: "فرق متاحة", en: "Teams available" },
  resetDemo: { ar: "إعادة ضبط العرض", en: "Reset demo" },
  live: { ar: "مباشر", en: "Live" },
  connectionLost: { ar: "انقطع الاتصال بالخادم", en: "Lost connection to server" },
  activeScenario: { ar: "السيناريو النشط", en: "Active scenario" },
  queueEmpty: { ar: "لا توجد بلاغات", en: "No reports" },
  selectCase: { ar: "اختر بلاغًا من القائمة أو الخريطة", en: "Select a report from the queue or the map" },
  needsReview: { ar: "بحاجة لمراجعة", en: "Needs review" },
  case_new: { ar: "جديد", en: "New" },
  case_reviewed: { ar: "تمت المراجعة", en: "Reviewed" },
  case_assigned: { ar: "فريق في الطريق", en: "Team en route" },
  case_on_scene: { ar: "الفريق في الموقع", en: "Team on scene" },
  case_resolved: { ar: "مغلق", en: "Closed" },
  team_available: { ar: "متاح", en: "Available" },
  team_dispatched: { ar: "في مهمة", en: "Dispatched" },
  team_on_scene: { ar: "في الموقع", en: "On scene" },
  reportDetails: { ar: "تفاصيل البلاغ", en: "Report details" },
  people: { ar: "الأشخاص", en: "People" },
  received: { ar: "وقت الاستلام", en: "Received" },
  origin: { ar: "المصدر", en: "Source" },
  origin_resident: { ar: "بلاغ من السكان", en: "From a resident" },
  origin_demo: { ar: "بلاغ تجريبي", en: "Demo report" },
  extraSupport: { ar: "يحتاجون دعمًا إضافيًا", en: "Need extra support" },
  humanReviewTitle: { ar: "المراجعة البشرية", en: "Human review" },
  reviewHint: {
    ar: "اعتمد تقييم الذكاء الاصطناعي أو صحّح درجة الخطورة.",
    en: "Confirm the AI assessment or correct the severity.",
  },
  confirmAssessment: { ar: "اعتماد التقييم", en: "Confirm assessment" },
  changedFrom: { ar: "عُدّلت من", en: "Changed from" },
  dispatchTitle: { ar: "التوزيع الذكي للفرق", en: "AI dispatch" },
  approveDispatch: { ar: "اعتماد وإرسال الفريق", en: "Approve & dispatch" },
  otherTeam: { ar: "أو اختر فريقًا آخر", en: "Or choose another team" },
  noTeamAvailable: { ar: "لا يوجد فريق مناسب متاح حاليًا", en: "No suitable team is available right now" },
  dispatchReason: {
    ar: "أقرب فريق متاح من النوع المطلوب، مع حجز الفرق للبلاغات الأخطر أولًا.",
    en: "Nearest available team of the needed type, reserving teams for more urgent reports first.",
  },
  substituteNote: {
    ar: "لا يتوفر فريق من النوع المطلوب؛ هذا أقرب فريق بديل قادر على الاستجابة.",
    en: "No team of the needed type is free; this is the nearest substitute that can respond.",
  },
  assignedTeam: { ar: "الفريق المكلّف", en: "Assigned team" },
  markOnScene: { ar: "وصل الفريق", en: "Team arrived" },
  resolveCase: { ar: "إغلاق البلاغ", en: "Close case" },
  dispatchDisclaimer: {
    ar: "اقتراحات الذكاء الاصطناعي لدعم القرار فقط؛ القرار النهائي لمسؤول العمليات.",
    en: "AI suggestions support the decision; the dispatcher makes the final call.",
  },
  teams: { ar: "الفرق", en: "Teams" },
} satisfies Record<string, Bilingual>;

export const HAZARD_LABELS: Record<HazardType, Bilingual> = {
  missile: { ar: "تهديد صاروخي", en: "Missile threat" },
  flood: { ar: "سيول وفيضانات", en: "Flood" },
  fire: { ar: "حريق", en: "Fire" },
  road: { ar: "حادث طريق", en: "Road accident" },
  trapped: { ar: "أشخاص محاصرون", en: "People trapped" },
};

export const SEVERITY_LABELS: Record<Severity, Bilingual> = {
  low: { ar: "منخفضة", en: "Low" },
  medium: { ar: "متوسطة", en: "Medium" },
  high: { ar: "عالية", en: "High" },
  critical: { ar: "حرجة", en: "Critical" },
};

export const TEAM_LABELS: Record<ResponseTeam, Bilingual> = {
  civil_defense: { ar: "الدفاع المدني", en: "Civil Defense" },
  ambulance: { ar: "الإسعاف (الهلال الأحمر)", en: "Ambulance (Red Crescent)" },
  water_rescue: { ar: "فرق الإنقاذ المائي", en: "Water rescue" },
  fire_rescue: { ar: "الإطفاء والإنقاذ", en: "Fire & rescue" },
  police: { ar: "الشرطة / المرور", en: "Police / traffic" },
};

export type UiKey = keyof typeof UI;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: UiKey) => string;
  /** Pick the current-locale string from bilingual data. */
  pick: (text: Bilingual) => string;
  statusLabel: (s: SosStatus) => string;
  formatNumber: (n: number, digits?: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const localeStore = createPersistentStore<Locale>("rpa.locale", "ar", (raw) =>
  JSON.parse(raw) === "en" ? "en" : "ar",
);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = localeStore.useValue();
  const setLocale = localeStore.set;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const t = useCallback((key: UiKey) => UI[key][locale], [locale]);
  const pick = useCallback((text: Bilingual) => text[locale], [locale]);
  const statusLabel = useCallback((s: SosStatus) => UI[`status_${s}`][locale], [locale]);
  const formatNumber = useCallback(
    (n: number, digits = 0) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
        maximumFractionDigits: digits,
      }).format(n),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, pick, statusLabel, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
