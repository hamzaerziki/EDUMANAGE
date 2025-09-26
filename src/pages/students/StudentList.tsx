import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { downloadCSV } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  BookOpen,
  Phone,
  Mail
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AddStudentModal from "@/components/modals/AddStudentModal";
import MoreFiltersModal from "@/components/modals/MoreFiltersModal";
import StudentProfileModal from "@/components/modals/StudentProfileModal";
import EditStudentModal from "@/components/modals/EditStudentModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { examsStore } from "@/lib/examsStore";
import { getCoefficient } from "@/lib/coefficientsStore";
import { attendanceStore } from "@/lib/attendanceStore";
import { activityStore } from "@/lib/activityStore";
import { groupsApi, studentsApi } from "@/lib/api";

const StudentList = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [additionalFilters, setAdditionalFilters] = useState<any>({});
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  // New: group-centric view
  const [selectedGroupView, setSelectedGroupView] = useState<any | null>(null);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const reloadStudents = async () => {
    try {
      const data = await studentsApi.list();
      setStudents(Array.isArray(data) ? data : []);
    } catch { setStudents([]); }

  };

  // Load groups from backend only (no mock/local fallback)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await groupsApi.list();
        if (Array.isArray(data)) {
          const adapted = data.map(g => ({
            id: g.id,
            name: g.name,
            level: g.level || '',
            grade: '',
            subject: '',
            teacher: '',
            schedule: '',
            classroom: '',
            capacity: 0,
            enrolled: 0,
            students: [] as any[],
          }));
          setAllGroups(adapted);
        } else {
          setAllGroups([]);
        }
      } catch { setAllGroups([]); }
    };
    load();
  }, []);

  // Load students from backend
  useEffect(() => { reloadStudents(); }, []);

  const categories = useMemo(() => ([
    { key: 'Primaire', title: 'Primaire', gradient: 'from-amber-100 to-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'Collège',  title: 'Collège',  gradient: 'from-sky-100 to-sky-50',   badge: 'bg-sky-100 text-sky-700 border-sky-200' },
    { key: 'Lycée',    title: 'Lycée',    gradient: 'from-violet-100 to-violet-50', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  ]), []);

  // Derive enrolled counts from backend students per group
  const groupsWithCounts = useMemo(() => (
    (allGroups || []).map((g:any) => ({
      ...g,
      enrolled: (students || []).filter((s:any) => Number(s.group_id) === Number(g.id)).length,
    }))
  ), [allGroups, students]);

  const filteredGroupCards = useMemo(() => {
    if (!groupSearch) return groupsWithCounts;
    const term = groupSearch.toLowerCase();
    return groupsWithCounts.filter((g:any) => String(g.name || '').toLowerCase().includes(term) || String(g.grade || '').toLowerCase().includes(term));
  }, [groupsWithCounts, groupSearch]);

  // Stats from groups
  const totals = useMemo(() => {
    const totalGroups = groupsWithCounts.length;
    const totalStudents = (students || []).length;
    const totalCapacity = groupsWithCounts.reduce((sum: number, g: any) => sum + (g.capacity ?? 0), 0);
    const occupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    const levels = new Set(groupsWithCounts.map((g:any) => g.level).filter(Boolean)).size;
    return { totalGroups, totalStudents, totalCapacity, occupancy, levels };
  }, [groupsWithCounts, students]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportStudents = () => {
    const rows: (string|number)[][] = [
      [t.name || 'Name', t.email || 'Email', t.phone || 'Phone', t.grade || 'Grade', t.class || 'Class', t.status || 'Status', t.gpa || 'GPA', t.attendanceRate || 'Attendance'],
      ...students.map(student => [
        (student.full_name || student.name || '').toString(),
        student.email || '',
        student.phone || '',
        student.grade || '',
        student.class || '',
        student.status || '',
        (student.gpa ?? 'N/A'),
        (student.attendance ?? 'N/A')
      ])
    ];
    downloadCSV(rows, 'students.csv', language);
    toast({ title: t.export || 'Export', description: t.success || 'Exported successfully' });
  };

  const handleStudentAction = (action: string, student: any) => {
    setSelectedStudent(student);
    switch (action) {
      case 'view':
        setProfileModalOpen(true);
        break;
      case 'edit':
        setEditModalOpen(true);
        break;
      case 'delete':
        setDeleteModalOpen(true);
        break;
    }
  };

  const handleSaveStudent = (updatedStudent: any) => {
    // In a real app, this would update the database
    toast({
      title: "Student Updated",
      description: `${updatedStudent.name} has been updated successfully.`,
    });
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setDeletingStudent(true);
    try {
      const idNum = Number(selectedStudent.id);
      if (!Number.isNaN(idNum)) {
        await studentsApi.remove(idNum);
      }
      setStudents(prev => prev.filter(s => Number(s.id) !== idNum));
      toast({ title: "Student Deleted", description: `${selectedStudent.name} has been removed.`, variant: "destructive" });
      activityStore.logActivity(`Deleted student ${selectedStudent.name}`);
    } catch (e:any) {
      toast({ title: "Error", description: e?.message || 'Failed to delete student', variant: "destructive" });
    }
    setDeletingStudent(false);
    setDeleteModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDeleteAllStudents = async () => {
    setDeletingAll(true);
    try {
      const list = await studentsApi.list();
      const ids = Array.isArray(list) ? list.map((s:any)=> s.id).filter((id:any)=> typeof id === 'number') : [];
      await Promise.all(ids.map((id:number)=> studentsApi.remove(id).catch(()=>null)));
      setStudents([]);
      toast({ title: 'Students Deleted', description: `Deleted ${ids.length} students from database.`, variant: 'destructive' });
      activityStore.logActivity(`Deleted ${ids.length} students`);
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to delete all students', variant: 'destructive' });
    }
    setDeletingAll(false);
    setDeleteAllModalOpen(false);
  };

  // Group students by level and class
  const groupedStudents = students.reduce((acc, student) => {
    const level = student.level;
    if (!acc[level]) {
      acc[level] = {};
    }
    const className = student.class;
    if (!acc[level][className]) {
      acc[level][className] = [];
    }
    acc[level][className].push(student);
    return acc;
  }, {} as Record<string, Record<string, typeof students>>);

  const filteredStudents = (students || []).filter((student: any) => {
    const nameStr = String(student.full_name || student.name || '').toLowerCase();
    const emailStr = String(student.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = nameStr.includes(search) || emailStr.includes(search);

    const statusVal = String(student.status || '');
    const matchesStatus = statusFilter === 'all' || statusVal === statusFilter;

    const matchesGrade = gradeFilter === 'all' || String(student.grade || '') === gradeFilter;

    // Apply additional filters from MoreFiltersModal (guard all optional fields)
    let matchesAdditionalFilters = true;

    if (additionalFilters.enrollmentDateFrom) {
      const edRaw = student.enrollmentDate || student.created_at || null;
      const ed = edRaw ? new Date(edRaw) : null;
      const fromDate = new Date(additionalFilters.enrollmentDateFrom);
      if (ed && ed < fromDate) matchesAdditionalFilters = false;
    }

    if (additionalFilters.enrollmentDateTo) {
      const edRaw = student.enrollmentDate || student.created_at || null;
      const ed = edRaw ? new Date(edRaw) : null;
      const toDate = new Date(additionalFilters.enrollmentDateTo);
      if (ed && ed > toDate) matchesAdditionalFilters = false;
    }

    if (additionalFilters.gpaRange && student.gpa != null) {
      const [minGpa, maxGpa] = additionalFilters.gpaRange;
      if (student.gpa < minGpa || student.gpa > maxGpa) matchesAdditionalFilters = false;
    }

    if (additionalFilters.attendanceRange && student.attendance != null) {
      const [minAttendance, maxAttendance] = additionalFilters.attendanceRange;
      if (student.attendance < minAttendance || student.attendance > maxAttendance) matchesAdditionalFilters = false;
    }

    if (additionalFilters.classes && additionalFilters.classes.length > 0) {
      const cls = student.class;
      if (!cls || !additionalFilters.classes.includes(cls)) matchesAdditionalFilters = false;
    }

    if (additionalFilters.hasParentEmail && !(String(student.email || '').includes('@'))) {
      matchesAdditionalFilters = false;
    }

    return matchesSearch && matchesStatus && matchesGrade && matchesAdditionalFilters;
  });

  // Render: Group cards first (Primaire / Collège / Lycée)
  if (!selectedGroupView) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.students}</h1>
            <p className="text-muted-foreground">Sélectionnez un groupe pour gérer ses étudiants</p>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow hover:opacity-90" onClick={()=>setAddStudentOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t.addStudent}
            </Button>
            <Button variant="destructive" className="rounded" onClick={()=> setDeleteAllModalOpen(true)}>
              {t.deleteAll || 'Delete All'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalGroups}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalGroups}</div>
              <p className="text-xs text-muted-foreground">{t.groupsCount || 'Groupes'}</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.groupEnrolledStudents || 'Étudiants inscrits'}</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totals.totalStudents}</div>
              <p className="text-xs text-muted-foreground">{totals.totalCapacity ? `Sur ${totals.totalCapacity} places` : '—'}</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.occupancyRate || 'Taux d\'occupation'}</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totals.occupancy}%</div>
              <p className="text-xs text-muted-foreground">{t.capacityUsed || 'Capacité utilisée'}</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.groupLevels || 'Niveaux'}</CardTitle>
              <div className="h-4 w-4 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.levels}</div>
              <p className="text-xs text-muted-foreground">{t.primaryMiddleHigh || 'Primaire • Collège • Lycée'}</p>
            </CardContent>
          </Card>
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
            const items = filteredGroupCards.filter((g:any) => String(g.level || '').toLowerCase() === cat.key.toLowerCase());
            if (!items.length) return null as any;
            return (
              <div key={cat.key} className="space-y-3">
                <div className={`rounded-xl p-4 bg-gradient-to-r ${cat.gradient} border`}>
                  <div className="text-lg font-semibold">{cat.title}</div>
                  <div className="text-xs text-muted-foreground">Choisissez un groupe de {cat.title.toLowerCase()}</div>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {items.map((g:any)=> (
                    <button
                      key={g.id}
                      onClick={()=>{
                        const normalized = {
                          ...g,
                          name: g.name || g.title || g.groupName || g.id || 'Groupe',
                        };
                        setSelectedGroupView(normalized);
                      }}
                      className="h-full group relative rounded-lg border p-5 text-left transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg bg-background flex flex-col gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-lg font-semibold truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{g.level} • {g.grade}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.students || 'Students'}: <span className="font-semibold text-foreground">{g.enrolled}</span></span>
                        <span className={`px-2 py-0.5 rounded-full border ${cat.badge}`}>{g.level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredGroupCards.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucun groupe trouvé.</div>
          )}
        </div>

        {/* Modals visible on this page as well */}
        <AddStudentModal 
          open={addStudentOpen} 
          onOpenChange={setAddStudentOpen}
          onCreated={reloadStudents}
        />
        <MoreFiltersModal 
          open={moreFiltersOpen} 
          onOpenChange={setMoreFiltersOpen}
          onFiltersApply={setAdditionalFilters}
        />
      </div>
    );
  }

  // Selected group computations moved inside try below so any error is caught by the boundary

  // Simple Error Boundary to avoid blank screens if any child throws
  class SelectedGroupBoundary extends React.Component<{ onBack: () => void; children: React.ReactNode }, { hasError: boolean; }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
      console.error('SelectedGroupBoundary caught error:', error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="p-6 space-y-4">
            <div className="text-red-600 text-sm">Une erreur est survenue lors de l'affichage du groupe.</div>
            <Button variant="outline" onClick={this.props.onBack}>Retour aux groupes</Button>
          </div>
        );
      }
      return <>{this.props.children}</>;
    }
  }

  const safeSelectedGroupContent = (() => {
    try {
      const resolvedGroupName = String(selectedGroupView?.name || selectedGroupView?.title || selectedGroupView?.groupName || '').trim();
      const groupStudents = students.filter((s: any) => Number(s.group_id) === Number(selectedGroupView?.id));

      const normalizedGroupStudents = (groupStudents || []).map((s: any, idx: number) => {
        if (s && typeof s === 'object') {
          const name = String(s.full_name || s.name || s.fullName || s.studentName || `Student ${idx+1}`);
          return {
            id: s.id ?? `ext-${idx}`,
            name,
            email: s.email || '',
            phone: s.phone || '',
            grade: s.grade || '',
            class: s.class || '',
            status: s.status || 'active',
            gpa: typeof s.gpa === 'number' ? s.gpa : null,
            attendance: typeof s.attendance === 'number' ? s.attendance : null,
            avatar: s.avatar || null,
            group_id: s.group_id ?? Number(selectedGroupView?.id) ?? null,
          };
        }
        const name = typeof s === 'string' ? s : `Student ${idx+1}`;
        return {
          id: `ext-${idx}`,
          name,
          email: '',
          phone: '',
          grade: '',
          class: '',
          status: 'active',
          gpa: null,
          attendance: null,
          avatar: null,
          group_id: Number(selectedGroupView?.id) ?? null,
        };
      });

      const inner = (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{resolvedGroupName || 'Étudiants'}</h1>
          <p className="text-muted-foreground">Gérez les étudiants de ce groupe.</p>
        </div>
        <div className="flex gap-3">
          <button className="border px-3 py-1 rounded" onClick={()=>setSelectedGroupView(null)}>Retour aux groupes</button>
          <Button onClick={() => setAddStudentOpen(true)} className="gap-2 rounded bg-primary text-white px-4 py-2">
            <Plus className="h-4 w-4" />
            {t.addStudent}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">Étudiants: <span className="font-semibold text-foreground">{normalizedGroupStudents.length}</span></div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-2 border">Étudiant</th>
              <th className="text-left p-2 border">Email</th>
              <th className="text-left p-2 border">Téléphone</th>
              <th className="text-right p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {normalizedGroupStudents.map((student:any)=> (
              <tr key={student.id} className="border-b">
                <td className="p-2 border">{student.name}</td>
                <td className="p-2 border">{student.email}</td>
                <td className="p-2 border">{student.phone}</td>
                <td className="p-2 border text-right">
                  <button className="border px-2 py-1 rounded mr-2" onClick={()=>handleStudentAction('view', student)}>Voir</button>
                  <button className="border px-2 py-1 rounded mr-2" onClick={()=>handleStudentAction('edit', student)}>Modifier</button>
                  <button className="border px-2 py-1 rounded text-red-600" onClick={()=>handleStudentAction('delete', student)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {normalizedGroupStudents.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">Aucun étudiant dans ce groupe.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddStudentModal 
        open={addStudentOpen} 
        onOpenChange={setAddStudentOpen}
        onCreated={reloadStudents}
        defaultGroupId={Number(selectedGroupView?.id) || null}
      />
      <MoreFiltersModal 
        open={moreFiltersOpen} 
        onOpenChange={setMoreFiltersOpen}
        onFiltersApply={setAdditionalFilters}
      />
      <StudentProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        student={selectedStudent}
        groupId={Number(selectedGroupView?.id) || null}
        semester={undefined}
      />
      <EditStudentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Student"
        description="Are you sure you want to delete"
        itemName={selectedStudent?.name || ""}
        onConfirm={handleDeleteStudent}
        loading={deletingStudent}
      />
      <DeleteConfirmationModal
        open={deleteAllModalOpen}
        onOpenChange={setDeleteAllModalOpen}
        title={t.deleteAll || 'Delete All Students'}
        description={t.areYouSure || 'Are you sure you want to delete'}
        itemName={`${students.length} ${t.students || 'students'}`}
        onConfirm={handleDeleteAllStudents}
        loading={deletingAll}
      />
    </div>
      );
      return (
        <SelectedGroupBoundary onBack={() => setSelectedGroupView(null)}>
          {inner}
        </SelectedGroupBoundary>
      );
    } catch (err) {
      console.error('Error rendering selected group view:', err);
      try {
        const resolvedGroupName = String(selectedGroupView?.name || selectedGroupView?.title || selectedGroupView?.groupName || '').trim();
        const basic = students.filter(s => String(s.group || '').toLowerCase().includes(resolvedGroupName.toLowerCase()));
        const simple = basic.map((s:any, i:number)=>({ id: s.id ?? i+1, name: s.name || `Student ${i+1}`, email: s.email || '', phone: s.phone || '' }));
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{resolvedGroupName || 'Étudiants'}</h1>
              <button className="border px-3 py-1 rounded" onClick={() => setSelectedGroupView(null)}>Retour aux groupes</button>
            </div>
            <div className="text-sm text-muted-foreground">Mode simplifié affiché suite à une erreur. Vous pouvez quand même gérer les étudiants.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 border">Étudiant</th>
                    <th className="text-left p-2 border">Email</th>
                    <th className="text-left p-2 border">Téléphone</th>
                  </tr>
                </thead>
                <tbody>
                  {simple.map(st => (
                    <tr key={st.id} className="border-b">
                      <td className="p-2 border">{st.name}</td>
                      <td className="p-2 border">{st.email}</td>
                      <td className="p-2 border">{st.phone}</td>
                    </tr>
                  ))}
                  {simple.length === 0 && (
                    <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">Aucun étudiant trouvé.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      } catch (innerErr) {
        console.error('Fallback simple view also failed:', innerErr);
        return (
          <div className="p-6 space-y-4">
            <div className="text-red-600 text-sm">Erreur lors de l'affichage du groupe.</div>
            <Button variant="outline" onClick={() => setSelectedGroupView(null)}>
              {t.backToGroups || 'Retour aux groupes'}
            </Button>
          </div>
        );
      }
    }
  })();

  return safeSelectedGroupContent;
};

export default StudentList;