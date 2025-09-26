export type SubjectCoefficients = Record<string, number>;

const KEY = 'subject-coefficients';

export function readCoefficients(): SubjectCoefficients {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj as SubjectCoefficients : {};
  } catch {
    return {};
  }
}

export function saveCoefficients(map: SubjectCoefficients) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export function getCoefficient(subject: string, fallback = 1): number {
  const map = readCoefficients();
  if (!subject) return fallback;
  const key = subject.toLowerCase();
  if (key in map) return map[key];
  return inferDefaultCoefficient(subject, fallback);
}

export function setCoefficient(subject: string, value: number) {
  const map = readCoefficients();
  map[subject.toLowerCase()] = value;
  saveCoefficients(map);
}

export function inferDefaultCoefficient(subject: string, fallback = 1): number {
  const s = (subject || '').toLowerCase();
  if (/math|رياضيات/.test(s)) return 7;
  if (/phys|chim|physics|chem|فيزياء|كيمياء/.test(s)) return 6;
  if (/svt|life|earth|أرض|أحياء|علوم الحياة/.test(s)) return 5;
  if (/arab|عرب/.test(s)) return 4;
  if (/fran|فرن/.test(s)) return 4;
  if (/engl|انج|إنج|english/.test(s)) return 3;
  if (/history|geo|تاريخ|جغ/.test(s)) return 2;
  if (/islam|دين|تربية إسلامية/.test(s)) return 2;
  if (/sport|pe|رياض/.test(s)) return 1;
  return fallback;
}

export function getDefaultCoefficientsForSubjects(subjects: string[]): SubjectCoefficients {
  const map: SubjectCoefficients = {};
  for (const s of subjects) map[s.toLowerCase()] = inferDefaultCoefficient(s, 1);
  return map;
}
