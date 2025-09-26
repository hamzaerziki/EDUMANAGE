import type { Language } from './translations';

// Canonical subject IDs
export type SubjectId =
  | 'math'
  | 'physics_chemistry'
  | 'svt'
  | 'science_general'
  | 'french'
  | 'arabic'
  | 'english'
  | 'history_geography'
  | 'islamic_education'
  | 'philosophy'
  | 'computer_science'
  | 'visual_arts'
  | 'physical_education'
  | 'economics'
  | 'accounting'
  | 'human_sciences';

// Labels per language
const SUBJECT_LABELS: Record<Language, Record<SubjectId, string>> = {
  en: {
    math: 'Mathematics',
    physics_chemistry: 'Physics & Chemistry',
    svt: 'Life & Earth Sciences',
    science_general: 'Sciences',
    french: 'French',
    arabic: 'Arabic',
    english: 'English',
    history_geography: 'History & Geography',
    islamic_education: 'Islamic Education',
    philosophy: 'Philosophy',
    computer_science: 'Computer Science',
    visual_arts: 'Visual Arts',
    physical_education: 'Physical Education',
    economics: 'Economic Sciences',
    accounting: 'Accounting',
    human_sciences: 'Human Sciences',
  },
  fr: {
    math: 'Mathématiques',
    physics_chemistry: 'Physique-Chimie',
    svt: 'Sciences de la Vie et de la Terre',
    science_general: 'Sciences',
    french: 'Français',
    arabic: 'Arabe',
    english: 'Anglais',
    history_geography: 'Histoire-Géographie',
    islamic_education: 'Éducation Islamique',
    philosophy: 'Philosophie',
    computer_science: 'Informatique',
    visual_arts: 'Arts Plastiques',
    physical_education: 'Éducation Physique',
    economics: 'Sciences Économiques',
    accounting: 'Comptabilité',
    human_sciences: 'Sciences Humaines',
  },
  ar: {
    math: 'الرياضيات',
    physics_chemistry: 'الفيزياء والكيمياء',
    svt: 'علوم الحياة والأرض',
    science_general: 'العلوم',
    french: 'الفرنسية',
    arabic: 'العربية',
    english: 'الإنجليزية',
    history_geography: 'التاريخ والجغرافيا',
    islamic_education: 'التربية الإسلامية',
    philosophy: 'الفلسفة',
    computer_science: 'المعلوميات',
    visual_arts: 'الفنون التشكيلية',
    physical_education: 'التربية البدنية',
    economics: 'العلوم الاقتصادية',
    accounting: 'المحاسبة',
    human_sciences: 'العلوم الإنسانية',
  },
};

export function getAllSubjects(language: Language): string[] {
  return Object.values(SUBJECT_LABELS[language]);
}

function mapIdsToLabels(ids: SubjectId[], language: Language): string[] {
  return ids.map((id) => SUBJECT_LABELS[language][id]);
}

// Heuristics to derive track from grade text
function isScienceTrack(grade: string): boolean {
  const g = grade.toLowerCase();
  return (
    g.includes('science') ||
    g.includes('sciences') ||
    g.includes('pc') ||
    g.includes('svt') ||
    g.includes('math') ||
    g.includes('رياضيات') ||
    g.includes('علم')
  );
}

function isEconomicTrack(grade: string): boolean {
  const g = grade.toLowerCase();
  return g.includes('éco') || g.includes('econo') || g.includes('اقتص') || g.includes('management');
}

function isLiteratureTrack(grade: string): boolean {
  const g = grade.toLowerCase();
  return g.includes('lettres') || g.includes('literature') || g.includes('human') || g.includes('آداب');
}

export function getSubjectsForLevelAndGrade(level: string, grade: string, language: Language): string[] {
  // Normalize French level labels used across the app
  const lvl = level.toLowerCase();

  let ids: SubjectId[] = [];

  if (lvl.includes('primaire') || lvl.includes('primary') || lvl.includes('ابتد')) {
    ids = [
      'math',
      'french',
      'arabic',
      'science_general',
      'history_geography',
      'visual_arts',
      'physical_education',
      'computer_science',
      'english',
    ];
  } else if (lvl.includes('collège') || lvl.includes('college') || lvl.includes("إعد")) {
    ids = [
      'math',
      'french',
      'arabic',
      'physics_chemistry',
      'svt',
      'history_geography',
      'english',
      'islamic_education',
      'visual_arts',
      'physical_education',
    ];
  } else if (lvl.includes('lycée') || lvl.includes('lycee') || lvl.includes('high') || lvl.includes('ثان')) {
    if (isScienceTrack(grade)) {
      ids = [
        'math',
        'physics_chemistry',
        'svt',
        'french',
        'english',
        'arabic',
        'philosophy',
        'history_geography',
        'computer_science',
        'physical_education',
      ];
    } else if (isEconomicTrack(grade)) {
      ids = [
        'math',
        'french',
        'arabic',
        'economics',
        'history_geography',
        'english',
        'islamic_education',
        'physical_education',
        'computer_science',
      ];
    } else if (isLiteratureTrack(grade)) {
      ids = [
        'math',
        'french',
        'arabic',
        'history_geography',
        'philosophy',
        'english',
        'islamic_education',
        'visual_arts',
        'physical_education',
      ];
    } else {
      // Generic lycée
      ids = [
        'math',
        'french',
        'arabic',
        'history_geography',
        'english',
        'physical_education',
      ];
    }
  }

  // Ensure unique and mapped to labels
  const labels = Array.from(new Set(mapIdsToLabels(ids, language)));
  return labels;
}

export function getSubjectPairs(language: Language): Array<{ id: SubjectId; label: string }>{
  // Preserve declared order from SUBJECT_LABELS
  const entries = Object.entries(SUBJECT_LABELS[language]) as Array<[SubjectId, string]>;
  return entries.map(([id, label]) => ({ id, label }));
}

// Composite label like: Arabic (English)
export function getCompositeSubjectLabel(id: SubjectId): string {
  const ar = SUBJECT_LABELS['ar'][id];
  const en = SUBJECT_LABELS['en'][id];
  return `${ar} (${en})`;
}

// Composite label for any two languages, e.g., Arabic (Français)
export function getCompositeSubjectLabelLangs(
  id: SubjectId,
  primary: Language,
  secondary: Language
): string {
  const p = SUBJECT_LABELS[primary][id];
  const s = SUBJECT_LABELS[secondary][id];
  return `${p} (${s})`;
}

// Return subject IDs for a given level and grade (same logic as label function)
export function getSubjectsForLevelAndGradeIds(level: string, grade: string): SubjectId[] {
  const lvl = level.toLowerCase();

  let ids: SubjectId[] = [];

  if (lvl.includes('primaire') || lvl.includes('primary') || lvl.includes('ابتد')) {
    ids = [
      'math',
      'french',
      'arabic',
      'science_general',
      'history_geography',
      'visual_arts',
      'physical_education',
      'computer_science',
      'english',
    ];
  } else if (lvl.includes('collège') || lvl.includes('college') || lvl.includes("إعد")) {
    ids = [
      'math',
      'french',
      'arabic',
      'physics_chemistry',
      'svt',
      'history_geography',
      'english',
      'islamic_education',
      'visual_arts',
      'physical_education',
    ];
  } else if (lvl.includes('lycée') || lvl.includes('lycee') || lvl.includes('high') || lvl.includes('ثان')) {
    if (isScienceTrack(grade)) {
      ids = [
        'math',
        'physics_chemistry',
        'svt',
        'french',
        'english',
        'arabic',
        'philosophy',
        'history_geography',
        'computer_science',
        'physical_education',
      ];
    } else if (isEconomicTrack(grade)) {
      ids = [
        'math',
        'french',
        'arabic',
        'economics',
        'history_geography',
        'english',
        'islamic_education',
        'physical_education',
        'computer_science',
      ];
    } else if (isLiteratureTrack(grade)) {
      ids = [
        'math',
        'french',
        'arabic',
        'history_geography',
        'philosophy',
        'english',
        'islamic_education',
        'visual_arts',
        'physical_education',
      ];
    } else {
      // Generic lycée
      ids = [
        'math',
        'french',
        'arabic',
        'history_geography',
        'english',
        'physical_education',
      ];
    }
  }

  return Array.from(new Set(ids));
}
