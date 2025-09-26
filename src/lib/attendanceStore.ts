export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  date: string;         // ISO YYYY-MM-DD
  group: string;        // group id or name
  student: string;      // student name or id
  status: AttendanceStatus;
}

const KEY = 'attendance-records';

function read(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: AttendanceRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export const attendanceStore = {
  all(): AttendanceRecord[] { return read(); },
  add(rec: AttendanceRecord) {
    const list = read();
    list.push(rec);
    write(list);
  },
  saveBatch(dateISO: string, group: string, students: Array<{ student: string; status: AttendanceStatus }>) {
    const list = read();
    // remove duplicates for same date/group/student before pushing new ones
    const key = (s: string) => `${dateISO}\u0001${group}\u0001${s}`;
    const incomingKeys = new Set(students.map(s => key(s.student)));
    const filtered = list.filter(r => !incomingKeys.has(key(r.student)) || r.date !== dateISO || r.group !== group);
    const toAdd: AttendanceRecord[] = students.map(s => ({ date: dateISO, group, student: s.student, status: s.status }));
    write([...filtered, ...toAdd]);
  },
  forStudent(group: string, student: string): AttendanceRecord[] {
    const s = (student || '').toLowerCase();
    const g = (group || '').toLowerCase();
    return read().filter(r => r.group.toLowerCase() === g && r.student.toLowerCase() === s);
  },
  percentage(group: string, student: string): number | null {
    const recs = this.forStudent(group, student);
    if (!recs.length) return null;
    const present = recs.filter(r => r.status === 'present').length;
    const late = recs.filter(r => r.status === 'late').length;
    const total = recs.length;
    const pct = ((present + 0.5 * late) / total) * 100;
    return Math.round(pct * 10) / 10;
  }
};
