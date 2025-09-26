import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { attendanceStore } from "@/lib/attendanceStore";
import { subjectGradesApi, groupsApi, coursesApi, teachersApi, attendanceApi, studentsApi } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  groupId?: number | null;
  semester?: string | null;
}

const StudentProfileModal = ({ open, onOpenChange, student, groupId, semester }: StudentProfileModalProps) => {
  if (!student) return null;
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Load real grades from backend to build bulletin and compute DB-based GPA
  const [bulletinData, setBulletinData] = useState<Record<string, Array<{ subject: string; examRows: { label: string; grade: number | null }[]; average: number | null; coefficient?: number }>>>({});
  const [dbGpa, setDbGpa] = useState<number | null>(null);
  const [loadingGrades, setLoadingGrades] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [noData, setNoData] = useState<boolean>(false);

  // Group and courses real data
  const [groupInfo, setGroupInfo] = useState<null | { id: number; name: string; level?: string | null; year?: number | null }>(null);
  const [courses, setCourses] = useState<Array<{ id: number; name: string; teacher_name?: string | null }>>([]);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [attendancePctDb, setAttendancePctDb] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingGrades(true);
      setLoadError(null);
      setNoData(false);
      if (!student?.id) {
        setLoadingGrades(false);
        setLoadError('Missing student id');
        return;
      }
      try {
        const idNum = Number(student.id);
        if (!Number.isFinite(idNum)) {
          setLoadError('Invalid student id');
          setLoadingGrades(false);
          return;
        }
        const paramsBase: any = { student_id: idNum };
        const paramsWithGroup: any = { ...paramsBase };
        if (groupId != null) paramsWithGroup.group_id = Number(groupId);
        if (semester) paramsWithGroup.semester = String(semester);
        const rowsFirst = await subjectGradesApi.getByStudent(groupId != null ? paramsWithGroup : paramsBase);
        let rows = rowsFirst;
        // Fallback: if filtered by group_id but empty, retry without the group filter to not hide data
        if (Array.isArray(rowsFirst) && rowsFirst.length === 0 && groupId != null) {
          rows = await subjectGradesApi.getByStudent(paramsBase);
        }
        // console.debug('[StudentProfileModal] fetched rows:', rows?.length);
        // Group rows by semester and subject
        const bySem: Record<string, Record<string, { examRows: { label: string; grade: number | null }[]; coefficient: number }>> = {};
        (rows || []).forEach((r: any) => {
          const sem = String(r.semester || '—');
          const subj = String(r.subject || '—');
          if (!bySem[sem]) bySem[sem] = {};
          if (!bySem[sem][subj]) bySem[sem][subj] = { examRows: [], coefficient: Number(r.coefficient || 1) };
          // Keep latest non-null coefficient encountered
          if (r.coefficient != null) bySem[sem][subj].coefficient = Number(r.coefficient);
          bySem[sem][subj].examRows.push({ label: String(r.exam_name || 'Exam'), grade: typeof r.grade === 'number' ? r.grade : Number(r.grade) });
        });
        const res: Record<string, Array<{ subject: string; examRows: { label: string; grade: number | null }[]; average: number | null; coefficient?: number }>> = {};
        Object.keys(bySem).forEach(sem => {
          res[sem] = Object.entries(bySem[sem]).map(([subject, data]) => {
            const grades = data.examRows.map(er => er.grade).filter((x): x is number => typeof x === 'number' && !Number.isNaN(x));
            const avg = grades.length ? Math.round((grades.reduce((a,b)=>a+b,0) / grades.length) * 100) / 100 : null;
            return { subject, examRows: data.examRows, average: avg, coefficient: data.coefficient };
          });
        });
        setBulletinData(res);
        // Compute DB-based GPA for the latest semester across subjects using saved coefficients
        const sems = Object.keys(res).sort();
        if (sems.length) {
          const latest = sems[sems.length - 1];
          const rowsLatest = res[latest];
          let sum = 0; let weight = 0;
          rowsLatest.forEach(r => {
            if (typeof r.average === 'number') {
              const c = typeof r.coefficient === 'number' ? r.coefficient : 1;
              sum += r.average * c;
              weight += c;
            }
          });
          setDbGpa(weight ? Math.round((sum / weight) * 100) / 100 : null);
          setNoData(false);
        } else {
          setDbGpa(null);
          setNoData(true);
        }
        setLoadingGrades(false);
      } catch (e: any) {
        // console.error('Failed to load bulletin', e);
        setBulletinData({});
        setDbGpa(null);
        setLoadError(e?.message || 'Failed to load grades');
        setLoadingGrades(false);
      }
    };
    load();
  }, [student?.id, groupId, semester]);

  // If there are no explicit courses for the group, derive a fallback list from the student's subjects in the latest semester
  useEffect(() => {
    try {
      if (courses.length === 0 && bulletinData && Object.keys(bulletinData).length) {
        const sems = Object.keys(bulletinData).sort();
        const latest = sems[sems.length - 1];
        const rows: any[] = bulletinData[latest] || [];
        const uniqueSubjects = Array.from(new Set(rows.map((r: any) => r.subject))).filter(Boolean);
        const derived = uniqueSubjects.map((s: string, i: number) => ({ id: 10000 + i, name: String(s), teacher_name: null }));
        if (derived.length) setCourses(derived);
      }
    } catch {}
  }, [bulletinData]);

  // Load group info, enrolled courses, student details (for created_at), and attendance from backend
  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      setMetaError(null);
      try {
        const sid = Number(student?.id);
        if (Number.isFinite(sid)) {
          try { setStudentDetails(await studentsApi.get(sid)); } catch { setStudentDetails(null); }
        } else {
          setStudentDetails(null);
        }

        const effectiveGroupId = (groupId != null ? Number(groupId) : (student?.group_id != null ? Number(student.group_id) : NaN));
        let gInfo: any = null;
        if (!Number.isNaN(effectiveGroupId)) {
          try {
            gInfo = await groupsApi.get(effectiveGroupId);
          } catch {
            const groups = await groupsApi.list();
            gInfo = Array.isArray(groups) ? groups.find((g:any)=> Number(g.id) === Number(effectiveGroupId)) : null;
          }
        }
        if (gInfo) setGroupInfo({ id: Number(gInfo.id), name: String(gInfo.name), level: gInfo.level ?? null, year: gInfo.year ?? null }); else setGroupInfo(null);

        // Load courses and map teacher names
        const [allCourses, allTeachers] = await Promise.all([
          coursesApi.list().catch(()=>[]),
          teachersApi.list().catch(()=>[]),
        ]);
        const tMap = new Map<number, string>();
        (Array.isArray(allTeachers) ? allTeachers : []).forEach((t:any)=>{
          if (t && typeof t.id === 'number') tMap.set(Number(t.id), String(t.full_name || t.name || ''));
        });
        const filtered = (Array.isArray(allCourses) ? allCourses : []).filter((c:any)=> !Number.isNaN(effectiveGroupId) && Number(c.group_id) === Number(effectiveGroupId));
        const adapted = filtered.map((c:any)=> ({ id: Number(c.id), name: String(c.name || ''), teacher_name: tMap.get(Number(c.teacher_id)) || null }));
        setCourses(adapted);

        // Attendance from backend with local fallback
        try {
          if (Number.isFinite(sid)) {
            const all = await attendanceApi.list();
            const recs = (Array.isArray(all) ? all : []).filter((r:any)=> Number(r.student_id) === sid);
            if (recs.length) {
              const present = recs.filter((r:any)=> String(r.status).toLowerCase() === 'present').length;
              const late = recs.filter((r:any)=> String(r.status).toLowerCase() === 'late').length;
              const pct = ((present + 0.5 * late) / recs.length) * 100;
              setAttendancePctDb(Math.round(pct * 10) / 10);
            } else {
              setAttendancePctDb(null);
            }
          } else {
            setAttendancePctDb(null);
          }
        } catch { setAttendancePctDb(null); }

      } catch (e:any) {
        setMetaError(e?.message || 'Failed to load student context');
        setGroupInfo(null);
        setCourses([]);
        setStudentDetails(null);
        setAttendancePctDb(null);
      }
      setLoadingMeta(false);
    };
    loadMeta();
  }, [groupId, student?.group_id, student?.id]);

  const enrollmentDateText = useMemo(() => {
    const raw = (student.enrollmentDate || student.created_at || studentDetails?.created_at || null);
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }, [student, studentDetails]);

  // Attendance: prefer DB, fallback to local store
  const attendancePctLocal = useMemo(() => attendanceStore.percentage(groupInfo?.name || student.group || '', student.name || ''), [student, groupInfo]);
  const attendancePct = attendancePctDb != null ? attendancePctDb : attendancePctLocal;

  const statusLabel = (s: string) => {
    switch (s) {
      case 'active': return t.active;
      case 'inactive': return t.inactive;
      case 'pending': return t.pending;
      default: return s;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.studentProfile}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grades Bulletin */}
          {loadingGrades ? (
            <Card><CardHeader><CardTitle>Bulletin des notes</CardTitle></CardHeader><CardContent>Chargement…</CardContent></Card>
          ) : loadError ? (
            <Card><CardHeader><CardTitle>Bulletin des notes</CardTitle></CardHeader><CardContent className="text-red-600 text-sm">{loadError}</CardContent></Card>
          ) : noData ? (
            <Card><CardHeader><CardTitle>Bulletin des notes</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Aucune note trouvée pour cet élève.</CardContent></Card>
          ) : (
            <Bulletin data={bulletinData} />
          )}
          {/* Header Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {student.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <div className="flex items-center gap-2">
                <Badge className={`border ${getStatusColor(student.status)}`}>
                  {statusLabel(student.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {String(student.id).padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.personalInformation}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.enrollmentDateRange || 'Enrollment Date'}</p>
                  <p className="font-medium">{enrollmentDateText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t.academicInformation}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Niveau</p>
                  <p className="font-medium text-lg">{groupInfo?.level || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Année/Grade</p>
                  <p className="font-medium text-lg">{(groupInfo?.year != null) ? String(groupInfo.year) : '—'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <p className="font-medium text-lg">{groupInfo?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groupe</p>
                  <p className="font-medium text-lg">{groupInfo?.name || 'Non assigné'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.average}</p>
                    <p className="font-medium text-lg">
                      {dbGpa != null ? `${dbGpa}/20` : (student.gpa ? `${student.gpa}/20` : 'N/A')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.attendanceRate}</p>
                    <p className="font-medium text-lg">
                      {attendancePct != null ? `${attendancePct}%` : (student.attendance ? `${student.attendance}%` : 'N/A')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Classes */}
          {courses && courses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t.enrolledCourses} ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {courses.map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{course.name}</h4>
                        {course.teacher_name && (
                          <p className="text-sm text-muted-foreground">Professeur: {course.teacher_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">&nbsp;</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Actif
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t.enrolledCourses}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMeta ? (
                  <div className="text-sm text-muted-foreground">Chargement…</div>
                ) : metaError ? (
                  <div className="text-red-600 text-sm">{metaError}</div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t.noResultsFound}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {student.gpa && student.attendance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t.performanceOverview || 'Performance Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t.academicPerformance || 'Academic Performance'}</span>
                      <span>{dbGpa != null ? Math.round((dbGpa / 20) * 100) : Math.round(((student.gpa ?? 0) / 20) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(dbGpa != null ? (dbGpa / 20) * 100 : ((student.gpa ?? 0) / 20) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t.attendanceRate}</span>
                      <span>{attendancePct ?? student.attendance}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${attendancePct ?? student.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Bulletin component: uses prepared data grouped by semester
const Bulletin = ({ data }: { data: Record<string, Array<{ subject: string; examRows: { label: string; grade: number | null }[]; average: number | null }> > }) => {
  const semesters = Object.keys(data || {});
  if (!semesters.length) return null;
  return (
    <div className="space-y-4">
      {semesters.sort().map(sem => (
        <Card key={sem}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Bulletin des notes — {sem}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {data[sem].map((row, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{row.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {row.examRows.length ? row.examRows.map((e,i) => (
                        <span key={i} className="mr-2">{e.label}: <span className="font-medium">{typeof e.grade === 'number' ? e.grade : '—'}</span></span>
                      )) : <span>—</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Moyenne</div>
                    <div className="text-sm font-semibold">{row.average ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentProfileModal;