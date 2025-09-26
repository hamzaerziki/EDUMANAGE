import { AnalyticsEngine, type StudentData, type PaymentData, type AttendanceRecord, type CourseData } from '@/lib/analytics';
import { exportReportPdf, type PdfLang, type BrandingInfo } from '@/lib/pdfUtils';

// Common types
export type DateRange = { from?: Date; to?: Date; label?: string };
export type ChartRef = { el: Element | null; title?: string; heightPx?: number; summary?: string };
export type ReportCommonOptions = {
  lang?: PdfLang;
  centerName: string;
  author?: string;
  branding?: BrandingInfo;
  dateRange?: DateRange;
  includeCharts?: boolean;
  includeDetails?: boolean;
  enableAdvanced?: boolean;
  notes?: string[];
  charts?: ChartRef[]; // optional DOM chart refs to embed
};

// i18n helpers (minimal)
function t(lang: PdfLang | undefined, dict: { fr: string; en: string; ar: string }) {
  const l = lang || 'fr';
  return dict[l];
}

function fmtDate(d: string | Date, lang: PdfLang | undefined) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(dt);
}

function inRange(dateStr: string, range?: DateRange): boolean {
  if (!range) return true;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return true;
  if (range.from && d < range.from.getTime()) return false;
  if (range.to && d > range.to.getTime()) return false;
  return true;
}

function percent(n: number) { return `${Math.round(n * 100) / 100}%`; }
function moneyMAD(n: number) { return `${Math.round(n).toLocaleString()} MAD`; }

// Simple Pearson correlation for arrays with same length
function pearson(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const x = xs.slice(0, n), y = ys.slice(0, n);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx; const dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2) || 1e-9;
  return Math.max(-1, Math.min(1, num / den));
}

// Build filters list for PDF header
function buildFilters(lang: PdfLang | undefined, dateRange?: DateRange) {
  const filters: Array<{ label: string; value: string }> = [];
  if (dateRange && (dateRange.from || dateRange.to)) {
    const lbl = t(lang, { fr: 'Plage de dates', en: 'Date Range', ar: 'نطاق التاريخ' });
    const from = dateRange.from ? fmtDate(dateRange.from, lang) : '—';
    const to = dateRange.to ? fmtDate(dateRange.to, lang) : '—';
    filters.push({ label: lbl, value: `${from} → ${to}${dateRange.label ? ` (${dateRange.label})` : ''}` });
  }
  return filters;
}

// 1) Student Performance Report
export async function generateStudentPerformanceReportPDF(opts: {
  students: StudentData[];
  attendanceRecords?: AttendanceRecord[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, {
    fr: 'Rapport de performance des étudiants',
    en: 'Student Performance Report',
    ar: 'تقرير أداء الطلاب',
  });

  const students = (opts.students || []).filter(s => inRange(s.enrollmentDate, opts.dateRange));
  const perf = AnalyticsEngine.calculateStudentPerformance(students);

  // Advanced: correlation attendance vs performance
  let corr = 0;
  if (opts.enableAdvanced) {
    const pairs = students.filter(s => s.gpa != null && s.attendance != null);
    corr = pearson(pairs.map(p => p.attendance || 0), pairs.map(p => p.gpa || 0));
  }

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];

  // Summary metrics
  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Métrique', en: 'Metric', ar: 'مؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Moyenne générale (GPA)', en: 'Average GPA', ar: 'المعدل العام' }), (perf.averageGPA || 0).toFixed(2)],
      [t(lang, { fr: 'Étudiants excellents', en: 'Top performers', ar: 'المتفوقون' }), String(perf.topPerformers.length)],
      [t(lang, { fr: 'Étudiants à risque', en: 'At-risk students', ar: 'الطلاب المعرضون للخطر' }), String(perf.atRiskStudents.length)],
      ...(opts.enableAdvanced ? [[t(lang, { fr: 'Corrélation présence ↔ performance', en: 'Correlation attendance ↔ performance', ar: 'الارتباط بين الحضور والأداء' }), (corr).toFixed(2)]] : []),
    ],
  });

  // Distribution table
  const distRows = Object.entries(perf.performanceDistribution).map(([cat, count]) => [cat, String(count)]);
  tables.push({
    title: t(lang, { fr: 'Répartition des performances', en: 'Performance distribution', ar: 'توزيع الأداء' }),
    columns: [t(lang, { fr: 'Catégorie', en: 'Category', ar: 'الفئة' }), t(lang, { fr: 'Nombre', en: 'Count', ar: 'العدد' })],
    rows: distRows,
  });

  if (opts.includeDetails) {
    // Top performers (limited)
    tables.push({
      title: t(lang, { fr: 'Meilleurs étudiants', en: 'Top performers', ar: 'أفضل الطلاب' }),
      columns: [t(lang, { fr: 'Nom', en: 'Name', ar: 'الاسم' }), 'GPA', t(lang, { fr: 'Présence', en: 'Attendance', ar: 'الحضور' })],
      rows: perf.topPerformers.slice(0, 25).map(s => [s.name, String(s.gpa ?? '—'), s.attendance != null ? `${s.attendance}%` : '—']),
    });

    // At-risk students (limited)
    tables.push({
      title: t(lang, { fr: 'Étudiants à risque', en: 'At-risk students', ar: 'الطلاب المعرضون للخطر' }),
      columns: [t(lang, { fr: 'Nom', en: 'Name', ar: 'الاسم' }), 'GPA', t(lang, { fr: 'Présence', en: 'Attendance', ar: 'الحضور' })],
      rows: perf.atRiskStudents.slice(0, 25).map(s => [s.name, String(s.gpa ?? '—'), s.attendance != null ? `${s.attendance}%` : '—']),
    });
  }

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}

// 2) Financial Report
export async function generateFinancialReportPDF(opts: {
  payments: PaymentData[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, { fr: 'Rapport financier', en: 'Financial Report', ar: 'التقرير المالي' });
  const payments = (opts.payments || []).filter(p => inRange(p.paidDate || p.dueDate, opts.dateRange));
  const fin = AnalyticsEngine.calculateFinancialAnalytics(payments);

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];

  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Indicateur', en: 'Indicator', ar: 'المؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Revenu total', en: 'Total revenue', ar: 'إجمالي الإيرادات' }), moneyMAD(fin.totalRevenue)],
      [t(lang, { fr: 'Revenu du mois', en: 'Monthly revenue', ar: 'إيراد هذا الشهر' }), moneyMAD(fin.monthlyRevenue)],
      [t(lang, { fr: 'Taux de recouvrement', en: 'Collection rate', ar: 'معدل التحصيل' }), `${fin.collectionRate}%`],
      [t(lang, { fr: 'Montant impayé', en: 'Outstanding amount', ar: 'المبلغ غير المدفوع' }), moneyMAD(fin.outstandingAmount)],
      [t(lang, { fr: 'Projection annuelle', en: 'Projected annual revenue', ar: 'الإيراد السنوي المتوقع' }), moneyMAD(fin.projectedAnnualRevenue)],
    ],
  });

  // Monthly trends
  tables.push({
    title: t(lang, { fr: 'Tendances mensuelles', en: 'Monthly trends', ar: 'الاتجاهات الشهرية' }),
    columns: [t(lang, { fr: 'Mois', en: 'Month', ar: 'الشهر' }), t(lang, { fr: 'Revenu', en: 'Revenue', ar: 'الإيراد' }), t(lang, { fr: 'Encaissements', en: 'Collections', ar: 'التحصيلات' })],
    rows: fin.paymentTrends.map(tr => [tr.month, moneyMAD(tr.revenue), String(tr.collections)]),
  });

  if (opts.includeDetails) {
    // Raw payments table (limited)
    tables.push({
      title: t(lang, { fr: 'Paiements', en: 'Payments', ar: 'المدفوعات' }),
      columns: ['ID', t(lang, { fr: 'Montant', en: 'Amount', ar: 'المبلغ' }), t(lang, { fr: 'Échéance', en: 'Due date', ar: 'تاريخ الاستحقاق' }), t(lang, { fr: 'Payé le', en: 'Paid date', ar: 'تاريخ الدفع' }), t(lang, { fr: 'Statut', en: 'Status', ar: 'الحالة' })],
      rows: payments.slice(0, 100).map(p => [String(p.id), moneyMAD(p.amount), fmtDate(p.dueDate, lang), p.paidDate ? fmtDate(p.paidDate, lang) : '—', p.status]),
    });
  }

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}

// 3) Attendance Analysis Report
export async function generateAttendanceAnalysisReportPDF(opts: {
  attendance: AttendanceRecord[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, { fr: "Rapport d'assiduité", en: 'Attendance Analysis Report', ar: 'تقرير الحضور' });
  const records = (opts.attendance || []).filter(r => inRange(r.date, opts.dateRange));
  const att = AnalyticsEngine.calculateAttendanceAnalytics(records);

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];

  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Indicateur', en: 'Indicator', ar: 'المؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Taux global de présence', en: 'Overall attendance rate', ar: 'معدل الحضور العام' }), `${att.overallRate}%`],
      [t(lang, { fr: 'Nombre d’enregistrements', en: 'Total records', ar: 'إجمالي السجلات' }), String(records.length)],
    ],
  });

  tables.push({
    title: t(lang, { fr: 'Tendances mensuelles', en: 'Monthly trends', ar: 'الاتجاهات الشهرية' }),
    columns: [t(lang, { fr: 'Mois', en: 'Month', ar: 'الشهر' }), t(lang, { fr: 'Taux', en: 'Rate', ar: 'النسبة' }), t(lang, { fr: 'Total', en: 'Total', ar: 'الإجمالي' })],
    rows: att.monthlyTrends.map(m => [m.month, `${m.rate}%`, String(m.total)]),
  });

  const classRows = Object.entries(att.classWiseRates).map(([cls, rate]) => [cls, `${rate}%`]);
  tables.push({
    title: t(lang, { fr: 'Taux par classe', en: 'Class-wise rates', ar: 'معدلات حسب القسم' }),
    columns: [t(lang, { fr: 'Classe', en: 'Class', ar: 'القسم' }), t(lang, { fr: 'Taux', en: 'Rate', ar: 'النسبة' })],
    rows: classRows,
  });

  if (opts.includeDetails) {
    // Top/bottom students by attendance
    const entries = Object.entries(att.studentAttendanceMap).map(([id, rate]) => ({ id: Number(id), rate }));
    const top = [...entries].sort((a, b) => b.rate - a.rate).slice(0, 20);
    const bottom = [...entries].sort((a, b) => a.rate - b.rate).slice(0, 20);
    tables.push({
      title: t(lang, { fr: 'أفضل الحضور', en: 'Top attendance', ar: 'أفضل حضور' }),
      columns: ['ID', t(lang, { fr: 'Taux', en: 'Rate', ar: 'النسبة' })],
      rows: top.map(e => [String(e.id), `${e.rate}%`]),
    });
    tables.push({
      title: t(lang, { fr: 'أضعف الحضور', en: 'Lowest attendance', ar: 'أضعف حضور' }),
      columns: ['ID', t(lang, { fr: 'Taux', en: 'Rate', ar: 'النسبة' })],
      rows: bottom.map(e => [String(e.id), `${e.rate}%`]),
    });
  }

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}

// 4) Teacher Performance Report
export interface TeacherData {
  id: number | string;
  name: string;
  evaluationScore?: number | null; // 0..100
  avgStudentGrade?: number | null; // 0..20 or percentage
  observationRating?: number | null; // 0..5
  attendanceRate?: number | null; // %
  pdHours?: number | null; // professional development hours
}

export async function generateTeacherPerformanceReportPDF(opts: {
  teachers: TeacherData[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, { fr: 'Rapport de performance des enseignants', en: 'Teacher Performance Report', ar: 'تقرير أداء المعلمين' });
  const teachers = opts.teachers || [];

  // Aggregates
  const validEval = teachers.filter(t => t.evaluationScore != null);
  const avgEval = validEval.length ? Math.round(validEval.reduce((s, t) => s + (t.evaluationScore || 0), 0) / validEval.length) : 0;
  const validObs = teachers.filter(t => t.observationRating != null);
  const avgObs = validObs.length ? Math.round((validObs.reduce((s, t) => s + (t.observationRating || 0), 0) / validObs.length) * 100) / 100 : 0;
  const validPD = teachers.filter(t => t.pdHours != null);
  const avgPD = validPD.length ? Math.round(validPD.reduce((s, t) => s + (t.pdHours || 0), 0) / validPD.length) : 0;

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];
  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Indicateur', en: 'Indicator', ar: 'المؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Score moyen d’évaluation', en: 'Avg evaluation score', ar: 'متوسط التقييم' }), `${avgEval}`],
      [t(lang, { fr: 'Note moyenne d’observation', en: 'Avg observation rating', ar: 'متوسط الملاحظة' }), `${avgObs}`],
      [t(lang, { fr: 'Heures de formation', en: 'Avg PD hours', ar: 'متوسط ساعات التطوير المهني' }), `${avgPD}`],
    ],
  });

  if (opts.includeDetails) {
    tables.push({
      title: t(lang, { fr: 'Détails des enseignants', en: 'Teacher details', ar: 'تفاصيل المعلمين' }),
      columns: [t(lang, { fr: 'Nom', en: 'Name', ar: 'الاسم' }), t(lang, { fr: 'Évaluation', en: 'Evaluation', ar: 'التقييم' }), t(lang, { fr: 'Observation', en: 'Observation', ar: 'الملاحظة' }), t(lang, { fr: 'Présence', en: 'Attendance', ar: 'الحضور' }), t(lang, { fr: 'Heures de formation', en: 'PD Hours', ar: 'ساعات التطوير' })],
      rows: teachers.map(tch => [tch.name, tch.evaluationScore != null ? `${tch.evaluationScore}` : '—', tch.observationRating != null ? `${tch.observationRating}` : '—', tch.attendanceRate != null ? `${tch.attendanceRate}%` : '—', tch.pdHours != null ? `${tch.pdHours}` : '—']),
    });
  }

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}

// 5) Course Analytics Report
export async function generateCourseAnalyticsReportPDF(opts: {
  courses: CourseData[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, { fr: 'Rapport analytique des cours', en: 'Course Analytics Report', ar: 'تقرير تحليلات الدورات' });
  const courses = (opts.courses || []).filter(c => inRange(c.startDate, opts.dateRange) || inRange(c.endDate, opts.dateRange));
  const ca = AnalyticsEngine.calculateCourseAnalytics(courses);

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];

  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Indicateur', en: 'Indicator', ar: 'المؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Taux d’inscription', en: 'Enrollment rate', ar: 'معدل التسجيل' }), percent(ca.enrollmentRate)],
      [t(lang, { fr: 'Note moyenne', en: 'Average rating', ar: 'التقييم المتوسط' }), `${ca.averageRating}`],
      [t(lang, { fr: 'Utilisation de capacité', en: 'Capacity utilization', ar: 'استخدام السعة' }), percent(ca.capacityUtilization)],
    ],
  });

  tables.push({
    title: t(lang, { fr: 'Cours populaires', en: 'Popular courses', ar: 'الدورات الشائعة' }),
    columns: [t(lang, { fr: 'Titre', en: 'Title', ar: 'العنوان' }), t(lang, { fr: 'Inscrits', en: 'Enrolled', ar: 'المسجلون' }), t(lang, { fr: 'Capacité', en: 'Capacity', ar: 'السعة' }), t(lang, { fr: 'Note', en: 'Rating', ar: 'التقييم' })],
    rows: ca.popularCourses.map(c => [c.title, String(c.studentsEnrolled), String(c.maxStudents), String(c.rating)]),
  });

  tables.push({
    title: t(lang, { fr: 'Cours sous-performants', en: 'Underperforming courses', ar: 'الدورات منخفضة الأداء' }),
    columns: [t(lang, { fr: 'Titre', en: 'Title', ar: 'العنوان' }), t(lang, { fr: 'Inscrits', en: 'Enrolled', ar: 'المسجلون' }), t(lang, { fr: 'Capacité', en: 'Capacity', ar: 'السعة' }), t(lang, { fr: 'Note', en: 'Rating', ar: 'التقييم' })],
    rows: ca.underperformingCourses.map(c => [c.title, String(c.studentsEnrolled), String(c.maxStudents), String(c.rating)]),
  });

  tables.push({
    title: t(lang, { fr: 'Tendances des inscriptions', en: 'Enrollment trends', ar: 'اتجاهات التسجيل' }),
    columns: [t(lang, { fr: 'Mois', en: 'Month', ar: 'الشهر' }), t(lang, { fr: 'Inscriptions', en: 'Enrollments', ar: 'التسجيلات' }), t(lang, { fr: 'Achèvements', en: 'Completions', ar: 'الإنهاءات' })],
    rows: (ca.enrollmentTrends || []).map(e => [e.month, String(e.enrollments), String(e.completions)]),
  });

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}

// 6) Enrollment Report
export async function generateEnrollmentReportPDF(opts: {
  students: StudentData[];
} & ReportCommonOptions) {
  const lang = opts.lang || 'fr';
  const title = t(lang, { fr: 'Rapport des inscriptions', en: 'Enrollment Report', ar: 'تقرير التسجيل' });
  const students = (opts.students || []).filter(s => inRange(s.enrollmentDate, opts.dateRange));

  const total = students.length;
  const active = students.filter(s => (s.status || '').toLowerCase() === 'active').length;
  const withdrawn = students.filter(s => (s.status || '').toLowerCase() === 'inactive' || (s.status || '').toLowerCase() === 'left' || (s.status || '').toLowerCase() === 'withdrawn').length;
  const retention = total > 0 ? Math.round((active / total) * 10000) / 100 : 0;

  const byLevel: Record<string, number> = {};
  const byGrade: Record<string, number> = {};
  students.forEach(s => { byLevel[s.level] = (byLevel[s.level] || 0) + 1; byGrade[s.grade] = (byGrade[s.grade] || 0) + 1; });

  const tables: Array<{ title?: string; columns: string[]; rows: string[][] }> = [];
  tables.push({
    title: t(lang, { fr: 'Résumé', en: 'Summary', ar: 'الملخص' }),
    columns: [t(lang, { fr: 'Indicateur', en: 'Indicator', ar: 'المؤشر' }), t(lang, { fr: 'Valeur', en: 'Value', ar: 'القيمة' })],
    rows: [
      [t(lang, { fr: 'Total des inscrits', en: 'Total enrollment', ar: 'إجمالي المسجلين' }), String(total)],
      [t(lang, { fr: 'Actifs', en: 'Active', ar: 'نشط' }), String(active)],
      [t(lang, { fr: 'Retraits', en: 'Withdrawn', ar: 'منسحب' }), String(withdrawn)],
      [t(lang, { fr: 'Taux de rétention', en: 'Retention rate', ar: 'معدل الاحتفاظ' }), `${retention}%`],
    ],
  });

  tables.push({
    title: t(lang, { fr: 'Répartition par niveau', en: 'By level', ar: 'حسب المستوى' }),
    columns: [t(lang, { fr: 'Niveau', en: 'Level', ar: 'المستوى' }), t(lang, { fr: 'Nombre', en: 'Count', ar: 'العدد' })],
    rows: Object.entries(byLevel).map(([lvl, n]) => [lvl, String(n)]),
  });

  tables.push({
    title: t(lang, { fr: 'Répartition par classe', en: 'By grade', ar: 'حسب الصف' }),
    columns: [t(lang, { fr: 'Classe', en: 'Grade', ar: 'الصف' }), t(lang, { fr: 'Nombre', en: 'Count', ar: 'العدد' })],
    rows: Object.entries(byGrade).map(([gr, n]) => [gr, String(n)]),
  });

  await exportReportPdf({
    lang,
    centerName: opts.centerName,
    title,
    author: opts.author,
    branding: opts.branding,
    subtitle: opts.dateRange?.label || undefined,
    filters: buildFilters(lang, opts.dateRange),
    notes: opts.notes,
    tables,
    charts: opts.includeCharts ? (opts.charts || []) : [],
  });
}
