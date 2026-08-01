import type { BiographyChapter, Companion, PathLesson, Subject, Surah } from "./types";
import { ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER, type AbuBakrCanonicalSlug } from "./abu_bakr/identity";

export const subjects: Subject[] = [
  { slug: "quran", label: { ar: "القرآن", en: "Qur’an" }, active: true },
  { slug: "seerah", label: { ar: "السيرة", en: "Seerah" }, active: false },
  { slug: "sahabah", label: { ar: "الصحابة", en: "Sahabah" }, active: true },
  { slug: "hadith", label: { ar: "الحديث", en: "Hadith" }, active: false },
  { slug: "hanbali-fiqh", label: { ar: "الفقه الحنبلي", en: "Hanbali Fiqh" }, active: false },
  { slug: "aqeedah", label: { ar: "العقيدة", en: "Aqeedah" }, active: false },
  { slug: "adhkar", label: { ar: "الأذكار", en: "Adhkar" }, active: false },
  { slug: "history", label: { ar: "التاريخ الإسلامي", en: "Islamic History" }, active: false },
];

export const surahs: Surah[] = [
  { slug: "al-fatihah", number: 1, name: { ar: "الفاتحة", en: "Al-Fatihah" }, verses: 7, availability: "active" },
  { slug: "al-baqarah", number: 2, name: { ar: "البقرة", en: "Al-Baqarah" }, verses: 286, availability: "preview" },
  { slug: "ali-imran", number: 3, name: { ar: "آل عمران", en: "Ali ‘Imran" }, verses: 200, availability: "preview" },
  { slug: "al-ikhlas", number: 112, name: { ar: "الإخلاص", en: "Al-Ikhlas" }, verses: 4, availability: "preview" },
];

export const fatihahPath: PathLesson[] = [
  { slug: "lesson-1", number: 1, title: { ar: "لماذا سورة الفاتحة سورة فريدة؟", en: "Why Surah al-Fatihah Is Unique" }, state: "active" },
  { slug: "verse-1", number: 2, title: { ar: "الآية الأولى", en: "Verse 1" }, state: "planned" },
  { slug: "verses-2-4", number: 3, title: { ar: "الآيات ٢–٤", en: "Verses 2–4" }, state: "planned" },
  { slug: "verse-5", number: 4, title: { ar: "الآية الخامسة", en: "Verse 5" }, state: "planned" },
  { slug: "verses-6-7", number: 5, title: { ar: "الآيتان ٦–٧", en: "Verses 6–7" }, state: "planned" },
  { slug: "review", number: 6, title: { ar: "الملخص والمراجعة", en: "Summary and review" }, state: "planned" },
];

export const companions: Companion[] = [
  { slug: "abu-bakr", name: { ar: "أبو بكر الصديق", en: "Abu Bakr al-Siddiq" }, title: { ar: "الخليفة الأول", en: "The first Caliph" }, availability: "active" },
  { slug: "umar-ibn-al-khattab", name: { ar: "عمر بن الخطاب", en: "Umar ibn al-Khattab" }, title: { ar: "الخليفة الثاني", en: "The second Caliph" }, availability: "preview" },
  { slug: "uthman-ibn-affan", name: { ar: "عثمان بن عفان", en: "Uthman ibn Affan" }, title: { ar: "الخليفة الثالث", en: "The third Caliph" }, availability: "preview" },
  { slug: "ali-ibn-abi-talib", name: { ar: "علي بن أبي طالب", en: "Ali ibn Abi Talib" }, title: { ar: "الخليفة الرابع", en: "The fourth Caliph" }, availability: "preview" },
];

// Learner wording remains separate from identity. Route/display aliases are joined from the generated,
// validated identity map so array position and arithmetic can never select a research lesson.
const abuBakrPresentation: Record<AbuBakrCanonicalSlug, Omit<BiographyChapter, "canonicalSlug" | "slug" | "number">> = {
  "abu_bakr.lesson_01_who_was_abu_bakr": { title: { ar: "من كان أبو بكر الصدّيق؟", en: "Who Was Abu Bakr al-Siddiq?" }, description: { ar: "اسمه وكنيته وألقابه، وسبقه إلى الإيمان، وقربه من النبي ﷺ", en: "His name, kunyah, and titles; his precedence in faith; and his closeness to the Prophet ﷺ" }, state: "active", contentReady: true },
  "abu_bakr.lesson_02_first_days_of_islam": { title: { ar: "الأيام الأولى للإسلام", en: "The First Days of Islam" }, description: { ar: "قبوله الإسلام ودعوته المبكرة في مكة.", en: "His acceptance of Islam and his early da'wah in Makkah." }, state: "active", contentReady: true },
  "abu_bakr.lesson_03_faith_under_persecution": { title: { ar: "الإيمان تحت الاضطهاد", en: "Faith Under Persecution" }, description: { ar: "الاضطهاد في مكة وعتقه للمستضعفين من المسلمين.", en: "Persecution in Makkah and his freeing of the weak among the early Muslims." }, state: "active", contentReady: true },
  "abu_bakr.lesson_04_companion_of_the_cave": { title: { ar: "رفيق الغار", en: "Companion of the Cave" }, description: { ar: "الهجرة النبوية ورحلة الغار.", en: "The Hijrah and the journey to the cave." }, state: "planned" },
  "abu_bakr.lesson_05_abu_bakr_in_madinah": { title: { ar: "أبو بكر في المدينة", en: "Abu Bakr in Madinah" }, description: { ar: "بدر وأُحد والغزوات اللاحقة.", en: "Badr, Uhud, and the later campaigns." }, state: "planned" },
  "abu_bakr.lesson_06_final_illness_and_death": { title: { ar: "المرض الأخير ووفاة النبي ﷺ", en: "The Final Illness and Death of the Prophet ﷺ" }, description: { ar: "مرض النبي ﷺ الأخير ووفاته.", en: "The Prophet's ﷺ final illness and death." }, state: "planned" },
  "abu_bakr.lesson_08_the_first_caliph": { title: { ar: "الخليفة الأول", en: "The First Caliph" }, description: { ar: "سقيفة بني ساعدة ومبايعة أبي بكر رضي الله عنه.", en: "Saqifah and the bay'ah given to Abu Bakr." }, state: "planned" },
  "abu_bakr.lesson_09_the_ridda_crisis": { title: { ar: "أزمة الردة", en: "The Ridda Crisis" }, description: { ar: "منع الزكاة، ومسيلمة الكذاب، وإنفاذ جيش أسامة.", en: "Zakah refusal, Musaylimah, and the dispatch of Usama's army." }, state: "planned" },
  "abu_bakr.lesson_10_preserving_the_quran": { title: { ar: "حفظ القرآن", en: "Preserving the Qur'an" }, description: { ar: "معركة اليمامة وجمع القرآن في مصحف واحد.", en: "The battle of Yamamah and the compilation of the Qur'an." }, state: "planned" },
  "abu_bakr.lesson_11_final_days_and_legacy": { title: { ar: "أيامه الأخيرة وإرثه", en: "His Final Days and Legacy" }, description: { ar: "مرضه، واستخلافه عمر رضي الله عنه، ووفاته.", en: "His illness, his appointment of 'Umar as successor, and his death." }, state: "planned" },
  "abu_bakr.lesson_12_timeline_review": { title: { ar: "مراجعة الخط الزمني والتقييم الختامي", en: "Timeline Review and Final Assessment" }, description: { ar: "مراجعة زمنية شاملة لمسار سيرة أبي بكر رضي الله عنه.", en: "A consolidated chronological review of Abu Bakr's biography path." }, state: "planned" },
};

export const abuBakrPath: BiographyChapter[] = ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => ({
  canonicalSlug: identity.canonicalSlug,
  slug: identity.routeSlug,
  number: identity.displayNumber,
  ...(abuBakrPresentation[identity.canonicalSlug] ?? (() => { throw new Error(`Missing Abu Bakr presentation for ${identity.canonicalSlug}`); })()),
}));
