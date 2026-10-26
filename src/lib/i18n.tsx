"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { createPersistentStore } from "@/lib/browser-store";
import type { Bilingual, CaseStatus, HazardType, Locale, ResponseTeam, Severity, SosStatus } from "@/lib/types";

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
  decrease: { ar: "إنقاص", en: "Decrease" },
  increase: { ar: "زيادة", en: "Increase" },
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
  sourceAi: { ar: "ذكاء اصطناعي", en: "AI" },
  sourceRules: { ar: "قواعد تلقائية", en: "Rule-based" },
  humanReview: {
    ar: "تقييم مبدئي لدعم القرار، ويخضع لمراجعة فريق الطوارئ.",
    en: "Preliminary assessment to support decisions; subject to review by the emergency team.",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  clearReports: { ar: "مسح البلاغات", en: "Clear reports" },

  simTitle: { ar: "لوحة المحاكاة", en: "Simulation panel" },
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
  received: { ar: "وقت الاستلام", en: "Received" },
  origin: { ar: "المصدر", en: "Source" },
  origin_resident: { ar: "بلاغ من السكان", en: "From a resident" },
  origin_demo: { ar: "بلاغ تجريبي", en: "Demo report" },
  humanReviewTitle: { ar: "المراجعة البشرية", en: "Human review" },
  reviewHint: {
    ar: "اعتمد تقييم الذكاء الاصطناعي أو صحّح درجة الخطورة.",
    en: "Confirm the AI assessment or correct the severity.",
  },
  confirmAssessment: { ar: "اعتماد التقييم", en: "Confirm assessment" },
  changedFrom: { ar: "عُدّلت من", en: "Changed from" },
  dispatchTitle: { ar: "التوزيع الذكي للفرق", en: "AI dispatch" },
  approveDispatch: { ar: "اعتماد وإرسال الفريق", en: "Approve & dispatch" },
  noTeamAvailable: { ar: "لا يوجد فريق مناسب متاح حاليًا", en: "No suitable team is available right now" },
  dispatchReason: {
    ar: "أقرب فريق متاح من النوع المطلوب، مع حجز الفرق للبلاغات الأخطر أولًا.",
    en: "Nearest available team of the needed type, reserving teams for more urgent reports first.",
  },
  substituteNote: {
    ar: "لا يتوفر فريق من النوع المطلوب؛ هذا أقرب فريق بديل قادر على الاستجابة.",
    en: "No team of the needed type is free; this is the nearest substitute that can respond.",
  },
  markOnScene: { ar: "وصل الفريق", en: "Team arrived" },
  resolveCase: { ar: "إغلاق البلاغ", en: "Close case" },
  dispatchDisclaimer: {
    ar: "اقتراحات الذكاء الاصطناعي لدعم القرار فقط؛ القرار النهائي لمسؤول العمليات.",
    en: "AI suggestions support the decision; the dispatcher makes the final call.",
  },
  teams: { ar: "الفرق", en: "Teams" },

  // Affected people
  affectedTitle: { ar: "فئات المتضررين", en: "People affected" },
  affectedTotal: { ar: "إجمالي المتضررين", en: "Total affected" },
  affectedHint: {
    ar: "حدد عدد كل فئة. العالقون هم من لا يستطيعون الخروج بأنفسهم.",
    en: "Count each group. Trapped means people who can't get out on their own.",
  },
  group_adults: { ar: "بالغون", en: "Adults" },
  group_children: { ar: "أطفال", en: "Children" },
  group_elderly: { ar: "كبار السن", en: "Older adults" },
  group_disabled: { ar: "ذوو الإعاقة", en: "People with disabilities" },
  group_pregnant: { ar: "حوامل", en: "Pregnant women" },
  group_trapped: { ar: "عالقون", en: "Trapped" },

  // Reporting methods
  methodTitle: { ar: "كيف تريد وصف الحالة؟", en: "How do you want to describe it?" },
  method_camera: { ar: "الكاميرا", en: "Camera" },
  method_upload: { ar: "رفع صورة", en: "Upload photo" },
  method_voice: { ar: "رسالة صوتية", en: "Voice note" },
  method_text: { ar: "كتابة", en: "Write" },
  photoTake: { ar: "التقط صورة للحادث", en: "Take a photo of the incident" },
  photoChoose: { ar: "اختر صورة من جهازك", en: "Choose a photo from your device" },
  photoHint: {
    ar: "سيحلل الذكاء الاصطناعي الصورة ويحدد نوع الخطر ومستواه والفرق المناسبة.",
    en: "AI will analyse the photo to identify the hazard, its severity and the right teams.",
  },
  photoAnalyzing: { ar: "جارٍ تحليل الصورة…", en: "Analysing the photo…" },
  photoAnalyzingSteps: {
    ar: "تحديد نوع الخطر · تقدير الخطورة · اقتراح الفرق",
    en: "Identifying hazard · Estimating severity · Suggesting teams",
  },
  photoError: { ar: "تعذّر قراءة الصورة. جرّب صورة أخرى.", en: "Couldn't read that image. Try another photo." },
  photoRemove: { ar: "إزالة الصورة", en: "Remove photo" },
  photoAnalysisTitle: { ar: "تحليل الصورة", en: "Photo analysis" },
  photoAttached: { ar: "صورة الحادث", en: "Incident photo" },
  confidence: { ar: "درجة الثقة", en: "Confidence" },
  sourceSimulated: { ar: "تحليل تجريبي", en: "Simulated analysis" },
  analysisApplied: {
    ar: "طُبّق التحليل على البلاغ. يمكنك تعديل التفاصيل قبل الإرسال.",
    en: "Analysis applied to the report. You can edit the details before sending.",
  },
  voiceStart: { ar: "اضغط للتسجيل", en: "Tap to record" },
  voiceStop: { ar: "إيقاف التسجيل", en: "Stop recording" },
  voiceRecording: { ar: "جارٍ التسجيل…", en: "Recording…" },
  voiceTranscribing: { ar: "جارٍ تحويل الصوت إلى نص…", en: "Transcribing…" },
  voiceTranscript: { ar: "النص المستخرج", en: "Transcript" },
  voiceSimNote: {
    ar: "تحويل الصوت إلى نص هنا محاكاة. راجع النص وعدّله قبل الإرسال.",
    en: "Speech-to-text is simulated here. Check and edit the text before sending.",
  },
  voiceMicError: {
    ar: "تعذّر الوصول إلى الميكروفون؛ سنعرض نصًا تجريبيًا.",
    en: "Microphone unavailable; showing a sample transcript.",
  },
  voiceRetake: { ar: "تسجيل جديد", en: "Record again" },

  // One-tap SOS
  quickSosTitle: { ar: "استغاثة فورية", en: "Instant SOS" },
  quickSosHold: { ar: "اضغط مطولًا للإرسال", en: "Press and hold to send" },
  quickSosHint: {
    ar: "لمن لا يستطيع الكتابة أو التحدث: يُرسل موقعك فورًا كحالة حرجة.",
    en: "If you can't type or talk: sends your location right away as critical.",
  },
  quickSosSent: { ar: "أُرسلت الاستغاثة مع موقعك", en: "SOS sent with your location" },
  quickSosDescription: { ar: "استغاثة فورية بضغطة واحدة", en: "One-tap instant SOS" },
  orDescribe: { ar: "أو صف الحالة بالتفصيل", en: "Or describe the situation" },

  // Resources and multi-team dispatch
  requiredResources: { ar: "الموارد المطلوبة", en: "Required resources" },
  equipment: { ar: "المعدات", en: "Equipment" },
  suggestedTeams: { ar: "الفرق المقترحة", en: "Suggested teams" },
  assignAllSuggested: { ar: "اعتماد وإرسال جميع الفرق المقترحة", en: "Approve & dispatch all suggested" },
  assignedTeams: { ar: "الفرق المكلّفة", en: "Assigned teams" },
  releaseTeam: { ar: "إعادة الفريق", en: "Release team" },
  addTeam: { ar: "إضافة فريق آخر", en: "Add another team" },
  allTeamsAssigned: { ar: "تم تكليف كل الفرق المطلوبة", en: "All required teams are assigned" },

  // Critical alert
  criticalAlertTitle: { ar: "بلاغ حرج جديد يحتاج تدخلًا عاجلًا", en: "New critical report needs urgent action" },
  viewCase: { ar: "عرض البلاغ", en: "View report" },
  dismiss: { ar: "إغلاق", en: "Dismiss" },

  // Summary
  summaryTitle: { ar: "ملخص البلاغ", en: "Report summary" },
  copy: { ar: "نسخ", en: "Copy" },
  copied: { ar: "تم النسخ", en: "Copied" },

  // Status stages shown to people
  stage_new: { ar: "جديد", en: "New" },
  stage_responding: { ar: "جارٍ الاستجابة", en: "Responding" },
  stage_rescued: { ar: "تم الإنقاذ", en: "Rescued" },
  outcome_rescued: { ar: "تم الإنقاذ", en: "Rescued" },
  outcome_transferred: { ar: "نُقل للمستشفى", en: "Taken to hospital" },
  outcome_false_alarm: { ar: "بلاغ غير دقيق", en: "False alarm" },
  outcome_merged: { ar: "دُمج مع بلاغ آخر", en: "Merged" },
  chooseOutcome: { ar: "نتيجة العملية", en: "Outcome" },

  // Duplicates
  possibleDuplicate: { ar: "بلاغ مكرر محتمل", en: "Possible duplicate" },
  duplicateHint: {
    ar: "بلاغ مشابه من الموقع نفسه وبنوع الخطر نفسه خلال آخر ٣٠ دقيقة.",
    en: "A similar report of the same hazard from the same spot in the last 30 minutes.",
  },
  mergeInto: { ar: "دمج مع البلاغ الأصلي", en: "Merge into original" },
  notDuplicate: { ar: "ليس مكررًا", en: "Not a duplicate" },
  openOriginal: { ar: "فتح البلاغ الأصلي", en: "Open original" },

  // Reassessment
  reassessTitle: { ar: "تحديث الوضع وإعادة التقييم", en: "Update situation & reassess" },
  reassessNote: { ar: "ما الذي تغيّر؟ (اختياري)", en: "What changed? (optional)" },
  reassessApply: { ar: "إعادة التقييم", en: "Reassess" },
  historyTitle: { ar: "سجل التقييم", en: "Assessment history" },

  // Map
  dangerZone: { ar: "منطقة خطرة", en: "Danger zone" },
  closedRoadWarning: { ar: "طريق مغلق – خطر", en: "Closed road – danger" },
  alternativeRoute: { ar: "مسار بديل يتجنب المناطق الخطرة", en: "Alternative route avoiding danger zones" },
  directRouteBlocked: { ar: "المسار المباشر يمر بمنطقة خطرة", en: "The direct route crosses a danger zone" },
  heatmap: { ar: "الخريطة الحرارية", en: "Heat map" },
  heatLow: { ar: "منخفض", en: "Low" },
  heatHigh: { ar: "مرتفع", en: "High" },

  // Simulation
  simRunAll: { ar: "تشغيل كل السيناريوهات معًا", en: "Run all scenarios at once" },
  simStopAll: { ar: "إنهاء كل السيناريوهات", en: "End all scenarios" },

  // Dashboard stats and reports
  teamsBusy: { ar: "فرق مشغولة", en: "Teams busy" },
  totalReports: { ar: "إجمالي البلاغات", en: "Total reports" },
  reportsPage: { ar: "تقارير الاستجابة", en: "Response reports" },
  backToOps: { ar: "العودة للوحة العمليات", en: "Back to operations" },
  kpiHandled: { ar: "بلاغات تمت معالجتها", en: "Reports handled" },
  kpiOpen: { ar: "بلاغات مفتوحة", en: "Open reports" },
  kpiCritical: { ar: "حالات حرجة", en: "Critical cases" },
  kpiPeople: { ar: "متضررون تم إنقاذهم", en: "People rescued" },
  avgDispatch: { ar: "متوسط زمن الإسناد", en: "Avg. time to dispatch" },
  avgArrival: { ar: "متوسط زمن الوصول", en: "Avg. time to arrive" },
  avgResolve: { ar: "متوسط زمن الإغلاق", en: "Avg. time to close" },
  responseTimes: { ar: "أوقات الاستجابة", en: "Response times" },
  outcomesTitle: { ar: "نتائج العمليات", en: "Outcomes" },
  byHazard: { ar: "البلاغات حسب نوع الخطر", en: "Reports by hazard" },
  bySeverity: { ar: "البلاغات المفتوحة حسب الخطورة", en: "Open reports by severity" },
  teamUtilisation: { ar: "استخدام الفرق", en: "Team utilisation" },
  reportsNote: {
    ar: "الأرقام محسوبة من بيانات المحاكاة الحالية وتتحدث مباشرة.",
    en: "Figures come from the current simulation data and update live.",
  },
  channel: { ar: "طريقة الإبلاغ", en: "Reported via" },
  channel_text: { ar: "وصف مكتوب", en: "Written" },
  channel_photo: { ar: "صورة", en: "Photo" },
  channel_voice: { ar: "رسالة صوتية", en: "Voice" },
  channel_sos: { ar: "استغاثة فورية", en: "Instant SOS" },
} satisfies Record<string, Bilingual>;

/** The three stages people see, over the five internal case statuses. */
export type CaseStage = "new" | "responding" | "rescued";

export function caseStage(status: CaseStatus): CaseStage {
  if (status === "new" || status === "reviewed") return "new";
  if (status === "assigned" || status === "on_scene") return "responding";
  return "rescued";
}

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
