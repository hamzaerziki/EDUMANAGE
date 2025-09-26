export type Teacher = {
  id: number;
  name: string;
  email?: string;
  phone: string;
  department: string;
  subjects: string[];
  status: 'active' | 'on_leave' | 'inactive';
  studentsCount?: number;
  experience?: string; // e.g., "5 years"
  joinDate?: string; // ISO string
  avatar?: string;
};

const KEY = 'teachers-list';

function read(): Teacher[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: Teacher[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export const teachersStore = {
  all(): Teacher[] { return read(); },
  seedIfEmpty(defaults: Teacher[]) {
    const list = read();
    if (!list.length && defaults?.length) write(defaults);
  },
  add(t: Partial<Teacher>): Teacher {
    const list = read();
    const teacher: Teacher = {
      id: typeof t.id === 'number' ? t.id : Date.now(),
      name: t.name || 'Unnamed',
      email: t.email || '',
      phone: t.phone || '',
      department: t.department || '',
      subjects: Array.isArray(t.subjects) ? t.subjects : [],
      status: (t.status as Teacher['status']) || 'active',
      studentsCount: typeof t.studentsCount === 'number' ? t.studentsCount : 0,
      experience: t.experience || '0 years',
      joinDate: t.joinDate || new Date().toISOString().slice(0,10),
      avatar: t.avatar || '',
    };
    list.push(teacher);
    write(list);
    return teacher;
  },
  update(id: number, patch: Partial<Teacher>): Teacher | null {
    const list = read();
    const idx = list.findIndex(t => t.id === id);
    if (idx < 0) return null;
    const updated = { ...list[idx], ...patch } as Teacher;
    list[idx] = updated;
    write(list);
    return updated;
  },
  remove(id: number) {
    const list = read();
    write(list.filter(t => t.id !== id));
  }
};
