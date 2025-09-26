import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserCheck, 
  Users, 
  BookOpen, 
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddTeacherModal from "@/components/modals/AddTeacherModal";
import TeacherProfileModal from "@/components/modals/TeacherProfileModal";
import EditTeacherModal from "@/components/modals/EditTeacherModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { teachersApi } from "@/lib/api";
import { activityStore } from "@/lib/activityStore";
import type { Teacher } from "@/lib/teachersStore";

const TeacherList = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherStats, setTeacherStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    onLeave: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('🚀 Loading teachers and stats in parallel...');
        
        // Load teachers and stats in parallel for better performance
        const [teachersList, overviewStats] = await Promise.all([
          teachersApi.list().catch(() => []),
          teachersApi.getOverviewStats().catch(() => null)
        ]);
        
        if (!alive) return;
        
        // Process teachers data
        const adapted = Array.isArray(teachersList) ? (teachersList as any[]).map(x => ({
          id: x.id,
          name: x.full_name || '',
          full_name: x.full_name || '',
          email: x.email || '',
          phone: x.phone || '',
          department: x.speciality || '',
          speciality: x.speciality || '',
          subjects: x.speciality ? [x.speciality] : [],
          status: 'active' as const,
          studentsCount: 0,
          experience: '',
          joinDate: (x.created_at ? String(x.created_at).slice(0,10) : ''),
          created_at: x.created_at,
          avatar: '',
        })) : [];
        
        console.log('📚 Loaded teachers:', adapted);
        setTeachers(adapted);
        
        // Set stats from backend if available, otherwise calculate fallback
        if (overviewStats && overviewStats.totalTeachers > 0) {
          console.log('📊 Using backend stats:', overviewStats);
          setTeacherStats(overviewStats);
        } else if (adapted.length > 0) {
          // Fallback calculation
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const fallbackStats = {
            totalTeachers: adapted.length,
            activeTeachers: adapted.filter((t) => t.status === 'active').length,
            onLeave: adapted.filter((t) => t.status === 'inactive' || t.status === 'on_leave').length,
            newThisMonth: adapted.filter((t) => {
              const createdAt = new Date(t.created_at || t.joinDate);
              return createdAt >= thisMonth;
            }).length
          };
          
          console.log('📊 Using fallback stats:', fallbackStats);
          setTeacherStats(fallbackStats);
        }
        
      } catch (error) {
        console.error('❌ Error loading teacher data:', error);
        setTeachers([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    
    loadData();
    return () => { alive = false; };
  }, []);

  const stats = {
    total: teachers.length,
    active: teachers.filter((x) => x.status === 'active').length,
    inactive: teachers.filter((x) => x.status === 'inactive' || x.status === 'on_leave').length,
    newThisMonth: teacherStats.newThisMonth,
  };

  const textActiveSub = language === 'fr' ? 'Enseigne actuellement' : language === 'ar' ? 'يُدرّس حالياً' : 'Currently teaching';
  const textInactiveSub = language === 'fr' ? 'Inactifs' : language === 'ar' ? 'غير نشطين' : 'Inactive';
  const textNewHeader = language === 'fr' ? 'Nouveaux ce mois' : language === 'ar' ? 'جدد هذا الشهر' : 'New This Month';
  const textNewSub = language === 'fr' ? 'Récemment ajoutés' : language === 'ar' ? 'انضم حديثاً' : 'Recently joined';

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green/10 text-green border-green/20";
      case "on_leave": return "bg-red/10 text-red border-red/20";
      case "inactive": return "bg-red/10 text-red border-red/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t.active;
      case 'on_leave':
      case 'inactive': return t.inactive;
      default: return status;
    }
  };

  const handleTeacherAction = (action: string, teacher: any) => {
    console.log('🎯 Teacher action:', action, 'for teacher:', teacher);
    setSelectedTeacher(teacher);
    switch (action) {
      case 'view':
        console.log('👀 Opening profile modal for teacher:', teacher);
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

  const handleSaveTeacher = (updatedTeacher: any) => {
    // Persist locally
    if (updatedTeacher?.id) {
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? { ...t, ...updatedTeacher } : t));
    }
    toast({
      title: "Teacher Updated",
      description: `${updatedTeacher.name} has been updated successfully.`,
    });
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setDeletingTeacher(true);
    try {
      const idNum = Number(selectedTeacher.id);
      if (!Number.isNaN(idNum)) {
        await teachersApi.remove(idNum);
      }
      setTeachers(prev => prev.filter(t => Number(t.id) !== idNum));
      toast({
        title: t.teacherDeleted || "Teacher Deleted",
        description: `${selectedTeacher.name || selectedTeacher.full_name} ${t.hasBeenRemoved || 'has been removed.'}`,
        variant: "destructive",
      });
      activityStore.add({ 
        id: `del-teacher-${Date.now()}`, 
        type: 'teacher_deleted', 
        message: `Deleted teacher ${selectedTeacher.name || selectedTeacher.full_name}`, 
        timestamp: Date.now() 
      });
    } catch (e:any) {
      toast({ title: "Error", description: e?.message || 'Failed to delete teacher', variant: 'destructive' });
    }
    setDeletingTeacher(false);
    setDeleteModalOpen(false);
    setSelectedTeacher(null);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || teacher.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.teacherManagement}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setAddTeacherOpen(true)}>
          <Plus className="h-4 w-4" />
          {t.addTeacher}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalTeachers}</CardTitle>
            <UserCheck className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{teacherStats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">{t.teachers}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.active}</CardTitle>
            <Users className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">{teacherStats.activeTeachers}</div>
            <p className="text-xs text-muted-foreground">{textActiveSub}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.inactive}</CardTitle>
            <Calendar className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">{teacherStats.onLeave}</div>
            <p className="text-xs text-muted-foreground">{textInactiveSub}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{textNewHeader}</CardTitle>
            <BookOpen className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">{teacherStats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">{textNewSub}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="inactive">{t.inactive}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.department || 'Department'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allDepartments || 'All Departments'}</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4 mr-2" />
              {t.filters}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.teachers} ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.teacher}</TableHead>
                  <TableHead>{t.department || 'Department'}</TableHead>
                  <TableHead>{t.subjects}</TableHead>
                  <TableHead>{t.students}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.experience || 'Experience'}</TableHead>
                  <TableHead className="text-right">{t.actions || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {teacher.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue/10 text-blue border-blue/20">
                        {teacher.department}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.slice(0, 2).map((subject, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {teacher.subjects.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{teacher.subjects.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{teacher.studentsCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusColor(teacher.status)}`}>
                        {getStatusLabel(teacher.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{teacher.experience}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTeacherAction('view', teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTeacherAction('edit', teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleTeacherAction('delete', teacher)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddTeacherModal 
        open={addTeacherOpen} 
        onOpenChange={setAddTeacherOpen}
        onAdded={(tch) => setTeachers(prev => [...prev, {
          id: tch.id,
          name: tch.full_name || '',
          email: tch.email || '',
          phone: tch.phone || '',
          department: tch.speciality || '',
          subjects: tch.speciality ? [tch.speciality] : [],
          status: 'active' as const,
          studentsCount: 0,
          experience: '',
          joinDate: (tch.created_at ? String(tch.created_at).slice(0,10) : ''),
          avatar: '',
        }])}
      />
      <TeacherProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        teacher={selectedTeacher}
      />
      <EditTeacherModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        teacher={selectedTeacher}
        onSave={handleSaveTeacher}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Teacher"
        description="Are you sure you want to delete"
        itemName={selectedTeacher?.name || ""}
        onConfirm={handleDeleteTeacher}
        loading={deletingTeacher}
      />
    </div>
  );
};

export default TeacherList;