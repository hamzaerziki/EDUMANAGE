import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { downloadCSV } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Plus, Save, Download, Printer, Upload, Star, Search } from "lucide-react";
import { examsStore, type ExamGrid } from "@/lib/examsStore";
import { activityStore } from "@/lib/activityStore";
import { notificationsStore } from "@/lib/notificationsStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { getCoefficient, setCoefficient } from "@/lib/coefficientsStore";
import { groupsApi, studentsApi, subjectsApi, coursesApi, examsApi, subjectGradesApi } from "@/lib/api";

const defaultStudents = ["Student 1","Student 2","Student 3","Student 4"];

const makeDefaultGrid = (id = "default-group", title = "Default Group", students = defaultStudents, subject?: string): ExamGrid => ({
  id,
  title,
  students: [...students],
  subject,
  rows: [
    { examLabel: "Exam 1", grades: new Array(students.length).fill(null) },
    { examLabel: "Exam 2", grades: new Array(students.length).fill(null) },
    { examLabel: "Exam 3", grades: new Array(students.length).fill(null) },
    { examLabel: "Exam 4", grades: new Array(students.length).fill(null) },
  ],
  semester: new Date().getFullYear() + "-S1",
  updatedAt: Date.now(),
});

const Exams = () => {
  const { t, language } = useTranslation();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [groupSearch, setGroupSearch] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [grid, setGrid] = useState<ExamGrid>(() => makeDefaultGrid());
  const [groupId, setGroupId] = useState(grid.id);
  const [semester, setSemester] = useState(grid.semester);
  const [coeffTick, setCoeffTick] = useState(0);
  const [currentCoefficient, setCurrentCoefficient] = useState(1);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [groupAverages, setGroupAverages] = useState<Map<number, number | null>>(new Map());

  // Access control: only admins or teachers
  const roleAllowed = user && (user.role === 'admin' || user.role === 'teacher');

  useEffect(() => {
    const load = async () => {
      try {
        const [g, s] = await Promise.all([
          groupsApi.list(),
          studentsApi.list().catch(() => []),
        ]);
        const adapted = Array.isArray(g)
          ? g.map((it: any) => ({ id: it.id, name: it.name, level: it.level || '', grade: '' }))
          : [];
        setAllGroups(adapted);
        setAllStudents(Array.isArray(s) ? s : []);
      } catch {
        setAllGroups([]);
        setAllStudents([]);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => ([
    { key: 'Primaire', title: 'Primaire', gradient: 'from-amber-100 to-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'Collège',  title: 'Collège',  gradient: 'from-sky-100 to-sky-50',   badge: 'bg-sky-100 text-sky-700 border-sky-200' },
    { key: 'Lycée',    title: 'Lycée',    gradient: 'from-violet-100 to-violet-50', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  ]), []);

  const filteredGroups = useMemo(() => {
    if (!groupSearch) return allGroups;
    const term = groupSearch.toLowerCase();
    return allGroups.filter((g: any) => String(g.name || '').toLowerCase().includes(term) || String(g.grade || '').toLowerCase().includes(term));
  }, [allGroups, groupSearch]);

  const nameToStudentId = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedGroup) return map;
    (allStudents || [])
      .filter((st: any) => Number(st.group_id) === Number(selectedGroup.id))
      .forEach((st: any) => map.set(String(st.full_name || st.id), Number(st.id)));
    return map;
  }, [allStudents, selectedGroup]);

  // Whether the current subject grid has any entered/saved grade
  const subjectHasAnyGrade = useMemo(() => {
    return (grid?.rows || []).some(r => (r?.grades || []).some(g => typeof g === 'number' && !isNaN(Number(g))));
  }, [grid]);

  // When group changes, prepare subjects from DB and reset current subject until user chooses
  useEffect(() => {
    if (!selectedGroup) return;
    setGroupId(String(selectedGroup.id));
    const studentsForGroup = allStudents
      .filter((st: any) => Number(st.group_id) === Number(selectedGroup.id))
      .map((st: any) => st.full_name || String(st.id));
    (async () => {
      try {
        const subs = await subjectsApi.list();
        const subjects = Array.isArray(subs) ? (subs as any[]).map((s:any) => s.name).filter(Boolean) : [];
        setSubjectOptions(subjects);
        setSelectedSubject(prev => (prev && subjects.includes(prev)) ? prev : undefined);
      } catch {
        setSubjectOptions([]);
        setSelectedSubject(undefined);
      }
    })();
    const g = makeDefaultGrid(String(selectedGroup.id), selectedGroup.name || 'Group', studentsForGroup, undefined);
    setGrid(g);
  }, [selectedGroup, allStudents]);

  // Sanitize saved grids to only include DB students for the selected group
  useEffect(() => {
    if (!selectedGroup || !selectedGroup.id) return;
    // Build canonical DB-driven student list for this group
    const dbNames = (allStudents || [])
      .filter((st: any) => Number(st.group_id) === Number(selectedGroup.id))
      .map((st: any) => st.full_name || String(st.id));
    let changed = false;
    // Normalize all saved grids for this group to use DB student list and aligned grades length
    examsStore.all()
      .filter(g => String(g.id) === String(selectedGroup.id))
      .forEach(g => {
        const needsStudentsUpdate = JSON.stringify(g.students) !== JSON.stringify(dbNames);
        if (needsStudentsUpdate) {
          const newRows = (g.rows || []).map(r => {
            const grades = Array.isArray(r.grades) ? [...r.grades] : [];
            // Resize to match DB student count
            const resized = grades.slice(0, dbNames.length);
            while (resized.length < dbNames.length) resized.push(null);
            return { ...r, grades: resized };
          });
          examsStore.save({ ...g, students: dbNames, rows: newRows });
          changed = true;
        }
      });
    // If current subject grid changed, refresh it
    if (changed && selectedSubject) {
      const refreshed = examsStore.findByGroupAndSubject(String(selectedGroup.id), selectedSubject, semester);
      if (refreshed) setGrid({ ...refreshed });
    }
  }, [selectedGroup, allStudents, selectedSubject, semester]);

  // When subject changes, load/create its grid
  useEffect(() => {
    if (!selectedGroup || !selectedSubject) return;
    const studentsForGroup = allStudents
      .filter((st: any) => Number(st.group_id) === Number(selectedGroup.id))
      .map((st: any) => st.full_name || String(st.id));
    const existing = examsStore.findByGroupAndSubject(String(selectedGroup.id), selectedSubject, semester);
    const g = existing ? { ...existing, students: studentsForGroup } : makeDefaultGrid(String(selectedGroup.id), selectedGroup.name || 'Group', studentsForGroup, selectedSubject);
    setGrid(g);
    
    // Update coefficient state for the selected subject - Load the specific coefficient for this subject
    const subjectCoefficient = getCoefficient(selectedSubject.toLowerCase(), 1);
    setCurrentCoefficient(subjectCoefficient);

    // Try loading persisted grades for this group+subject+semester from backend
    (async () => {
      try {
        const rows = await subjectGradesApi.getByGroupSubject({ group_id: Number(selectedGroup.id), subject: selectedSubject, semester });
        if (Array.isArray(rows) && rows.length) {
          const examNames: string[] = Array.from(new Set(rows.map((r: any) => String(r.exam_name))));
          const idToIndex = new Map<number, number>();
          (allStudents || [])
            .filter((s: any) => Number(s.group_id) === Number(selectedGroup.id))
            .forEach((s: any, idx: number) => idToIndex.set(Number(s.id), idx));
          const newRows = examNames.map((name) => ({ examLabel: name, grades: new Array(studentsForGroup.length).fill(null) }));
          rows.forEach((r: any) => {
            const rIdx = examNames.indexOf(String(r.exam_name));
            const sIdx = idToIndex.get(Number(r.student_id));
            if (rIdx >= 0 && sIdx !== undefined) newRows[rIdx].grades[sIdx] = Number(r.grade);
          });
          setGrid(prev => ({ ...prev, subject: selectedSubject, rows: newRows, students: studentsForGroup }));
          if (rows[0]?.coefficient) setCurrentCoefficient(Math.max(1, Math.min(10, Number(rows[0].coefficient))));
        }
      } catch {
        // ignore backend load errors, keep local grid
      }
    })();
  }, [selectedSubject, semester, selectedGroup, allStudents]);

  useEffect(() => {
    if (!selectedGroup || !selectedSubject) return;
    const stored = examsStore.findByGroupAndSubject(groupId, selectedSubject, semester);
    if (stored) {
      setGrid(stored);
      setSemester(stored.semester);
    }
  }, [groupId, selectedSubject, semester, selectedGroup]);

  // Saved subjects for current group+semester
  const savedSubjects = useMemo(() => {
    if (!selectedGroup) return new Set<string>();
    const set = new Set<string>();
    examsStore.all().forEach(g => {
      if (String(g.id) === String(selectedGroup.id) && g.semester === semester && g.subject) {
        set.add((g.subject || '').toLowerCase());
      }
    });
    return set;
  }, [selectedGroup, semester, coeffTick]);

  // Basic grid actions (Excel-like)
  const addExamRow = () => {
    const next = { ...grid, rows: [...grid.rows, { examLabel: `${t.exam || 'Exam'} ${grid.rows.length + 1}`, grades: new Array(grid.students.length).fill(null) }] };
    setGrid(next);
  };

  const deleteExamRow = (rowIndex: number) => {
    setGrid(prev => ({ ...prev, rows: prev.rows.filter((_, i) => i !== rowIndex) }));
  };

  const updateGrade = (rowIndex: number, colIndex: number, value: string) => {
    const v = value.trim();
    const num = v === '' ? null : Math.max(0, Math.min(20, Number(v)));
    setGrid(prev => ({
      ...prev,
      rows: prev.rows.map((r, i) => i === rowIndex ? { ...r, grades: r.grades.map((g, j) => j === colIndex ? (typeof num === 'number' ? num : null) : g) } : r)
    }));
  };

  const saveGrid = async () => {
    try {
      // Save to localStorage for immediate UI updates
      const toSave: ExamGrid = { ...grid, id: String(selectedGroup?.id || groupId), title: selectedGroup?.name || grid.title, semester, subject: selectedSubject, updatedAt: Date.now() };
      examsStore.save(toSave);
      
      // Persist to new subject-grades endpoint (one row per student per exam)
      if (selectedGroup && selectedSubject) {
        const groupIdNum = Number(selectedGroup.id);
        const nameToStudent = new Map<string, any>();
        (allStudents || []).filter((s:any)=> Number(s.group_id)===groupIdNum).forEach((s:any)=> nameToStudent.set(String(s.full_name || s.id), s));
        const gradesPayload: Array<{ student_id: number; group_id: number; subject: string; exam_name: string; grade: number; coefficient: number; semester: string }> = [];
        grid.rows.forEach((row) => {
          grid.students.forEach((studentName, sIdx) => {
            const raw = row.grades[sIdx];
            if (raw !== null && raw !== undefined && !isNaN(Number(raw))) {
              const student = nameToStudent.get(String(studentName));
              if (student?.id) {
                gradesPayload.push({
                  student_id: Number(student.id),
                  group_id: groupIdNum,
                  subject: String(selectedSubject),
                  exam_name: String(row.examLabel),
                  grade: Number(raw),
                  coefficient: Number(currentCoefficient),
                  semester: String(semester),
                });
              }
            }
          });
        });
        if (gradesPayload.length) {
          await subjectGradesApi.upsertBulk({ grades: gradesPayload });
        }
        // Refresh averages after persistence
        await reloadAverages();
      }
       
      // Save coefficient
      if (selectedSubject) {
        setCoefficient(selectedSubject.toLowerCase(), currentCoefficient);
        setCoeffTick(v => v + 1);
      }
       
      toast({ 
        title: t.saveGrades || 'Grades Saved', 
        description: `${selectedSubject}: Coefficient ${currentCoefficient} - Saved!` 
      });
    } catch (error: any) {
      console.error('Save error:', error);
       
      toast({ 
        title: 'Error', 
        description: `Failed to save. Saved locally only.`, 
        variant: 'destructive' 
      });
    }
  };

  const clearCurrentSubject = () => {
    if (!selectedGroup || !selectedSubject) return;
    examsStore.removeForGroupAndSubject(String(selectedGroup.id), selectedSubject, semester);
    const studentsForGroup = allStudents
      .filter((st: any) => Number(st.group_id) === Number(selectedGroup.id))
      .map((st: any) => st.full_name || String(st.id));
    setGrid(makeDefaultGrid(String(selectedGroup.id), selectedGroup.name || 'Group', studentsForGroup, selectedSubject));
    toast({ title: t.clear || 'Clear', description: t.cleared || 'Grades cleared for this subject.' });
  };

  const calculateWeightedAverage = (grades: (number | null)[], coefficients: number[]) => {
    const sum = grades.reduce((acc, grade, index) => {
      if (grade === null) return acc;
      return acc + grade * coefficients[index];
    }, 0);
    const totalCoefficient = coefficients.reduce((acc, coefficient) => acc + coefficient, 0);
    return sum / totalCoefficient;
  };

  const reloadAverages = async () => {
    if (!selectedGroup) return;
    try {
      const res = await subjectGradesApi.getAveragesByGroup({ group_id: Number(selectedGroup.id), semester });
      const map = new Map<number, number | null>();
      (res || []).forEach((r: any) => map.set(Number(r.student_id), (r?.average === null || r?.average === undefined) ? null : Number(r.average)));
      setGroupAverages(map);
    } catch {
      setGroupAverages(new Map());
    }
  };

  useEffect(() => {
    reloadAverages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, semester, selectedSubject]);

  const calculateCurrentSubjectAverage = (studentIndex: number) => {
    // Simple average of all exams for this student in current subject
    const grades = [];
    
    // Get all grades for this student across all exam rows
    for (let rowIndex = 0; rowIndex < grid.rows.length; rowIndex++) {
      const grade = grid.rows[rowIndex].grades[studentIndex];
      if (grade !== null && grade !== undefined && !isNaN(Number(grade))) {
        grades.push(Number(grade));
      }
    }
    
    if (grades.length === 0) return '—';
    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    return Math.round(average * 100) / 100;
  };

  if (!roleAllowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">{t.warning || 'Warning'}: {t.no || 'No'} access.</CardContent>
        </Card>
      </div>
    );
  }

  // When no group is selected, show centered grid of group cards
  if (!selectedGroup) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.exams || 'Exams'}</h1>
            <p className="text-muted-foreground">{t.examsManagement || 'Exams Management'}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={groupSearch}
                onChange={(e)=>setGroupSearch(e.target.value)}
                className="pl-10"
                placeholder={t.searchGroupsPlaceholder || 'Rechercher un groupe...'}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {categories.map(cat => {
            const items = filteredGroups.filter((g:any) => String(g.level || '').toLowerCase() === cat.key.toLowerCase());
            if (!items.length) return null;
            return (
              <div key={cat.key} className="space-y-3">
                <div className={`rounded-xl p-4 bg-gradient-to-r ${cat.gradient} border`}>
                  <div className="text-lg font-semibold">{cat.title}</div>
                  <div className="text-xs text-muted-foreground">Sélectionnez un groupe de {cat.title.toLowerCase()}</div>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {items.map((g:any)=> (
                    <button
                      key={g.id}
                      onClick={()=>setSelectedGroup(g)}
                      className="h-full group relative rounded-lg border p-5 text-left transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg bg-background flex flex-col gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-lg font-semibold truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{g.level} • {g.grade}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.students || 'Students'}: <span className="font-semibold text-foreground">{allStudents.filter((st:any)=> Number(st.group_id)===Number(g.id)).length}</span></span>
                        <span className={`px-2 py-0.5 rounded-full border ${cat.badge}`}>{g.level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredGroups.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucun groupe trouvé.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.exams || 'Exams'}</h1>
          <p className="text-muted-foreground">{t.examsManagement || 'Exams Management'}</p>
        </div>
        <div className="flex gap-2"></div>
      </div>

      {/* Layout: Left column (Groups or Students), Right detail (visible only after group selection) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">
                {selectedGroup ? `${t.students || 'Students'}` : (t.groups || 'Groups')}
              </CardTitle>
              {selectedGroup && (
                <div className="text-xs text-muted-foreground">{t.exam || 'Exam'}s: <span className="font-semibold text-foreground">{grid.rows.length}</span></div>
              )}
              {selectedGroup && (
                <Button variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary/10" onClick={()=>{ setSelectedGroup(null); setSelectedSubject(undefined); }}>
                  {t.backToGroups || 'Change Group'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedGroup ? (
              <>
                <Input placeholder={t.searchPlaceholder} value={groupSearch} onChange={(e)=>setGroupSearch(e.target.value)} />
                <div className="max-h-[400px] overflow-auto space-y-1">
                  {allGroups.map((g:any)=> (
                    <button
                      key={g.id}
                      onClick={()=>setSelectedGroup(g)}
                      className={`w-full text-left p-2 rounded border transition-colors hover:bg-accent ${selectedGroup?.id===g.id?'bg-accent ring-1 ring-primary border-primary':''}`}
                    >
                      <div className="font-medium text-sm truncate">{g.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{g.level} • {g.grade}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="max-h-[460px] overflow-auto space-y-1">
                {grid.students.map((name: string, idx:number) => (
                  <div key={idx} className="p-2 rounded border bg-background flex items-center justify-between">
                    <div className="text-sm truncate">{name}</div>
                    <div className="text-xs text-muted-foreground">#{idx+1}</div>
                  </div>
                ))}
                {grid.students.length === 0 && (
                  <div className="text-xs text-muted-foreground">{t.noStudentsEnrolled || 'No students in this group.'}</div>
                )}
              </div>
             )}
          </CardContent>
        </Card>

        {selectedGroup && (
          <div className="lg:col-span-9 space-y-6">
            {/* Record Grades (Excel-like) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t.recordGrades || 'Record Grades'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.semester || 'Semester'}</label>
                    <Input value={semester} onChange={(e)=>setSemester(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.subject || 'Subject'}</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-primary/10 border-primary/20 hover:bg-primary/15">
                        <SelectValue placeholder={t.selectSubject || 'Select Subject'} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOptions.map((s)=> (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center justify-between w-full">
                              <span>{s}</span>
                              {savedSubjects.has(s.toLowerCase()) && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">{t.coefficient || 'Coefficient'}</span>
                      <Input
                        className="w-24 rounded-full"
                        type="number"
                        min={1}
                        max={10}
                        value={currentCoefficient}
                        onChange={(e)=>setCurrentCoefficient(Math.max(1, Math.min(10, Number(e.target.value))))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">{t.exam || 'Exam'}s: <span className="font-semibold text-foreground">{grid.rows.length}</span></div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={saveGrid}>{t.saveGrades || 'Save Grades'}</Button>
                    <Button size="sm" variant="ghost" onClick={clearCurrentSubject}>{t.clear || 'Clear'}</Button>
                    <Button size="sm" className="gap-1 rounded-full" onClick={addExamRow}><Plus className="h-4 w-4" />{t.addExam || 'Add Exam'}</Button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">{t.students || 'Students'}</TableHead>
                        {grid.rows.map((row, rIdx) => (
                          <TableHead key={rIdx} className="whitespace-nowrap">
                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 text-foreground">
                              <span className="font-medium">{row.examLabel}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-600" onClick={()=>deleteExamRow(rIdx)}>−</Button>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="whitespace-nowrap">
                          <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                            <span className="font-medium">{t.moyenneGenerale || 'Moyenne Générale'}</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grid.students.map((s, sIdx) => (
                        <TableRow key={sIdx} className="odd:bg-muted/30">
                          <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">{s}</TableCell>
                          {grid.rows.map((row, rIdx) => {
                            const val = row.grades[sIdx];
                            return (
                              <TableCell key={rIdx} className="align-middle">
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  value={val ?? ''}
                                  onChange={(e)=>updateGrade(rIdx, sIdx, e.target.value)}
                                  className={`w-20 border rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition`}
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell className="align-middle">
                            <div className="w-20 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-center font-medium text-emerald-800">
                              {subjectHasAnyGrade ? calculateCurrentSubjectAverage(sIdx) : '—'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;
