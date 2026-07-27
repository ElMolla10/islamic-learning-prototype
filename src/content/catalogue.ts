import type { BiographyChapter, Companion, PathLesson, Subject, Surah } from "./types";

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

// Draft chapter structure only — titles and descriptions are placeholder topic-scope labels (structural
// pointers to content_research/abu_bakr/, not real content) pending Mohamed's review. See
// src/content/abu_bakr/README.md for how these 11 website lessons map onto the 12 content_research lesson
// folders (lessons 6 and 7 there are merged into website lesson 6).
export const abuBakrPath: BiographyChapter[] = [
  { slug: "lesson-1", number: 1, title: { ar: "من كان أبو بكر الصدّيق؟", en: "Who Was Abu Bakr al-Siddiq?" }, description: { ar: "اسمه وكنيته وألقابه، وسبقه إلى الإيمان، وقربه من النبي ﷺ", en: "His name, kunyah, and titles; his precedence in faith; and his closeness to the Prophet ﷺ" }, state: "active", contentReady: true },
  { slug: "lesson-2", number: 2, title: { ar: "الأيام الأولى للإسلام [عنوان مبدئي]", en: "The First Days of Islam [placeholder title]" }, description: { ar: "قبوله الإسلام ودعوته المبكرة [مبدئي]", en: "His acceptance of Islam and early da'wah [placeholder]" }, state: "active" },
  { slug: "lesson-3", number: 3, title: { ar: "الإيمان تحت الاضطهاد [عنوان مبدئي]", en: "Faith Under Persecution [placeholder title]" }, description: { ar: "الاضطهاد في مكة وعتق المستضعفين [مبدئي]", en: "Persecution in Makkah and freeing the weak [placeholder]" }, state: "active" },
  { slug: "lesson-4", number: 4, title: { ar: "رفيق الغار [عنوان مبدئي]", en: "Companion of the Cave [placeholder title]" }, description: { ar: "الهجرة ورحلة الغار [مبدئي]", en: "The Hijrah and the journey to the cave [placeholder]" }, state: "active" },
  { slug: "lesson-5", number: 5, title: { ar: "أبو بكر في المدينة [عنوان مبدئي]", en: "Abu Bakr in Madinah [placeholder title]" }, description: { ar: "بدر وأحد والغزوات اللاحقة [مبدئي]", en: "Badr, Uhud, and the later campaigns [placeholder]" }, state: "active" },
  { slug: "lesson-6", number: 6, title: { ar: "المرض الأخير ووفاة النبي ﷺ [عنوان مبدئي]", en: "The Final Illness and Death of the Prophet ﷺ [placeholder title]" }, description: { ar: "مرض النبي ﷺ ووفاته [مبدئي]", en: "The Prophet's ﷺ final illness and death [placeholder]" }, state: "active" },
  { slug: "lesson-7", number: 7, title: { ar: "الخليفة الأول [عنوان مبدئي]", en: "The First Caliph [placeholder title]" }, description: { ar: "سقيفة بني ساعدة والبيعة [مبدئي]", en: "Saqifah and the bay'ah [placeholder]" }, state: "active" },
  { slug: "lesson-8", number: 8, title: { ar: "أزمة الردة [عنوان مبدئي]", en: "The Ridda Crisis [placeholder title]" }, description: { ar: "منع الزكاة ومسيلمة وجيش أسامة [مبدئي]", en: "Zakah refusal, Musaylimah, and Usama's army [placeholder]" }, state: "active" },
  { slug: "lesson-9", number: 9, title: { ar: "حفظ القرآن [عنوان مبدئي]", en: "Preserving the Qur'an [placeholder title]" }, description: { ar: "اليمامة وجمع القرآن [مبدئي]", en: "Yamamah and the compilation of the Qur'an [placeholder]" }, state: "active" },
  { slug: "lesson-10", number: 10, title: { ar: "أيامه الأخيرة وإرثه [عنوان مبدئي]", en: "His Final Days and Legacy [placeholder title]" }, description: { ar: "مرضه واستخلاف عمر ووفاته [مبدئي]", en: "His illness, appointing 'Umar, and his death [placeholder]" }, state: "active" },
  { slug: "lesson-11", number: 11, title: { ar: "مراجعة الخط الزمني والتقييم الختامي [عنوان مبدئي]", en: "Timeline Review and Final Assessment [placeholder title]" }, description: { ar: "مراجعة زمنية شاملة لمسار السيرة [مبدئي]", en: "A consolidated chronological review of the path [placeholder]" }, state: "active" },
];
