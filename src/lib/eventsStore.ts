export type EventType = 'school_event' | 'holiday' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  location?: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  createdBy?: string;
}

const KEY = 'calendar-events';

function read(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: CalendarEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

function toId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const eventsStore = {
  all(): CalendarEvent[] {
    return read().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },
  byDateRange(startISO: string, endISO: string): CalendarEvent[] {
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    return read().filter(ev => {
      const st = new Date(ev.start).getTime();
      const en = new Date(ev.end).getTime();
      return en >= s && st <= e;
    }).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },
  add(ev: Omit<CalendarEvent, 'id'> & { id?: string }): CalendarEvent {
    const list = read();
    const rec: CalendarEvent = { id: ev.id || toId(), ...ev } as CalendarEvent;
    list.push(rec);
    write(list);
    return rec;
  },
  update(id: string, patch: Partial<CalendarEvent>) {
    const list = read();
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      write(list);
    }
  },
  remove(id: string) {
    write(read().filter(e => e.id !== id));
  },
};
