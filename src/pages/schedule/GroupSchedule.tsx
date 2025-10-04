import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { scheduleStore, type ScheduleSession } from "@/lib/scheduleStore";
import { activityStore } from "@/lib/activityStore";
import { Calendar, ChevronLeft, Plus, Palette, Download, Trash2 } from "lucide-react";
import { exportTimetablePdf } from "@/lib/pdfUtils";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { groupsApi, timetableApi, coursesApi, teachersApi, subjectsApi, API_BASE } from "@/lib/api";

// days will be localized using translations
const dayIndexes = [0,1,2,3,4,5,6] as const;

const colorOptions = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Green", value: "bg-green-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Teal", value: "bg-teal-500" },
  { label: "Rose", value: "bg-rose-500" },
  { label: "Amber", value: "bg-amber-500" },
];

function timeToMinutes(hhmm: string) {
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + (m||0);
}
function minutesToTime(mins: number) {
  const h = String(Math.floor(mins/60)).padStart(2,'0');
  const m = String(mins%60).padStart(2,'0');
  return `${h}:${m}`;
}

const GroupSchedule = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const groupName = decodeURIComponent(String(params.groupId || "")).trim();
  const { institutionSettings } = useSettings();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editSession, setEditSession] = useState<ScheduleSession | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);

  // Load teacher list from database instead of localStorage fallback
    useEffect(() => {
      const loadTeachers = async () => {
        try {
          const teachers = await teachersApi.list();
          const names = Array.isArray(teachers) 
            ? teachers.map((t: any) => t.full_name || t.name || '').filter(Boolean)
            : [];
          setTeacherOptions(names);
        } catch (error) {
          console.error('Failed to load teachers:', error);
          setTeacherOptions([]);
        }
      };
      loadTeachers();
    }, []);
  useEffect(() => {
    (async () => {
      try {
        const subs = await subjectsApi.list();
        const names = Array.isArray(subs) ? (subs as any[]).map(s => s.name).filter(Boolean) : [];
        setSubjectOptions(Array.from(new Set(names)));
      } catch {
        setSubjectOptions([]);
      }
    })();
  }, []);

  // load sessions for this group
  useEffect(() => {
    // Initial load from local store for instant UI
    const all = scheduleStore.getAll();
    setSessions(all.filter(s => (s.group || '').trim() === groupName));

    // Resolve backend group id by matching name, then load timetable from DB
    const resolveAndLoad = async () => {
      try {
        const groups = await groupsApi.list();
        const found = (groups || []).find((g: any) => String(g.name).trim() === groupName);
        if (found) {
          setGroupId(found.id);
          await refreshFromBackend(found.id);
        }
      } catch {}
    };
    resolveAndLoad();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'schedule-sessions') {
        const next = scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName);
        setSessions(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [groupName]);

  const refreshFromBackend = async (gid: number) => {
    try {
      const [tt, courses, teachers] = await Promise.all([
        timetableApi.list(),
        coursesApi.list(),
        teachersApi.list().catch(() => []),
      ]);
      const entries = (tt || []).filter((e: any) => Number(e.group_id) === Number(gid));
      const makeHHMM = (t: string) => String(t || '').slice(0, 5);
      const findTeacherName = (teacher_id?: number | null) => {
        const t = (teachers || []).find((x: any) => Number(x.id) === Number(teacher_id));
        return t?.full_name || '';
      };
      const byGroupName: ScheduleSession[] = entries.map((e: any) => {
        const course = (courses || []).find((c: any) => Number(c.id) === Number(e.course_id));
        const title = course?.name || '';
        const teacher = course ? findTeacherName(course.teacher_id) : '';
        return {
          id: String(e.id),
          title,
          subject: title,
          teacher,
          classroom: '',
          group: groupName,
          day: Number(e.day_of_week) as any,
          startTime: makeHHMM(e.start_time),
          endTime: makeHHMM(e.end_time),
          level: '-',
          students: 0,
          color: 'bg-blue-500',
        };
      });
      // Mirror into local store for consistency with other views
      const existing = scheduleStore.getAll().filter(s => (s.group || '').trim() !== groupName);
      scheduleStore.bulkSet([...existing, ...byGroupName]);
      setSessions(byGroupName);
    } catch {}
  };

  const byDay = useMemo(() => {
    const map: Record<number, ScheduleSession[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    sessions.forEach(s => { map[s.day] = [...(map[s.day] || []), s]; });
    Object.keys(map).forEach(k => (map as any)[k].sort((a: ScheduleSession, b: ScheduleSession) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)));
    return map;
  }, [sessions]);

  const pauseLabel = language === 'fr' ? 'PAUSE' : language === 'ar' ? 'استراحة' : 'PAUSE';
  const periodTemplate = useMemo(() => ([
    { key: 'p1', label: '1', startMin: timeToMinutes('08:00'), endMin: timeToMinutes('09:00'), pause: false },
    { key: 'p2', label: '2', startMin: timeToMinutes('09:00'), endMin: timeToMinutes('10:00'), pause: false },
    { key: 'p3', label: '3', startMin: timeToMinutes('10:00'), endMin: timeToMinutes('11:00'), pause: false },
    { key: 'p4', label: '4', startMin: timeToMinutes('11:00'), endMin: timeToMinutes('12:00'), pause: false },
    { key: 'pause', label: pauseLabel, startMin: timeToMinutes('12:00'), endMin: timeToMinutes('13:00'), pause: true },
    { key: 'p6', label: '6', startMin: timeToMinutes('13:00'), endMin: timeToMinutes('14:00'), pause: false },
    { key: 'p7', label: '7', startMin: timeToMinutes('14:00'), endMin: timeToMinutes('15:00'), pause: false },
    { key: 'p8', label: '8', startMin: timeToMinutes('15:00'), endMin: timeToMinutes('16:00'), pause: false },
    { key: 'p9', label: '9', startMin: timeToMinutes('16:00'), endMin: timeToMinutes('17:00'), pause: false },
    { key: 'p10', label: '10', startMin: timeToMinutes('17:00'), endMin: timeToMinutes('18:00'), pause: false },
    { key: 'p11', label: '11', startMin: timeToMinutes('18:00'), endMin: timeToMinutes('19:00'), pause: false },
    { key: 'p12', label: '12', startMin: timeToMinutes('19:00'), endMin: timeToMinutes('20:00'), pause: false },
    { key: 'p13', label: '13', startMin: timeToMinutes('20:00'), endMin: timeToMinutes('21:00'), pause: false },
    { key: 'p14', label: '14', startMin: timeToMinutes('21:00'), endMin: timeToMinutes('22:00'), pause: false },
  ]), [language]);

  const dayOrder = useMemo(() => [1, 2, 3, 4, 5, 6, 0], []);

  const dayAbbr = (d: number) => (language === 'fr' ? ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'][d] : language === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]);

  const timetableMatrix = useMemo(() => {
    return dayOrder.map((d) => {
      const list = (byDay[d] || []).slice().sort((a: ScheduleSession, b: ScheduleSession) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      const cells: Array<{ key: string; span: number; isPause?: boolean; title?: string; teacher?: string; room?: string; session?: ScheduleSession }> = [];
      for (let i = 0; i < periodTemplate.length; ) {
        const p = periodTemplate[i];
        if (p.pause) {
          cells.push({ key: `pause-${i}`, span: 1, isPause: true, title: pauseLabel }); i++; continue;
        }
        const found = list.find((s) => {
          const sStart = timeToMinutes(s.startTime);
          return sStart >= p.startMin && sStart < p.endMin;
        });
        if (found) {
          const sEnd = timeToMinutes(found.endTime);
          let endIdx = i;
          while (endIdx < periodTemplate.length && !periodTemplate[endIdx].pause && sEnd > periodTemplate[endIdx].endMin) {
            endIdx++;
          }
          const span = Math.max(1, endIdx - i + 1);
          const room = found.classroom ? `${language === 'fr' ? 'Salle' : 'Room'} ${found.classroom}` : undefined;
          cells.push({ key: found.id || `${d}-${i}`, span, title: found.title || found.subject, teacher: found.teacher, room, session: found });
          i = endIdx + 1;
        } else {
          cells.push({ key: `empty-${i}`, span: 1 }); i++;
        }
      }
      return { day: d, cells };
    });
  }, [byDay, dayOrder, periodTemplate, language]);

  const openAdd = () => setAddOpen(true);
  const openEdit = (s: ScheduleSession) => setEditSession(s);

  const handleCreate = async (payload: Omit<ScheduleSession, 'id'>) => {
    // Instant UI via local store
    const tempId = String(Date.now());
    const item: ScheduleSession = { id: tempId, ...payload };
    scheduleStore.upsert(item);
    setSessions(scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName));
    activityStore.add({ id: `${Date.now()}`, type: 'course_add', message: `Added session: ${item.title} (${item.startTime}-${item.endTime})`, timestamp: Date.now() });
    setAddOpen(false);

    // Persist to backend if group resolved
    try {
      if (!groupId) throw new Error("Group ID not resolved");
      // Ensure teacher
      let teacherId: number | null = null;
      if (item.teacher) {
        const teachers = await teachersApi.list().catch(() => []);
        const t = (teachers || []).find((x: any) => String(x.full_name).trim() === String(item.teacher).trim());
        teacherId = t?.id || null;
        if (!teacherId) {
          const created = await teachersApi.create({ full_name: item.teacher });
          teacherId = created?.id || null;
        }
      }
      // Ensure course
      const courses = await coursesApi.list();
      let course = (courses || []).find((c: any) => String(c.name).trim() === String(item.title || item.subject).trim() && Number(c.group_id) === Number(groupId));
      if (!course) {
        course = await coursesApi.create({ name: item.title || item.subject || 'Course', teacher_id: teacherId, group_id: groupId });
      }
      // Create timetable row
      const tt = await timetableApi.create({
        group_id: groupId,
        day_of_week: Number(item.day),
        start_time: `${item.startTime}:00`,
        end_time: `${item.endTime}:00`,
        course_id: course?.id ?? null,
      });
      // Replace temp id with backend id in local store
      const updated: ScheduleSession = { ...item, id: String(tt.id) };
      const rest = scheduleStore.getAll().filter(s => s.id !== tempId);
      scheduleStore.bulkSet([...rest, updated]);
      setSessions(scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName));
    } catch (err: any) {
        toast({ title: t.error, description: err.message, variant: "destructive" });
        // Rollback local store change
        scheduleStore.remove(tempId);
        setSessions(scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName));
    }
  };

  const handleUpdate = async (payload: ScheduleSession) => {
    scheduleStore.upsert(payload);
    activityStore.add({ id: `${Date.now()}`, type: 'course_edit', message: `Updated session: ${payload.title} (${payload.startTime}-${payload.endTime})`, timestamp: Date.now() });
    setEditSession(null);
    setSessions(scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName));
    try {
      if (!groupId) return;
      const idNum = Number(payload.id);
      // Ensure teacher/course
      let teacherId: number | null = null;
      if (payload.teacher) {
        const teachers = await teachersApi.list().catch(() => []);
        const t = (teachers || []).find((x: any) => String(x.full_name).trim() === String(payload.teacher).trim());
        teacherId = t?.id || null;
        if (!teacherId) { const created = await teachersApi.create({ full_name: payload.teacher }); teacherId = created?.id || null; }
      }
      const courses = await coursesApi.list();
      let course = (courses || []).find((c: any) => String(c.name).trim() === String(payload.title || payload.subject).trim() && Number(c.group_id) === Number(groupId));
      if (!course) { course = await coursesApi.create({ name: payload.title || payload.subject || 'Course', teacher_id: teacherId, group_id: groupId }); }
      if (Number.isFinite(idNum)) {
        await timetableApi.update(idNum, {
          group_id: groupId,
          day_of_week: Number(payload.day),
          start_time: `${payload.startTime}:00`,
          end_time: `${payload.endTime}:00`,
          course_id: course?.id ?? null,
        });
      } else {
        const tt = await timetableApi.create({
          group_id: groupId,
          day_of_week: Number(payload.day),
          start_time: `${payload.startTime}:00`,
          end_time: `${payload.endTime}:00`,
          course_id: course?.id ?? null,
        });
        // Replace local id with backend id
        const rest = scheduleStore.getAll().filter(s => s.id !== payload.id);
        scheduleStore.bulkSet([...rest, { ...payload, id: String(tt.id) }]);
        setSessions(scheduleStore.getAll().filter(s => (s.group || '').trim() === groupName));
      }
    } catch (err: any) {
        toast({ title: t.error, description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (s: ScheduleSession) => {
    if (!confirm(`${t.confirmDelete}: ${s.title}`)) return;
    const originalSessions = sessions;
    scheduleStore.remove(s.id);
    activityStore.add({ id: `${Date.now()}`, type: 'course_delete', message: `Deleted session: ${s.title}`, timestamp: Date.now() });
    setSessions(scheduleStore.getAll().filter(x => (x.group || '').trim() === groupName));
    // Remove from backend if persisted
    const idNum = Number(s.id);
    if (Number.isFinite(idNum)) {
      try {
        await timetableApi.remove(idNum);
      } catch (err: any) {
        toast({ title: t.error, description: err.message, variant: "destructive" });
        setSessions(originalSessions);
      }
    }
  };

  const exportPDF = async () => {
    try {
      if (!groupId) throw new Error('Group not resolved yet');
      const resp = await timetableApi.groupPdf(groupId);
      if (resp?.path) {
        const url = `${API_BASE}${resp.path}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable_${groupName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      throw new Error('No PDF path returned');
    } catch (e: any) {
      // Fallback to client-side PDF so user still gets a document
      const mapped: Record<number, Array<{ startTime: string; endTime: string; title?: string; subject?: string; teacher?: string; classroom?: string }>> = {} as any;
      dayIndexes.forEach((d) => {
        const list = byDay[d] || [];
        mapped[d] = list.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          title: s.title || s.subject,
          subject: s.subject,
          teacher: s.teacher,
          classroom: s.classroom,
        }));
      });
      exportTimetablePdf({
        lang: (language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en'),
        centerName: institutionSettings.name,
        groupName,
        byDay: mapped,
      });
      toast({ title: t.warning || 'Warning', description: t.downloadFailed || 'Backend PDF not available, used fallback PDF.', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{groupName}</h1>
          <p className="text-muted-foreground">{t.scheduleManagement}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full border-primary text-primary hover:bg-primary/10"
            onClick={() => navigate('/schedule/groups')}
          >
            <ChevronLeft className="h-4 w-4 mr-2"/>Groupes
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            className="rounded-full"
          >
            <Download className="h-4 w-4 mr-2"/>Télécharger PDF
          </Button>
          <Button
            className="rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow hover:opacity-90"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4 mr-2"/>Ajouter une séance
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5"/> Emploi du temps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] table-fixed border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-2 text-left w-[60px]">{language === 'fr' ? 'Jour' : language === 'ar' ? 'اليوم' : 'Day'}</th>
                  {periodTemplate.map((p, idx) => (
                    <th key={p.key} className="border p-2 text-center">
                      {!p.pause ? (
                        <div>
                          <div className="font-semibold">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{minutesToTime(p.startMin)} - {minutesToTime(p.endMin)}</div>
                        </div>
                      ) : (
                        <div className="font-bold">{pauseLabel}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetableMatrix.map((row) => (
                  <tr key={`row-${row.day}`} className="align-top">
                    <td className="border text-center font-semibold">{dayAbbr(row.day)}</td>
                    {row.cells.map((c) => c.isPause ? (
                      <td key={c.key} className="border text-center font-semibold text-muted-foreground">{pauseLabel}</td>
                    ) : c.title ? (
                      <td key={c.key} colSpan={c.span} className={`border p-2 group relative ${c.session?.color}`}>
                        <div className="text-center font-semibold cursor-pointer" onClick={() => c.session && openEdit(c.session)}>
                          {c.title || 'No Title'}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{c.teacher || ''}</span>
                          <span>{c.room || ''}</span>
                        </div>
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => c.session && handleDelete(c.session)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    ) : (
                      <td key={c.key} className="border p-2"></td>
                    )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add modal */}
      <GroupSessionModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(payload) => handleCreate({ ...payload, group: groupName })}
        defaultDay={new Date().getDay()}
        teacherOptions={teacherOptions}
        subjectOptions={subjectOptions}
      />

      {/* Edit modal */}
      {editSession && (
        <GroupSessionModal
          open={!!editSession}
          onOpenChange={(v) => { if (!v) setEditSession(null); }}
          onSubmit={(payload) => handleUpdate({ ...editSession, ...payload, group: groupName })}
          initial={editSession}
          teacherOptions={teacherOptions}
          subjectOptions={subjectOptions}
        />
      )}
    </div>
  );
};

export default GroupSchedule;

// Modal for creating/updating a group session
function GroupSessionModal({ open, onOpenChange, onSubmit, initial, defaultDay, teacherOptions, subjectOptions }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Omit<ScheduleSession, 'id' | 'group'> & { group?: string }) => void;
  initial?: ScheduleSession | null;
  defaultDay?: number;
  teacherOptions: string[];
  subjectOptions: string[];
}) {
  const { t, language } = useTranslation();
  const [title, setTitle] = useState(initial?.title || initial?.subject || "");
  const [subject, setSubject] = useState(initial?.subject || initial?.title || "");
  const [teacher, setTeacher] = useState(initial?.teacher || "");
  const [classroom, setClassroom] = useState(initial?.classroom || "");
  const [day, setDay] = useState(String(initial?.day ?? (defaultDay ?? 1)));
  const [startTime, setStartTime] = useState(initial?.startTime || "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime || "09:00");
  const [color, setColor] = useState(initial?.color || colorOptions[0].value);
  const [students, setStudents] = useState<number>(initial?.students ?? 0);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || initial?.subject || "");
    setSubject(initial?.subject || initial?.title || "");
    setTeacher(initial?.teacher || "");
    setClassroom(initial?.classroom || "");
    setDay(String(initial?.day ?? (defaultDay ?? 1)));
    setStartTime(initial?.startTime || "08:00");
    setEndTime(initial?.endTime || "09:00");
    setColor(initial?.color || colorOptions[0].value);
    setStudents(initial?.students ?? 0);
  }, [open, initial, defaultDay]);

  // Start times 08:00–21:00, End times 09:00–22:00
  const startHours = Array.from({ length: 14 }, (_, i) => String(8 + i).padStart(2, '0'));
  const endHours = Array.from({ length: 14 }, (_, i) => String(9 + i).padStart(2, '0'));

  const save = () => {
    const sH = parseInt((startTime || '08:00').split(':')[0], 10);
    const eH = parseInt((endTime || '09:00').split(':')[0], 10);
    if (eH <= sH) return alert(t.invalidTimeRange || 'End time must be after start time');
    onSubmit({
      title: title || subject,
      subject: subject || title,
      teacher,
      classroom,
      day: parseInt(day, 10),
      startTime,
      endTime,
      level: '-',
      students,
      color,
    } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initial ? t.edit : t.add}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          { /* Localized labels */ }
          {(() => { return null; })()}
          { /* Compute labels */ }
          { /* eslint-disable */ }
          { /* Using constants below for clarity */ }


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.subject}</Label>
              <Select value={subject} onValueChange={(v) => { setSubject(v); if (!title) setTitle(v); }}>
                <SelectTrigger><SelectValue placeholder={t.selectSubject || t.subject} /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.teacher}</Label>
              <Select value={teacher} onValueChange={setTeacher}>
                <SelectTrigger><SelectValue placeholder={t.selectTeacher || t.teacher} /></SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.courseTitle || 'Titre'}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mathématiques" />
          </div>

          {(() => { return null; })()}
          { /* Day/Time Row */ }
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Jour' : language === 'ar' ? 'اليوم' : 'Day'}</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Jour' : language === 'ar' ? 'اليوم' : 'Day'} /></SelectTrigger>
                <SelectContent>
                  {([t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday] as string[]).map((dn, idx) => (
                    <SelectItem key={`d-${idx}`} value={String(idx)}>{dn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.startTime}</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger><SelectValue placeholder={t.startTime} /></SelectTrigger>
                <SelectContent>
                  {startHours.map(h => (<SelectItem key={h} value={`${h}:00`}>{h}:00</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.endTime}</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger><SelectValue placeholder={t.endTime} /></SelectTrigger>
                <SelectContent>
                  {endHours.filter(h => parseInt(h, 10) > parseInt((startTime || '08:00').split(':')[0], 10)).map(h => (<SelectItem key={h} value={`${h}:00`}>{h}:00</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          { /* Room/Students/Color Row */ }
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t.room || 'Salle'}</Label>
              <Input value={classroom} onChange={(e) => setClassroom(e.target.value)} placeholder="Salle 101" />
            </div>
            <div className="space-y-2">
              <Label>{t.students}</Label>
              <Input type="number" min={0} value={students} onChange={(e) => setStudents(parseInt(e.target.value || '0', 10))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Palette className="h-4 w-4" />{language === 'fr' ? 'Couleur' : language === 'ar' ? 'اللون' : 'Color'}</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Couleur' : language === 'ar' ? 'اللون' : 'Color'} /></SelectTrigger>
                <SelectContent>
                  {colorOptions.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button onClick={save}>{t.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
