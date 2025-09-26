export type ActivityType =
  | 'enrollment'
  | 'payment'
  | 'course_add'
  | 'course_edit'
  | 'course_delete'
  | 'report_generated'
  | 'report_downloaded'
  | 'exam_created'
  | 'exam_updated'
  | 'student_added'
  | 'student_deleted'
  | 'teacher_deleted'
  | 'note_changed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: number; // Date.now()
}

const KEY = 'activity-feed';

function read(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: ActivityItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export const activityStore = {
  add(item: ActivityItem) {
    const list = read();
    list.push(item);
    // keep last 200
    const next = list.sort((a,b) => b.timestamp - a.timestamp).slice(0, 200);
    write(next);
  },
  getRecent(limit = 20): ActivityItem[] {
    return read().sort((a,b) => b.timestamp - a.timestamp).slice(0, limit);
  },
  clear() { write([]); }
};
