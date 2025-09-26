import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { FileText, Calendar, Download } from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { exportReportPdf } from "@/lib/pdfUtils";
import { useSettings } from "@/hooks/useSettings";

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateReportModal = ({ open, onOpenChange }: GenerateReportModalProps) => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { institutionSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportType: "",
    dateRange: "",
    customStartDate: "",
    customEndDate: "",
    format: "pdf",
    includeCharts: true,
    includeDetails: true,
    includeAnalytics: false
  });

  const reportTypes = [
    { value: "student_performance", label: t.studentPerformanceReport || "Student Performance Report" },
    { value: "financial_summary", label: t.financialSummaryReport || "Financial Summary Report" },
    { value: "attendance_analysis", label: t.attendanceAnalysisReport || "Attendance Analysis Report" },
    { value: "teacher_performance", label: t.teacherPerformanceReport || "Teacher Performance Report" },
    { value: "course_analytics", label: t.courseAnalyticsReport || "Course Analytics Report" },
    { value: "enrollment_report", label: t.enrollmentReport || "Enrollment Report" }
  ];

  const dateRanges = [
    { value: "today", label: t.today },
    { value: "this_week", label: t.thisWeek },
    { value: "this_month", label: t.thisMonth },
    { value: "last_month", label: t.lastMonth || "Last Month" },
    { value: "this_quarter", label: t.thisQuarter || "This Quarter" },
    { value: "this_year", label: t.thisYear },
    { value: "custom", label: t.customRange || "Custom Range" }
  ];

  const formats = [
    { value: "pdf", label: "PDF" }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = async () => {
    if (!formData.reportType || !formData.dateRange) {
      toast({
        title: t.missingInformation || "Missing Information",
        description: t.pleaseSelectReportTypeAndDateRange || "Please select report type and date range.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Load or mock data then compute analytics
      const loadArr = (k: string) => { try { const raw = localStorage.getItem(k); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch { return []; } };
      const students = loadArr('students').length ? loadArr('students') : [
        { id: 1, name: "Ahmed", gpa: 15.8, attendance: 95, enrollmentDate: "2023-09-01", status: "active", level: "Lycée", grade: "1ère Bac" },
        { id: 2, name: "Fatima", gpa: 16.9, attendance: 92, enrollmentDate: "2022-09-01", status: "active", level: "Lycée", grade: "2ème Bac" },
        { id: 3, name: "Youssef", gpa: 13.6, attendance: 78, enrollmentDate: "2021-09-01", status: "inactive", level: "Lycée", grade: "TC" },
        { id: 4, name: "Aicha", gpa: 17.0, attendance: 98, enrollmentDate: "2020-09-01", status: "active", level: "Collège", grade: "3ème" }
      ];
      const courses = loadArr('courses').length ? loadArr('courses') : [
        { id: 1, title: "Math", studentsEnrolled: 45, maxStudents: 50, status: "active", startDate: "2024-01-15", endDate: "2024-07-15", rating: 4.8 },
        { id: 2, title: "Physics", studentsEnrolled: 32, maxStudents: 40, status: "active", startDate: "2024-02-01", endDate: "2024-06-01", rating: 4.6 }
      ];
      const payments = loadArr('payments').length ? loadArr('payments') : [
        { id: 1, amount: 299, status: "paid", dueDate: "2024-01-15", paidDate: "2024-01-10" },
        { id: 2, amount: 249, status: "pending", dueDate: "2024-01-20", paidDate: null }
      ];
      const attendance = loadArr('attendance-records').length ? loadArr('attendance-records') : [
        { studentId: 1, date: "2024-01-20", status: "present", classId: "math-1" },
        { studentId: 2, date: "2024-01-20", status: "absent", classId: "physics-1" }
      ];

      const analytics = AnalyticsEngine.aggregateMetrics(students as any, courses as any, payments as any, attendance as any);

      const reportTitle = reportTypes.find(r => r.value === formData.reportType)?.label || 'Report';
      const dateRangeLabel = dateRanges.find(r => r.value === formData.dateRange)?.label || 'Unknown';
      const langPdf = (language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en') as 'fr' | 'en' | 'ar';

      if (formData.format === 'pdf') {
        const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];
        const pushKeyMetrics = (metrics: Array<[string, string | number]>) => {
          tables.push({ title: t.keyMetrics || 'Key Metrics', columns: [t.metric || 'Metric', t.value || 'Value'], rows: metrics.map(([k, v]) => [k, String(v)]) });
        };
        if (formData.reportType === 'student_performance') {
          pushKeyMetrics([[t.averageGPA || 'Average GPA', analytics.students.averageGPA], [t.totalStudents || 'Total Students', students.length]]);
          const top = analytics.students.topPerformers.slice(0, 10).map((s: any) => [s.name, String(s.gpa ?? '-')]);
          const risk = analytics.students.atRiskStudents.slice(0, 10).map((s: any) => [s.name, `${s.gpa ?? '-'} | ${s.attendance ?? '-'}%`]);
          tables.push({ title: t.topPerformers || 'Top Performers', columns: [t.name || 'Name', 'GPA'], rows: top });
          tables.push({ title: t.atRiskStudents || 'At-risk Students', columns: [t.name || 'Name', `${t.gpa || 'GPA'} | ${t.attendanceRate || 'Attendance'}`], rows: risk });
        }
        if (formData.reportType === 'financial_summary') {
          pushKeyMetrics([[t.totalRevenue || 'Total Revenue', `${analytics.financial.totalRevenue} MAD`], [t.monthlyRevenue || 'Monthly Revenue', `${analytics.financial.monthlyRevenue} MAD`], [t.collectionRate || 'Collection Rate', `${analytics.financial.collectionRate}%`], [t.outstandingAmount || 'Outstanding Amount', `${analytics.financial.outstandingAmount} MAD`], [t.projectedAnnualRevenue || 'Projected Annual Revenue', `${analytics.financial.projectedAnnualRevenue} MAD`]]);
          const trends = analytics.financial.paymentTrends.map((p: any) => [p.month, String(p.revenue), String(p.collections)]);
          tables.push({ title: t.monthlyTrends || 'Monthly Trends', columns: [t.month || 'Month', t.revenue || 'Revenue', t.collections || 'Collections'], rows: trends });
        }
        if (formData.reportType === 'attendance_analysis') {
          pushKeyMetrics([[t.attendanceRate || 'Attendance Rate', `${analytics.attendance.overallRate}%`]]);
          const trends = analytics.attendance.monthlyTrends.map((m: any) => [m.month, `${m.rate}%`, String(m.total)]);
          const classWise = Object.entries(analytics.attendance.classWiseRates).map(([cls, rate]: any) => [String(cls), `${rate}%`]);
          tables.push({ title: t.monthlyTrends || 'Monthly Trends', columns: [t.month || 'Month', t.attendanceRate || 'Attendance Rate', t.total || 'Total'], rows: trends });
          tables.push({ title: t.classWiseRates || 'Class-wise Rates', columns: [t.class || 'Class', t.rate || 'Rate'], rows: classWise });
        }
        if (formData.reportType === 'course_analytics') {
          pushKeyMetrics([[t.enrollmentRate || 'Enrollment Rate', `${analytics.courses.enrollmentRate}%`], [t.averageRating || 'Average Rating', String(analytics.courses.averageRating)], [t.capacityUtilization || 'Capacity Utilization', `${analytics.courses.capacityUtilization}%`]]);
          const popular = analytics.courses.popularCourses.map((c: any) => [c.title, `${c.studentsEnrolled}/${c.maxStudents}`, String(c.rating)]);
          const under = analytics.courses.underperformingCourses.map((c: any) => [c.title, `${c.studentsEnrolled}/${c.maxStudents}`, String(c.rating)]);
          tables.push({ title: t.popularCourses || 'Popular Courses', columns: [t.course || 'Course', t.enrollment || 'Enrollment', t.rating || 'Rating'], rows: popular });
          tables.push({ title: t.underperformingCourses || 'Underperforming Courses', columns: [t.course || 'Course', t.enrollment || 'Enrollment', t.rating || 'Rating'], rows: under });
        }
        if (formData.reportType === 'enrollment_report') {
          const trends = analytics.courses.enrollmentTrends.map((e: any) => [e.month, String(e.enrollments), String(e.completions)]);
          tables.push({ title: t.enrollmentTrends || 'Enrollment Trends', columns: [t.month || 'Month', t.enrollments || 'Enrollments', t.completions || 'Completions'], rows: trends });
        }
        if (formData.reportType === 'teacher_performance') {
          const teachers = loadArr('teachers-list');
          const bySubject: Record<string, number> = {};
          (teachers as any[]).forEach((tch:any)=>{ (tch.subjects || []).forEach((s:string)=>{ bySubject[s] = (bySubject[s]||0) + 1; }); });
          const subjectRows = Object.entries(bySubject).map(([s,c])=>[s, String(c)]);
          if (subjectRows.length) tables.push({ title: t.success || 'Subjects Coverage', columns: [t.subject || 'Subject', t.total || 'Total'], rows: subjectRows });
          const teacherRows = (teachers as any[]).map((tch:any)=>[ tch.name || '-', (Array.isArray(tch.subjects) ? tch.subjects.join(', ') : '') || '-', String(tch.studentsCount ?? 0), tch.status || 'active' ]);
          if (teacherRows.length) tables.push({ title: t.teacherPerformanceReport || 'Teacher Performance Report', columns: [t.name || 'Name', t.subject || 'Subject', t.groupStudentsCount || 'Students', t.status || 'Status'], rows: teacherRows });
          const ranking = [...teacherRows].sort((a,b)=> parseInt(b[2] as string) - parseInt(a[2] as string)).slice(0, 15);
          if (ranking.length) tables.push({ title: t.performanceOverview || 'Teacher Ranking', columns: [t.name || 'Name', t.subject || 'Subject', t.groupStudentsCount || 'Students', t.status || 'Status'], rows: ranking });
        }

        await exportReportPdf({
          lang: langPdf,
          centerName: institutionSettings.name,
          title: reportTitle,
          subtitle: `${t.dateRange || 'Date Range'}: ${dateRangeLabel}`,
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
      }

      toast({ title: t.reportGeneratedSuccessfully || "Report Generated Successfully", description: `${reportTypes.find(r => r.value === formData.reportType)?.label}` });
      onOpenChange(false);
    } catch (e: any) {
      console.error('Report generation failed', e);
      toast({ title: t.error || 'Error', description: (e?.message || 'Report generation failed. Please check console.'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.generateReport}
          </DialogTitle>
          <DialogDescription>
            {t.reportsAnalytics}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.reportConfiguration || 'Report Configuration'}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reportType">{t.reportType || 'Report Type'} *</Label>
              <Select value={formData.reportType} onValueChange={(value) => handleInputChange("reportType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.reportType || 'Report Type'} />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">{t.dateRange || 'Date Range'} *</Label>
              <Select value={formData.dateRange} onValueChange={(value) => handleInputChange("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.dateRange || 'Date Range'} />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customStartDate">{t.startDate}</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={formData.customStartDate}
                    onChange={(e) => handleInputChange("customStartDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDate">{t.endDate}</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={formData.customEndDate}
                    onChange={(e) => handleInputChange("customEndDate", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="format">{t.outputFormat || 'Output Format'}</Label>
              <Select value={formData.format} onValueChange={(value) => handleInputChange("format", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="PDF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.reportOptions || 'Report Options'}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={formData.includeCharts}
                  onCheckedChange={(checked) => handleInputChange("includeCharts", checked as boolean)}
                />
                <Label htmlFor="includeCharts" className="text-sm">{t.includeCharts || 'Include charts and graphs'}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={formData.includeDetails}
                  onCheckedChange={(checked) => handleInputChange("includeDetails", checked as boolean)}
                />
                <Label htmlFor="includeDetails" className="text-sm">{t.includeDetails || 'Include detailed data'}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnalytics"
                  checked={formData.includeAnalytics}
                  onCheckedChange={(checked) => handleInputChange("includeAnalytics", checked as boolean)}
                />
                <Label htmlFor="includeAnalytics" className="text-sm">{t.includeAnalytics || 'Include advanced analytics'}</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? (
              <>{t.loading}</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t.generateReport}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportModal;