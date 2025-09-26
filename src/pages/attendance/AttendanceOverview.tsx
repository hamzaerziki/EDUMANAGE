import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LanguageSelector } from "@/components/ui/language-selector";
import { 
  Calendar as CalendarIcon, 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  GraduationCap,
  ChevronDown,
  RefreshCcw,
  FileText
} from "lucide-react";
import MarkAttendanceModal from "@/components/modals/MarkAttendanceModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { groupsApi, studentsApi } from "@/lib/api";
import { attendanceApi } from "@/lib/api";
import { exportReportPdf, type PdfLang } from "@/lib/pdfUtils";
import { useToast } from "@/hooks/use-toast";

const AttendanceOverview = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);

  // Load groups and students from backend only
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const selectedISO = selectedDate.toISOString().slice(0,10);

  const refreshAll = async () => {
    try {
      const [g, s, a] = await Promise.all([
        groupsApi.list(),
        studentsApi.list().catch(()=>[]),
        attendanceApi.list().catch(()=>[]),
      ]);
      setGroupsData(Array.isArray(g) ? g.map((x:any)=>({ id: x.id, name: x.name, level: x.level || '', grade: '' })) : []);
      setStudents(Array.isArray(s) ? s : []);
      setAttendance(Array.isArray(a) ? a : []);
    } catch {
      setGroupsData([]); setStudents([]); setAttendance([]);
    }
  };

  useEffect(() => {
    refreshAll();
    const onUpdated = () => refreshAll();
    window.addEventListener('attendance:updated', onUpdated as any);
    return () => window.removeEventListener('attendance:updated', onUpdated as any);
  }, []);

  // When the selected date changes, refetch attendance so dashboard stays in sync
  useEffect(() => {
    refreshAll();
  }, [selectedDate]);

  // When the mark modal closes, trigger an extra refresh (in case of race with event timing)
  useEffect(() => {
    if (!isMarkAttendanceOpen) {
      // Slight delay to let the backend finish any commits
      const id = setTimeout(() => { refreshAll(); }, 150);
      return () => clearTimeout(id);
    }
  }, [isMarkAttendanceOpen]);

  // Group groups by level for organized display
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Apply filters to groups
  const filteredGroups = groupsData.filter((g) => {
    const classOk = selectedClass === "all" || selectedClass === "" || String(g.id) === String(selectedClass);
    const q = searchTerm.trim().toLowerCase();
    const text = `${g.name} ${g.teacher ?? ''} ${g.subject ?? ''} ${g.grade ?? ''}`.toLowerCase();
    const searchOk = q === "" || text.includes(q);
    return classOk && searchOk;
  });

  const groupedByLevel = filteredGroups.reduce((acc, group) => {
    if (!acc[group.level]) {
      acc[group.level] = [];
    }
    acc[group.level].push(group);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleCategory = (level: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getStudentCount = (group: any) => {
    if (!group) return 0;
    return students.filter((s:any)=> Number(s.group_id) === Number(group.id)).length;
  };

  // Compute stats for selected date from backend attendance
  const todaysRecs = attendance.filter((a:any)=> String(a.date) === selectedISO);
  // Reduce to latest record per student (avoid duplicates if attendance was taken multiple times)
  const latestByStudent: Record<number, any> = {};
  todaysRecs.forEach((rec:any) => {
    const sid = Number(rec.student_id);
    const prev = latestByStudent[sid];
    if (!prev || Number(rec.id) > Number(prev.id)) latestByStudent[sid] = rec;
  });
  const uniqueRecs = Object.values(latestByStudent);
  // Restrict records to the groups currently filtered/selected
  const allowedGroupIds = new Set(filteredGroups.map(g => Number(g.id)));
  const uniqueFiltered = (uniqueRecs as any[]).filter((rec:any) => {
    const st = students.find((s:any)=> Number(s.id) === Number(rec.student_id));
    return st ? allowedGroupIds.has(Number(st.group_id)) : false;
  });
  const presentCount = uniqueFiltered.filter((a:any)=> a.status === 'present').length;
  const absentCount = uniqueFiltered.filter((a:any)=> a.status === 'absent').length;
  const lateCount = uniqueFiltered.filter((a:any)=> a.status === 'late').length;
  const denom = presentCount + absentCount; // late does NOT reduce presence rate
  const attendanceStats = {
    totalStudents: filteredGroups.reduce((sum, group) => sum + getStudentCount(group), 0),
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    attendanceRate: denom ? Math.round((presentCount / denom) * 1000) / 10 : 0,
  };

  const classSchedules = filteredGroups;

  // Build rows for Students tab from backend attendance for selected date (unique per student)
  const rowsForDate = uniqueFiltered.map((rec:any) => {
    const st = students.find((s:any)=> Number(s.id) === Number(rec.student_id));
    const grp = st ? groupsData.find((g:any)=> Number(g.id) === Number(st.group_id)) : null;
    return {
      id: rec.id,
      student: st?.full_name || st?.name || String(rec.student_id),
      class: grp?.name || '',
      status: rec.status,
      time: '-',
    };
  });
  const filteredRecentAttendance = rowsForDate.filter((record) => {
    const statusOk = studentStatusFilter === 'all' || record.status === studentStatusFilter;
    const q = studentSearchTerm.trim().toLowerCase();
    const text = `${record.student} ${record.class}`.toLowerCase();
    const searchOk = q === '' || text.includes(q);
    return statusOk && searchOk;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800 border-green-200";
      case "absent": return "bg-red-100 text-red-800 border-red-200";
      case "late": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4" />;
      case "absent": return <XCircle className="h-4 w-4" />;
      case "late": return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleExportReport = async () => {
    try {
      console.log('🔄 Generating overall attendance report...');
      const pdfLang: PdfLang = language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en';
      const dateStr = selectedDate.toLocaleDateString('fr-FR');
      
      // Prepare report title and subtitle
      const reportTitle = language === 'fr' 
        ? 'Rapport de Présence' 
        : language === 'ar' 
        ? 'تقرير الحضور' 
        : 'Attendance Report';
      
      const subtitle = language === 'fr'
        ? `Présences du ${dateStr}`
        : language === 'ar'
        ? `حضور يوم ${dateStr}`
        : `Attendance for ${dateStr}`;

      // Prepare summary statistics
      const summaryTable = {
        title: language === 'fr' ? 'Résumé Général' : language === 'ar' ? 'الملخص العام' : 'Overall Summary',
        columns: [
          language === 'fr' ? 'Métrique' : language === 'ar' ? 'المقياس' : 'Metric',
          language === 'fr' ? 'Valeur' : language === 'ar' ? 'القيمة' : 'Value'
        ],
        rows: [
          [
            language === 'fr' ? 'Total Étudiants' : language === 'ar' ? 'إجمالي الطلاب' : 'Total Students',
            attendanceStats.totalStudents.toString()
          ],
          [
            language === 'fr' ? 'Présents' : language === 'ar' ? 'حاضر' : 'Present',
            `${attendanceStats.present} (${attendanceStats.attendanceRate}%)`
          ],
          [
            language === 'fr' ? 'Absents' : language === 'ar' ? 'غائب' : 'Absent',
            attendanceStats.absent.toString()
          ],
          [
            language === 'fr' ? 'En Retard' : language === 'ar' ? 'متأخر' : 'Late',
            attendanceStats.late.toString()
          ]
        ]
      };

      // Prepare detailed attendance by group
      const groupTables = Object.entries(groupedByLevel).map(([level, groups]) => {
        const groupRows: string[][] = [];
        
        groups.forEach(group => {
          // Get students for this group
          const groupStudents = students.filter(s => Number(s.group_id) === Number(group.id));
          
          if (groupStudents.length > 0) {
            // Add group header row
            groupRows.push([
              `${group.name} (${level})`,
              groupStudents.length.toString(),
              '',
              ''
            ]);
            
            // Add students with their attendance
            groupStudents.forEach(student => {
              const attendanceRecord = uniqueFiltered.find(a => 
                Number(a.student_id) === Number(student.id)
              );
              
              const status = attendanceRecord?.status || 'absent';
              const statusText = status === 'present' 
                ? (language === 'fr' ? 'Présent' : language === 'ar' ? 'حاضر' : 'Present')
                : status === 'late'
                ? (language === 'fr' ? 'En Retard' : language === 'ar' ? 'متأخر' : 'Late')
                : (language === 'fr' ? 'Absent' : language === 'ar' ? 'غائب' : 'Absent');
              
              groupRows.push([
                `  ${student.full_name || student.name}`,
                student.phone || '—',
                student.email || '—',
                statusText
              ]);
            });
            
            // Add separator row
            groupRows.push(['', '', '', '']);
          }
        });

        return {
          title: `${language === 'fr' ? 'Détail par Niveau' : language === 'ar' ? 'التفاصيل حسب المستوى' : 'Details by Level'} - ${level}`,
          columns: [
            language === 'fr' ? 'Étudiant/Groupe' : language === 'ar' ? 'الطالب/المجموعة' : 'Student/Group',
            language === 'fr' ? 'Téléphone' : language === 'ar' ? 'الهاتف' : 'Phone',
            language === 'fr' ? 'Email' : language === 'ar' ? 'البريد الإلكتروني' : 'Email',
            language === 'fr' ? 'Statut' : language === 'ar' ? 'الحالة' : 'Status'
          ],
          rows: groupRows
        };
      });

      console.log('📄 Generating overall PDF report...');

      // Generate the PDF report
      await exportReportPdf({
        lang: pdfLang,
        centerName: 'EduManage',
        title: reportTitle,
        subtitle,
        author: 'Système EduManage',
        tables: [summaryTable, ...groupTables],
        branding: {
          address: 'Système de Gestion Éducative',
          phone: '+212 XXX XXX XXX',
          email: 'contact@edumanage.ma',
          location: 'Maroc',
          timeZone: 'Africa/Casablanca'
        },
        filters: [
          {
            label: language === 'fr' ? 'Date' : language === 'ar' ? 'التاريخ' : 'Date',
            value: dateStr
          },
          {
            label: language === 'fr' ? 'Classes' : language === 'ar' ? 'الفصول' : 'Classes',
            value: selectedClass === 'all' 
              ? (language === 'fr' ? 'Toutes les classes' : language === 'ar' ? 'جميع الفصول' : 'All classes')
              : (filteredGroups.find(g => String(g.id) === selectedClass)?.name || selectedClass)
          }
        ],
        notes: [
          language === 'fr' 
            ? 'Ce rapport présente les données de présence en temps réel depuis la base de données.'
            : language === 'ar'
            ? 'يعرض هذا التقرير بيانات الحضور في الوقت الفعلي من قاعدة البيانات.'
            : 'This report presents real-time attendance data from the database.'
        ]
      });

      console.log('✅ PDF report generated successfully');

      toast({
        title: language === 'fr' ? 'Rapport généré' : language === 'ar' ? 'تم إنشاء التقرير' : 'Report generated',
        description: language === 'fr' 
          ? 'Le rapport PDF a été téléchargé avec succès.'
          : language === 'ar'
          ? 'تم تنزيل تقرير PDF بنجاح.'
          : 'PDF report downloaded successfully.',
      });

    } catch (error) {
      console.error('❌ Error generating attendance report:', error);
      toast({
        title: language === 'fr' ? 'Erreur' : language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'fr' 
          ? 'Erreur lors de la génération du rapport.'
          : language === 'ar'
          ? 'خطأ في إنشاء التقرير.'
          : 'Error generating report.',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAttendance = (classData?: any) => {
    setSelectedGroup(classData || null);
    // Don't filter the view to only this class - users want to see all groups
    setIsMarkAttendanceOpen(true);
  };

  const syncLabel = (t.syncNow as any) || (language==='fr' ? 'Synchroniser' : language==='ar' ? 'مزامنة الآن' : 'Sync Now');

  const handleGroupReport = async (group: any) => {
    try {
      console.log('🔄 Generating report for group:', group);
      const pdfLang: PdfLang = language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en';
      const dateStr = selectedDate.toLocaleDateString('fr-FR');
      
      // Get students for this specific group
      const groupStudents = students.filter(s => Number(s.group_id) === Number(group.id));
      console.log('👥 Group students:', groupStudents.length);
      
      // Get attendance records for this group's students
      const groupAttendance = uniqueFiltered.filter(a => 
        groupStudents.some(s => Number(s.id) === Number(a.student_id))
      );
      console.log('📊 Group attendance records:', groupAttendance.length);
      
      // Calculate group-specific stats
      const groupStats = {
        totalStudents: groupStudents.length,
        present: groupAttendance.filter(a => a.status === 'present').length,
        absent: groupStudents.length - groupAttendance.length + groupAttendance.filter(a => a.status === 'absent').length,
        late: groupAttendance.filter(a => a.status === 'late').length
      };
      
      const attendanceRate = groupStats.totalStudents > 0 
        ? Math.round((groupStats.present / groupStats.totalStudents) * 100) 
        : 0;

      // Prepare report title
      const reportTitle = language === 'fr' 
        ? `Rapport de Présence - ${group.name}` 
        : language === 'ar' 
        ? `تقرير الحضور - ${group.name}` 
        : `Attendance Report - ${group.name}`;
      
      const subtitle = language === 'fr'
        ? `${group.level} - ${dateStr}`
        : language === 'ar'
        ? `${group.level} - ${dateStr}`
        : `${group.level} - ${dateStr}`;

      // Group summary table
      const summaryTable = {
        title: language === 'fr' ? 'Résumé du Groupe' : language === 'ar' ? 'ملخص المجموعة' : 'Group Summary',
        columns: [
          language === 'fr' ? 'Métrique' : language === 'ar' ? 'المقياس' : 'Metric',
          language === 'fr' ? 'Valeur' : language === 'ar' ? 'القيمة' : 'Value'
        ],
        rows: [
          [
            language === 'fr' ? 'Nom du Groupe' : language === 'ar' ? 'اسم المجموعة' : 'Group Name',
            group.name
          ],
          [
            language === 'fr' ? 'Niveau' : language === 'ar' ? 'المستوى' : 'Level',
            group.level || '—'
          ],
          [
            language === 'fr' ? 'Total Étudiants' : language === 'ar' ? 'إجمالي الطلاب' : 'Total Students',
            groupStats.totalStudents.toString()
          ],
          [
            language === 'fr' ? 'Présents' : language === 'ar' ? 'حاضر' : 'Present',
            `${groupStats.present} (${attendanceRate}%)`
          ],
          [
            language === 'fr' ? 'Absents' : language === 'ar' ? 'غائب' : 'Absent',
            groupStats.absent.toString()
          ],
          [
            language === 'fr' ? 'En Retard' : language === 'ar' ? 'متأخر' : 'Late',
            groupStats.late.toString()
          ]
        ]
      };

      // Student details table
      const studentRows = groupStudents.map(student => {
        const attendanceRecord = groupAttendance.find(a => 
          Number(a.student_id) === Number(student.id)
        );
        
        const status = attendanceRecord?.status || 'absent';
        const statusText = status === 'present' 
          ? (language === 'fr' ? 'Présent' : language === 'ar' ? 'حاضر' : 'Present')
          : status === 'late'
          ? (language === 'fr' ? 'En Retard' : language === 'ar' ? 'متأخر' : 'Late')
          : (language === 'fr' ? 'Absent' : language === 'ar' ? 'غائب' : 'Absent');
        
        return [
          student.full_name || student.name || '—',
          student.phone || '—',
          student.email || '—',
          statusText
        ];
      });

      const detailsTable = {
        title: language === 'fr' ? 'Détail des Étudiants' : language === 'ar' ? 'تفاصيل الطلاب' : 'Student Details',
        columns: [
          language === 'fr' ? 'Nom Complet' : language === 'ar' ? 'الاسم الكامل' : 'Full Name',
          language === 'fr' ? 'Téléphone' : language === 'ar' ? 'الهاتف' : 'Phone',
          language === 'fr' ? 'Email' : language === 'ar' ? 'البريد الإلكتروني' : 'Email',
          language === 'fr' ? 'Statut' : language === 'ar' ? 'الحالة' : 'Status'
        ],
        rows: studentRows
      };

      console.log('📄 Generating PDF report...');
      
      // Generate the PDF report
      await exportReportPdf({
        lang: pdfLang,
        centerName: 'EduManage',
        title: reportTitle,
        subtitle,
        author: 'Système EduManage',
        tables: [summaryTable, detailsTable],
        branding: {
          address: 'Système de Gestion Éducative',
          phone: '+212 XXX XXX XXX',
          email: 'contact@edumanage.ma',
          location: 'Maroc',
          timeZone: 'Africa/Casablanca'
        },
        filters: [
          {
            label: language === 'fr' ? 'Date' : language === 'ar' ? 'التاريخ' : 'Date',
            value: dateStr
          },
          {
            label: language === 'fr' ? 'Groupe' : language === 'ar' ? 'المجموعة' : 'Group',
            value: group.name
          },
          {
            label: language === 'fr' ? 'Niveau' : language === 'ar' ? 'المستوى' : 'Level',
            value: group.level || '—'
          }
        ],
        notes: [
          language === 'fr' 
            ? `Rapport détaillé pour le groupe ${group.name}. Données en temps réel depuis la base de données.`
            : language === 'ar'
            ? `تقرير مفصل للمجموعة ${group.name}. بيانات في الوقت الفعلي من قاعدة البيانات.`
            : `Detailed report for group ${group.name}. Real-time data from database.`
        ]
      });

      console.log('✅ PDF report generated successfully');

      toast({
        title: language === 'fr' ? 'Rapport généré' : language === 'ar' ? 'تم إنشاء التقرير' : 'Report generated',
        description: language === 'fr' 
          ? `Rapport PDF pour ${group.name} téléchargé avec succès.`
          : language === 'ar'
          ? `تم تنزيل تقرير PDF لـ ${group.name} بنجاح.`
          : `PDF report for ${group.name} downloaded successfully.`,
      });

    } catch (error) {
      console.error('❌ Error generating group report:', error);
      toast({
        title: language === 'fr' ? 'Erreur' : language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'fr' 
          ? 'Erreur lors de la génération du rapport du groupe.'
          : language === 'ar'
          ? 'خطأ في إنشاء تقرير المجموعة.'
          : 'Error generating group report.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.attendanceManagement}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <div className="flex gap-3">
          <LanguageSelector />
          <Button variant="outline" onClick={refreshAll} title={syncLabel}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            {syncLabel}
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <FileText className="h-4 w-4 mr-2" />
            {t.download}
          </Button>
          <Button onClick={() => handleMarkAttendance()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.takeAttendance}
          </Button>
        </div>
      </div>

      {/* Date and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : t.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t.classOverview} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.classOverview}</SelectItem>
                {classSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={() => console.log('More Filters clicked')}>
              <Filter className="h-4 w-4 mr-2" />
              {t.filters}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalStudents}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">{t.enrolledStudents}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize">{t.present}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
            <p className="text-xs text-muted-foreground">{t.present}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize">{t.absent}</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
            <p className="text-xs text-muted-foreground">{t.absent}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize">{t.late}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
            <p className="text-xs text-muted-foreground">{t.late}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendanceRate}</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">{t.attendanceRate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classes">{t.classOverview}</TabsTrigger>
          <TabsTrigger value="students">{t.studentAttendance}</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          {/* Groups by Level - Expandable Categories */}
          <div className="space-y-6">
            {Object.entries(groupedByLevel).map(([level, groups]) => (
              <div key={level} className="space-y-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-3 rounded-lg"
                  onClick={() => toggleCategory(level)}
                >
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{level}</h2>
                  <Badge variant="outline">{groups.length} groups</Badge>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${expandedCategories[level] ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedCategories[level] && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-6">
                    {groups.map((group) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{group.grade}</p>
                              <p className="text-sm text-muted-foreground">Prof: {group.teacher}</p>
                            </div>
                            <Badge variant="secondary">{group.subject}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {getStudentCount(group)} {t.students.toLowerCase?.() || 'students'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleMarkAttendance(group)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Prendre les Présences
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGroupReport(group)}
                              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Télécharger Rapport
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatus}</SelectItem>
                    <SelectItem value="present">{t.present}</SelectItem>
                    <SelectItem value="absent">{t.absent}</SelectItem>
                    <SelectItem value="late">{t.late}</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.student}</TableHead>
                    <TableHead>{t.class}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {record.student.split(' ').map((n:string) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{record.student}</div>
                            <div className="text-xs text-muted-foreground">{record.class}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell>
                        <Badge className={cn('border', getStatusColor(record.status))}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            <span className="capitalize">{record.status === 'present' ? t.present : record.status === 'absent' ? t.absent : t.late}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{record.time}</TableCell>
                    </TableRow>
                  ))}
                  {filteredRecentAttendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">{t.noData || 'No data for selected date.'}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal 
        open={isMarkAttendanceOpen} 
        onOpenChange={setIsMarkAttendanceOpen}
        selectedClass={selectedGroup}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default AttendanceOverview;