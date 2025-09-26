export interface ExamRow {
  examLabel: string;            // e.g., Exam 1, Exam 2, Extra 1
  grades: (number | null)[];    // one per student
  comments?: (string | null)[]; // optional comments per student
  date?: string;                // optional ISO date for the exam
}

export interface ExamGrid {
  id: string;               // group identifier (e.g., group id)
  title: string;            // group title/name
  subject?: string;         // optional subject label for this grid
  students: string[];       // student names or IDs
  rows: ExamRow[];          // list of exams
  semester: string;         // e.g., 2024-S1
  updatedAt: number;        // timestamp
}

const KEY = 'exams-grids';

function read(): ExamGrid[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: ExamGrid[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export const examsStore = {
  all(): ExamGrid[] { return read(); },
  get(id: string): ExamGrid | undefined { return read().find(g => g.id === id); },
  findByGroupAndSubject(id: string, subject?: string, semester?: string): ExamGrid | undefined {
    const list = read().filter(g => g.id === id && (!semester || g.semester === semester));
    if (!subject) return list[0];
    const match = list.find(g => (g.subject || '').toLowerCase() === subject.toLowerCase());
    return match; // IMPORTANT: do NOT fallback to list[0] to avoid cross-subject bleed
  },
  save(grid: ExamGrid) {
    const list = read();
    const idx = list.findIndex(g => g.id === grid.id && (g.subject || '').toLowerCase() === (grid.subject || '').toLowerCase() && g.semester === grid.semester);
    if (idx >= 0) list[idx] = grid; else list.push(grid);
    write(list);
  },
  remove(id: string) { write(read().filter(g => g.id !== id)); },
  removeForGroupAndSubject(id: string, subject?: string, semester?: string) {
    const list = read().filter(g => !(g.id === id && (!subject || (g.subject || '').toLowerCase() === subject.toLowerCase()) && (!semester || g.semester === semester)));
    write(list);
  },
};
