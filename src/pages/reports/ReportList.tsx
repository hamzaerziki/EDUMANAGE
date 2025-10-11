import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users, BookOpen, DollarSign, Calendar, RefreshCw, TrendingUp, BarChart3, FileText, Search, Filter, Download, Plus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts';
import { AnalyticsEngine } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import GenerateReportModal from "@/components/modals/GenerateReportModal";
import { CSVBulkUploadModal } from "@/components/modals/CSVBulkUploadModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { attendanceStore } from "@/lib/attendanceStore";
import { examsStore } from "@/lib/examsStore";
import { exportReportPdf } from "@/lib/pdfUtils";
import { useSettings } from "@/hooks/useSettings";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { Switch } from "@/components/ui/switch";
import { 
  generateStudentPerformanceReportPDF,
  generateFinancialReportPDF,
  generateAttendanceAnalysisReportPDF,
  generateTeacherPerformanceReportPDF,
  generateCourseAnalyticsReportPDF,
  generateEnrollmentReportPDF,
  type TeacherData,
} from "@/lib/reportBuilders";

// Mock data for charts
const attendanceCorrelationData = [
  { bucket: '0-20%', avg: 45 },
  { bucket: '21-40%', avg: 58 },
  { bucket: '41-60%', avg: 72 },
  { bucket: '61-80%', avg: 85 },
  { bucket: '81-100%', avg: 92 }
];

const classComparisonData = [
  { group: 'Group A', avg: 78 },
  { group: 'Group B', avg: 82 },
  { group: 'Group C', avg: 75 },
  { group: 'Group D', avg: 88 }
];

const studentTrendData = [
  { exam: 'Exam 1', score: 75 },
  { exam: 'Exam 2', score: 82 },
  { exam: 'Exam 3', score: 78 },
  { exam: 'Exam 4', score: 85 }
];

const analyticsDisplayData = [
  { title: 'Total Students', value: '450', change: '+5%' },
  { title: 'Average Attendance', value: '92%', change: '+2%' },
  { title: 'Course Completion', value: '88%', change: '+3%' }
];

const ReportList = () => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { institutionSettings } = useSettings();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("this_month");
  const [generateReportOpen, setGenerateReportOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  // Performance filters
  const [perfGroup, setPerfGroup] = useState<string>('all');
  const [perfSubject, setPerfSubject] = useState<string>('all');
  const [perfStudent, setPerfStudent] = useState<string>('');
  const [perfDateRange, setPerfDateRange] = useState<string>('this_month');
  const [perfTeacher, setPerfTeacher] = useState<string>('all');
  // Report generation options
  const [optIncludeCharts, setOptIncludeCharts] = useState<boolean>(true);
  const [optIncludeDetails, setOptIncludeDetails] = useState<boolean>(true);
  const [optEnableAdvanced, setOptEnableAdvanced] = useState<boolean>(true);

  // Dynamic statistics from database
  const [reportStats, setReportStats] = useState({
  totalReports: 0,
  generatedToday: 0,
  pendingReports: 0,
  downloadCount: 0
});

// Load statistics from API
useEffect(() => {
  const fetchStatistics = async () => {
    try {
      const response = await apiClient.request('/reports/statistics/summary');
      setReportStats(response.data.reportStats);
    } catch (error) {
      console.error("Error fetching report statistics:", error);
    }
  };
  fetchStatistics();
}, []);

  const recentReports = [
    {
      id: 1,
      title: "Student Performance Report",
      type: "academic",
      description: "Comprehensive academic performance analysis for Q1 2024",
      generatedBy: "Admin User",
      generatedDate: "2024-01-20",
      format: "PDF",
      size: "2.4 MB",
      downloads: 24,
      status: "ready",
      category: "Students"
    },
    {
      id: 2,
      title: "Financial Summary Report",
      type: "financial",
      description: "Monthly revenue and payment collection report",
      generatedBy: "Finance Manager",
      generatedDate: "2024-01-19",
      format: "PDF",
      size: "1.8 MB",
      downloads: 12,
      status: "ready",
      category: "Finance"
    },
    {
      id: 3,
      title: "Teacher Performance Analysis",
      type: "teacher",
      description: "Teaching effectiveness and student feedback analysis",
      generatedBy: "HR Manager",
      generatedDate: "2024-01-18",
      format: "PDF",
      size: "3.1 MB",
      downloads: 18,
      status: "ready",
      category: "Teachers"
    },
    {
      id: 4,
      title: "Attendance Analytics",
      type: "attendance",
      description: "Student and teacher attendance patterns and trends",
      generatedBy: "Admin User",
      generatedDate: "2024-01-17",
      format: "PDF",
      size: "1.9 MB",
      downloads: 31,
      status: "ready",
      category: "Attendance"
    },
  ];

  // Filter reports based on search term and type
  const filteredReports = recentReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = reportType === 'all' || report.type === reportType;
    return matchesSearch && matchesType;
  });

  // Get selected group name for performance report
  const selectedGroupNameForPerf = perfGroup === 'all' ? undefined : perfGroup;

  // Refs for charts to embed into PDFs
  const perfStudentTrendRef = useRef<HTMLDivElement | null>(null);
  const perfAttendanceCorrRef = useRef<HTMLDivElement | null>(null);
  const perfClassComparisonRef = useRef<HTMLDivElement | null>(null);
  const analyticsAttendanceTrendRef = useRef<HTMLDivElement | null>(null);
  const analyticsPerfDistRef = useRef<HTMLDivElement | null>(null);

  const langPdf = (language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en') as 'fr' | 'en' | 'ar';

  const handleExportReportsPdf = async () => {
    const columns = [
      t.reportTitleLabel || 'Title',
      t.reportByLabel || 'By',
      t.reportDateLabel || 'Date',
      t.reportFormatLabel || 'Format',
      t.reportSizeLabel || 'Size',
      t.reportDownloadsLabel || 'Downloads',
      t.reportCategoryLabel || 'Category',
      t.reportStatusLabel || 'Status'
    ];
    const rows = filteredReports.map(r => [r.title, r.generatedBy, r.generatedDate, r.format, r.size, String(r.downloads), r.category, r.status]);
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: t.reportsAnalytics || 'Reports & Analytics',
      author: user?.name,
      subtitle: t.recentReports || (language === 'fr' ? 'Rapports récents' : 'Recent Reports'),
      tables: [{ columns, rows }],
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
  };

  const handleExportPerformancePdf = async () => {
    const tables = [
      {
        title: t.attendanceCorrelation || 'Attendance Correlation',
        columns: [t.bucket || 'Bucket', t.average || 'Average'],
        rows: attendanceCorrelationData.map((r:any)=>[r.bucket, String(r.avg)])
      },
      {
        title: t.classComparison || 'Class Comparison',
        columns: [t.group || 'Group', t.average || 'Average'],
        rows: classComparisonData.map((r:any)=>[r.group, String(r.avg)])
      },
      {
        title: t.studentTrends || 'Student Trends',
        columns: [t.exam || 'Exam', t.score || 'Score'],
        rows: (studentTrendData || []).map((r:any)=>[String(r.exam), String(r.score)])
      }
    ];
    const charts = [
      { el: perfStudentTrendRef.current, title: t.studentTrends || 'Student Trends', heightPx: 260, summary: t.studentTrendSummary || 'Line chart showing per-exam score progression.' },
      { el: perfAttendanceCorrRef.current, title: t.attendanceCorrelation || 'Attendance Correlation', heightPx: 260, summary: t.attendanceCorrelationSummary || 'Scatter showing relation between attendance percentage and average grade.' },
      { el: perfClassComparisonRef.current, title: t.classComparison || 'Class Comparison', heightPx: 260, summary: t.classComparisonSummary || 'Bar chart comparing average grades across groups.' },
    ];
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: t.performanceReport || 'Performance Report',
      author: user?.name,
      subtitle: selectedGroupName ? `${t.group || 'Group'}: ${selectedGroupName}` : undefined,
      tables,
      charts,
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
  };

  const handleExportAnalyticsPdf = async () => {
    const tables = [
      {
        title: t.overview || 'Overview',
        columns: [t.metric || 'Metric', t.value || 'Value', t.change || 'Change'],
        rows: analyticsDisplayData.map(i => [i.title, i.value, i.change])
      }
    ];
    const charts = [
      { el: analyticsAttendanceTrendRef.current, title: t.attendanceTrend || 'Attendance Trend', heightPx: 300, summary: t.attendanceTrendSummary || 'Line chart showing attendance rate over recent months.' },
      { el: analyticsPerfDistRef.current, title: t.performanceDistribution || 'Performance Distribution', heightPx: 260, summary: t.performanceDistributionSummary || 'Bar chart showing number of students by performance category.' },
    ];
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: t.analyticsReport || 'Analytics Report',
      author: user?.name,
      tables,
      charts,
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
  };

  const quickReports = [
    {
      title: t.studentEnrollmentReport || "Student Enrollment Report",
      description: t.studentEnrollmentDescription || "Current enrollment statistics and trends",
      icon: Users,
      color: "text-blue",
      bgColor: "bg-blue/10"
    },
    {
      title: t.coursePerformanceReport || "Course Performance Report",
      description: t.coursePerformanceDescription || "Course completion rates and student feedback",
      icon: BookOpen,
      color: "text-purple",
      bgColor: "bg-purple/10"
    },
    {
      title: t.financialOverview || "Financial Overview",
      description: t.financialOverviewDescription || "Revenue, expenses, and payment analytics",
      icon: DollarSign,
      color: "text-green",
      bgColor: "bg-green/10"
    },
    {
      title: t.attendanceSummary || "Attendance Summary",
      description: t.attendanceSummaryDescription || "Daily, weekly, and monthly attendance reports",
      icon: Calendar,
      color: "text-orange",
      bgColor: "bg-orange/10"
    },
  ];

  // Initialize analytics data
  useEffect(() => {
    const mockStudents = [
      { id: 1, name: "Ahmed", gpa: 15.8, attendance: 95, enrollmentDate: "2023-09-01", status: "active", level: "Lycée", grade: "1ère Bac" },
      { id: 2, name: "Fatima", gpa: 16.9, attendance: 92, enrollmentDate: "2022-09-01", status: "active", level: "Lycée", grade: "2ème Bac" },
      { id: 3, name: "Youssef", gpa: 13.6, attendance: 78, enrollmentDate: "2021-09-01", status: "inactive", level: "Lycée", grade: "TC" },
      { id: 4, name: "Aicha", gpa: 17.0, attendance: 98, enrollmentDate: "2020-09-01", status: "active", level: "Collège", grade: "3ème" }
    ];

    const mockCourses = [
      { id: 1, title: "Math", studentsEnrolled: 45, maxStudents: 50, status: "active", startDate: "2024-01-15", endDate: "2024-07-15", rating: 4.8 },
      { id: 2, title: "Physics", studentsEnrolled: 32, maxStudents: 40, status: "active", startDate: "2024-02-01", endDate: "2024-06-01", rating: 4.6 }
    ];

    const mockPayments = [
      { id: 1, amount: 299, status: "paid", dueDate: "2024-01-15", paidDate: "2024-01-10" },
      { id: 2, amount: 249, status: "pending", dueDate: "2024-01-20", paidDate: null }
    ];

    const mockAttendance = [
      { studentId: 1, date: "2024-01-20", status: "present" as const, classId: "math-1" },
      { studentId: 2, date: "2024-01-20", status: "absent" as const, classId: "physics-1" }
    ];

    const analytics = AnalyticsEngine.aggregateMetrics(mockStudents, mockCourses, mockPayments, mockAttendance);
    setAnalyticsData(analytics);
  }, []);

  // Groups and subjects for Performance tab
  const allGroups = useMemo(() => {
    try {
      const raw = localStorage.getItem('groups');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }, []);
  const groupOptions = allGroups.map((g: any) => ({ id: String(g.id), name: g.name || String(g.id) }));
  const selectedGroupId = perfGroup !== 'all' ? perfGroup : (groupOptions[0]?.id || '');
  const selectedGroupName = groupOptions.find(g => g.id === selectedGroupId)?.name || '';

  const subjectOptionsPerf = useMemo(() => {
    const grids = examsStore.all();
    const set = new Set<string>();
    grids.forEach(g => { if (g.subject) set.add(g.subject); });
    return Array.from(set);
  }, []);

  const selectedGrid = useMemo(() => {
    if (!selectedGroupId) return undefined;
    if (perfSubject && perfSubject !== 'all') return examsStore.findByGroupAndSubject(selectedGroupId, perfSubject);
    const list = examsStore.all().filter(g => g.id === selectedGroupId);
    return list[0];
  }, [selectedGroupId, perfSubject]);

  const studentsInGrid = selectedGrid?.students || [];
  useEffect(() => {
    if (!perfStudent && studentsInGrid.length) setPerfStudent(studentsInGrid[0]);
  }, [studentsInGrid, perfStudent]);

  // Helper: compute per-student averages for group (optionally filtered by subject)
  const getStudentAverages = (groupId: string, subject?: string) => {
    const grids = examsStore.all().filter(g => g.id === groupId && (!subject || (g.subject || '').toLowerCase() === subject.toLowerCase()));
    if (!grids.length) return new Map<string, number>();
    const names = new Set<string>();
    grids.forEach(g => (g.students || []).forEach(s => names.add(s)));
    const sum = new Map<string, number>();
    const cnt = new Map<string, number>();
    grids.forEach(g => {
      (g.students || []).forEach((name, idx) => {
        const grades = g.rows.flatMap(r => (typeof r.grades[idx] === 'number' ? [r.grades[idx] as number] : []));
        if (grades.length) {
          const s = (sum.get(name) || 0) + grades.reduce((a,b)=>a+b,0) / grades.length;
          sum.set(name, s);
          cnt.set(name, (cnt.get(name) || 0) + 1);
        }
      });
    });
    const avg = new Map<string, number>();
    names.forEach(n => {
      const c = cnt.get(n) || 0;
      avg.set(n, c ? Number(((sum.get(n) || 0)/c).toFixed(2)) : 0);
    });
    return avg;
  };

  // Student trend data
  const studentTrendData = useMemo(() => {
    if (!selectedGrid || !perfStudent) return [
      { exam: 'Exam 1', score: 12 },
      { exam: 'Exam 2', score: 14 },
      { exam: 'Exam 3', score: 15.5 },
    ];
    const sIdx = selectedGrid.students.findIndex(s => s === perfStudent);
    if (sIdx < 0) return [];
    return selectedGrid.rows.map(r => ({ exam: r.examLabel, score: typeof r.grades[sIdx] === 'number' ? (r.grades[sIdx] as number) : 0 }));
  }, [selectedGrid, perfStudent]);

  // Attendance correlation data (bucketed)
  const attendanceCorrelationData = useMemo(() => {
    if (!selectedGroupId) return [
      { bucket: '70-80', avg: 12.8 },
      { bucket: '80-90', avg: 14.2 },
      { bucket: '90-100', avg: 15.6 },
    ];
    const avgMap = getStudentAverages(selectedGroupId, perfSubject !== 'all' ? perfSubject : undefined);
    const buckets = [
      { min: 0, max: 60, label: '0-60' },
      { min: 60, max: 70, label: '60-70' },
      { min: 70, max: 80, label: '70-80' },
      { min: 80, max: 90, label: '80-90' },
      { min: 90, max: 101, label: '90-100' },
    ];
    const acc: Record<string, { sum: number; n: number }> = {};
    avgMap.forEach((gpa, name) => {
      const pct = attendanceStore.percentage(selectedGroupName || selectedGroupId, name) ?? 0;
      const b = buckets.find(b => pct >= b.min && pct < b.max) || buckets[buckets.length - 1];
      acc[b.label] = acc[b.label] || { sum: 0, n: 0 };
      acc[b.label].sum += gpa; acc[b.label].n += 1;
    });
    return buckets.map(b => ({ bucket: b.label, avg: acc[b.label]?.n ? Number((acc[b.label].sum/acc[b.label].n).toFixed(2)) : 0 }));
  }, [selectedGroupId, perfSubject, selectedGroupName]);

  // Class comparison data
  const classComparisonData = useMemo(() => {
    const items = (groupOptions.length ? groupOptions : [{ id: 'g1', name: 'Class A' }, { id: 'g2', name: 'Class B' }, { id: 'g3', name: 'Class C' }]).slice(0, 6);
    return items.map(g => {
      const avgMap = getStudentAverages(g.id, perfSubject !== 'all' ? perfSubject : undefined);
      const vals = Array.from(avgMap.values());
      const avg = vals.length ? Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : Math.round(12 + Math.random()*4);
      return { group: g.name, avg };
    });
  }, [groupOptions, perfSubject]);

  const analyticsDisplayData = [
    {
      title: t.totalStudents || "Total Students",
      value: "1,234",
      change: "+12%",
      trend: "up",
      color: "text-blue"
    },
    {
      title: t.activeCourses || "Active Courses",
      value: "89",
      change: "+8%",
      trend: "up",
      color: "text-purple"
    },
    {
      title: t.monthlyRevenue || "Monthly Revenue",
      value: analyticsData ? `${analyticsData.financial.monthlyRevenue.toLocaleString()} MAD` : "45,678 MAD",
      change: "+15%",
      trend: "up",
      color: "text-green"
    },
    {
      title: t.attendanceRate || "Attendance Rate",
      value: analyticsData ? `${analyticsData.attendance.overallRate.toFixed(1)}%` : "92.5%",
      change: "+2%",
      trend: "up",
      color: "text-orange"
    },
  ];

  // Attendance Trend (line)
  const attendanceTrendData = analyticsData?.attendance?.monthlyTrends?.map((m: any) => ({ month: m.month, rate: m.rate })) || [
    { month: 'Jul 2024', rate: 89.2 },
    { month: 'Aug 2024', rate: 90.1 },
    { month: 'Sep 2024', rate: 91.5 },
    { month: 'Oct 2024', rate: 92.0 },
    { month: 'Nov 2024', rate: 92.5 },
    { month: 'Dec 2024', rate: 93.1 }
  ];

  // Performance Distribution (bar) derived from analytics engine
  const performanceDistributionBarData = analyticsData?.students?.performanceDistribution
    ? Object.entries(analyticsData.students.performanceDistribution).map(([category, count]: any) => ({ category, count }))
    : [
        { category: t.excellent || 'Excellent (18-20)', count: 5 },
        { category: t.veryGood || 'Très Bien (16-18)', count: 9 },
        { category: t.good || 'Bien (14-16)', count: 14 },
        { category: t.fair || 'Assez Bien (12-14)', count: 10 },
        { category: t.passing || 'Passable (10-12)', count: 12 },
        { category: t.insufficient || 'Insuffisant (<10)', count: 7 },
      ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green/10 text-green border-green/20";
      case "generating": return "bg-orange/10 text-orange border-orange/20";
      case "failed": return "bg-red/10 text-red border-red/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    
    // Recalculate analytics with fresh data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Refresh analytics data
    const mockStudents = [
      { id: 1, name: "Ahmed", gpa: 15.8, attendance: 95, enrollmentDate: "2023-09-01", status: "active", level: "Lycée", grade: "1ère Bac" },
      { id: 2, name: "Fatima", gpa: 16.9, attendance: 92, enrollmentDate: "2022-09-01", status: "active", level: "Lycée", grade: "2ème Bac" }
    ];

    const mockCourses = [
      { id: 1, title: "Math", studentsEnrolled: 45, maxStudents: 50, status: "active", startDate: "2024-01-15", endDate: "2024-07-15", rating: 4.8 }
    ];

    const mockPayments = [
      { id: 1, amount: 299, status: "paid", dueDate: "2024-01-15", paidDate: "2024-01-10" }
    ];

    const mockAttendance = [
      { studentId: 1, date: "2024-01-20", status: "present" as const, classId: "math-1" }
    ];

    const freshAnalytics = AnalyticsEngine.aggregateMetrics(mockStudents, mockCourses, mockPayments, mockAttendance);
    setAnalyticsData(freshAnalytics);
    
    toast({
      title: t.dataRefreshed || "Data Refreshed",
      description: t.allReportsUpdated || "All reports and analytics data has been updated with the latest information.",
    });
    
    setRefreshing(false);
  };

  const handleDownloadReport = async (report: any) => {
    // Export an individual report as PDF summary
    const columns = [
      t.reportTitleLabel || 'Title',
      t.reportByLabel || 'By',
      t.reportDateLabel || 'Date',
      t.reportFormatLabel || 'Format',
      t.reportSizeLabel || 'Size',
      t.reportDownloadsLabel || 'Downloads',
      t.reportCategoryLabel || 'Category',
      t.reportStatusLabel || 'Status'
    ];
    const rows: string[][] = [
      [t.reportTitleLabel || 'Title', report.title],
      [t.reportByLabel || 'By', report.generatedBy],
      [t.reportDateLabel || 'Date', report.generatedDate],
      [t.reportFormatLabel || 'Format', report.format],
      [t.reportSizeLabel || 'Size', report.size],
      [t.reportDownloadsLabel || 'Downloads', String(report.downloads)],
      [t.reportCategoryLabel || 'Category', report.category],
      [t.reportStatusLabel || 'Status', report.status],
    ];
    rows.push([t.reportDescriptionLabel || 'Description', report.description]);
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: report.title,
      author: user?.name,
      tables: [{ columns, rows }],
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
    toast({ title: t.reportExported || "Report exported" });
  };

  const handleGenerateQuickReport = async (reportTitle: string) => {
    // Generate a quick summary as a professional PDF
    const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];
    const addSection = (title: string, columns: string[], rows: (string | number)[][]) => {
      tables.push({ title, columns, rows: rows.map(r => r.map(String)) });
    };
    // Common key metrics header
    const keyCols = [t.metric || 'Metric', t.value || 'Value'];
    switch (reportTitle) {
      case "Student Enrollment Report":
        addSection(t.keyMetrics || 'Key Metrics', keyCols, [
          [t.totalStudents || 'Total Students', 1234],
          [t.enrollments || 'Enrollments (month)', 45],
          [t.completions || 'Graduations (year)', 123],
          [t.activeCourses || 'Active Programs', 15],
        ]);
        addSection(t.enrollmentDetails || 'ENROLLMENT DETAILS', [t.course || 'Program', t.enrollment || 'Enrolled', t.capacity || 'Capacity', (t.utilization || 'Utilization')], [
          ['Mathematics', 234, 250, '93.6%'],
          ['Physics', 189, 200, '94.5%'],
          ['Chemistry', 178, 180, '98.9%'],
        ]);
        break;
      case "Course Performance Report":
        addSection(t.keyMetrics || 'Key Metrics', keyCols, [
          [t.activeCourses || 'Active Courses', 89],
          [t.completionRate || 'Average Completion Rate', '87%'],
          [t.topCourse || 'Top Performing Course', 'Advanced Mathematics'],
          [t.studentSatisfaction || 'Student Satisfaction', '4.8/5'],
        ]);
        addSection(t.courseDetails || 'COURSE DETAILS', [t.course || 'Course', t.completionRate || 'Completion Rate', t.studentSatisfaction || 'Satisfaction', t.students || 'Students'], [
          ['Advanced Mathematics', '95%', '4.9', 45],
          ['Physics Lab', '89%', '4.7', 38],
          ['Chemistry Basics', '92%', '4.8', 52],
        ]);
        break;
      case "Financial Overview":
        addSection(t.keyMetrics || 'Key Metrics', keyCols, [
          [t.totalRevenue || 'Total Revenue', `${analyticsData?.financial.totalRevenue || 145680} MAD`],
          [t.change || 'Monthly Growth', '+15%'],
          [t.collectionRate || 'Payment Collection Rate', `${analyticsData?.financial.collectionRate?.toFixed(1) || 92}%`],
          [t.outstandingAmount || 'Outstanding Payments', `${analyticsData?.financial.outstandingAmount || 12340} MAD`],
        ]);
        addSection(t.monthlyTrends || 'MONTHLY BREAKDOWN', [t.month || 'Month', t.revenue || 'Revenue', t.collections || 'Collections', t.outstandingAmount || 'Outstanding'], [
          ['October', '42500 MAD', '39100 MAD', '3400 MAD'],
          ['November', '45678 MAD', '42000 MAD', '3678 MAD'],
          ['December', '47200 MAD', '43500 MAD', '3700 MAD'],
        ]);
        break;
      case "Attendance Summary":
        addSection(t.keyMetrics || 'Key Metrics', keyCols, [
          [t.attendanceRate || 'Average Attendance Rate', `${analyticsData?.attendance.overallRate?.toFixed(1) || 92.5}%`],
          [t.totalClassesThisMonth || 'Total Classes This Month', 89],
          [t.perfectAttendance || 'Perfect Attendance Students', 45],
          [t.lateArrivals || 'Late Arrivals', 234],
        ]);
        addSection(t.dailyBreakdown || 'DAILY BREAKDOWN', [t.date || 'Date', t.present || 'Present', t.absent || 'Absent', t.total || 'Total', t.attendanceRate || 'Rate'], [
          ['2024-01-20', 216, 18, 234, '92.3%'],
          ['2024-01-21', 221, 13, 234, '94.4%'],
          ['2024-01-22', 208, 26, 234, '88.9%'],
        ]);
        break;
    }
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: reportTitle,
      author: user?.name,
      tables,
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
  };

  const exportCSV = (rows: (string|number)[][], filename: string) => {
    const sep = (language === 'fr' || language === 'ar') ? ';' : ',';
    const escapeCell = (val: any) => {
      const s = String(val ?? '');
      const needsQuote = s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(sep) || /^\s|\s$/.test(s);
      const esc = s.replace(/"/g, '""');
      return needsQuote ? `"${esc}"` : esc;
    };
    const content = rows.map(r => r.map(escapeCell).join(sep)).join('\r\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); window.URL.revokeObjectURL(url);
  };

  const statusText = (s:string) => s === 'ready' ? (t.readyStatus || 'Ready') : s === 'generating' ? (t.generatingStatus || 'Generating') : s === 'failed' ? (t.failedStatus || 'Failed') : s;

  const resolveDateRange = (key: string) => {
    const now = new Date();
    let from: Date | undefined; let to: Date | undefined; let label: string | undefined;
    switch (key) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        from = start; to = now; label = t.todayLabel || 'Today';
        break;
      }
      case 'this_week': {
        const day = now.getDay(); // 0 Sun..6 Sat
        const diffToMonday = (day + 6) % 7; // Monday as start
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday); monday.setHours(0,0,0,0);
        from = monday; to = now; label = t.thisWeekLabel || 'This Week';
        break;
      }
      case 'last_month': {
        const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstPrev = new Date(firstThis.getFullYear(), firstThis.getMonth() - 1, 1);
        const lastPrev = new Date(firstThis.getFullYear(), firstThis.getMonth(), 0);
        from = firstPrev; to = lastPrev; label = t.lastMonthLabel || 'Last Month';
        break;
      }
      case 'this_month':
      default: {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        from = first; to = now; label = t.thisMonthLabel || 'This Month';
        break;
      }
    }
    return { from, to, label };
  };

  const buildBranding = () => ({
    logoDataUrl: institutionSettings.logoDataUrl,
    address: institutionSettings.address,
    phone: institutionSettings.phone,
    email: institutionSettings.email,
    location: (institutionSettings as any).location,
    timeZone: institutionSettings.timeZone,
  });

  const commonReportOpts = () => {
    const { from, to, label } = resolveDateRange(dateRange);
    return {
      lang: langPdf,
      centerName: institutionSettings.name,
      author: user?.name,
      branding: buildBranding(),
      includeCharts: optIncludeCharts,
      includeDetails: optIncludeDetails,
      enableAdvanced: optEnableAdvanced,
      dateRange: { from, to, label },
      notes: [
        language === 'fr' ? 'Montants en MAD (DH).' : language === 'ar' ? 'المبالغ بالدرهم المغربي (MAD).' : 'Amounts in MAD (DH).'
      ],
    };
  };

  const handleGenerateStudentPerformance = async () => {
    const students = [
      { id: 1, name: 'Ahmed', gpa: 15.8, attendance: 95, enrollmentDate: '2023-09-01', status: 'active', level: 'Lycée', grade: '1ère Bac' },
      { id: 2, name: 'Fatima', gpa: 16.9, attendance: 92, enrollmentDate: '2022-09-01', status: 'active', level: 'Lycée', grade: '2ème Bac' },
      { id: 3, name: 'Youssef', gpa: 13.6, attendance: 78, enrollmentDate: '2021-09-01', status: 'inactive', level: 'Lycée', grade: 'TC' },
      { id: 4, name: 'Aicha', gpa: 17.0, attendance: 98, enrollmentDate: '2020-09-01', status: 'active', level: 'Collège', grade: '3ème' },
    ];
    await generateStudentPerformanceReportPDF({
      students,
      ...commonReportOpts(),
      charts: optIncludeCharts ? [
        { el: perfStudentTrendRef.current, title: t.studentTrends || 'Student Trends', heightPx: 260 },
        { el: perfAttendanceCorrRef.current, title: t.attendanceCorrelation || 'Attendance Correlation', heightPx: 260 },
        { el: perfClassComparisonRef.current, title: t.classComparison || 'Class Comparison', heightPx: 260 },
      ] : [],
    });
  };

  const handleGenerateFinancial = async () => {
    const payments = [
      { id: 1, amount: 299, status: 'paid', dueDate: '2024-01-15', paidDate: '2024-01-10' },
      { id: 2, amount: 249, status: 'pending', dueDate: '2024-01-20', paidDate: null },
      { id: 3, amount: 279, status: 'overdue', dueDate: '2024-01-18', paidDate: null },
      { id: 4, amount: 199, status: 'paid', dueDate: '2024-01-25', paidDate: '2024-01-24' },
    ];
    await generateFinancialReportPDF({ payments, ...commonReportOpts(), charts: [] });
  };

  const handleGenerateAttendance = async () => {
    const attendance = [
      { studentId: 1, date: '2024-01-20', status: 'present' as const, classId: 'math-1' },
      { studentId: 2, date: '2024-01-20', status: 'absent' as const, classId: 'physics-1' },
      { studentId: 1, date: '2024-01-21', status: 'late' as const, classId: 'math-1' },
      { studentId: 2, date: '2024-01-21', status: 'present' as const, classId: 'physics-1' },
    ];
    await generateAttendanceAnalysisReportPDF({
      attendance,
      ...commonReportOpts(),
      charts: optIncludeCharts ? [
        { el: analyticsAttendanceTrendRef.current, title: t.attendanceTrend || 'Attendance Trend', heightPx: 300 },
      ] : [],
    });
  };

  const handleGenerateTeacherPerformance = async () => {
    const teachers: TeacherData[] = [
      { id: 1, name: 'M. Khalil Amrani', evaluationScore: 88, observationRating: 4.6, attendanceRate: 96, pdHours: 12, avgStudentGrade: 15.1 },
      { id: 2, name: 'Mme. Laila Benali', evaluationScore: 91, observationRating: 4.8, attendanceRate: 98, pdHours: 18, avgStudentGrade: 16.4 },
      { id: 3, name: 'Dr. Moulay Redouane', evaluationScore: 85, observationRating: 4.4, attendanceRate: 94, pdHours: 10, avgStudentGrade: 14.7 },
    ];
    await generateTeacherPerformanceReportPDF({ teachers, ...commonReportOpts(), charts: [] });
  };

  const handleGenerateCourseAnalytics = async () => {
    const courses = [
      { id: 1, title: 'Math', studentsEnrolled: 45, maxStudents: 50, status: 'active', startDate: '2024-01-15', endDate: '2024-07-15', rating: 4.8 },
      { id: 2, title: 'Physics', studentsEnrolled: 32, maxStudents: 40, status: 'active', startDate: '2024-02-01', endDate: '2024-06-01', rating: 4.6 },
    ];
    await generateCourseAnalyticsReportPDF({ courses, ...commonReportOpts(), charts: [] });
  };

  const handleGenerateEnrollment = async () => {
    const students = [
      { id: 1, name: 'Ahmed', gpa: 15.8, attendance: 95, enrollmentDate: '2023-09-01', status: 'active', level: 'Lycée', grade: '1ère Bac' },
      { id: 2, name: 'Fatima', gpa: 16.9, attendance: 92, enrollmentDate: '2022-09-01', status: 'active', level: 'Lycée', grade: '2ème Bac' },
      { id: 3, name: 'Youssef', gpa: 13.6, attendance: 78, enrollmentDate: '2021-09-01', status: 'inactive', level: 'Lycée', grade: 'TC' },
      { id: 4, name: 'Aicha', gpa: 17.0, attendance: 98, enrollmentDate: '2020-09-01', status: 'active', level: 'Collège', grade: '3ème' },
    ];
    await generateEnrollmentReportPDF({ students, ...commonReportOpts(), charts: [] });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.reportsAnalytics}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <div className="flex gap-3">
          <CSVBulkUploadModal onUploadComplete={(data, type) => {
            toast({
              title: t.uploadSuccessful || "Upload Successful",
              description: `${data.length} ${type} records processed. ${t.connectSupabase}`,
            });
          }} />
          <Button variant="outline" onClick={handleRefreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t.loading : t.refreshData}
          </Button>
          <Button className="bg-purple hover:bg-purple/90" onClick={() => setGenerateReportOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.generateReport}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalReports || 'Total Reports'}</CardTitle>
            <FileText className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">{reportStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">{t.allGeneratedReports}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.generatedToday || 'Generated Today'}</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{reportStats.generatedToday}</div>
            <p className="text-xs text-muted-foreground">{t.reportsToday}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pending}</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">{reportStats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">{t.beingGenerated}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.downloads || 'Downloads'}</CardTitle>
            <Download className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">{reportStats.downloadCount}</div>
            <p className="text-xs text-muted-foreground">{t.totalDownloads}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">{t.reportsTab || t.reports}</TabsTrigger>
          <TabsTrigger value="analytics">{t.analyticsTab || 'Analytics'}</TabsTrigger>
          <TabsTrigger value="performance">{t.performanceTab || 'Performance'}</TabsTrigger>
          <TabsTrigger value="quick">{t.quickReportsTab || 'Quick Reports'}</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
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

                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t.reportTypeLabel || 'Report Type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allTypes || 'All Types'}</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t.dateRangeLabel || 'Date Range'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t.todayLabel || 'Today'}</SelectItem>
                    <SelectItem value="this_week">{t.thisWeekLabel || 'This Week'}</SelectItem>
                    <SelectItem value="this_month">{t.thisMonthLabel || 'This Month'}</SelectItem>
                    <SelectItem value="last_month">{t.lastMonthLabel || 'Last Month'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {t.filters}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{(t.recentReports || 'Recent Reports')} ({filteredReports.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportReportsPdf}>
                <Download className="h-4 w-4 mr-2" />{t.exportPdf || 'Export PDF'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{t.reportByLabel || 'By'} {report.generatedBy}</span>
                          <span>{t.reportDateLabel || 'Date'}: {report.generatedDate}</span>
                          <span>{t.reportFormatLabel || 'Format'}: {report.format} • {t.reportSizeLabel || 'Size'}: {report.size}</span>
                          <span>{t.reportDownloadsLabel || 'Downloads'}: {report.downloads}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={`border ${getStatusColor(report.status)}`}>
                          {statusText(report.status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.reportCategoryLabel || 'Category'}: {report.category}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t.download}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Filters for Performance */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-5 items-center">
                <Select value={perfGroup} onValueChange={setPerfGroup}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.groups} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {groupOptions.map((g:any)=> (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={perfSubject} onValueChange={setPerfSubject}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.subject || 'Subject'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {subjectOptionsPerf.map((s)=> (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={perfStudent || ''} onValueChange={setPerfStudent}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.students} /></SelectTrigger>
                  <SelectContent>
                    {studentsInGrid.map((s)=> (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={perfDateRange} onValueChange={setPerfDateRange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.dateRange || 'Date Range'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">{t.thisMonthLabel || 'This Month'}</SelectItem>
                    <SelectItem value="last_month">{t.lastMonth || 'Last Month'}</SelectItem>
                    <SelectItem value="this_quarter">{t.thisQuarter || 'This Quarter'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={perfTeacher} onValueChange={setPerfTeacher}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t.teacher || 'Teacher'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="t1">T1</SelectItem>
                    <SelectItem value="t2">T2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleExportPerformancePdf}>
              <Download className="h-4 w-4 mr-2" />{t.exportPdf || 'Export PDF'}
            </Button>
          </div>
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Student Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.studentTrends || 'Student Trends'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64" ref={perfStudentTrendRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={studentTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name={t.grades || 'Grades'} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Correlation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.attendanceCorrelation || 'Attendance Correlation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={attendanceCorrelationData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 20]} />
                      <Tooltip />
                      <Bar dataKey="avg" fill="#6366f1" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Class Comparison */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.classComparison || 'Class Comparison'}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => {
                  const rows: (string|number)[][] = [[t.group || 'Group', t.average || 'Average']];
                  classComparisonData.forEach(r => rows.push([r.group, r.avg]));
                  exportCSV(rows, 'class-comparison.csv');
                }}>{t.export || 'Export'}</Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={classComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="group" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis domain={[0, 20]} />
                      <Tooltip />
                      <Bar dataKey="avg" fill="#14b8a6" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {analyticsDisplayData.map((item, index) => (
              <Card key={index} className="hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green" />
                      <span className="text-sm text-green">{item.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleExportAnalyticsPdf}>
              <Download className="h-4 w-4 mr-2" />{t.exportPdf || 'Export PDF'}
            </Button>
          </div>

          {/* Charts: simplified and focused */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Attendance Overview: Present vs Absent (stacked bar) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.attendanceTrend || 'Attendance Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80" ref={analyticsAttendanceTrendRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const stacked = (attendanceTrendData || []).map((m: any) => ({ month: m.month, present: Number(m.rate?.toFixed ? m.rate.toFixed(2) : m.rate), absent: Math.max(0, 100 - (m.rate || 0)) }));
                      return (
                        <RechartsBarChart data={stacked} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="present" stackId="a" fill="#22c55e" name={t.present} />
                          <Bar dataKey="absent" stackId="a" fill="#ef4444" name={t.absent} />
                        </RechartsBarChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.performanceDistribution || 'Performance Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64" ref={analyticsPerfDistRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={performanceDistributionBarData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.quickReportGeneration}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickReports.map((report, index) => (
                  <Card key={index} className="hover-scale cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg w-fit ${report.bgColor}`}>
                          <report.icon className={`h-6 w-6 ${report.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <Button size="sm" className="w-full" onClick={() => handleGenerateQuickReport(report.title)}>
                          {t.generateReport}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comprehensive Reports — builders */}
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.generateReport || 'Generate Report'}
          </CardTitle>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><Switch checked={optIncludeCharts} onCheckedChange={setOptIncludeCharts} />{t.includeCharts || 'Include charts'}</label>
            <label className="flex items-center gap-2"><Switch checked={optIncludeDetails} onCheckedChange={setOptIncludeDetails} />{t.includeDetails || 'Include details'}</label>
            <label className="flex items-center gap-2"><Switch checked={optEnableAdvanced} onCheckedChange={setOptEnableAdvanced} />{t.advancedAnalysis || 'Advanced analysis'}</label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" onClick={handleGenerateStudentPerformance} className="justify-start"><BarChart3 className="h-4 w-4 mr-2" />{t.performanceReport || 'Student Performance Report'}</Button>
            <Button variant="outline" onClick={handleGenerateFinancial} className="justify-start"><DollarSign className="h-4 w-4 mr-2" />{t.financialOverview || 'Financial Report'}</Button>
            <Button variant="outline" onClick={handleGenerateAttendance} className="justify-start"><Calendar className="h-4 w-4 mr-2" />{t.attendanceSummary || 'Attendance Analysis Report'}</Button>
            <Button variant="outline" onClick={handleGenerateTeacherPerformance} className="justify-start"><Users className="h-4 w-4 mr-2" />{t.teacherPerformanceReport || 'Teacher Performance Report'}</Button>
            <Button variant="outline" onClick={handleGenerateCourseAnalytics} className="justify-start"><BookOpen className="h-4 w-4 mr-2" />{t.coursePerformanceReport || 'Course Analytics Report'}</Button>
            <Button variant="outline" onClick={handleGenerateEnrollment} className="justify-start"><Users className="h-4 w-4 mr-2" />{t.studentEnrollmentReport || 'Enrollment Report'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <GenerateReportModal 
        open={generateReportOpen}
        onOpenChange={setGenerateReportOpen}
      />
    </div>
  );
};

export default ReportList;