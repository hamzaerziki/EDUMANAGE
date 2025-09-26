// Moroccan Curriculum dataset and helpers
// Bilingual helpers produce labels in the form: Arabic (French_or_Provided)

export type CurriculumSubject = {
  subject_fr: string;
  subject_ar: string;
};

export type CurriculumGrade = {
  grade_fr: string;
  grade_ar: string;
  subjects: CurriculumSubject[];
};

export type CurriculumLevel = {
  level_name_fr: string;
  level_name_ar: string;
  grades?: CurriculumGrade[];
  common_subjects?: CurriculumSubject[]; // for lycée
  streams?: {
    stream_name_fr: string;
    stream_name_ar: string;
    specialized_subjects: CurriculumSubject[];
  }[];
  source?: string;
};

export type CurriculumDataset = {
  education_levels: CurriculumLevel[];
};

// Dataset provided by user
export const MOROCCAN_CURRICULUM: CurriculumDataset = {
  education_levels: [
    {
      level_name_fr: "Enseignement fondamental (primaire)",
      level_name_ar: "التعليم الابتدائي",
      grades: [
        {
          grade_fr: "1ère année",
          grade_ar: "السنة الأولى من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        },
        {
          grade_fr: "2ème année",
          grade_ar: "السنة الثانية من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        },
        {
          grade_fr: "3ème année",
          grade_ar: "السنة الثالثة من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        },
        {
          grade_fr: "4ème année",
          grade_ar: "السنة الرابعة من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        },
        {
          grade_fr: "5ème année",
          grade_ar: "السنة الخامسة من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        },
        {
          grade_fr: "6ème année",
          grade_ar: "السنة السادسة من التعليم الابتدائي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Science (النشاط العلمي)", subject_ar: "النشاط العلمي" },
            { subject_fr: "Social Studies (الاجتماعيات)", subject_ar: "الاجتماعيات" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Art Education (التربية الفنية)", subject_ar: "التربية الفنية" },
            { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
          ]
        }
      ],
      source: "Primary school curriculum guidelines"
    },
    {
      level_name_fr: "Enseignement secondaire collégial (collège)",
      level_name_ar: "السلك الإعدادي",
      grades: [
        {
          grade_fr: "1ère année du collège",
          grade_ar: "السنة الأولى من السلك الإعدادي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "English (اللغة الإنجليزية)", subject_ar: "اللغة الإنجليزية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Physics & Chemistry (الفيزياء والكيمياء)", subject_ar: "الفيزياء والكيمياء" },
            { subject_fr: "Life and Earth Sciences (SVT, علوم الحياة والأرض)", subject_ar: "علوم الحياة والأرض" },
            { subject_fr: "History and Geography (التاريخ والجغرافيا)", subject_ar: "التاريخ والجغرافيا" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Computer Science (المعلوميات)", subject_ar: "المعلوميات" }
          ]
        },
        {
          grade_fr: "2ème année du collège",
          grade_ar: "السنة الثانية من السلك الإعدادي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "English (اللغة الإنجليزية)", subject_ar: "اللغة الإنجليزية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Physics & Chemistry (الفيزياء والكيمياء)", subject_ar: "الفيزياء والكيمياء" },
            { subject_fr: "Life and Earth Sciences (علوم الحياة والأرض)", subject_ar: "علوم الحياة والأرض" },
            { subject_fr: "History and Geography (التاريخ والجغرافيا)", subject_ar: "التاريخ والجغرافيا" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Computer Science (المعلوميات)", subject_ar: "المعلوميات" },
            { subject_fr: "Industrial Technology (التكنولوجيا الصناعية)", subject_ar: "التكنولوجيا الصناعية" }
          ]
        },
        {
          grade_fr: "3ème année du collège",
          grade_ar: "السنة الثالثة من السلك الإعدادي",
          subjects: [
            { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
            { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
            { subject_fr: "English (اللغة الإنجليزية)", subject_ar: "اللغة الإنجليزية" },
            { subject_fr: "Mathematics (الرياضيات)", subject_ar: "الرياضيات" },
            { subject_fr: "Physics & Chemistry (الفيزياء والكيمياء)", subject_ar: "الفيزياء والكيمياء" },
            { subject_fr: "Life and Earth Sciences (علوم الحياة والأرض)", subject_ar: "علوم الحياة والأرض" },
            { subject_fr: "History and Geography (التاريخ والجغرافيا)", subject_ar: "التاريخ والجغرافيا" },
            { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
            { subject_fr: "Computer Science (المعلوميات)", subject_ar: "المعلوميات" },
            { subject_fr: "Industrial Technology (التكنولوجيا الصناعية)", subject_ar: "التكنولوجيا الصناعية" }
          ]
        }
      ],
      source: "Collège curriculum reference"
    },
    {
      level_name_fr: "Enseignement secondaire qualifiant (lycée)",
      level_name_ar: "السلك الثانوي التأهيلي",
      common_subjects: [
        { subject_fr: "Arabic (اللغة العربية)", subject_ar: "اللغة العربية" },
        { subject_fr: "French (اللغة الفرنسية)", subject_ar: "اللغة الفرنسية" },
        { subject_fr: "English – First Foreign Language (اللغة الإنجليزية)", subject_ar: "اللغة الأجنبية الأولى (الإنجليزية)" },
        { subject_fr: "History and Geography (التاريخ والجغرافيا)", subject_ar: "التاريخ والجغرافيا" },
        { subject_fr: "Islamic Education (التربية الإسلامية)", subject_ar: "التربية الإسلامية" },
        { subject_fr: "Physical Education (التربية البدنية)", subject_ar: "التربية البدنية" }
      ],
      streams: [
        {
          stream_name_fr: "Sciences Mathématiques A",
          stream_name_ar: "علوم رياضية أ",
          specialized_subjects: [
            { subject_fr: "Mathematics", subject_ar: "الرياضيات" },
            { subject_fr: "Computer Science / Informatics", subject_ar: "المعلوميات" }
          ]
        },
        {
          stream_name_fr: "Sciences Mathématiques B",
          stream_name_ar: "علوم رياضية ب",
          specialized_subjects: [
            { subject_fr: "Mathematics", subject_ar: "الرياضيات" },
            { subject_fr: "Statistics & Probability (اختياري)", subject_ar: "الإحصاء والاحتمالات (اختياري)" }
          ]
        },
        {
          stream_name_fr: "Sciences Physiques",
          stream_name_ar: "علوم فيزيائية",
          specialized_subjects: [
            { subject_fr: "Physics & Chemistry (الفيزياء والكيمياء)", subject_ar: "الفيزياء والكيمياء" },
            { subject_fr: "Mathematics", subject_ar: "الرياضيات" },
            { subject_fr: "Life and Earth Sciences (SVT, علوم الحياة والأرض)", subject_ar: "علوم الحياة والأرض" }
          ]
        },
        {
          stream_name_fr: "Sciences de la Vie et de la Terre (SVT)",
          stream_name_ar: "علوم الحياة والأرض",
          specialized_subjects: [
            { subject_fr: "Biology", subject_ar: "الأحياء" },
            { subject_fr: "Geology", subject_ar: "الجيولوجيا" }
          ]
        },
        {
          stream_name_fr: "Lettres modernes et sciences humaines",
          stream_name_ar: "آداب وعلوم إنسانية",
          specialized_subjects: [
            { subject_fr: "Literature", subject_ar: "الأدب" },
            { subject_fr: "Sociology/Economics (اختياري)", subject_ar: "العلوم الاقتصادية والاجتماعية (اختياري)" }
          ]
        },
        {
          stream_name_fr: "Sciences Économiques et Gestion",
          stream_name_ar: "العلوم الاقتصادية والتدبير",
          specialized_subjects: [
            { subject_fr: "Economics", subject_ar: "الاقتصاد" },
            { subject_fr: "Management", subject_ar: "التدبير (المحاسبة)" }
          ]
        },
        {
          stream_name_fr: "Sciences Agronomiques et Agricoles",
          stream_name_ar: "علوم الإنتاج الزراعي والتسيير الفلاحي",
          specialized_subjects: [
            { subject_fr: "Agronomy / Agricultural Sciences", subject_ar: "التكنولوجيا الفلاحية (علوم زراعية)" }
          ]
        },
        {
          stream_name_fr: "Sciences et Technologies Électriques",
          stream_name_ar: "العلوم والتقنيات الكهربائية",
          specialized_subjects: [
            { subject_fr: "Electrical Engineering and Technology", subject_ar: "الهندسة الكهربائية" }
          ]
        },
        {
          stream_name_fr: "Sciences et Technologies Mécaniques",
          stream_name_ar: "العلوم والتقنيات الميكانيكية",
          specialized_subjects: [
            { subject_fr: "Mechanical Engineering and Technology", subject_ar: "الهندسة الميكانيكية" }
          ]
        },
        {
          stream_name_fr: "Arts Appliqués",
          stream_name_ar: "الفنون التطبيقية",
          specialized_subjects: [
            { subject_fr: "Applied Arts", subject_ar: "الفنون التطبيقية" }
          ]
        },
        {
          stream_name_fr: "Langue et Littérature Arabes",
          stream_name_ar: "اللغة العربية وآدابها",
          specialized_subjects: [
            { subject_fr: "Classical Arabic Literature", subject_ar: "الأدب العربي الكلاسيكي" }
          ]
        },
        {
          stream_name_fr: "Sciences de la Charia (Religious Sciences)",
          stream_name_ar: "العلوم الشرعية",
          specialized_subjects: [
            { subject_fr: "Islamic Law and Theology", subject_ar: "فقه وأصول الشريعة" }
          ]
        }
      ],
      source: "Baccalaureate streams and subjects"
    }
  ]
};

// Helpers
function cleanFrenchLabel(text: string): string {
  const raw = text || '';
  // For each parentheses block, remove tokens that contain Arabic letters; keep Latin acronyms like SVT
  const cleaned = raw.replace(/\(([^)]*)\)/g, (_match, inside: string) => {
    const tokens = inside
      .split(/[،,]/)
      .map(t => t.trim())
      .filter(t => t && !/[\u0600-\u06FF]/.test(t));
    return tokens.length ? `(${tokens.join(', ')})` : '';
  });
  // If there are still parentheses with only whitespace, drop them; collapse extra spaces
  return cleaned.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}

export const bilingual = (s: CurriculumSubject) => {
  const fr = cleanFrenchLabel(s.subject_fr);
  const frBase = fr || (s.subject_fr || '').replace(/\s*\([^\)]*\)/g, '').trim();
  return `${s.subject_ar} (${frBase})`;
};

export function getAllCurriculumSubjectsBilingual(): string[] {
  const set = new Set<string>();
  MOROCCAN_CURRICULUM.education_levels.forEach(level => {
    if (level.grades) {
      level.grades.forEach(g => g.subjects.forEach(sub => set.add(bilingual(sub))));
    }
    if (level.common_subjects) {
      level.common_subjects.forEach(sub => set.add(bilingual(sub)));
    }
    if (level.streams) {
      level.streams.forEach(st => st.specialized_subjects.forEach(sub => set.add(bilingual(sub))));
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Map our existing grade codes to dataset paths
const primaryCodeMap: Record<string, string> = {
  '1ap': '1ère année',
  '2ap': '2ème année',
  '3ap': '3ème année',
  '4ap': '4ème année',
  '5ap': '5ème année',
  '6ap': '6ème année',
};

const collegeCodeMap: Record<string, string> = {
  '1ac': '1ère année du collège',
  '2ac': '2ème année du collège',
  '3ac': '3ème année du collège',
};

// Lycée: we’ll use common subjects plus specialized subjects per stream
const lyceeStreamsMap: Record<string, string> = {
  '1bac-sci-math': 'Sciences Mathématiques A',
  '2bac-math': 'Sciences Mathématiques A',
  '2bac-pc': 'Sciences Physiques',
  '2bac-svt': 'Sciences de la Vie et de la Terre (SVT)',
  '1bac-let': 'Lettres modernes et sciences humaines',
  '2bac-let': 'Lettres modernes et sciences humaines',
  '1bac-hum': 'Lettres modernes et sciences humaines',
  '2bac-hum': 'Lettres modernes et sciences humaines',
  '1bac-eco': 'Sciences Économiques et Gestion',
  '2bac-eco': 'Sciences Économiques et Gestion',
};

function findLevelByNameFr(nameFragment: string): CurriculumLevel | undefined {
  return MOROCCAN_CURRICULUM.education_levels.find(l => l.level_name_fr.toLowerCase().includes(nameFragment.toLowerCase()));
}

export function getSubjectsForGradeCode(gradeCode: string): string[] {
  if (!gradeCode) return [];

  // Primary
  if (primaryCodeMap[gradeCode]) {
    const level = findLevelByNameFr('primaire');
    const gradeName = primaryCodeMap[gradeCode];
    const grade = level?.grades?.find(g => g.grade_fr === gradeName);
    return grade ? grade.subjects.map(bilingual) : [];
  }

  // Collège
  if (collegeCodeMap[gradeCode]) {
    const level = findLevelByNameFr('collég');
    const gradeName = collegeCodeMap[gradeCode];
    const grade = level?.grades?.find(g => g.grade_fr === gradeName);
    return grade ? grade.subjects.map(bilingual) : [];
  }

  // Lycée - Tronc commun codes (tc-*) => only common subjects
  if (gradeCode.startsWith('tc-')) {
    const level = findLevelByNameFr('qualifiant');
    const common = level?.common_subjects || [];
    return common.map(bilingual);
  }

  // Lycée - Streams (1bac-*, 2bac-*)
  if (lyceeStreamsMap[gradeCode]) {
    const level = findLevelByNameFr('qualifiant');
    const common = level?.common_subjects || [];
    const streamName = lyceeStreamsMap[gradeCode];
    const stream = level?.streams?.find(s => s.stream_name_fr === streamName);
    const subjects = [
      ...common.map(bilingual),
      ...((stream?.specialized_subjects || []).map(bilingual)),
    ];
    // Deduplicate
    return Array.from(new Set(subjects));
  }

  return [];
}

// Helpers to get subjects by UI labels (e.g., "Primaire" + "1ère Année Primaire")
export function getSubjectsForLevelAndGradeLabels(levelLabel: string, gradeLabel: string): string[] {
  const lvl = (levelLabel || '').toLowerCase();
  const grade = (gradeLabel || '').toLowerCase();

  // Primary mapping: 1..6 → "1ère année" .. "6ème année"
  if (lvl.includes('primaire') || lvl.includes('ابتد')) {
    const numMatch = grade.match(/(1|2|3|4|5|6)/);
    const n = numMatch ? parseInt(numMatch[1], 10) : NaN;
    const fr = n === 1 ? '1ère année' : `${n}ème année`;
    const level = findLevelByNameFr('primaire');
    const g = level?.grades?.find(gg => gg.grade_fr.toLowerCase() === fr.toLowerCase());
    return g ? g.subjects.map(bilingual) : [];
  }

  // Collège mapping: 1..3 → "1ère année du collège" .. "3ème année du collège"
  if (lvl.includes('coll') || lvl.includes('إعد')) {
    const numMatch = grade.match(/(1|2|3)/);
    const n = numMatch ? parseInt(numMatch[1], 10) : NaN;
    const fr = n === 1 ? '1ère année du collège' : `${n}ème année du collège`;
    const level = findLevelByNameFr('collég');
    const g = level?.grades?.find(gg => gg.grade_fr.toLowerCase() === fr.toLowerCase());
    return g ? g.subjects.map(bilingual) : [];
  }

  // Lycée: common subjects plus specialized based on keywords in gradeLabel
  if (lvl.includes('lyc') || lvl.includes('ثان') || lvl.includes('qualifiant')) {
    const level = findLevelByNameFr('qualifiant');
    const commons = (level?.common_subjects || []).map(bilingual);

    // Tronc commun
    if (grade.includes('tronc') || grade.includes('جذع')) {
      return commons;
    }

    // Determine stream by keywords
    let streamName = '';
    if (/(pc|physique)/i.test(grade)) streamName = 'Sciences Physiques';
    else if (/svt/i.test(grade) || grade.includes('exp')) streamName = 'Sciences de la Vie et de la Terre (SVT)';
    else if (/math/i.test(grade)) streamName = 'Sciences Mathématiques A';
    else if (/lettres|humaines|human/i.test(grade)) streamName = 'Lettres modernes et sciences humaines';
    else if (/éco|eco|gestion/i.test(grade)) streamName = 'Sciences Économiques et Gestion';

    if (streamName) {
      const stream = level?.streams?.find(s => s.stream_name_fr === streamName);
      const spezial = (stream?.specialized_subjects || []).map(bilingual);
      return Array.from(new Set([...commons, ...spezial]));
    }

    return commons;
  }

  return [];
}
