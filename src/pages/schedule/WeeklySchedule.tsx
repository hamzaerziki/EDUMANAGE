import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Pencil,
  MapPin
} from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import AddCourseModal from "@/components/modals/AddCourseModal";
import { useTranslation } from "@/hooks/useTranslation";
import QuickEditSessionModal, { SessionData } from "@/components/modals/QuickEditSessionModal";
import { scheduleStore, type ScheduleSession } from "@/lib/scheduleStore";
import { activityStore } from "@/lib/activityStore";

interface CourseSchedule {
  id: string;
  title: string;
  teacher: string;
  group: string;
  subject: string;
  classroom: string;
  startTime: string;
  endTime: string;
  day: number; // 0 = Sunday, 1 = Monday, etc.
  level: string;
  students: number;
  color: string;
}

const WeeklySchedule = () => {
  const { t } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  // trigger re-render each minute for current-time indicator
  const [, setNowTick] = useState(0);
  // View state
  const [view, setView] = useState<'week' | 'day'>('day');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()); // 0=Sun..6=Sat
  
  // Generate week days starting from Sunday (Moroccan week)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Helpers
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeToMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const minutesToTime = (mins: number) => `${pad(Math.floor(mins/60))}:${pad(mins%60)}`;

  // Build time slots from 08:00 to 23:00
  const slotStep = view === 'day' ? 30 : 60; // compact day view
  const SLOT_PX = view === 'day' ? 28 : 60;  // visual slot height (smaller in day view)
  const isValidTime = (v?: string) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
  const buildTimeSlots = () => {
    let startMin = 8 * 60;
    let endMin = 23 * 60;
    if (view === 'day') {
      const daySessions = scheduleData.filter(s => s.day === selectedDay && isValidTime(s.startTime) && isValidTime(s.endTime));
      if (daySessions.length) {
        const starts = daySessions.map(s => timeToMinutes(s.startTime)).filter(n => Number.isFinite(n));
        const ends = daySessions.map(s => timeToMinutes(s.endTime)).filter(n => Number.isFinite(n));
        if (starts.length && ends.length) {
          const minStart = Math.min(...starts);
          const maxEnd = Math.max(...ends);
        // add 30 min margin above and below, clamp to day bounds
          startMin = Math.max(8 * 60, Math.floor((minStart - 30) / slotStep) * slotStep);
          endMin = Math.min(23 * 60, Math.ceil((maxEnd + 30) / slotStep) * slotStep);
        }
      } else {
        // no sessions: show compact default window
        startMin = 9 * 60;
        endMin = 15 * 60;
      }
    }
    const slots: string[] = [];
    for (let m = startMin; m <= endMin; m += slotStep) slots.push(minutesToTime(m));
    if (slots.length === 0) slots.push(minutesToTime(startMin));
    return slots;
  };
  // State for schedule
  const [scheduleData, setScheduleData] = useState<CourseSchedule[]>([]);

  // Compute time slots AFTER scheduleData exists to avoid reference errors
  const timeSlots = useMemo(buildTimeSlots, [view, selectedDay, scheduleData]);

  // Mock schedule data with Moroccan curriculum courses (initial)
  const initialScheduleData: CourseSchedule[] = [
    // Sunday
    { id: "1", title: "Mathématiques", teacher: "Prof. Ahmed", group: "2ème Bac PC - A", subject: "Mathématiques", classroom: "Salle 101", startTime: "08:00", endTime: "10:00", day: 0, level: "Lycée", students: 25, color: "bg-blue-500" },
    { id: "2", title: "Physique-Chimie", teacher: "Dr. Fatima", group: "2ème Bac PC - A", subject: "Physique-Chimie", classroom: "Lab 201", startTime: "10:00", endTime: "12:00", day: 0, level: "Lycée", students: 25, color: "bg-green-500" },
    { id: "3", title: "Français", teacher: "Mme. Laila", group: "1ère Bac Lettres - A", subject: "Français", classroom: "Salle 102", startTime: "14:00", endTime: "16:00", day: 0, level: "Lycée", students: 20, color: "bg-purple-500" },
    
    // Monday
    { id: "4", title: "SVT", teacher: "Dr. Omar", group: "2ème Bac SVT - B", subject: "Sciences de la Vie et de la Terre", classroom: "Lab 202", startTime: "08:00", endTime: "10:00", day: 1, level: "Lycée", students: 24, color: "bg-emerald-500" },
    { id: "5", title: "Arabe", teacher: "Prof. Aicha", group: "Tronc Commun - A", subject: "اللغة العربية", classroom: "Salle 103", startTime: "10:00", endTime: "12:00", day: 1, level: "Lycée", students: 30, color: "bg-orange-500" },
    { id: "6", title: "Philosophie", teacher: "Dr. Nadia", group: "2ème Bac Lettres - A", subject: "Philosophie", classroom: "Salle 104", startTime: "14:00", endTime: "16:00", day: 1, level: "Lycée", students: 20, color: "bg-indigo-500" },
    
    // Tuesday
    { id: "7", title: "Anglais", teacher: "Mr. Hassan", group: "1ère Bac Sciences - A", subject: "English", classroom: "Salle 105", startTime: "08:00", endTime: "10:00", day: 2, level: "Lycée", students: 28, color: "bg-red-500" },
    { id: "8", title: "Histoire-Géographie", teacher: "Prof. Youssef", group: "2ème Bac Sciences Humaines", subject: "Histoire-Géographie", classroom: "Salle 106", startTime: "10:00", endTime: "12:00", day: 2, level: "Lycée", students: 18, color: "bg-yellow-500" },
    
    // Wednesday
    { id: "9", title: "Mathématiques", teacher: "Prof. Zineb", group: "3ème Collège - A", subject: "Mathématiques", classroom: "Salle 107", startTime: "09:00", endTime: "11:00", day: 3, level: "Collège", students: 22, color: "bg-blue-500" },
    { id: "10", title: "Sciences", teacher: "Dr. Khalid", group: "2ème Collège - B", subject: "Sciences Physiques", classroom: "Lab 203", startTime: "14:00", endTime: "16:00", day: 3, level: "Collège", students: 30, color: "bg-teal-500" },
    
    // Thursday
    { id: "11", title: "Informatique", teacher: "M. Reda", group: "1ère Bac Sciences - B", subject: "Informatique", classroom: "Lab Info", startTime: "08:00", endTime: "10:00", day: 4, level: "Lycée", students: 26, color: "bg-gray-500" },
    { id: "12", title: "Économie", teacher: "Mme. Khadija", group: "2ème Bac Économie - A", subject: "Sciences Économiques", classroom: "Salle 108", startTime: "14:00", endTime: "16:00", day: 4, level: "Lycée", students: 22, color: "bg-pink-500" },
    
    // Friday
    { id: "13", title: "Français", teacher: "Prof. Sara", group: "6ème Primaire - A", subject: "Français", classroom: "Salle 201", startTime: "08:00", endTime: "10:00", day: 5, level: "Primaire", students: 27, color: "bg-purple-500" },
    { id: "14", title: "Mathématiques", teacher: "Mme. Amina", group: "5ème Primaire - B", subject: "Mathématiques", classroom: "Salle 202", startTime: "10:00", endTime: "12:00", day: 5, level: "Primaire", students: 25, color: "bg-blue-500" },
    
    // Saturday
    { id: "15", title: "Arts Plastiques", teacher: "Prof. Karim", group: "Tronc Commun - B", subject: "Arts Plastiques", classroom: "Atelier Art", startTime: "09:00", endTime: "11:00", day: 6, level: "Lycée", students: 28, color: "bg-rose-500" },
    { id: "16", title: "Éducation Physique", teacher: "Coach Mourad", group: "Multiple Groups", subject: "EPS", classroom: "Gymnase", startTime: "14:00", endTime: "16:00", day: 6, level: "Tous", students: 40, color: "bg-amber-500" }
  ];


  // Seed from store on mount
  useEffect(() => {
    const saved = scheduleStore.getAll();
    if (saved.length > 0) {
      setScheduleData(saved as unknown as CourseSchedule[]);
    } else {
      scheduleStore.bulkSet(initialScheduleData as unknown as ScheduleSession[]);
      setScheduleData(initialScheduleData as unknown as CourseSchedule[]);
    }
  }, []);

  const getCoursesByDayAndTime = (day: number, time: string) => {
    const slotMin = timeToMinutes(time);
    return scheduleData.filter(course => {
      const s = timeToMinutes(course.startTime);
      const e = timeToMinutes(course.endTime);
      return course.day === day && slotMin >= s && slotMin < e;
    });
  };

  const getCourseDurationMinutes = (course: CourseSchedule) => {
    return Math.max(0, timeToMinutes(course.endTime) - timeToMinutes(course.startTime));
  };

  const openQuickEdit = (course: CourseSchedule) => {
    setSelectedSession(course as unknown as SessionData);
    setQuickEditOpen(true);
  };

  const handleQuickSave = (updated: SessionData) => {
    setScheduleData(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelectedSession(null);
    scheduleStore.upsert(updated as unknown as ScheduleSession);
    activityStore.add({ id: `${Date.now()}`, type: 'course_edit', message: `Updated session: ${updated.title} (${updated.startTime}-${updated.endTime})`, timestamp: Date.now() });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
    setSelectedDay(new Date().getDay());
  };

  const prevDay = () => setSelectedDay(d => (d + 6) % 7);
  const nextDay = () => setSelectedDay(d => (d + 1) % 7);

  // Update every minute to move the current time indicator
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const handleCourseAdded = (c: Partial<CourseSchedule>) => {
    // Basic validator and safe defaults
    const id = c.id || String(Date.now());
    const title = c.title || c.subject || 'Nouveau cours';
    const startTime = c.startTime || '08:00';
    const endTime = c.endTime || '09:00';
    const day = typeof c.day === 'number' ? c.day : 0;
    const newItem: CourseSchedule = {
      id,
      title,
      teacher: c.teacher || '—',
      group: c.group || '—',
      subject: c.subject || title,
      classroom: c.classroom || '—',
      startTime,
      endTime,
      day,
      level: c.level || '—',
      students: typeof c.students === 'number' ? c.students : 0,
      color: c.color || 'bg-blue-500',
    };
    setScheduleData(prev => [...prev, newItem]);
    scheduleStore.upsert(newItem as unknown as ScheduleSession);
    activityStore.add({ id: `${Date.now()}`, type: 'course_add', message: `Added session: ${newItem.title} (${newItem.startTime}-${newItem.endTime})`, timestamp: Date.now() });
  };

  const handleDelete = (course: CourseSchedule) => {
    if (confirm(`${t.areYouSure} \n${t.thisActionCannotBeUndone}`)) {
      setScheduleData(prev => prev.filter(c => c.id !== course.id));
      scheduleStore.remove(course.id);
      activityStore.add({ id: `${Date.now()}`, type: 'course_delete', message: `Deleted session: ${course.title} (${course.startTime}-${course.endTime})`, timestamp: Date.now() });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.weeklySchedule}</h1>
          <p className="text-muted-foreground">{t.scheduleManagement}</p>
        </div>
        <Button onClick={() => setShowAddCourseModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addCourse}
        </Button>
      </div>

      {/* Week/Day Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant={view==='week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
              <Button variant={view==='day' ? 'default' : 'outline'} onClick={() => setView('day')}>Day</Button>
            </div>

            {view === 'week' ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4 mr-2" />{t.previousWeek}
                </Button>
                <Button variant="ghost" onClick={goToCurrentWeek}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{t.currentWeek}
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(weekStart, "d MMM")} - {format(addDays(weekStart, 6), "d MMM yyyy")}
                </h2>
                <Button variant="outline" onClick={() => navigateWeek('next')}>
                  {t.nextWeek}<ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={prevDay}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={goToCurrentWeek}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{t.today || 'Today'}
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(weekDays[selectedDay], "EEEE d MMM yyyy")}
                </h2>
                <Button variant="outline" onClick={nextDay}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className={view==='week' ? 'min-w-[1000px]' : 'min-w-[420px]'}>
              {/* Header Row */}
              <div className={`grid ${view==='week' ? 'grid-cols-8' : 'grid-cols-2'} border-b`}>
                <div className="p-4 font-semibold bg-muted">Time</div>
                {(view==='week' ? [0,1,2,3,4,5,6] : [selectedDay]).map((dayIdx) => (
                  <div key={dayIdx} className="p-4 font-semibold bg-muted text-center border-l">
                    <div>{format(weekDays[dayIdx], "EEEE")}</div>
                    <div className="text-sm text-muted-foreground">{format(weekDays[dayIdx], "d MMM")}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {/* Body Grid with absolute-positioned events to span multiple rows */}
              <div className={`grid ${view==='week' ? 'grid-cols-8' : 'grid-cols-2'}`}>
                {/* Time Column with labels */}
                <div className="bg-muted/50">
                  {timeSlots.map((time, idx) => (
                    <div key={time} className="flex items-center px-2 border-b text-xs text-muted-foreground" style={{ height: SLOT_PX }}>
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="tabular-nums">{time}</span>
                    </div>
                  ))}
                </div>
                {(view==='week' ? [0,1,2,3,4,5,6] : [selectedDay]).map((dayIndex) => {
                  const daySessions = scheduleData
                    .filter(s => s.day === dayIndex && isValidTime(s.startTime) && isValidTime(s.endTime))
                    .sort((a,b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                  const containerHeight = Math.max(1, timeSlots.length) * SLOT_PX;
                  const dayStartMin = timeSlots.length ? timeToMinutes(timeSlots[0]) : 8 * 60; // anchor to first visible slot
                  const isTodayColumn = dayIndex === new Date().getDay();
                  return (
                    <div key={`daycol-${dayIndex}`} className="border-l relative" style={{ height: containerHeight }}>
                      {/* Grid lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        {timeSlots.map((_, idx) => (
                          <div key={idx} className="absolute left-0 right-0 border-t border-border/60" style={{ top: idx * SLOT_PX }} />
                        ))}
                      </div>
                      {/* Current time indicator */}
                      {isTodayColumn && (() => {
                        const now = new Date();
                        const nowMin = now.getHours() * 60 + now.getMinutes();
                        const startMin = dayStartMin;
                        const endMin = startMin + timeSlots.length * slotStep;
                        if (nowMin >= startMin && nowMin <= endMin) {
                          const topNow = ((nowMin - startMin) / slotStep) * SLOT_PX;
                          return (
                            <div className="absolute left-0 right-0" style={{ top: topNow }}>
                              <div className="h-[2px] bg-red-500/80" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {/* Events */}
                      {daySessions.map((s) => {
                        const top = ((timeToMinutes(s.startTime) - dayStartMin) / slotStep) * SLOT_PX;
                        const heightRaw = (getCourseDurationMinutes(s) / slotStep) * SLOT_PX;
                        const height = Math.max(18, heightRaw - 1); // reach end line precisely
                        return (
                          <div
                            key={s.id}
                            className={`${s.color} text-white px-2 py-1 rounded-md text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer absolute left-1 right-1 ${selectedSession?.id === s.id ? 'ring-2 ring-offset-2 ring-white/80' : ''}`}
                            style={{ top, height }}
                            title={`${s.title} - ${s.teacher}`}
                            onClick={() => openQuickEdit(s as unknown as CourseSchedule)}
                          >
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openQuickEdit(s as unknown as CourseSchedule); }}
                              className="absolute top-1 right-1 inline-flex items-center justify-center rounded-md bg-black/20 hover:bg-black/30 p-1"
                              aria-label="edit"
                            >
                              <Pencil className="h-3 w-3 text-white" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(s as unknown as CourseSchedule); }}
                              className="absolute top-1 right-6 inline-flex items-center justify-center rounded-md bg-black/20 hover:bg-black/30 p-1"
                              aria-label="delete"
                            >
                              ×
                            </button>
                            <div className="font-semibold truncate text-white">{s.group}</div>
                            <div className="text-[11px] opacity-95 truncate">{s.title || s.subject}</div>
                            <div className="text-[11px] opacity-80 truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{s.classroom}</span>
                              <span className="mx-1">•</span>
                              <span className="tabular-nums">{s.startTime} - {s.endTime}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t.totalCoursesThisWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t.activeTeachers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(scheduleData.map(course => course.teacher)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t.groupsScheduled}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(scheduleData.map(course => course.group)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t.totalStudents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheduleData.reduce((sum, course) => sum + course.students, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>{t.subjectLegend}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from(new Set(scheduleData.map(course => course.subject))).map((subject, index) => {
              const course = scheduleData.find(c => c.subject === subject);
              return (
                <Badge key={subject} variant="outline" className="justify-start">
                  <div className={`w-3 h-3 rounded-full ${course?.color} mr-2`}></div>
                  {subject}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Course Modal */}
      <AddCourseModal 
        open={showAddCourseModal} 
        onOpenChange={setShowAddCourseModal}
        onAdd={handleCourseAdded}
      />

      {/* Quick Edit Modal */}
      <QuickEditSessionModal
        open={quickEditOpen}
        onOpenChange={setQuickEditOpen}
        session={selectedSession}
        onSave={handleQuickSave}
      />
    </div>
  );
};

export default WeeklySchedule;