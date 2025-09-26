export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string; // uuid or unique string
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number; // Date.now()
  read: boolean;
}

const KEY = 'notifications';

function read(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: NotificationItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export const notificationsStore = {
  all(): NotificationItem[] {
    return read().sort((a, b) => b.timestamp - a.timestamp);
  },
  add(item: NotificationItem) {
    const list = read();
    list.push(item);
    const next = list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 300);
    write(next);
  },
  latest(): NotificationItem | undefined {
    const list = read();
    if (!list.length) return undefined;
    return list.sort((a, b) => b.timestamp - a.timestamp)[0];
  },
  markRead(id: string) {
    const list = read().map(n => (n.id === id ? { ...n, read: true } : n));
    write(list);
  },
  markAllRead() {
    const list = read().map(n => ({ ...n, read: true }));
    write(list);
  },
  remove(id: string) {
    const list = read().filter(n => n.id !== id);
    write(list);
  },
  clear() {
    write([]);
  },
};
