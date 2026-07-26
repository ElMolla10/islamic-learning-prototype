import type { PathLesson, Subject, Surah } from "./types";

export const subjects: Subject[] = [
  { slug: "quran", label: { ar: "القرآن", en: "Qur’an" }, active: true },
  { slug: "seerah", label: { ar: "السيرة", en: "Seerah" }, active: false },
  { slug: "sahabah", label: { ar: "الصحابة", en: "Sahabah" }, active: false },
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
