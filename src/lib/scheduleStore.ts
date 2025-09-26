export interface ScheduleSession {
  id: string;
  title: string;
  teacher: string;
  group: string;
  subject: string;
  classroom: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  day: number;       // 0=Sun .. 6=Sat
  level: string;
  students: number;
  color: string;
}

const KEY = 'schedule-sessions';

function read(): ScheduleSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(sessions: ScheduleSession[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {}
}

export const scheduleStore = {
  getAll(): ScheduleSession[] {
    return read();
  },
  getByDay(day: number): ScheduleSession[] {
    return read().filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
  },
  upsert(session: ScheduleSession) {
    const list = read();
    const idx = list.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    write(list);
  },
  bulkSet(sessions: ScheduleSession[]) {
    write(sessions);
  },
  remove(id: string) {
    write(read().filter(s => s.id !== id));
  },
  clear() {
    write([]);
  }
};
