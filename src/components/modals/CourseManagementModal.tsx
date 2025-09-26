import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ManageEnrollmentModal from "./ManageEnrollmentModal";
import EditScheduleModal from "./EditScheduleModal";
import { 
  UserCheck, 
  Users, 
  Calendar, 
  Clock,
  BookOpen,
  TrendingUp,
  Mail,
  Phone,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { studentsApi, attendanceApi, groupsApi, timetableApi } from "@/lib/api";

interface CourseManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
}

const CourseManagementModal = ({ open, onOpenChange, course }: CourseManagementModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { t } = useTranslation();

  if (!course) return null;

  // Real data state
  const [groupInfo, setGroupInfo] = useState<any | null>(null);
  const [students, setStudents] = useState<Array<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status?: string | null;
    attendance?: number | null;
    grade?: number | null;
    enrolledDate?: string | null;
  }>>([]);
  const [scheduleData, setScheduleData] = useState<Array<{ day: string; time: string; topic: string }>>([]);

  useEffect(() => {
    if (!course) return;
    let alive = true;
    (async () => {
      try {
        // Load group
        const g = course.group_id ? await groupsApi.get(course.group_id).catch(() => null) : null;
        if (!alive) return;
        setGroupInfo(g);

        // Load students of this group
        const allStudents = await studentsApi.list().catch(() => []);
        if (!alive) return;
        const studs = (Array.isArray(allStudents) ? allStudents : []).filter((s: any) => Number(s.group_id) === Number(course.group_id));

        // Load attendance and compute per-student percentage
        const attendance = await attendanceApi.list().catch(() => []);
        const byStudent = new Map<number, any[]>();
        (Array.isArray(attendance) ? attendance : []).forEach((r: any) => {
          const sid = Number(r.student_id);
          if (!byStudent.has(sid)) byStudent.set(sid, []);
          byStudent.get(sid)!.push(r);
        });
        const withAttendance = studs.map((s: any) => {
          const sid = Number(s.id);
          const recs = byStudent.get(sid) || [];
          let pct: number | null = null;
          if (recs.length) {
            const present = recs.filter((r: any) => String(r.status).toLowerCase() === 'present').length;
            const late = recs.filter((r: any) => String(r.status).toLowerCase() === 'late').length;
            pct = Math.round(((present + 0.5 * late) / recs.length) * 100);
          }
          return {
            id: sid,
            name: s.full_name || s.name || '',
            email: s.email || null,
            phone: s.phone || null,
            status: s.status ?? null,
            attendance: pct,
            grade: null,
            enrolledDate: s.created_at || null,
          };
        });
        if (!alive) return;
        setStudents(withAttendance);

        // Load schedule from timetable entries
        const allEntries = await timetableApi.list().catch(() => []);
        if (!alive) return;
        const entries = (Array.isArray(allEntries) ? allEntries : []).filter((e: any) => Number(e.group_id) === Number(course.group_id) && (!e.course_id || Number(e.course_id) === Number(course.id)));
        const dayName = (d: number) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][Math.max(0, Math.min(6, Number(d)||0))];
        const fmt = (v: any) => {
          if (!v) return '';
          const s = String(v);
          const m = s.match(/\d{1,2}:\d{2}/);
          return m ? m[0] : s;
        };
        const sched = entries.map((e: any) => ({
          day: dayName(e.day_of_week),
          time: `${fmt(e.start_time)} - ${fmt(e.end_time)}`,
          topic: '',
        }));
        setScheduleData(sched);
      } catch {
        setGroupInfo(null);
        setStudents([]);
        setScheduleData([]);
      }
    })();
    return () => { alive = false; };
  }, [course?.id, course?.group_id]);

  // Derived analytics (DB-backed or placeholders)
  const totalStudents = students.length;
  const capacity = Number(groupInfo?.capacity ?? 0) || 0;
  const enrollmentPct = capacity > 0 ? Math.max(0, Math.min(100, Math.round((totalStudents / capacity) * 100))) : null;
  const avgAttendance = useMemo(() => {
    const vals = students.map(s => s.attendance).filter((v): v is number => typeof v === 'number');
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [students]);
  const attendanceTrend: Array<number | null> = [0, 1, 2, 3].map(() => (avgAttendance != null ? avgAttendance : null));
  const avgStudyHours = useMemo(() => {
    const minutesBetween = (span: string) => {
      const parts = String(span || '').split('-').map(p => p.trim());
      if (parts.length !== 2) return 0;
      const toMin = (t: string) => {
        const m = t.match(/(\d{1,2}):(\d{2})/);
        if (!m) return 0;
        const h = parseInt(m[1], 10); const min = parseInt(m[2], 10);
        return h * 60 + min;
      };
      const a = toMin(parts[0]);
      const b = toMin(parts[1]);
      return Math.max(0, b - a);
    };
    const totalMins = scheduleData.reduce((acc, s) => acc + minutesBetween(s.time), 0);
    return totalMins ? Math.round((totalMins / 60) * 10) / 10 : null;
  }, [scheduleData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t.active;
      case 'inactive': return t.inactive;
      case 'pending': return t.pending;
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t.courseManagement} - {course.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="students">{t.students}</TabsTrigger>
            <TabsTrigger value="schedule">{t.schedule}</TabsTrigger>
            <TabsTrigger value="analytics">{t.statistics}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t.enrollmentStatus || 'Enrollment Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{totalStudents}</span>
                      <span className="text-sm text-muted-foreground">/ {capacity || '—'}</span>
                    </div>
                    {enrollmentPct != null ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${enrollmentPct}%` }}
                        ></div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t.courseProgress || 'Course Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <span className="text-2xl font-bold">—</span>
                    <div className="w-full bg-gray-200 rounded-full h-2" />
                    <p className="text-xs text-muted-foreground">Course completion</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t.assignedGroups || 'Assigned Groups'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <span className="text-2xl font-bold">{course.group_id ? 1 : 0}</span>
                    <div className="space-y-1">
                      {groupInfo?.name ? (
                        <Badge variant="outline" className="text-xs">{groupInfo.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t.quickStats || 'Quick Stats'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue">{avgAttendance != null ? `${avgAttendance}%` : '—'}</p>
                    <p className="text-sm text-muted-foreground">{t.avgAttendance || 'Avg Attendance'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green">—</p>
                    <p className="text-sm text-muted-foreground">{t.avgRating || 'Avg Rating'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple">—</p>
                    <p className="text-sm text-muted-foreground">{t.assignments || 'Assignments'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange">—</p>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t.enrolledStudents} ({students.length})</h3>
              <Button size="sm" onClick={() => setEnrollmentModalOpen(true)}>
                {t.manageEnrollment}
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.student}</TableHead>
                      <TableHead>{t.groupContact || 'Contact'}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.attendance || 'Attendance'}</TableHead>
                      <TableHead>{`${t.grades || 'Grades'} (/20)`}</TableHead>
                      <TableHead>{t.enrolledStudents}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {String(student.name || '').split(' ').map(n => n?.[0] || '').join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student.email || '—'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.phone || '—'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.status ? (
                            <Badge className={`border ${getStatusColor(student.status)}`}>
                              {getStatusLabel(student.status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{student.attendance != null ? `${student.attendance}%` : '—'}</span>
                            {student.attendance != null && student.attendance >= 80 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">—</Badge>
                        </TableCell>
                        <TableCell>
                          {student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t.schedule}</h3>
              <Button size="sm" onClick={() => setScheduleModalOpen(true)}>
                {t.editSchedule}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t.weeklySchedule}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleData.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-medium">{session.day}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{session.topic || '—'}</p>
                          <p className="text-sm text-muted-foreground">
                            Instructor: {course.teacher}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{t.scheduled || 'Scheduled'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.studentPerformance || 'Student Performance'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-sm">{t.week || 'Week'} {i + 1}</span>
                        <span className="font-medium">{attendanceTrend[i] != null ? `${attendanceTrend[i]}%` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.attendanceTrends || 'Attendance Trends'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-sm">{t.week || 'Week'} {i + 1}</span>
                        <span className="font-medium">{attendanceTrend[i] != null ? `${attendanceTrend[i]}%` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.courseInsights || 'Course Insights'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green">—</p>
                    <p className="text-sm text-muted-foreground">{t.studentSatisfaction || 'Student Satisfaction'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue">{avgStudyHours != null ? `${avgStudyHours.toFixed(1)} hrs` : '—'}</p>
                    <p className="text-sm text-muted-foreground">{t.avgStudyTimePerWeek || 'Avg Study Time/Week'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple">—</p>
                    <p className="text-sm text-muted-foreground">{t.assignmentCompletion || 'Assignment Completion'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sub-modals */}
        <ManageEnrollmentModal
          open={enrollmentModalOpen}
          onOpenChange={setEnrollmentModalOpen}
          course={course}
        />
        <EditScheduleModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          course={course}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CourseManagementModal;