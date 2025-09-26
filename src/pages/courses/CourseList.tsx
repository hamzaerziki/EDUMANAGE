import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Search,
  Filter,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Star,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddCourseModal from "@/components/modals/AddCourseModal";
import EditCourseModal from "@/components/modals/EditCourseModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { coursesApi, teachersApi, groupsApi, studentsApi, subjectsApi } from "@/lib/api";

const CourseList = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  // Real data state
  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    studentsEnrolled: 0,
  });

  // Backend entities
  const [courses, setCourses] = useState<any[]>([]);
  const [teachersById, setTeachersById] = useState<Record<number, any>>({});
  const [groupsById, setGroupsById] = useState<Record<number, any>>({});
  const [studentCountByGroup, setStudentCountByGroup] = useState<Record<number, number>>({});
  const [subjectCategoryByName, setSubjectCategoryByName] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [courseList, teacherList, groupList, studentList, subjectList] = await Promise.all([
          coursesApi.list(),
          teachersApi.list().catch(() => []),
          groupsApi.list().catch(() => []),
          studentsApi.list().catch(() => []),
          subjectsApi.list().catch(() => []),
        ]);
        if (!alive) return;
        setCourses(courseList || []);
        const tById: Record<number, any> = {};
        (teacherList || []).forEach((t: any) => { if (t && t.id != null) tById[t.id] = t; });
        setTeachersById(tById);
        const gById: Record<number, any> = {};
        (groupList || []).forEach((g: any) => { if (g && g.id != null) gById[g.id] = g; });
        setGroupsById(gById);

        const subjMap: Record<string, string> = {};
        (subjectList || []).forEach((s: any) => {
          const key = String(s?.name || '').trim();
          if (key) subjMap[key] = String(s?.category || 'General');
        });
        setSubjectCategoryByName(subjMap);

        const counts: Record<number, number> = {};
        (studentList || []).forEach((s: any) => {
          const gid = s?.group_id;
          if (gid != null) counts[gid] = (counts[gid] || 0) + 1;
        });
        setStudentCountByGroup(counts);

        const courseGroupIds = new Set((courseList || []).map((c: any) => c?.group_id).filter(Boolean));
        let enrolled = 0;
        courseGroupIds.forEach((gid: any) => { enrolled += counts[gid] || 0; });

        setCourseStats({
          totalCourses: (courseList || []).length,
          // We don't track course status yet, show active as total for now
          activeCourses: (courseList || []).length,
          completedCourses: 0,
          studentsEnrolled: enrolled,
        });
      } catch (e) {
        // Optional: toast({ title: 'Error', description: String(e) })
      }
    })();
    return () => { alive = false; };
  }, []);

  // Refresh after closing AddCourseModal (when a new course may have been created)
  useEffect(() => {
    if (addCourseOpen) return;
    let alive = true;
    (async () => {
      try {
        const [courseList, teacherList, groupList, studentList, subjectList] = await Promise.all([
          coursesApi.list(),
          teachersApi.list().catch(() => []),
          groupsApi.list().catch(() => []),
          studentsApi.list().catch(() => []),
          subjectsApi.list().catch(() => []),
        ]);
        if (!alive) return;
        setCourses(courseList || []);
        const tById: Record<number, any> = {};
        (teacherList || []).forEach((t: any) => { if (t && t.id != null) tById[t.id] = t; });
        setTeachersById(tById);
        const gById: Record<number, any> = {};
        (groupList || []).forEach((g: any) => { if (g && g.id != null) gById[g.id] = g; });
        setGroupsById(gById);

        const subjMap: Record<string, string> = {};
        (subjectList || []).forEach((s: any) => {
          const key = String(s?.name || '').trim();
          if (key) subjMap[key] = String(s?.category || 'General');
        });
        setSubjectCategoryByName(subjMap);

        const counts: Record<number, number> = {};
        (studentList || []).forEach((s: any) => {
          const gid = s?.group_id;
          if (gid != null) counts[gid] = (counts[gid] || 0) + 1;
        });
        setStudentCountByGroup(counts);
        const courseGroupIds = new Set((courseList || []).map((c: any) => c?.group_id).filter(Boolean));
        let enrolled = 0;
        courseGroupIds.forEach((gid: any) => { enrolled += counts[gid] || 0; });
        setCourseStats({
          totalCourses: (courseList || []).length,
          activeCourses: (courseList || []).length,
          completedCourses: 0,
          studentsEnrolled: enrolled,
        });
      } catch {}
    })();
    return () => { alive = false; };
  }, [addCourseOpen]);

  // Map backend data to display shape expected by the cards
  const displayCourses = useMemo(() => {
    return (courses || []).map((c: any) => {
      const teacher = c?.teacher_id != null ? teachersById[c.teacher_id] : null;
      const group = c?.group_id != null ? groupsById[c.group_id] : null;
      const title = c.name;
      const derivedCategory = subjectCategoryByName[String(title).trim()] || "";
      return {
        id: c.id,
        title,
        description: "",
        category: derivedCategory || teacher?.speciality || "",
        level: group?.level || "",
        teacher: teacher?.full_name || (t.unassigned || 'Unassigned'),
        teacherAvatar: "",
        studentsEnrolled: c?.group_id ? (studentCountByGroup[c.group_id] || 0) : 0,
        schedule: group?.name || "",
        group_id: c?.group_id ?? null,
        teacher_id: c?.teacher_id ?? null,
      };
    });
  }, [courses, teachersById, groupsById, studentCountByGroup, subjectCategoryByName, t.unassigned]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green/10 text-green border-green/20";
      case "completed": return "bg-blue/10 text-blue border-blue/20";
      case "upcoming": return "bg-orange/10 text-orange border-orange/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green/10 text-green border-green/20";
      case "Intermediate": return "bg-orange/10 text-orange border-orange/20";
      case "Advanced": return "bg-purple/10 text-purple border-purple/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCourseAction = (action: string, course: any) => {
    setSelectedCourse(course);
    switch (action) {
      case 'view':
        navigate(`/courses/${course.id}`);
        break;
      case 'edit':
        setEditModalOpen(true);
        break;
      case 'delete':
        setDeleteModalOpen(true);
        break;
      case 'manage':
        navigate(`/courses/${course.id}/inscriptions`);
        break;
    }
  };

  const handleSaveCourse = (updatedCourse: any) => {
    // In a real app, this would update the database
    toast({
      title: "Course Updated",
      description: `${updatedCourse.title} has been updated successfully.`,
    });
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    setDeletingCourse(true);
    
    try {
      // Actually delete the course from the database
      await coursesApi.remove(selectedCourse.id);
      
      // Update the UI by removing the course from the state
      setCourses(prevCourses => prevCourses.filter(course => course.id !== selectedCourse.id));
      
      // Update course stats
      setCourseStats(prevStats => ({
        ...prevStats,
        totalCourses: prevStats.totalCourses - 1,
        activeCourses: prevStats.activeCourses - 1,
      }));
      
      toast({
        title: "Course Deleted",
        description: `${selectedCourse.title} has been removed from the system.`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setDeletingCourse(false);
      setDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const filteredCourses = displayCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(subjectCategoryByName).forEach((cat) => { if (cat) set.add(cat); });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [subjectCategoryByName]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.courseManagement}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setAddCourseOpen(true)}>
          <Plus className="h-4 w-4" />
          {t.addCourse}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCourses}</CardTitle>
            <BookOpen className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">{courseStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">{t.totalCourses}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{`${t.active} ${t.courses}`}</CardTitle>
            <Calendar className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">{courseStats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">{t.active}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.completed}</CardTitle>
            <Star className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{courseStats.completedCourses}</div>
            <p className="text-xs text-muted-foreground">{t.completed}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.enrolledStudents}</CardTitle>
            <Users className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">{courseStats.studentsEnrolled}</div>
            <p className="text-xs text-muted-foreground">{t.enrolledStudents}</p>
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

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories || 'All Categories'}</SelectItem>
                {categoryOptions.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="upcoming">{t.upcoming || 'Upcoming'}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {t.filters}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover-scale">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Teacher */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={course.teacherAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {String(course.teacher || '').split(' ').map(n => n?.[0] || '').join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{course.teacher}</p>
                </div>
              </div>

              {/* Course Details (DB-backed only) */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.studentsEnrolled}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{course.schedule}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue/10 text-blue border-blue/20">
                  {course.category}
                </Badge>
                <Badge className={`border ${getLevelColor(course.level)}`}>
                  {course.level}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCourseAction('edit', course)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCourseAction('delete', course)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/courses/${course.id}/inscriptions`)}>
                  <UserCheck className="h-4 w-4 mr-1" />
                  {t.manageEnrollment}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <AddCourseModal 
        open={addCourseOpen} 
        onOpenChange={setAddCourseOpen} 
      />
      <EditCourseModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Course"
        description="Are you sure you want to delete"
        itemName={selectedCourse?.title || ""}
        onConfirm={handleDeleteCourse}
        loading={deletingCourse}
      />
    </div>
  );
};

export default CourseList;