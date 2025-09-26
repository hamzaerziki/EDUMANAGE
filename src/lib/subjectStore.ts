// Simple client-side subject store to append custom subjects and make them available app-wide
// Data is persisted in localStorage under the key 'custom-subjects'

export const CUSTOM_SUBJECTS_KEY = 'custom-subjects';

export function getCustomSubjects(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SUBJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr.filter((v) => typeof v === 'string') as string[]) : [];
  } catch {
    return [];
  }
}

export function setCustomSubjects(subjects: string[]) {
  try {
    const unique = Array.from(new Set(subjects.filter(Boolean)));
    localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(unique));
  } catch {}
}

export function addCustomSubject(subject: string) {
  if (!subject || !subject.trim()) return;
  const current = getCustomSubjects();
  if (current.includes(subject)) return;
  current.push(subject);
  setCustomSubjects(current);
}

export function removeCustomSubject(subject: string) {
  try {
    const current = getCustomSubjects();
    const next = current.filter(s => s !== subject);
    setCustomSubjects(next);
  } catch {}
}
