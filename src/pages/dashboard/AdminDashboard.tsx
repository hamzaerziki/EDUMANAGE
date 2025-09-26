import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { studentsApi, teachersApi, coursesApi, paymentsApi, attendanceApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  CreditCard,
  TrendingUp,
  Calendar,
  Bell,
  Plus,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationsModal from "@/components/modals/NotificationsModal";
import QuickAddModal from "@/components/modals/QuickAddModal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { activityStore, type ActivityItem } from "@/lib/activityStore";
import { scheduleStore, type ScheduleSession } from "@/lib/scheduleStore";
import { examsStore } from "@/lib/examsStore";
import { notificationsStore } from "@/lib/notificationsStore";
import { useToast } from "@/hooks/use-toast";

type StatItem = {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  colorClass?: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [todaysSessions, setTodaysSessions] = useState<ScheduleSession[]>([]);
  const [topScore, setTopScore] = useState<{
    student: string;
    grade: number;
    subject?: string;
    group?: string;
    exam?: string;
    semester?: string;
  } | null>(null);
  const [lastNotifTs, setLastNotifTs] = useState<number>(0);
  const [leftStudentsCount, setLeftStudentsCount] = useState<number>(0);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [currentStudents, setCurrentStudents] = useState<any[]>([]);

  const refreshRealtimeBlocks = async () => {
    setActivities(activityStore.getRecent(10));
    const now = new Date();
    const day = now.getDay(); // 0 Sun..6 Sat
    const sessions = scheduleStore.getAll().filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
    setTodaysSessions(sessions.slice(0, 8));
    // Compute top score across all exams
    try {
      const grids = examsStore.all();
      let best: any = null;
      let bestVal = -Infinity;
      const students = await studentsApi.list();
      const studentIds = students.map((s: any) => s.id);
      for (const g of grids) {
        g.rows?.forEach(r => {
          r.grades?.forEach((val, idx) => {
            if (typeof val === 'number' && val > bestVal && studentIds.includes(g.students?.[idx])) {
              bestVal = val;
              best = {
                grade: val,
                student: g.students?.[idx] || `#${idx+1}`,
                subject: g.subject,
                group: g.title,
                exam: r.examLabel,
                semester: g.semester,
              };
            }
          });
        });
      }
      setTopScore(best);
    } catch {}

    // Check latest notification and show toast if new
    try {
      const latest = notificationsStore.latest();
      if (latest && latest.timestamp > lastNotifTs) {
        setLastNotifTs(latest.timestamp);
        toast({
          title: latest.title,
          description: latest.message,
        });
      }
    } catch {}
  };

  useEffect(() => {
    refreshRealtimeBlocks();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'activity-feed' || e.key === 'schedule-sessions' || e.key === 'exams-grids' || e.key === 'notifications') {
        refreshRealtimeBlocks();
      }
    };
    window.addEventListener('storage', onStorage);
    const interval = setInterval(refreshRealtimeBlocks, 5000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  };
  
  // Load real KPIs from backend and compute attendance rate (late excluded)
  useEffect(() => {
    const load = async () => {
      try {
        const [students, teachers, courses, payments, attendance] = await Promise.all([
          studentsApi.list().catch(() => []),
          teachersApi.list().catch(() => []),
          coursesApi.list().catch(() => []),
          paymentsApi.list().catch(() => []),
          attendanceApi.list().catch(() => []),
        ]);
        setCurrentStudents(students);
        const totalStudents = Array.isArray(students) ? students.length : 0;
        const totalTeachers = Array.isArray(teachers) ? teachers.length : 0;
        const totalCourses = Array.isArray(courses) ? courses.length : 0;
        const now = new Date();
        const ym = now.toISOString().slice(0,7);
        const monthlyRevenue = (payments || []).filter((p:any)=> String(p.status||'paid')==='paid' && String(p.date||'').startsWith(ym)).reduce((s:number,p:any)=> s + Number(p.amount||0), 0);
        const outstandingAmount = (payments || []).filter((p:any)=> String(p.status||'paid')!=='paid').reduce((s:number,p:any)=> s + Number(p.amount||0), 0);
        const todayISO = now.toISOString().slice(0,10);
        const todays = (attendance || []).filter((a:any)=> String(a.date)===todayISO);
        const seen = new Set<number>();
        const unique:any[] = [];
        for (const rec of todays) { const sid = Number(rec.student_id); if (!seen.has(sid)) { seen.add(sid); unique.push(rec); } }
        const present = unique.filter(r=> r.status==='present').length;
        const absent = unique.filter(r=> r.status==='absent').length;
        const denom = present + absent; // ignore late in rate
        const attendanceRate = denom ? Math.round((present/denom)*1000)/10 : 0;
        const leftCount = (students||[]).filter((s:any)=> ['inactive','left'].includes(String(s.status||'').toLowerCase())).length;
        setLeftStudentsCount(leftCount);
        setAnalyticsData({ financial: { monthlyRevenue, outstandingAmount, projectedAnnualRevenue: monthlyRevenue*12 }, attendance: { overallRate: attendanceRate } });
        setStats([
          { title: t.totalStudents, value: totalStudents.toLocaleString(), icon: Users, colorClass: "text-blue-600" },
          { title: t.totalTeachers, value: String(totalTeachers), icon: UserCheck, colorClass: "text-green-600" },
          { title: t.totalCourses, value: String(totalCourses), icon: BookOpen, colorClass: "text-orange-600" },
          { title: t.monthlyRevenue, value: `${monthlyRevenue.toLocaleString()} MAD`, icon: CreditCard, colorClass: "text-emerald-600" },
          { title: t.attendanceRate, value: `${attendanceRate.toFixed(1)}%`, icon: BarChart3, colorClass: "text-sky-600" },
          { title: t.outstandingAmount, value: `${outstandingAmount.toLocaleString()} MAD`, icon: AlertTriangle, colorClass: "text-rose-600" },
        ]);
      } catch {}
    };
    load();
    const interval = setInterval(load, 300000);
    return () => clearInterval(interval);
  }, [t]);

  // Fallback demo data if stores are empty
  const fallbackActivities = [
    { id: 'a1', type: 'enrollment', message: 'John Doe enrolled in Mathematics Course', timestamp: Date.now() - 2*60*60*1000 },
    { id: 'a2', type: 'payment', message: 'Payment received from Sarah Wilson', timestamp: Date.now() - 4*60*60*1000 },
    { id: 'a3', type: 'course_add', message: 'New teacher Maria Garcia added', timestamp: Date.now() - 24*60*60*1000 },
  ] as ActivityItem[];
  const allowedActivityTypes = new Set(['exam_created','exam_updated','student_added','student_deleted','teacher_deleted','note_changed','payment','enrollment']);
  const recentActivities = (activities.length ? activities : fallbackActivities)
    .filter((a: any) => !a.type || allowedActivityTypes.has(a.type));

  const fallbackSessions = [
    { subject: 'Mathematics', teacher: 'Dr. Smith', time: '09:00', students: 24 },
    { subject: 'Physics', teacher: 'Prof. Johnson', time: '11:00', students: 18 },
    { subject: 'Chemistry', teacher: 'Dr. Brown', time: '14:00', students: 22 },
    { subject: 'Biology', teacher: 'Ms. Davis', time: '16:00', students: 20 },
  ];
  const upcomingClasses = todaysSessions.length
    ? todaysSessions.map(s => ({ subject: s.title || s.subject, teacher: s.teacher, time: s.startTime, students: s.students }))
    : fallbackSessions;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.dashboard}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <div className="flex gap-3 items-center">
          <LanguageSelector />
          <Button className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white" onClick={() => setNotificationsOpen(true)}>
            <Bell className="h-4 w-4" />
            {t.notifications}
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t.quickAdd || 'Quick Add'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.colorClass || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.colorClass || ""}`}>{stat.value}</div>
              {stat.change && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} {t.changeFromLastMonth || 'from last month'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retention & Payments Card */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              {t.studentsLeftAndOutstanding}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-md border">
                <div className="text-sm text-muted-foreground">{t.studentsWhoLeft}</div>
                <div className="text-2xl font-bold text-rose-600">{leftStudentsCount}</div>
              </div>
              <div className="p-4 rounded-md border">
                <div className="text-sm text-muted-foreground">{t.outstandingAmount}</div>
                <div className="text-2xl font-bold text-amber-600">{(analyticsData?.financial?.outstandingAmount ?? 0).toLocaleString()} MAD</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              className="justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/attendance')}
            >
              <Calendar className="h-4 w-4" />
              {t.markAttendance}
            </Button>
            <Button 
              className="justify-start gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate('/students')}
            >
              <Users className="h-4 w-4" />
              {t.addStudent}
            </Button>
            <Button 
              className="justify-start gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => navigate('/courses')}
            >
              <BookOpen className="h-4 w-4" />
              {t.addCourse}
            </Button>
            <Button 
              className="justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate('/payments')}
            >
              <CreditCard className="h-4 w-4" />
              {t.recordPayment}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-md border">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{(activity as any).message}</p>
                    <p className="text-xs text-muted-foreground">
                      {(activity as any).timestamp ? relativeTime((activity as any).timestamp) : (activity as any).time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Right column: Top Score + Upcoming Classes */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t.bestGradesSummary || 'Top Score'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topScore ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{topScore.student}</div>
                  <div className="text-xs text-muted-foreground">{topScore.subject || '—'} • {topScore.group || ''} • {topScore.exam || ''}</div>
                  <div className="text-2xl font-bold text-primary">{topScore.grade}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t.todaysClasses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((class_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium text-sm">{class_.subject}</p>
                      <p className="text-xs text-muted-foreground">{class_.teacher}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{class_.time}</p>
                      <Badge variant="secondary" className="text-xs">
                        {class_.students} {t.students.toLowerCase?.() || 'students'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {upcomingClasses.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">{t.noClassesToday || 'Aucun cours programmé aujourd\'hui'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <NotificationsModal 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
      <QuickAddModal 
        open={quickAddOpen} 
        onOpenChange={setQuickAddOpen} 
      />
    </div>
  );
};

export default AdminDashboard;