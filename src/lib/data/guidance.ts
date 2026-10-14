import type { Bilingual, HazardType } from "@/lib/types";

export interface Guidance {
  title: Bilingual;
  steps: Bilingual[];
  /** Short, simple wording for children and older adults. */
  simple: Bilingual;
}

/**
 * Safety guidance bundled with the app so it stays available offline.
 * Always defer to official Civil Defense instructions.
 */
export const GUIDANCE: Record<HazardType, Guidance> = {
  missile: {
    title: { ar: "عند الإنذار الصاروخي", en: "During a missile alert" },
    steps: [
      { ar: "توجّه فورًا إلى أقرب ملجأ معتمد أو غرفة داخلية بلا نوافذ.", en: "Go immediately to the nearest approved shelter or an interior room without windows." },
      { ar: "ابتعد عن النوافذ والأبواب الزجاجية والجدران الخارجية.", en: "Stay away from windows, glass doors and outer walls." },
      { ar: "إن كنت في الخارج دون ملجأ قريب: انبطح أرضًا وغطِّ رأسك بيديك.", en: "If outdoors with no shelter nearby: lie flat on the ground and cover your head with your hands." },
      { ar: "ابقَ في مكانك حتى إعلان انتهاء الخطر من الجهات الرسمية.", en: "Stay put until officials announce the all-clear." },
      { ar: "لا تقترب من الشظايا أو الأجسام الغريبة، وأبلغ عنها.", en: "Do not approach debris or unknown objects; report them." },
    ],
    simple: { ar: "ادخل غرفة بلا شبابيك، واجلس بعيدًا عن الزجاج، وانتظر حتى يقولوا: انتهى الخطر.", en: "Go into a room with no windows, sit away from glass, and wait until they say it's safe." },
  },
  flood: {
    title: { ar: "عند السيول", en: "During a flash flood" },
    steps: [
      { ar: "ابتعد فورًا عن مجاري الأودية والشعاب والأنفاق.", en: "Move away from valley beds, ravines and underpasses immediately." },
      { ar: "لا تقُد أو تمشِ في المياه الجارية مهما بدت ضحلة.", en: "Never drive or walk through moving water, however shallow it looks." },
      { ar: "اتجه إلى مكان مرتفع وابتعد عن أعمدة وأسلاك الكهرباء.", en: "Head to higher ground and keep clear of power lines and poles." },
      { ar: "إن حوصرت المياه سيارتك، اخرج منها واصعد إلى مكان مرتفع.", en: "If water surrounds your car, get out and climb to higher ground." },
      { ar: "تابع التحديثات الرسمية ولا تعد حتى يُعلن أن المنطقة آمنة.", en: "Follow official updates and don't return until the area is declared safe." },
    ],
    simple: { ar: "ابتعد عن الماء، واصعد إلى مكان عالٍ، ولا تلعب قرب السيل.", en: "Stay away from the water, go somewhere high, and never play near floodwater." },
  },
  fire: {
    title: { ar: "عند الحريق", en: "During a fire" },
    steps: [
      { ar: "أخلِ المكان فورًا عبر أقرب مخرج آمن، ولا تستخدم المصاعد.", en: "Evacuate at once through the nearest safe exit; do not use elevators." },
      { ar: "غطِّ أنفك وفمك بقطعة قماش مبللة إن أمكن.", en: "Cover your nose and mouth with a damp cloth if possible." },
      { ar: "تحرك منخفضًا تحت مستوى الدخان.", en: "Stay low, beneath the smoke." },
      { ar: "ابتعد عكس اتجاه الدخان والرياح.", en: "Move away from the direction of the smoke and wind." },
      { ar: "لا تعد إلى المبنى لأي سبب حتى يسمح الدفاع المدني بذلك.", en: "Do not go back inside for any reason until Civil Defense allows it." },
    ],
    simple: { ar: "اخرج بسرعة، وامشِ منخفضًا، وغطِّ أنفك، ولا ترجع.", en: "Get out fast, stay low, cover your nose, and don't go back in." },
  },
  road: {
    title: { ar: "عند حادث مروري", en: "At a road accident" },
    steps: [
      { ar: "أوقف سيارتك في مكان آمن وشغّل إشارات التنبيه.", en: "Park somewhere safe and turn on your hazard lights." },
      { ar: "اتصل بالطوارئ وحدد الموقع وعدد المصابين.", en: "Call emergency services with the location and number of injured." },
      { ar: "لا تحرك المصابين إلا إذا كان هناك خطر مباشر كالحريق.", en: "Don't move injured people unless there is immediate danger such as fire." },
      { ar: "ابتعد عن حركة السير أثناء الانتظار.", en: "Keep away from traffic while you wait." },
    ],
    simple: { ar: "ابقَ بعيدًا عن السيارات، واطلب من شخص كبير الاتصال بالطوارئ.", en: "Stay away from the cars and ask an adult to call emergency services." },
  },
  trapped: {
    title: { ar: "إذا كنت محاصرًا", en: "If you are trapped" },
    steps: [
      { ar: "أرسل بلاغ استغاثة بموقعك فورًا.", en: "Send an SOS with your location right away." },
      { ar: "حافظ على هدوئك ووفّر بطارية هاتفك.", en: "Stay calm and save your phone battery." },
      { ar: "أصدر أصواتًا بالطرق على الجدران أو الأنابيب بدل الصراخ المستمر.", en: "Tap on walls or pipes to signal instead of shouting continuously." },
      { ar: "ابقَ في أعلى مكان آمن متاح إن كانت المياه ترتفع.", en: "If water is rising, stay at the highest safe point available." },
    ],
    simple: { ar: "لا تخف، ابقَ في مكانك، واطرق على الجدار ليسمعك المنقذون.", en: "Don't be scared, stay where you are, and knock on the wall so rescuers can hear you." },
  },
};

export const EMERGENCY_NUMBERS: { number: string; label: Bilingual }[] = [
  { number: "911", label: { ar: "الطوارئ الموحد", en: "Unified emergency" } },
  { number: "998", label: { ar: "الدفاع المدني", en: "Civil Defense" } },
  { number: "997", label: { ar: "الهلال الأحمر", en: "Red Crescent" } },
  { number: "999", label: { ar: "الشرطة", en: "Police" } },
];
