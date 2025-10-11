export interface Translation {
  // Common Actions
  loading: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  view: string;
  add: string;
  search: string;
  filters: string;
  export: string;
  download: string;
  back: string;
  next: string;
  previous: string;
  close: string;
  submit: string;
  create: string;
  update: string;
  remove: string;
  continue: string;
  done: string;
  ok: string;
  yes: string;
  no: string;
  confirm: string;

  // Subscription Management
  subscriptions: string;
  subscriptionManagement: string;
  currentPlan: string;
  upgradePlan: string;
  billingHistory: string;
  usageMetrics: string;
  availablePlans: string;
  planFeatures: string;
  monthlyPrice: string;
  yearlyPrice: string;
  switchToPlan: string;
  currentUsage: string;
  nextBillingDate: string;
  cancelSubscription: string;
  resumeSubscription: string;
  planDetails: string;
  studentLimit: string;
  storageLimit: string;
  supportLevel: string;
  additionalFeatures: string;
  billingCycle: string;
  monthly: string;
  yearly: string;
  invoiceHistory: string;
  downloadInvoice: string;
  paymentMethod: string;
  updatePaymentMethod: string;
  downloadSchedule?: string;
  reasonLabel?: string;
  allLabel?: string;
  otherLabel?: string;
  
  // Navigation
  dashboard: string;
  students: string;
  groups: string;
  teachers: string;
  courses: string;
  subjects: string;
  attendance: string;
  payments: string;
  reports: string;
  settings: string;
  schedule: string;
  // New Navigation
  documents?: string;
  eventsCalendar?: string;
  
  // Dashboard
  totalStudents: string;
  totalTeachers: string;
  totalCourses: string;
  attendanceRate: string;
  recentActivity: string;
  quickActions: string;
  quickAdd?: string;
  editScheduleDashboardLabel?: string;
  overview: string;
  statistics: string;
  performanceTrends: string;
  // New Analytics
  performanceAnalytics?: string;
  studentTrends?: string;
  attendanceCorrelation?: string;
  classComparison?: string;
  performanceDistribution?: string;
  attendanceTrend?: string;
  monthlyRevenue: string;
  collectionRate: string;
  outstandingAmount: string;
  averageGPA: string;
  enrollmentRate: string;
  capacityUtilization: string;
  atRiskStudents: string;
  projectedAnnualRevenue: string;
  todaysClasses: string;
  studentsLeftAndOutstanding: string;
  studentsWhoLeft: string;
  // Report generator (types and sections)
  studentPerformanceReport?: string;
  financialSummaryReport?: string;
  attendanceAnalysisReport?: string;
  teacherPerformanceReport?: string;
  courseAnalyticsReport?: string;
  enrollmentReport?: string;
  keyMetrics?: string;
  topPerformers?: string;
  generatedOn?: string;
  monthlyTrends?: string;
  month?: string;
  revenue?: string;
  collections?: string;
  classWiseRates?: string;
  rate?: string;
  popularCourses?: string;
  underperformingCourses?: string;
  enrollmentTrends?: string;
  enrollments?: string;
  completions?: string;
  gpa?: string;
  
  // Students
  studentManagement: string;
  addStudent: string;
  editStudent: string;
  studentProfile: string;
  enrolledStudents: string;
  studentDetails: string;
  personalInformation: string;
  academicInformation: string;
  parentInformation?: string;
  courseEnrollment: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  enrolledCourses: string;
  addStudentSuccess: string;
  studentAddedSuccessfully: string;
  
  // Teachers  
  teacherManagement: string;
  addTeacher: string;
  editTeacher: string;
  teacherProfile: string;
  teacherDetails: string;
  department?: string;
  joiningDate?: string;
  salary?: string;
  // Additional UI labels for teacher/profile screens
  contactInformation?: string;
  professionalInformation?: string;
  subjectsTeaching?: string;
  teachingStatistics?: string;
  yearsExperience?: string;
  experience?: string;
  performanceOverview?: string;
  academicPerformance?: string;
  classAttendance?: string;
  averageGradeImprovement?: string;
  
  // Groups
  groupsAndClasses: string;
  manageGroupsDesc: string;
  newGroup: string;
  totalGroups: string;
  activeClasses: string;
  groupEnrolledStudents: string;
  occupancyRate: string;
  capacityUsed: string;
  groupLevels: string;
  primaryMiddleHigh: string;
  searchGroupsPlaceholder: string;
  studyLevel: string;
  allLevels: string;
  groupPrimary: string;
  groupMiddle: string;
  groupHigh: string;
  groupsCount: string;
  groupStudentsCount: string;
  groupFull: string;
  almostFull: string;
  availableSpots: string;
  enrolledStudentsInGroup: string;
  groupStudent: string;
  groupContact: string;
  groupAverage: string;
  groupAttendance: string;
  groupEnrollment: string;
  noStudentsEnrolled: string;
  groupDetails: string;
  groupModify: string;
  groupAddStudent: string;
  groupName: string;
  level: string;
  selectLevel: string;
  class: string;
  selectClass: string;
  subject: string;
  selectSubject: string;
  room: string;
  capacity: string;
  flexible: string;
  morePeopleCanBeAdded: string;
  groupCreatedSuccessfully: string;
  
  // Courses
  courseManagement: string;
  addCourse: string;
  editCourse: string;
  courseDetails: string;
  manageEnrollment: string;
  editSchedule: string;
  courseTitle: string;
  description: string;
  teacher: string;
  assignedTeacher: string;
  maxStudents: string;
  duration: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  fee: string;
  courseFee: string;
  assignToGroup: string;
  courseCreatedSuccessfully: string;
  courseInformation: string;
  teachingInformation: string;
  durationAndPricing: string;
  // Extra course UI labels
  instructor?: string;
  enrollment?: string;
  scheduleAndDuration?: string;
  rating?: string;
  completionRate?: string;
  passRate?: string;
  oneTimePayment?: string;
  courseInsights?: string;
  
  // Subjects
  subjectsManagement: string;
  addSubject: string;
  editSubject: string;
  subjectName: string;
  category: string;
  selectCategory: string;
  categories: {
    sciences: string;
    languages: string;
    humanities: string;
    socialSciences: string;
    technology: string;
    arts: string;
    sports: string;
  };
  subjectDescription: string;
  activeSubjects: string;
  subjectAddedSuccessfully: string;
  
  // Detailed Subject Categories (for selection lists)
  subjectsCategoriesDetailed?: {
    arabicLanguageLiterature: string;
    mathematicsSciences: string;
    physicsChemistry: string;
    lifeEarthSciences: string;
    philosophyHumanSciences: string;
    historyGeography: string;
    islamicEducation: string;
    foreignLanguages: string;
    physicalEducation: string;
    itTechnology: string;
    artsArtEducation: string;
  };
  
  // Exams
  exams: string;
  examsManagement: string;
  recordGrades: string;
  saveGrades: string;
  addExam: string;
  exam: string;
  semester: string;
  grades: string;
  average: string;
  examsChartTitle?: string;
  optionalFeatureNote?: string;
  exportExcel?: string;
  bestGradesSummary?: string;
  noExamsYet?: string;
  activeSubjectsForAverage?: string;
  coefficient?: string;
  bulkPasteGrades?: string;
  showComments?: string;
  hideComments?: string;
  generalAveragePerStudent?: string;
  
  // Schedule
  weeklySchedule: string;
  scheduleManagement: string;
  currentWeek: string;
  previousWeek: string;
  nextWeek: string;
  dayView: string;
  weekView: string;
  listView: string;
  totalCoursesThisWeek: string;
  activeTeachers: string;
  groupsScheduled: string;
  subjectLegend: string;
  
  
  // Attendance
  attendanceManagement: string;
  attendanceAnalyticsSummary?: string;
  averageAttendanceRate?: string;
  totalClassesThisMonth?: string;
  lateArrivals?: string;
  perfectAttendance?: string;
  markAttendance: string;
  takeAttendance: string;
  present: string;
  absent: string;
  late: string;
  classOverview: string;
  studentAttendance: string;
  attendanceReports: string;
  monthlyReport: string;
  classwiseReport: string;
  studentHistory: string;
  attendanceAnalytics: string;
  attendanceRecordedSuccessfully: string;
  selectGroup: string;
  recordAttendance: string;
  markAllPresent: string;
  backToGroups: string;

  // Documents
  uploadDocument?: string;
  generateDocument?: string;
  digitalSignatures?: string;
  documentType?: string;
  documentOwner?: string;
  addDocument?: string;
  certificateDoc?: string;
  reportCardDoc?: string;
  absenceExcuseDoc?: string;
  signed?: string;
  unsigned?: string;
  sign?: string;
  unsign?: string;

  // Events & Calendar
  events?: string;
  createEvent?: string;
  eventTitle?: string;
  eventDescription?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  monthlyView?: string;
  weeklyView?: string;
  dailyView?: string;
  integration?: string;
  
  // Payments
  paymentManagement: string;
  recordPayment: string;
  paymentHistory: string;
  totalCollected: string;
  pendingPayments: string;
  paidPaymentsTitle?: string;
  pendingPaymentsTitle?: string;
  overduePaymentsTitle?: string;
  totalRevenue?: string;
  paidStudents?: string;
  paymentsReceived?: string;
  awaitingPayment?: string;
  paidPayments?: string;
  overduePayments?: string;
  paymentDetails?: string;
  studentInformation?: string;
  student?: string;
  course?: string;
  amount?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  notes?: string;
  invoiceNumber?: string;
  downloadInvoice?: string;
  paymentRecordedSuccessfully?: string;
  paymentUpdated?: string;
  selectStudent?: string;
  backToStudents?: string;
  month?: string;
  allStatus?: string;
  allMonths?: string;
  january?: string;
  february?: string;
  march?: string;
  cash?: string;
  creditCard?: string;
  bankTransfer?: string;
  mobilePayment?: string;
  check?: string;
  paymentType?: string;
  tuitionFee?: string;
  registrationFee?: string;
  learningMaterials?: string;
  transportation?: string;
  other?: string;
  actions?: string;
  
  // Receipt
  paymentReceipt?: string;
  receiptDetails?: string;
  issueDate?: string;
  totalAmount?: string;
  printReceipt?: string;
  printing?: string;
  thankYouPayment?: string;
  receiptDisclaimer?: string;
  courseOrService?: string;
  notSpecified?: string;
  
  // Reports
  reportsAnalytics: string;
  reportsTab?: string;
  analyticsTab?: string;
  performanceTab?: string;
  quickReportsTab?: string;
  recentReports?: string;
  exportPdf?: string;
  reportTitleLabel?: string;
  reportByLabel?: string;
  reportDateLabel?: string;
  reportFormatLabel?: string;
  reportSizeLabel?: string;
  reportDownloadsLabel?: string;
  reportCategoryLabel?: string;
  reportStatusLabel?: string;
  reportDescriptionLabel?: string;
  allTypes?: string;
  readyStatus?: string;
  generatingStatus?: string;
  failedStatus?: string;
  totalReports?: string;
  generatedToday?: string;
  downloads?: string;
  reportTypeLabel?: string;
  dateRangeLabel?: string;
  todayLabel?: string;
  thisWeekLabel?: string;
  thisMonthLabel?: string;
  lastMonthLabel?: string;
  generateReport: string;
  refreshData: string;
  reportConfiguration?: string;
  reportOptions?: string;
  reportType?: string;
  dateRange?: string;
  customRange?: string;
  outputFormat?: string;
  includeCharts?: string;
  includeDetails?: string;
  includeAnalytics?: string;
  missingInformation?: string;
  pleaseSelectReportTypeAndDateRange?: string;
  lastMonth?: string;
  thisQuarter?: string;
  reportGeneratedSuccessfully?: string;
  performanceReport?: string;
  analyticsReport?: string;
  metric?: string;
  value?: string;
  change?: string;
  bucket?: string;
  group?: string;
  score?: string;
  dataRefreshed?: string;
  allReportsUpdated?: string;
  reportExported?: string;
  reportGenerated?: string;
  hasBeenGenerated?: string;
  hasBeenDownloaded?: string;
  uploadSuccessful?: string;
  connectSupabase?: string;
  allGeneratedReports?: string;
  reportsToday?: string;
  beingGenerated?: string;
  totalDownloads?: string;
  quickReportGeneration?: string;
  studentEnrollmentReport?: string;
  studentEnrollmentDescription?: string;
  coursePerformanceReport?: string;
  coursePerformanceDescription?: string;
  financialOverview?: string;
  financialOverviewDescription?: string;
  attendanceSummary?: string;
  attendanceSummaryDescription?: string;
  veryGood?: string;
  fair?: string;
  passing?: string;
  insufficient?: string;
  
  // Settings
  systemSettings: string;
  language: string;
  notifications: string;
  markAllAsRead?: string;
  noNotifications?: string;
  notif_new_student?: string;
  notif_payment_received?: string;
  notif_attendance_warning?: string;
  notif_new_student_registration?: string;
  notif_course_schedule_updated?: string;
  notif_payment_overdue?: string;
  notif_teacher_leave_request?: string;
  profile: string;
  institutionName: string;
  contactEmail: string;
  phoneNumber: string;
  timeZone: string;
  darkMode: string;
  fontSize: string;
  small: string;
  medium: string;
  large: string;
  appearance: string;
  general: string;
  security: string;
  system: string;
  // Security details
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  updatePassword?: string;
  twoFactorAuth?: string;
  enable2FA?: string;
  twoFactorDescription?: string;
  autoLogoutAfterInactivity?: string;
  sessionManagement?: string;
  languageSettings: string;
  selectLanguage: string;
  // Settings - System Management
  systemManagement?: string;
  dataManagement?: string;
  systemMaintenance?: string;
  dangerZone?: string;
  exportData?: string;
  importData?: string;
  clearCache?: string;
  optimizeDatabase?: string;
  resetSystemSettings?: string;
  thisWillResetAllSettingsToDefaults?: string;
  resetSettings?: string;
  csvUpload?: string;
  // CSV Upload UI
  selectDataType?: string;
  chooseWhatToUpload?: string;
  downloadTemplate?: string;
  uploadCSV?: string;
  processing?: string;
  validationErrors?: string;
  csvValidated?: string;
  records?: string;
  uploaded?: string;
  failedToProcess?: string;
  
  // Status
  status: string;
  active: string;
  inactive: string;
  completed: string;
  pending: string;
  upcoming?: string;
  paid?: string;
  overdue?: string;
  cancelled?: string;
  onLeave?: string;
  suspended?: string;
  
  // Time
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  
  // Messages
  error: string;
  success: string;
  warning: string;
  info: string;
  changeFromLastMonth?: string;
  requiredField: string;
  invalidEmail: string;
  passwordTooShort: string;
  confirmPassword: string;
  passwordsDoNotMatch: string;
  invalidTimeRange?: string;
  timeOutOfBounds?: string;
  
  // Days of week
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  
  // Moroccan Education Levels
  moroccanCurriculum: string;
  primaryEducation: string;
  middleEducation: string;
  highEducation: string;
  
  // Form Labels
  required: string;
  optional: string;
  placeholder: string;
  searchPlaceholder: string;
  noResultsFound: string;
  name?: string;
  studentId?: string;
  selectTeacher: string;
  selectDepartment?: string;
  selectGrade?: string;
  allDepartments?: string;
  
  // Filters UI
  advancedFilters?: string;
  clearAll?: string;
  deleteAll?: string;
  enrollmentDateRange?: string;
  from?: string;
  to?: string;
  ageRange?: string;
  years?: string;
  gpaRange?: string;
  attendanceRange?: string;
  classes?: string;
  additionalFilters?: string;
  hasParentEmail?: string;
  hasUnpaidFees?: string;
  applyFilters?: string;
  allCategories?: string;
  selectDate?: string;

  // Level Management
  levelManagement?: string;
  existingLevels?: string;
  initializeDefaults?: string;
  noLevelsFound?: string;
  levelName?: string;
  orderIndex?: string;
  createLevel?: string;
  editLevel?: string;
  addLevel?: string;
  addGrade?: string;
  noGradesYet?: string;
  saving?: string;

  // Course management UI
  enrollmentStatus?: string;
  courseProgress?: string;
  assignedGroups?: string;
  quickStats?: string;
  avgAttendance?: string;
  avgRating?: string;
  assignments?: string;
  scheduled?: string;
  studentPerformance?: string;
  excellent?: string;
  good?: string;
  averageLevel?: string;
  belowAverage?: string;
  attendanceTrends?: string;
  week?: string;
  avgStudyTimePerWeek?: string;
  assignmentCompletion?: string;
  studentSatisfaction?: string;
  // Manage enrollment UI
  searchStudents?: string;
  enrollStudents?: string;
  unenrollStudents?: string;
  currentEnrollment?: string;
  enroll?: string;
  unenroll?: string;
  availableStudents?: string;
  availableSpots?: string;
  remainingCapacity?: string;
  noLimitSet?: string;
  studentsNotInThisCourse?: string;
  quickActions?: string;
  addNewStudent?: string;
  assignWholeGroup?: string;
  addStudent?: string;
  assignGroup?: string;
  fullName?: string;
  gender?: string;
  male?: string;
  female?: string;
  other?: string;
  selectGender?: string;
  birthDate?: string;
  address?: string;
  createStudent?: string;
  creating?: string;
  assignGroupToCourse?: string;
  selectGroup?: string;
  chooseGroup?: string;
  assigning?: string;
  assignGroupNote?: string;
  noStudentsAvailable?: string;
  noStudentsAvailableDesc?: string;
  courseAtFullCapacity?: string;
  courseAtFullCapacityDesc?: string;
  debugInformation?: string;
  courseId?: string;
  courseGroupId?: string;
  totalStudents?: string;
  enrolledStudents?: string;
  groupsLoaded?: string;
  currentGroup?: string;
  sampleStudentGroupIds?: string;
  notFound?: string;
  
  // Actions
  addNew: string;
  saveChanges: string;
  discardChanges: string;
  confirmDelete: string;
  areYouSure: string;
  thisActionCannotBeUndone: string;
}

export type Language = 'en' | 'fr' | 'ar';

export const translations: Record<Language, Translation> = {
  en: {
    // Common Actions
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    add: 'Add',
    search: 'Search',
    filters: 'Filters',
    export: 'Export',
    download: 'Download',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    submit: 'Submit',
    create: 'Create',
    update: 'Update',
    remove: 'Remove',

    // Subscription Management
    subscriptions: 'Subscriptions',
    subscriptionManagement: 'Subscription Management',
    currentPlan: 'Current Plan',
    upgradePlan: 'Upgrade Plan',
    billingHistory: 'Billing History',
    usageMetrics: 'Usage Metrics',
    availablePlans: 'Available Plans',
    planFeatures: 'Plan Features',
    monthlyPrice: 'Monthly Price',
    yearlyPrice: 'Yearly Price',
    switchToPlan: 'Switch to Plan',
    currentUsage: 'Current Usage',
    nextBillingDate: 'Next Billing Date',
    cancelSubscription: 'Cancel Subscription',
    resumeSubscription: 'Resume Subscription',
    planDetails: 'Plan Details',
    studentLimit: 'Student Limit',
    storageLimit: 'Storage Limit',
    supportLevel: 'Support Level',
    additionalFeatures: 'Additional Features',
    billingCycle: 'Billing Cycle',
    monthly: 'Monthly',
    yearly: 'Yearly',
    invoiceHistory: 'Invoice History',
    downloadInvoice: 'Download Invoice',
    paymentMethod: 'Payment Method',
    updatePaymentMethod: 'Update Payment Method',
    continue: 'Continue',
    done: 'Done',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    downloadSchedule: 'Download Schedule',
    reasonLabel: 'Reason',
    allLabel: 'All',
    otherLabel: 'Other',
    
    // Navigation
    dashboard: 'Dashboard',
    students: 'Students',
    groups: 'Groups',
    teachers: 'Teachers',
    courses: 'Courses',
    subjects: 'Subjects',
    attendance: 'Attendance',
    payments: 'Payments',
    reports: 'Reports',
    settings: 'Settings',
    schedule: 'Schedule',
    // New Navigation
    documents: 'Documents',
    eventsCalendar: 'Events & Calendar',
    
    // Dashboard
    totalStudents: 'Total Students',
    totalTeachers: 'Total Teachers',
    totalCourses: 'Total Courses',
    attendanceRate: 'Attendance Rate',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    quickAdd: 'Quick Add',
    overview: 'Overview',
    statistics: 'Statistics',
    performanceTrends: 'Performance Trends',
    performanceDistribution: 'Performance Distribution',
    attendanceTrend: 'Attendance Trend',
    // New Analytics
    performanceAnalytics: 'Performance Analytics',
    studentTrends: 'Student Trends',
    attendanceCorrelation: 'Attendance vs Performance',
    classComparison: 'Class Comparison',
    monthlyRevenue: 'Monthly Revenue',
    collectionRate: 'Collection Rate',
    outstandingAmount: 'Outstanding Amount',
    averageGPA: 'Average GPA',
    enrollmentRate: 'Enrollment Rate',
    capacityUtilization: 'Capacity Utilization',
    atRiskStudents: 'At-Risk Students',
    projectedAnnualRevenue: 'Projected Annual Revenue',
    todaysClasses: "Today's Classes",
    studentsLeftAndOutstanding: 'Students Left & Outstanding',
    studentsWhoLeft: 'Students who left',
    // Report generator (types and sections)
    studentPerformanceReport: 'Student Performance Report',
    financialSummaryReport: 'Financial Summary Report',
    attendanceAnalysisReport: 'Attendance Analysis Report',
    teacherPerformanceReport: 'Teacher Performance Report',
    courseAnalyticsReport: 'Course Analytics Report',
    enrollmentReport: 'Enrollment Report',
    keyMetrics: 'Key Metrics',
    topPerformers: 'Top Performers',
    generatedOn: 'Generated on',
    monthlyTrends: 'Monthly Trends',
    month: 'Month',
    revenue: 'Revenue',
    collections: 'Collections',
    classWiseRates: 'Class-wise Rates',
    rate: 'Rate',
    popularCourses: 'Popular Courses',
    underperformingCourses: 'Underperforming Courses',
    enrollmentTrends: 'Enrollment Trends',
    enrollments: 'Enrollments',
    completions: 'Completions',
    gpa: 'GPA',
    
    // Students
    studentManagement: 'Student Management',
    addStudent: 'Add Student',
    editStudent: 'Edit Student',
    studentProfile: 'Student Profile',
    enrolledStudents: 'Enrolled Students',
    studentDetails: 'Student Details',
    personalInformation: 'Personal Information',
    academicInformation: 'Academic Information',
    parentInformation: 'Parent/Guardian Information',
    courseEnrollment: 'Course Enrollment',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    dateOfBirth: 'Date of Birth',
    grade: 'Grade',
    parentName: 'Parent/Guardian Name',
    parentPhone: 'Parent Phone',
    parentEmail: 'Parent Email',
    address: 'Address',
    enrolledCourses: 'Enrolled Courses',
    addStudentSuccess: 'Student Added Successfully',
    studentAddedSuccessfully: 'Student has been registered successfully',
    
    // Teachers  
    teacherManagement: 'Teacher Management',
    addTeacher: 'Add Teacher',
    editTeacher: 'Edit Teacher',
    teacherProfile: 'Teacher Profile',
    teacherDetails: 'Teacher Details',
    department: 'Department',
    joiningDate: "Date of Joining",
    salary: 'Salary',
    // Extra Teacher/Profile labels
    contactInformation: 'Contact Information',
    professionalInformation: 'Professional Information',
    subjectsTeaching: 'Subjects Teaching',
    teachingStatistics: "Teaching Statistics",
    yearsExperience: "Years Experience",
    experience: 'Experience',
    performanceOverview: "Performance Overview",
    academicPerformance: 'Academic Performance',
    classAttendance: 'Class Attendance',
    averageGradeImprovement: 'Average Grade Improvement',
    
    // Groups
    groupsAndClasses: 'Groups & Classes',
    manageGroupsDesc: 'Manage student groups and classes by study level',
    newGroup: 'New Group',
    totalGroups: 'Total Groups',
    activeClasses: 'Active Classes',
    groupEnrolledStudents: 'Enrolled Students',
    occupancyRate: 'Occupancy Rate',
    capacityUsed: 'Capacity Used',
    groupLevels: 'Levels',
    primaryMiddleHigh: 'Primary, Middle, High',
    searchGroupsPlaceholder: 'Search groups, subjects, teachers...',
    studyLevel: 'Study Level',
    allLevels: 'All Levels',
    groupPrimary: 'Primary',
    groupMiddle: 'Middle',
    groupHigh: 'High',
    groupsCount: 'group(s)',
    groupStudentsCount: 'students',
    groupFull: 'Full',
    almostFull: 'Almost Full',
    availableSpots: 'Available Spots',
    enrolledStudentsInGroup: 'Enrolled Students',
    groupStudent: 'Student',
    groupContact: 'Contact',
    groupAverage: 'Average',
    groupAttendance: 'Attendance',
    groupEnrollment: 'Enrollment',
    noStudentsEnrolled: 'No students enrolled in this group',
    groupDetails: 'Details',
    groupModify: 'Modify',
    groupAddStudent: 'Add Student',
    groupName: 'Group Name',
    level: 'Level',
    selectLevel: 'Select level',
    class: 'Class',
    selectClass: 'Select class',
    subject: 'Subject',
    selectSubject: 'Select subject',
    room: 'Room',
    capacity: 'Capacity',
    flexible: 'Flexible',
    morePeopleCanBeAdded: 'More students can be added if necessary',
    groupCreatedSuccessfully: 'Group Created Successfully',
    
    // Courses
    courseManagement: 'Course Management',
    addCourse: 'Add Course',
    editCourse: 'Edit Course',
    courseDetails: 'Course Details',
    manageEnrollment: 'Manage Enrollment',
    editSchedule: 'Edit Schedule',
    courseTitle: 'Course Title',
    description: 'Description',
    teacher: 'Teacher',
    assignedTeacher: 'Assigned Teacher',
    maxStudents: 'Max Students',
    duration: 'Duration',
    startDate: 'Start Date',
    endDate: 'End Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    fee: 'Fee',
    courseFee: 'Course Fee (MAD)',
    assignToGroup: 'Assign to Group',
    courseCreatedSuccessfully: 'Course Created Successfully',
    courseInformation: 'Course Information',
    teachingInformation: 'Teaching Information',
    durationAndPricing: 'Duration & Pricing',
    course_details: 'Course Details',
    // Extra course UI labels
    instructor: 'Instructor',
    enrollment: 'Enrollment',
    scheduleAndDuration: 'Schedule & Duration',
    rating: 'Rating',
    completionRate: 'Completion Rate',
    passRate: 'Pass Rate',
    oneTimePayment: 'One-time payment',
    courseInsights: 'Course Insights',
    studentSatisfaction: 'Student Satisfaction',
    
    // Subjects
    subjectsManagement: 'Subjects Management',
    addSubject: 'Add Subject',
    editSubject: 'Edit Subject',
    subjectName: 'Subject Name',
    category: 'Category',
    selectCategory: 'Select category',
    categories: {
      sciences: 'Sciences',
      languages: 'Languages',
      humanities: 'Humanities',
      socialSciences: 'Social Sciences',
      technology: 'Technology',
      arts: 'Arts',
      sports: 'Sports'
    },
    subjectDescription: 'Description',
    activeSubjects: 'Active Subjects',
    subjectAddedSuccessfully: 'Subject added successfully',
    subjectsCategoriesDetailed: {
      arabicLanguageLiterature: 'Arabic Language & Literature',
      mathematicsSciences: 'Mathematics & Sciences',
      physicsChemistry: 'Physics & Chemistry',
      lifeEarthSciences: 'Life & Earth Sciences',
      philosophyHumanSciences: 'Philosophy & Human Sciences',
      historyGeography: 'History & Geography',
      islamicEducation: 'Islamic Education',
      foreignLanguages: 'Foreign Languages',
      physicalEducation: 'Physical Education',
      itTechnology: 'IT & Technology',
      artsArtEducation: 'Arts & Art Education'
    },
    
    // Exams
    exams: 'Exams',
    examsManagement: 'Exams Management',
    recordGrades: 'Record Grades',
    saveGrades: 'Save Grades',
    addExam: 'Add Exam',
    exam: 'Exam',
    semester: 'Semester',
    grades: 'Grades',
    average: 'Average',
    examsChartTitle: 'Exam Results Overview',
    optionalFeatureNote: 'This feature is optional and can be enabled per center',
    exportExcel: 'Excel',
    bestGradesSummary: 'Best Grades Summary',
    noExamsYet: 'No exams yet for this group.',
    activeSubjectsForAverage: 'Active subjects (for general average)',
    coefficient: 'Coefficient',
    bulkPasteGrades: 'Bulk paste grades (CSV/Excel)',
    showComments: 'Show comments',
    hideComments: 'Hide comments',
    generalAveragePerStudent: 'General average (per student)',
    
    // Schedule
    weeklySchedule: 'Weekly Schedule',
    scheduleManagement: 'Schedule Management',
    currentWeek: 'Current Week',
    previousWeek: 'Previous Week',
    nextWeek: 'Next Week',
    dayView: 'Day View',
    weekView: 'Week View',
    listView: 'List View',
    totalCoursesThisWeek: 'Total Courses This Week',
    activeTeachers: 'Active Teachers',
    groupsScheduled: 'Groups Scheduled',
    subjectLegend: 'Subject Legend',
    
    
    // Attendance
    attendanceManagement: 'Attendance Management',
    attendanceAnalyticsSummary: 'Attendance Analytics Summary',
    averageAttendanceRate: 'Average Attendance Rate',
    totalClassesThisMonth: 'Total Classes This Month',
    lateArrivals: 'Late Arrivals',
    perfectAttendance: 'Perfect Attendance',
    markAttendance: 'Mark Attendance',
    takeAttendance: 'Take Attendance',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    classOverview: 'Class Overview',
    studentAttendance: 'Student Attendance',
    attendanceReports: 'Reports',
    monthlyReport: 'Monthly Attendance Report',
    classwiseReport: 'Class-wise Report',
    studentHistory: 'Student History Report',
    attendanceAnalytics: 'Attendance Analytics Summary',
    attendanceRecordedSuccessfully: 'Attendance Recorded Successfully',
    selectGroup: 'Select Group',
    recordAttendance: 'Record Attendance',
    markAllPresent: 'Mark All Present',
    backToGroups: 'Back to Groups',

    // Documents
    uploadDocument: 'تحميل مستند',
    generateDocument: 'إنشاء مستند',
    digitalSignatures: 'توقيعات رقمية',
    documentType: 'نوع المستند',
    documentOwner: 'المالك',
    addDocument: 'إضافة مستند',
    certificateDoc: 'شهادة',
    reportCardDoc: 'كشف درجات',
    absenceExcuseDoc: 'عذر غياب',
    signed: 'موقّع',
    unsigned: 'غير موقّع',
    sign: 'توقيع',
    unsign: 'إلغاء التوقيع',

    // Events & Calendar
    events: 'Events',
    createEvent: 'Create Event',
    eventTitle: 'Title',
    eventDescription: 'Description',
    eventDate: 'Date',
    eventTime: 'Time',
    eventLocation: 'Location',
    monthlyView: 'Monthly',
    weeklyView: 'Weekly',
    dailyView: 'Daily',
    
    // Payments
    paymentManagement: 'Payment Management',
    recordPayment: 'Record Payment',
    paymentHistory: 'Payment History',
    totalCollected: 'Total Collected',
    pendingPayments: 'Pending Payments',
    paidPaymentsTitle: 'Paid Payments / المدفوعات',
    pendingPaymentsTitle: 'Pending Payments / المدفوعات المعلقة',
    overduePaymentsTitle: 'Overdue Payments / المدفوعات المتأخرة',
    totalRevenue: 'Total Revenue',
    paidStudents: 'Paid Students',
    paymentsReceived: 'Payments received',
    awaitingPayment: 'Awaiting payment',
    paidPayments: 'Paid Payments',
    overduePayments: 'Overdue Payments',
    paymentDetails: 'Payment Details',
    studentInformation: 'Student Information',
    student: 'Student',
    course: 'Course',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    transactionId: 'Transaction ID',
    paymentDate: 'Payment Date',
    dueDate: 'Due Date',
    notes: 'Notes',
    invoiceNumber: 'Invoice Number',
    downloadInvoice: 'Download Invoice',
    paymentRecordedSuccessfully: 'Payment Recorded Successfully',
    paymentUpdated: 'Payment Updated',
    selectStudent: 'Select Student',
    backToStudents: 'Back to Students',
    month: 'Month',
    allStatus: 'All Status',
    allMonths: 'All Months',
    january: 'January',
    february: 'February',
    march: 'March',
    cash: 'Cash',
    creditCard: 'Credit Card',
    bankTransfer: 'Bank Transfer',
    mobilePayment: 'Mobile Payment',
    check: 'Check',
    paymentType: 'Payment Type',
    tuitionFee: 'Tuition Fee',
    registrationFee: 'Registration Fee',
    learningMaterials: 'Learning Materials',
    transportation: 'Transportation',
    other: 'Other',
    actions: 'Actions',
    // Receipt
    paymentReceipt: 'Payment Receipt',
    receiptDetails: 'Receipt Details',
    issueDate: 'Issue Date',
    totalAmount: 'Total Amount',
    printReceipt: 'Print Receipt',
    printing: 'Printing...',
    thankYouPayment: 'Thank you for your payment!',
    receiptDisclaimer: 'This receipt serves as proof of payment. Please keep it for your records.',
    courseOrService: 'Course/Service',
    notSpecified: 'Not specified',
    
    // Reports
    reportsAnalytics: 'Reports & Analytics',
    reportsTab: 'Reports',
    analyticsTab: 'Analytics',
    performanceTab: 'Performance',
    quickReportsTab: 'Quick Reports',
    recentReports: 'Recent Reports',
    exportPdf: 'Export PDF',
    reportTitleLabel: 'Title',
    reportByLabel: 'By',
    reportDateLabel: 'Date',
    reportFormatLabel: 'Format',
    reportSizeLabel: 'Size',
    reportDownloadsLabel: 'Downloads',
    reportCategoryLabel: 'Category',
    reportStatusLabel: 'Status',
    reportDescriptionLabel: 'Description',
    allTypes: 'All Types',
    readyStatus: 'Ready',
    generatingStatus: 'Generating',
    failedStatus: 'Failed',
    totalReports: 'Total Reports',
    generatedToday: 'Generated Today',
    downloads: 'Downloads',
    reportTypeLabel: 'Report Type',
    dateRangeLabel: 'Date Range',
    todayLabel: 'Today',
    thisWeekLabel: 'This Week',
    thisMonthLabel: 'This Month',
    lastMonthLabel: 'Last Month',
    generateReport: 'Generate Report',
    refreshData: 'Refresh Data',
    reportConfiguration: 'Report Configuration',
    reportOptions: 'Report Options',
    reportType: 'Report Type',
    dateRange: 'Date Range',
    customRange: 'Custom Range',
    outputFormat: 'Output Format',
    includeCharts: 'Include charts and graphs',
    includeDetails: 'Include detailed data',
    includeAnalytics: 'Include advanced analytics',
    missingInformation: 'Missing Information',
    pleaseSelectReportTypeAndDateRange: 'Please select report type and date range.',
    lastMonth: 'Last Month',
    thisQuarter: 'This Quarter',
    reportGeneratedSuccessfully: 'Report Generated Successfully',
    performanceReport: 'Performance Report',
    analyticsReport: 'Analytics Report',
    metric: 'Metric',
    value: 'Value',
    change: 'Change',
    bucket: 'Bucket',
    group: 'Group',
    score: 'Score',
    dataRefreshed: 'Data Refreshed',
    allReportsUpdated: 'All reports and analytics data has been updated with the latest information.',
    reportExported: 'Report exported',
    reportGenerated: 'Report Generated',
    hasBeenGenerated: 'has been generated',
    hasBeenDownloaded: 'and downloaded.',
    uploadSuccessful: 'Upload Successful',
    connectSupabase: 'Connect Supabase to save permanently.',
    allGeneratedReports: 'All generated reports',
    reportsToday: 'Reports today',
    beingGenerated: 'Being generated',
    totalDownloads: 'Total downloads',
    quickReportGeneration: 'Quick Report Generation',
    studentEnrollmentReport: 'Student Enrollment Report',
    studentEnrollmentDescription: 'Current enrollment statistics and trends',
    coursePerformanceReport: 'Course Performance Report',
    coursePerformanceDescription: 'Course completion rates and student feedback',
    financialOverview: 'Financial Overview',
    financialOverviewDescription: 'Revenue, expenses, and payment analytics',
    attendanceSummary: 'Attendance Summary',
    attendanceSummaryDescription: 'Daily, weekly, and monthly attendance reports',
    veryGood: 'Very Good (16-18)',
    fair: 'Fair (12-14)',
    passing: 'Passing (10-12)',
    insufficient: 'Insufficient (<10)',
    
    // Settings
    systemSettings: 'System Settings',
    language: 'Language',
    notifications: 'Notifications',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    notif_new_student: 'New student',
    notif_payment_received: 'Payment received',
    notif_attendance_warning: 'Attendance warning',
    notif_new_student_registration: 'New student registration',
    notif_course_schedule_updated: 'Course schedule updated',
    notif_payment_overdue: 'Payment overdue',
    notif_teacher_leave_request: 'Teacher leave request',
    profile: 'Profile',
    institutionName: 'Institution Name',
    contactEmail: 'Contact Email',
    phoneNumber: 'Phone Number',
    timeZone: 'Time Zone',
    darkMode: 'Dark Mode',
    fontSize: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    appearance: 'Appearance',
    general: 'General',
    security: 'Security',
    system: 'System',
    // Security details
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    twoFactorAuth: 'Two-Factor Authentication',
    enable2FA: 'Enable 2FA',
    twoFactorDescription: 'Add an extra layer of security / أضف طبقة إضافية من الأمان',
    autoLogoutAfterInactivity: 'Auto-logout after inactivity / تسجيل الخروج التلقائي بعد فترة من الخمول',
    
    // Status
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    completed: 'Completed',
    pending: 'Pending',
    upcoming: 'Upcoming',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    onLeave: 'On Leave',
    suspended: 'Suspended',
    
    // Time
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    
    // Messages
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    changeFromLastMonth: 'from last month',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 8 characters',
    confirmPassword: 'Confirm Password',
    passwordsDoNotMatch: 'Passwords do not match',
    invalidTimeRange: 'End time must be after start time',
    timeOutOfBounds: 'Please select times between 08:00 and 23:00',
    
    // Days of week
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    
    // Moroccan Education Levels
    moroccanCurriculum: 'Moroccan Curriculum',
    primaryEducation: 'Primary Education',
    middleEducation: 'Middle Education',
    highEducation: 'High School Education',
    
    // Form Labels
    required: 'Required',
    optional: 'Optional',
    placeholder: 'Enter value...',
    searchPlaceholder: 'Search...',
    noResultsFound: 'No results found',
    name: 'Name',
    studentId: 'Student ID',
    selectTeacher: 'Select Teacher',
    selectDepartment: 'Select Department',
    selectGrade: 'Select Grade',
    // Filters UI
    advancedFilters: 'Advanced Filters',
    clearAll: 'Clear All',
    deleteAll: 'Delete All',
    enrollmentDateRange: 'Enrollment Date Range',
    from: 'From',
    to: 'To',
    ageRange: 'Age Range',
    years: 'years',
    gpaRange: 'GPA Range',
    attendanceRange: 'Attendance Range',
    classes: 'Classes',
    additionalFilters: 'Additional Filters',
    hasParentEmail: 'Has Parent Email',
    hasUnpaidFees: 'Has Unpaid Fees',
    applyFilters: 'Apply Filters',
    allCategories: 'All Categories',
    selectDate: 'Select date',

    // Level Management
    levelManagement: 'Level Management',
    existingLevels: 'Existing Levels',
    initializeDefaults: 'Initialize Defaults',
    noLevelsFound: 'No levels found',
    levelName: 'Level Name',
    orderIndex: 'Order Index',
    createLevel: 'Create Level',
    editLevel: 'Edit Level',
    addLevel: 'Add Level',
    addGrade: 'Add Grade',
    noGradesYet: 'No grades yet',
    saving: 'Saving...',
    // Course management UI
    enrollmentStatus: 'Enrollment Status',
    courseProgress: 'Course Progress',
    assignedGroups: 'Assigned Groups',
    quickStats: 'Quick Stats',
    avgAttendance: 'Avg Attendance',
    avgRating: 'Avg Rating',
    assignments: 'Assignments',
    scheduled: 'Scheduled',
    studentPerformance: 'Student Performance',
    excellent: 'Excellent',
    good: 'Good',
    averageLevel: 'Average',
    belowAverage: 'Below Average',
    attendanceTrends: 'Attendance Trends',
    week: 'Week',
    avgStudyTimePerWeek: 'Avg Study Time/Week',
    assignmentCompletion: 'Assignment Completion',
    studentSatisfaction: 'Student Satisfaction',
    // Manage enrollment UI
    searchStudents: 'Search Students',
    enrollStudents: 'Enroll Students',
    unenrollStudents: 'Unenroll Students',
    currentEnrollment: 'Current Enrollment',
    enroll: 'Enroll',
    unenroll: 'Remove',
    availableStudents: 'Available Students',
    availableSpots: 'Available Spots',
    remainingCapacity: 'Remaining Capacity',
    noLimitSet: 'No Limit Set',
    studentsNotInThisCourse: 'Students Not In This Course',
    quickActions: 'Quick Actions',
    addNewStudent: 'Add New Student',
    assignWholeGroup: 'Assign Whole Group',
    addStudent: 'Add Student',
    assignGroup: 'Assign Group',
    fullName: 'Full Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    selectGender: 'Select Gender',
    birthDate: 'Birth Date',
    address: 'Address',
    createStudent: 'Create Student',
    creating: 'Creating...',
    assignGroupToCourse: 'Assign Group to Course',
    selectGroup: 'Select Group',
    chooseGroup: 'Choose Group...',
    assigning: 'Assigning...',
    assignGroupNote: 'This will assign the course to the selected group. All students in this group will be considered enrolled in this course.',
    noStudentsAvailable: 'No Students Available',
    noStudentsAvailableDesc: 'There are no students available to enroll in this course. You can:',
    courseAtFullCapacity: 'Course at Full Capacity',
    courseAtFullCapacityDesc: 'This course has reached its maximum capacity. You cannot enroll more students unless you increase the capacity or unenroll existing students.',
    debugInformation: 'Debug Information',
    courseId: 'Course ID',
    courseGroupId: 'Course Group ID',
    totalStudents: 'Total Students',
    enrolledStudents: 'Enrolled Students',
    groupsLoaded: 'Groups Loaded',
    currentGroup: 'Current Group',
    sampleStudentGroupIds: 'Sample Student Group IDs',
    notFound: 'Not Found',
    
    // Actions
    addNew: 'Add New',
    saveChanges: 'Save Changes',
    discardChanges: 'Discard Changes',
    confirmDelete: 'Confirm Delete',
    areYouSure: 'Are you sure?',
    thisActionCannotBeUndone: 'This action cannot be undone.',
  },
  
  fr: {
    // Common Actions
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    view: 'Voir',
    add: 'Ajouter',
    search: 'Rechercher',
    filters: 'Filtres',
    export: 'Exporter',
    download: 'Télécharger',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    close: 'Fermer',
    submit: 'Soumettre',
    create: 'Créer',
    update: 'Mettre à jour',
    remove: 'Supprimer',

    // Subscription Management
    subscriptions: 'Abonnements',
    subscriptionManagement: 'Gestion des abonnements',
    currentPlan: 'Plan actuel',
    upgradePlan: 'Mettre à niveau',
    billingHistory: 'Historique de facturation',
    usageMetrics: 'Métriques d\'utilisation',
    availablePlans: 'Plans disponibles',
    planFeatures: 'Fonctionnalités du plan',
    monthlyPrice: 'Prix mensuel',
    yearlyPrice: 'Prix annuel',
    switchToPlan: 'Passer au plan',
    currentUsage: 'Utilisation actuelle',
    nextBillingDate: 'Prochaine date de facturation',
    cancelSubscription: 'Annuler l\'abonnement',
    resumeSubscription: 'Reprendre l\'abonnement',
    planDetails: 'Détails du plan',
    studentLimit: 'Limite d\'étudiants',
    storageLimit: 'Limite de stockage',
    supportLevel: 'Niveau de support',
    additionalFeatures: 'Fonctionnalités supplémentaires',
    billingCycle: 'Cycle de facturation',
    monthly: 'Mensuel',
    yearly: 'Annuel',
    invoiceHistory: 'Historique des factures',
    downloadInvoice: 'Télécharger la facture',
    paymentMethod: 'Mode de paiement',
    updatePaymentMethod: 'Mettre à jour le mode de paiement',
    continue: 'Continuer',
    done: 'Terminé',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    confirm: 'Confirmer',
    downloadSchedule: "Télécharger l'emploi du temps",
    reasonLabel: 'Motif',
    allLabel: 'Tous',
    otherLabel: 'Autre',
    
    // Navigation
    dashboard: 'Tableau de bord',
    students: 'Étudiants',
    groups: 'Groupes',
    teachers: 'Enseignants',
    courses: 'Cours',
    subjects: 'Matières',
    attendance: 'Présence',
    payments: 'Paiements',
    reports: 'Rapports',
    settings: 'Paramètres',
    schedule: 'Emploi du temps',
    // New Navigation
    documents: 'Documents',
    eventsCalendar: 'Événements & Calendrier',
    
    // Dashboard
    totalStudents: 'Total Étudiants',
    totalTeachers: 'Total Enseignants',
    totalCourses: 'Total Cours',
    attendanceRate: 'Taux de Présence',
    recentActivity: 'Activité Récente',
    quickActions: 'Actions Rapides',
    quickAdd: 'Ajout rapide',
    overview: 'Vue d\'ensemble',
    statistics: 'Statistiques',
    performanceTrends: 'Tendances de Performance',
    performanceDistribution: 'Répartition des performances',
    attendanceTrend: 'Tendance de présence',
    // New Analytics
    performanceAnalytics: 'Analytique de Performance',
    studentTrends: 'Évolution des élèves',
    attendanceCorrelation: 'Présence vs Performance',
    classComparison: 'Comparaison des classes',
    monthlyRevenue: 'Revenu Mensuel',
    collectionRate: 'Taux de recouvrement',
    outstandingAmount: 'Montant en souffrance',
    averageGPA: 'Moyenne générale',
    enrollmentRate: "Taux d'inscription",
    capacityUtilization: 'Utilisation de la capacité',
    atRiskStudents: 'Étudiants à risque',
    projectedAnnualRevenue: 'Revenu annuel projeté',
    todaysClasses: "Cours d'aujourd'hui",
    studentsLeftAndOutstanding: 'Étudiants partis & Montant en souffrance',
    studentsWhoLeft: 'Étudiants partis',
    // Report generator (types and sections)
    studentPerformanceReport: 'Rapport de performance des étudiants',
    financialSummaryReport: 'Rapport financier',
    attendanceAnalysisReport: 'Analyse des présences',
    teacherPerformanceReport: 'Rapport de performance des enseignants',
    courseAnalyticsReport: 'Rapport analytique des cours',
    enrollmentReport: 'Rapport des inscriptions',
    keyMetrics: 'Indicateurs clés',
    topPerformers: 'Meilleurs étudiants',
    generatedOn: 'Généré le',
    monthlyTrends: 'Tendances mensuelles',
    month: 'Mois',
    revenue: 'Revenu',
    collections: 'Encaissements',
    classWiseRates: 'Taux par classe',
    rate: 'Taux',
    popularCourses: 'Cours populaires',
    underperformingCourses: 'Cours à améliorer',
    enrollmentTrends: 'Tendances des inscriptions',
    enrollments: 'Inscriptions',
    completions: 'Achèvements',
    gpa: 'Moyenne',
    
    // Students
    studentManagement: 'Gestion des Étudiants',
    addStudent: 'Ajouter Étudiant',
    editStudent: 'Modifier Étudiant',
    studentProfile: 'Profil Étudiant',
    enrolledStudents: 'Étudiants Inscrits',
    studentDetails: 'Détails de l\'Étudiant',
    personalInformation: 'Informations Personnelles',
    academicInformation: 'Informations Académiques',
    parentInformation: 'Informations du Parent/Tuteur',
    courseEnrollment: 'Inscription aux Cours',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    email: 'Email',
    phone: 'Téléphone',
    dateOfBirth: 'Date de naissance',
    grade: 'Niveau',
    parentName: 'Nom du Parent/Tuteur',
    parentPhone: 'Téléphone du Parent',
    parentEmail: 'Email du Parent',
    address: 'Adresse',
    enrolledCourses: 'Cours Inscrits',
    addStudentSuccess: 'Étudiant Ajouté avec Succès',
    studentAddedSuccessfully: 'L\'étudiant a été enregistré avec succès',
    
    // Teachers
    teacherManagement: 'Gestion des Enseignants',
    addTeacher: 'Ajouter Enseignant',
    editTeacher: 'Modifier Enseignant',
    teacherProfile: 'Profil Enseignant',
    teacherDetails: 'Détails de l\'Enseignant',
    department: 'Département',
    joiningDate: "Date d'entrée",
    salary: 'Salaire',
    // Extra Teacher/Profile labels
    contactInformation: 'Informations de contact',
    professionalInformation: 'Informations professionnelles',
    subjectsTeaching: 'Matières enseignées',
    teachingStatistics: "Statistiques d'enseignement",
    yearsExperience: "Années d'expérience",
    experience: 'Expérience',
    performanceOverview: "Aperçu des performances",
    academicPerformance: 'Performance académique',
    classAttendance: 'Assiduité en classe',
    averageGradeImprovement: 'Amélioration moyenne des notes',
    
    // Groups
    groupsAndClasses: 'Groupes et Classes',
    manageGroupsDesc: 'Gérer les groupes d\'étudiants et les classes par niveau d\'études',
    newGroup: 'Nouveau Groupe',
    totalGroups: 'Total Groupes',
    activeClasses: 'Classes Actives',
    groupEnrolledStudents: 'Étudiants Inscrits',
    occupancyRate: 'Taux d\'Occupation',
    capacityUsed: 'Capacité Utilisée',
    groupLevels: 'Niveaux',
    primaryMiddleHigh: 'Primaire, Collège, Lycée',
    searchGroupsPlaceholder: 'Rechercher groupes, matières, professeurs...',
    studyLevel: 'Niveau d\'études',
    allLevels: 'Tous les Niveaux',
    groupPrimary: 'Primaire',
    groupMiddle: 'Collège',
    groupHigh: 'Lycée',
    groupsCount: 'groupe(s)',
    groupStudentsCount: 'étudiants',
    groupFull: 'Complet',
    almostFull: 'Presque Plein',
    availableSpots: 'Places Disponibles',
    enrolledStudentsInGroup: 'Étudiants Inscrits',
    groupStudent: 'Étudiant',
    groupContact: 'Contact',
    groupAverage: 'Moyenne',
    groupAttendance: 'Assiduité',
    groupEnrollment: 'Inscription',
    noStudentsEnrolled: 'Aucun étudiant inscrit dans ce groupe',
    groupDetails: 'Détails',
    groupModify: 'Modifier',
    groupAddStudent: 'Ajouter Étudiant',
    groupName: 'Nom du Groupe',
    level: 'Niveau',
    selectLevel: 'Sélectionner le niveau',
    class: 'Classe',
    selectClass: 'Sélectionner la classe',
    subject: 'Matière',
    selectSubject: 'Sélectionner la matière',
    room: 'Salle',
    capacity: 'Capacité',
    flexible: 'Flexible',
    morePeopleCanBeAdded: 'Plus d\'étudiants peuvent être ajoutés si nécessaire',
    groupCreatedSuccessfully: 'Groupe Créé avec Succès',
    
    // Courses
    courseManagement: 'Gestion des Cours',
    addCourse: 'Ajouter Cours',
    editCourse: 'Modifier Cours',
    courseDetails: 'Détails du Cours',
    manageEnrollment: 'Gérer les Inscriptions',
    editSchedule: 'Modifier Horaire',
    courseTitle: 'Titre du Cours',
    description: 'Description',
    teacher: 'Enseignant',
    assignedTeacher: 'Enseignant Assigné',
    maxStudents: 'Nombre Max d\'Étudiants',
    duration: 'Durée',
    startDate: 'Date de Début',
    endDate: 'Date de Fin',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    fee: 'Frais',
    courseFee: 'Frais du Cours (MAD)',
    assignToGroup: 'Assigner au Groupe',
    courseCreatedSuccessfully: 'Cours Créé avec Succès',
    courseInformation: 'Informations du Cours',
    teachingInformation: 'Informations d\'Enseignement',
    durationAndPricing: 'Durée et Tarification',
    course_details: 'Détails du Cours',
    // Extra course UI labels
    instructor: 'Enseignant',
    enrollment: 'Inscriptions',
    scheduleAndDuration: "Emploi du temps & Durée",
    rating: 'Note',
    completionRate: "Taux d’achèvement",
    passRate: 'Taux de réussite',
    oneTimePayment: 'Paiement unique',
    courseInsights: 'Aperçus du cours',
    studentSatisfaction: 'Satisfaction des étudiants',
    
    // Subjects
    subjectsManagement: 'Gestion des Matières',
    addSubject: 'Ajouter Matière',
    editSubject: 'Modifier Matière',
    subjectName: 'Nom de la Matière',
    category: 'Catégorie',
    selectCategory: 'Sélectionner la catégorie',
    categories: {
      sciences: 'Sciences',
      languages: 'Langues',
      humanities: 'Sciences Humaines',
      socialSciences: 'Sciences Sociales',
      technology: 'Technologie',
      arts: 'Arts',
      sports: 'Sports'
    },
    subjectDescription: 'Description',
    activeSubjects: 'Matières Actives',
    subjectAddedSuccessfully: 'Matière ajoutée avec succès',
    
    // Exams
    exams: 'Examens',
    examsManagement: 'Gestion des Examens',
    recordGrades: 'Saisir les notes',
    saveGrades: 'Enregistrer les notes',
    addExam: 'Ajouter un examen',
    exam: 'Examen',
    semester: 'Semestre',
    grades: 'Notes',
    average: 'Moyenne',
    examsChartTitle: 'Aperçu des résultats',
    optionalFeatureNote: 'Fonctionnalité optionnelle activable par centre',
    exportExcel: 'Excel',
    bestGradesSummary: 'Meilleures notes par matière',
    noExamsYet: "Aucun examen pour ce groupe pour l'instant.",
    activeSubjectsForAverage: 'Matières actives (pour la moyenne générale)',
    coefficient: 'Coefficient',
    notes: 'Notes',
    bulkPasteGrades: 'Coller en masse (CSV/Excel)',
    showComments: 'Afficher les commentaires',
    hideComments: 'Masquer les commentaires',
    generalAveragePerStudent: 'Moyenne générale (par étudiant)',
    
    // Schedule
    weeklySchedule: 'Emploi du temps hebdomadaire',
    scheduleManagement: "Gestion de l'emploi du temps",
    currentWeek: 'Semaine en cours',
    previousWeek: 'Semaine Précédente',
    nextWeek: 'Semaine Suivante',
    dayView: 'Vue Jour',
    weekView: 'Vue Semaine',
    listView: 'Vue Liste',
    totalCoursesThisWeek: 'Total Cours Cette Semaine',
    activeTeachers: 'Enseignants Actifs',
    groupsScheduled: 'Groupes Programmés',
    subjectLegend: 'Légende des Matières',
    
    
    // Attendance
    attendanceManagement: 'Gestion des Présences',
    attendanceAnalyticsSummary: 'Analyse des Présences',
    averageAttendanceRate: 'Moyen taux de présence',
    totalClassesThisMonth: 'Total des cours ce mois',
    lateArrivals: 'Retards',
    perfectAttendance: 'Présence parfaite',
    markAttendance: 'Marquer Présence',
    takeAttendance: 'Prendre les Présences',
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    classOverview: 'Vue d\'ensemble des Classes',
    studentAttendance: 'Présence des Étudiants',
    attendanceReports: 'Rapports de Présence',
    monthlyReport: 'Rapport Mensuel de Présence',
    classwiseReport: 'Rapport par Classe',
    studentHistory: 'Historique des Étudiants',
    attendanceAnalytics: 'Analyse des Présences',
    attendanceRecordedSuccessfully: 'Présence Enregistrée avec Succès',
    selectGroup: 'Sélectionner le Groupe',
    recordAttendance: 'Enregistrer la Présence',
    markAllPresent: 'Marquer Tous Présents',
    backToGroups: 'Retour aux groupes',
    
    // Payments
    paymentManagement: 'Gestion des Paiements',
    recordPayment: 'Enregistrer Paiement',
    paymentHistory: 'Historique des Paiements',
    totalCollected: 'Total Collecté',
    pendingPayments: 'Paiements en Attente',
    paidPaymentsTitle: 'Paiements effectués / Paiements effectués',
    pendingPaymentsTitle: 'Paiements en attente / Paiements en attente',
    overduePaymentsTitle: 'Paiements en retard / Paiements en retard',
    totalRevenue: 'Revenu total',
    paidStudents: 'Étudiants payés',
    paymentsReceived: 'Paiements reçus',
    awaitingPayment: 'En attente de paiement',
    paidPayments: 'Paiements effectués',
    overduePayments: 'Paiements en retard',
    paymentDetails: 'Détails du paiement',
    studentInformation: 'Informations Étudiant',
    student: 'Étudiant',
    course: 'Cours',
    amount: 'Montant',
    paymentMethod: 'Méthode de paiement',
    transactionId: 'ID de transaction',
    paymentDate: 'Date de paiement',
    dueDate: 'Date d’échéance',
    notes: 'Notes',
    invoiceNumber: 'Numéro de facture',
    downloadInvoice: 'Télécharger la facture',
    paymentRecordedSuccessfully: 'Paiement enregistré avec succès',
    paymentUpdated: 'Paiement mis à jour',
    selectStudent: 'Sélectionner un étudiant',
    backToStudents: 'Retour aux étudiants',
    month: 'Mois',
    allStatus: 'Tous les statuts',
    allMonths: 'Tous les mois',
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    cash: 'Espèces',
    creditCard: 'Carte bancaire',
    bankTransfer: 'Virement bancaire',
    mobilePayment: 'Paiement mobile',
    check: 'Chèque',
    paymentType: 'Type de paiement',
    tuitionFee: 'Frais de scolarité',
    registrationFee: 'Frais d’inscription',
    learningMaterials: 'Supports pédagogiques',
    transportation: 'Transport',
    other: 'Autre',
    actions: 'Actions',
    
    // Reports
    reportsAnalytics: 'Rapports et Analyses',
    reportsTab: 'Rapports',
    analyticsTab: 'Analytique',
    performanceTab: 'Performance',
    quickReportsTab: 'Rapports rapides',
    recentReports: 'Rapports récents',
    exportPdf: 'Exporter PDF',
    reportTitleLabel: 'Titre',
    reportByLabel: 'Par',
    reportDateLabel: 'Date',
    reportFormatLabel: 'Format',
    reportSizeLabel: 'Taille',
    reportDownloadsLabel: 'Téléchargements',
    reportCategoryLabel: 'Catégorie',
    reportStatusLabel: 'Statut',
    reportDescriptionLabel: 'Description',
    allTypes: 'Tous les types',
    readyStatus: 'Prêt',
    generatingStatus: 'En cours',
    failedStatus: 'Échec',
    totalReports: 'Total des rapports',
    generatedToday: "Générés aujourd'hui",
    downloads: 'Téléchargements',
    reportTypeLabel: 'Type de rapport',
    dateRangeLabel: 'Période',
    todayLabel: "Aujourd'hui",
    thisWeekLabel: 'Cette semaine',
    thisMonthLabel: 'Ce mois',
    lastMonthLabel: 'Le mois dernier',
    generateReport: 'Générer un rapport',
    refreshData: 'Rafraîchir les données',
    reportConfiguration: 'Configuration du rapport',
    reportOptions: 'Options du rapport',
    reportType: 'Type de rapport',
    dateRange: 'Période',
    customRange: 'Période personnalisée',
    outputFormat: 'Format de sortie',
    includeCharts: 'Inclure des graphiques',
    includeDetails: 'Inclure des données détaillées',
    includeAnalytics: 'Inclure des analyses avancées',
    missingInformation: 'Informations manquantes',
    pleaseSelectReportTypeAndDateRange: 'Veuillez sélectionner le type de rapport et la période.',
    lastMonth: 'Le mois dernier',
    thisQuarter: 'Ce trimestre',
    reportGeneratedSuccessfully: 'Rapport généré avec succès',
    performanceReport: 'Rapport de Performance',
    analyticsReport: 'Rapport Analytique',
    metric: 'Indicateur',
    value: 'Valeur',
    change: 'Changement',
    bucket: 'Tranche',
    group: 'Groupe',
    score: 'Note',
    dataRefreshed: 'Données rafraîchies',
    allReportsUpdated: 'Tous les rapports et analyses ont été mis à jour avec les dernières informations.',
    reportExported: 'Rapport exporté',
    reportGenerated: 'Rapport généré',
    hasBeenGenerated: 'a été généré',
    hasBeenDownloaded: 'et téléchargé.',
    uploadSuccessful: 'Téléversement réussi',
    connectSupabase: 'Connectez Supabase pour enregistrer définitivement.',
    allGeneratedReports: 'Tous les rapports générés',
    reportsToday: 'Rapports aujourd\'hui',
    beingGenerated: 'En cours de génération',
    totalDownloads: 'Téléchargements totaux',
    quickReportGeneration: 'Génération rapide de rapports',
    studentEnrollmentReport: 'Rapport des Inscriptions',
    studentEnrollmentDescription: 'Statistiques et tendances d\'inscription actuelles',
    coursePerformanceReport: 'Rapport de Performance des Cours',
    coursePerformanceDescription: 'Taux d\'achèvement et avis des étudiants',
    financialOverview: 'Aperçu Financier',
    financialOverviewDescription: 'Revenus, dépenses et analyses des paiements',
    attendanceSummary: 'Résumé des Présences',
    attendanceSummaryDescription: 'Rapports quotidiens, hebdomadaires et mensuels des présences',
    veryGood: 'Très Bien (16-18)',
    fair: 'Assez Bien (12-14)',
    passing: 'Passable (10-12)',
    insufficient: 'Insuffisant (<10)',
    
    // Settings
    systemSettings: 'Paramètres Système',
    systemManagement: 'Gestion du Système',
    dataManagement: 'Gestion des Données',
    systemMaintenance: 'Maintenance Système',
    dangerZone: 'Zone de danger',
    exportData: 'Exporter les données',
    importData: 'Importer des données',
    clearCache: 'Vider le cache',
    optimizeDatabase: 'Optimiser la base de données',
    resetSystemSettings: 'Réinitialiser les paramètres système',
    thisWillResetAllSettingsToDefaults: 'Cette action réinitialisera tous les paramètres par défaut',
    resetSettings: 'Réinitialiser les paramètres',
    csvUpload: 'Import CSV',
    // CSV Upload UI
    selectDataType: 'Sélectionner le type de données',
    chooseWhatToUpload: 'Choisissez ce que vous souhaitez importer',
    downloadTemplate: 'Télécharger le modèle pour respecter le format CSV',
    uploadCSV: 'Importer un fichier CSV',
    processing: 'Traitement en cours...',
    validationErrors: 'Erreurs de validation :',
    csvValidated: 'Fichier CSV validé avec succès ! Traitement en cours...',
    records: 'enregistrements',
    uploaded: 'importés',
    failedToProcess: 'Échec du traitement du fichier CSV',
    general: 'Général',
    security: 'Sécurité',
    appearance: 'Apparence',
    system: 'Système',
    institutionName: "Nom de l'Institution",
    contactEmail: "Email de Contact",
    phoneNumber: "Numéro de Téléphone",
    timeZone: "Fuseau Horaire",
    darkMode: "Mode Sombre",
    fontSize: "Taille de Police",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    language: 'Langue',
    notifications: 'Notifications',
    markAllAsRead: 'Marquer tout comme lu',
    noNotifications: 'Aucune notification',
    notif_new_student: 'Nouvel étudiant',
    notif_payment_received: 'Paiement reçu',
    notif_attendance_warning: 'Avertissement de présence',
    notif_new_student_registration: 'Nouvelle inscription d\'étudiant',
    notif_course_schedule_updated: 'Horaire du cours mis à jour',
    notif_payment_overdue: 'Paiement en retard',
    notif_teacher_leave_request: 'Demande de congé d’enseignant',
    profile: 'Profil',
    languageSettings: 'Paramètres de Langue',
    selectLanguage: 'Sélectionner la langue',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmNewPassword: 'Confirmer le nouveau mot de passe',
    updatePassword: 'Mettre à jour le mot de passe / تحديث كلمة المرور',
    twoFactorAuth: 'Authentification à deux facteurs',
    enable2FA: 'Activer 2FA',
    twoFactorDescription: 'Ajouter une couche supplémentaire de sécurité / أضف طبقة إضافية من الأمان',
    autoLogoutAfterInactivity: 'Déconnexion automatique après inactivité / تسجيل الخروج التلقائي بعد فترة من الخمول',
    
    // Status
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    completed: 'Terminé',
    pending: 'En attente',
    upcoming: 'À venir',
    paid: 'Payé',
    overdue: 'En retard',
    cancelled: 'Annulé',
    onLeave: 'En congé',
    suspended: 'Suspendu',
    
    // Time
    today: 'Aujourd\'hui',
    thisWeek: 'Cette Semaine',
    thisMonth: 'Ce Mois',
    thisYear: 'Cette Année',
    
    // Messages
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Information',
    changeFromLastMonth: 'par rapport au mois dernier',
    requiredField: 'Ce champ est obligatoire',
    invalidEmail: 'Veuillez entrer une adresse email valide',
    passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères',
    confirmPassword: 'Confirmer le Mot de Passe',
    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
    invalidTimeRange: "L'heure de fin doit être après l'heure de début",
    timeOutOfBounds: 'Veuillez choisir des horaires entre 08:00 et 23:00',
    
    // Days of week
    sunday: 'Dimanche',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    
    // Moroccan Education Levels
    moroccanCurriculum: 'Curriculum Marocain',
    primaryEducation: 'Enseignement Primaire',
    middleEducation: 'Enseignement Collégial',
    highEducation: 'Enseignement Secondaire',
    
    // Form Labels
    required: 'Obligatoire',
    optional: 'Optionnel',
    placeholder: 'Saisir la valeur...',
    searchPlaceholder: 'Rechercher...',
    noResultsFound: 'Aucun résultat trouvé',
    selectTeacher: "Sélectionner l'enseignant",
    name: 'Nom',
    studentId: 'ID Étudiant',
    selectDepartment: 'Sélectionner le département',
    selectGrade: 'Sélectionner la classe',
    // Filters UI
    advancedFilters: 'Filtres avancés',
    clearAll: 'Tout effacer',
    deleteAll: 'Supprimer tout',
    enrollmentDateRange: "Période d'inscription",
    from: 'De',
    to: 'À',
    ageRange: 'Tranche d\'âge',
    years: 'ans',
    gpaRange: 'Tranche de moyenne',
    attendanceRange: 'Tranche de présence',
    classes: 'Classes',
    additionalFilters: 'Filtres supplémentaires',
    hasParentEmail: 'Email du parent disponible',
    hasUnpaidFees: 'Frais impayés',
    applyFilters: 'Appliquer les filtres',
    allCategories: 'Toutes les catégories',
    selectDate: 'Sélectionner la date',

    // Level Management
    levelManagement: 'Gestion des Niveaux',
    existingLevels: 'Niveaux Existants',
    initializeDefaults: 'Initialiser par Défaut',
    noLevelsFound: 'Aucun niveau trouvé',
    levelName: 'Nom du Niveau',
    orderIndex: 'Index d\'Ordre',
    createLevel: 'Créer un Niveau',
    editLevel: 'Modifier le Niveau',
    addLevel: 'Ajouter un Niveau',
    addGrade: 'Ajouter une Classe',
    noGradesYet: 'Aucune classe encore',
    saving: 'Enregistrement...',

    // Level Management
    levelManagement: 'Gestion des Niveaux',
    existingLevels: 'Niveaux Existants',
    initializeDefaults: 'Initialiser par Défaut',
    noLevelsFound: 'Aucun niveau trouvé',
    levelName: 'Nom du Niveau',
    orderIndex: 'Index d\'Ordre',
    createLevel: 'Créer un Niveau',
    editLevel: 'Modifier le Niveau',
    addLevel: 'Ajouter un Niveau',
    addGrade: 'Ajouter une Classe',
    noGradesYet: 'Aucune classe encore',
    saving: 'Enregistrement...',
    // Course management UI
    enrollmentStatus: "Statut d'inscription",
    courseProgress: 'Progression du cours',
    assignedGroups: 'Groupes assignés',
    quickStats: 'Statistiques rapides',
    avgAttendance: 'Présence moyenne',
    avgRating: 'Note moyenne',
    assignments: 'Devoirs',
    scheduled: 'Planifié',
    studentPerformance: 'Performance des étudiants',
    excellent: 'Excellent',
    good: 'Bon',
    averageLevel: 'Moyen',
    belowAverage: 'Inférieur à la moyenne',
    attendanceTrends: 'Tendances de présence',
    week: 'Semaine',
    avgStudyTimePerWeek: "Temps d’étude moyen/semaine",
    assignmentCompletion: "Taux d’achèvement des devoirs",
    studentSatisfaction: 'Satisfaction des étudiants',
    // Manage enrollment UI
    searchStudents: 'Rechercher des étudiants',
    enrollStudents: 'Inscrire des étudiants',
    unenrollStudents: 'Désinscrire des étudiants',
    currentEnrollment: 'Inscriptions en cours',
    enroll: 'Inscrire',
    unenroll: 'Retirer',
    availableStudents: 'Étudiants disponibles',
    availableSpots: 'Places disponibles',
    remainingCapacity: 'Capacité restante',
    noLimitSet: 'Aucune limite définie',
    studentsNotInThisCourse: 'Étudiants non inscrits à ce cours',
    quickActions: 'Actions Rapides',
    addNewStudent: 'Ajouter un nouvel étudiant',
    assignWholeGroup: 'Assigner un groupe entier',
    addStudent: 'Ajouter Étudiant',
    assignGroup: 'Assigner Groupe',
    fullName: 'Nom complet',
    gender: 'Genre',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
    selectGender: 'Sélectionner le genre',
    birthDate: 'Date de naissance',
    address: 'Adresse',
    createStudent: 'Créer Étudiant',
    creating: 'Création...',
    assignGroupToCourse: 'Assigner un groupe au cours',
    selectGroup: 'Sélectionner un groupe',
    chooseGroup: 'Choisir un groupe...',
    assigning: 'Attribution...',
    assignGroupNote: 'Ceci assignera le cours au groupe sélectionné. Tous les étudiants de ce groupe seront considérés comme inscrits à ce cours.',
    noStudentsAvailable: 'Aucun étudiant disponible',
    noStudentsAvailableDesc: 'Il n\'y a aucun étudiant disponible pour s\'inscrire à ce cours. Vous pouvez :',
    courseAtFullCapacity: 'Le cours est à pleine capacité',
    courseAtFullCapacityDesc: 'Ce cours a atteint sa capacité maximale. Vous ne pouvez pas inscrire plus d\'étudiants à moins d\'augmenter la capacité ou de désinscrire des étudiants existants.',
    debugInformation: 'Informations de débogage',
    courseId: 'ID du cours',
    courseGroupId: 'ID du groupe du cours',
    totalStudents: 'Total étudiants',
    enrolledStudents: 'Étudiants inscrits',
    groupsLoaded: 'Groupes chargés',
    currentGroup: 'Groupe actuel',
    sampleStudentGroupIds: 'Exemples d\'IDs de groupes d\'étudiants',
    notFound: 'Introuvable',
    
    // Actions
    addNew: 'Ajouter Nouveau',
    saveChanges: 'Enregistrer les Modifications',
    discardChanges: 'Annuler les Modifications',
    confirmDelete: 'Confirmer la Suppression',
    areYouSure: 'Êtes-vous sûr ?',
    thisActionCannotBeUndone: 'Cette action ne peut pas être annulée.',
  },
  
  ar: {
    // Common Actions
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    view: 'عرض',
    add: 'إضافة',
    search: 'بحث',
    filters: 'تصفية',
    export: 'تصدير',
    download: 'تحميل',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق',
    submit: 'إرسال',
    create: 'إنشاء',
    update: 'تحديث',
    remove: 'إزالة',

    // Subscription Management
    subscriptions: 'الاشتراكات',
    subscriptionManagement: 'إدارة الاشتراكات',
    currentPlan: 'الخطة الحالية',
    upgradePlan: 'ترقية الخطة',
    billingHistory: 'سجل الفواتير',
    usageMetrics: 'مقاييس الاستخدام',
    availablePlans: 'الخطط المتاحة',
    planFeatures: 'مميزات الخطة',
    monthlyPrice: 'السعر الشهري',
    yearlyPrice: 'السعر السنوي',
    switchToPlan: 'التحويل إلى خطة',
    currentUsage: 'الاستخدام الحالي',
    nextBillingDate: 'تاريخ الفاتورة القادمة',
    cancelSubscription: 'إلغاء الاشتراك',
    resumeSubscription: 'استئناف الاشتراك',
    planDetails: 'تفاصيل الخطة',
    studentLimit: 'حد الطلاب',
    storageLimit: 'حد التخزين',
    supportLevel: 'مستوى الدعم',
    additionalFeatures: 'مميزات إضافية',
    billingCycle: 'دورة الفواتير',
    monthly: 'شهري',
    yearly: 'سنوي',
    invoiceHistory: 'سجل الفواتير',
    downloadInvoice: 'تحميل الفاتورة',
    paymentMethod: 'طريقة الدفع',
    updatePaymentMethod: 'تحديث طريقة الدفع',
    continue: 'متابعة',
    done: 'تم',
    ok: 'موافق',
    yes: 'نعم',
    no: 'لا',
    confirm: 'تأكيد',
    downloadSchedule: 'تحميل الجدول الدراسي',
    reasonLabel: 'السبب',
    allLabel: 'الكل',
    otherLabel: 'أخرى',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    students: 'الطلاب',
    groups: 'المجموعات',
    teachers: 'المعلمون',
    courses: 'الدورات',
    subjects: 'المواد',
    attendance: 'الحضور',
    payments: 'المدفوعات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    schedule: 'الجدول الزمني',
    
    // Dashboard
    totalStudents: 'إجمالي الطلاب',
    totalTeachers: 'إجمالي المعلمين',
    totalCourses: 'إجمالي الدورات',
    attendanceRate: 'معدل الحضور',
    recentActivity: 'النشاط الأخير',
    quickActions: 'إجراءات سريعة',
    quickAdd: 'إضافة سريعة',
    overview: 'نظرة عامة',
    statistics: 'الإحصائيات',
    performanceTrends: 'اتجاهات الأداء',
    monthlyRevenue: 'الإيرادات الشهرية',
    collectionRate: 'معدل التحصيل',
    outstandingAmount: 'المبلغ المستحق',
    averageGPA: 'المعدل العام',
    enrollmentRate: 'معدل التسجيل',
    capacityUtilization: 'استغلال السعة',
    atRiskStudents: 'الطلاب المعرضون للخطر',
    projectedAnnualRevenue: 'الإيراد السنوي المتوقع',
    todaysClasses: 'حصص اليوم',
    studentsLeftAndOutstanding: 'الطلاب المنسحبون والمبالغ المستحقة',
    studentsWhoLeft: 'الطلاب الذين انسحبوا',
    // Report generator (types and sections)
    studentPerformanceReport: 'تقرير أداء الطلاب',
    financialSummaryReport: 'التقرير المالي',
    attendanceAnalysisReport: 'تحليل الحضور',
    teacherPerformanceReport: 'تقرير أداء المعلمين',
    courseAnalyticsReport: 'تحليلات الدورات',
    enrollmentReport: 'تقرير التسجيلات',
    keyMetrics: 'المؤشرات الرئيسية',
    topPerformers: 'الأعلى أداءً',
    generatedOn: 'تم الإنشاء في',
    monthlyTrends: 'الاتجاهات الشهرية',
    month: 'الشهر',
    revenue: 'الإيراد',
    collections: 'التحصيلات',
    classWiseRates: 'نسب الحضور حسب القسم',
    rate: 'النسبة',
    popularCourses: 'الدورات الشائعة',
    underperformingCourses: 'الدورات منخفضة الأداء',
    enrollmentTrends: 'اتجاهات التسجيل',
    enrollments: 'تسجيلات',
    completions: 'إنهاءات',
    gpa: 'المعدل',
    
    // Students
    studentManagement: 'إدارة الطلاب',
    addStudent: 'إضافة طالب',
    editStudent: 'تعديل طالب',
    studentProfile: 'الملف الشخصي للطالب',
    enrolledStudents: 'الطلاب المسجلون',
    studentDetails: 'تفاصيل الطالب',
    personalInformation: 'المعلومات الشخصية',
    academicInformation: 'المعلومات الأكاديمية',
    parentInformation: 'معلومات ولي الأمر/الوصي',
    courseEnrollment: 'تسجيل المقررات',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    dateOfBirth: 'تاريخ الميلاد',
    grade: 'المستوى',
    parentName: 'اسم ولي الأمر',
    parentPhone: 'هاتف ولي الأمر',
    parentEmail: 'بريد ولي الأمر الإلكتروني',
    address: 'العنوان',
    enrolledCourses: 'المقررات المسجلة',
    addStudentSuccess: 'تم إضافة الطالب بنجاح',
    studentAddedSuccessfully: 'تم تسجيل الطالب بنجاح',
    
    // Teachers
    teacherManagement: 'إدارة المعلمين',
    addTeacher: 'إضافة معلم',
    editTeacher: 'تعديل معلم',
    teacherProfile: 'الملف الشخصي للمعلم',
    teacherDetails: 'تفاصيل المعلم',
    department: 'القسم',
    joiningDate: "تاريخ الانضمام",
    salary: 'الراتب',
    
    // Groups
    groupsAndClasses: 'المجموعات والفصول',
    manageGroupsDesc: 'إدارة مجموعات الطلاب والفصول حسب المستوى الدراسي',
    newGroup: 'مجموعة جديدة',
    totalGroups: 'إجمالي المجموعات',
    activeClasses: 'الفصول النشطة',
    groupEnrolledStudents: 'الطلاب المسجلون',
    occupancyRate: 'معدل الإشغال',
    capacityUsed: 'السعة المستخدمة',
    groupLevels: 'المستويات',
    primaryMiddleHigh: 'ابتدائي، إعدادي، ثانوي',
    searchGroupsPlaceholder: 'البحث في المجموعات والمواد والمعلمين...',
    studyLevel: 'المستوى الدراسي',
    allLevels: 'جميع المستويات',
    groupPrimary: 'ابتدائي',
    groupMiddle: 'إعدادي',
    groupHigh: 'ثانوي',
    groupsCount: 'مجموعة/مجموعات',
    groupStudentsCount: 'طلاب',
    groupFull: 'مكتمل',
    almostFull: 'شبه مكتمل',
    availableSpots: 'الأماكن المتاحة',
    enrolledStudentsInGroup: 'الطلاب المسجلون',
    groupStudent: 'طالب',
    groupContact: 'التواصل',
    groupAverage: 'المعدل',
    groupAttendance: 'الحضور',
    groupEnrollment: 'التسجيل',
    noStudentsEnrolled: 'لا يوجد طلاب مسجلون في هذه المجموعة',
    groupDetails: 'التفاصيل',
    groupModify: 'تعديل',
    groupAddStudent: 'إضافة طالب',
    groupName: 'اسم المجموعة',
    level: 'المستوى',
    selectLevel: 'اختر المستوى',
    class: 'الفصل',
    selectClass: 'اختر الفصل',
    subject: 'المادة',
    selectSubject: 'اختر المادة',
    room: 'القاعة',
    capacity: 'السعة',
    flexible: 'مرن',
    morePeopleCanBeAdded: 'يمكن إضافة المزيد من الطلاب عند الحاجة',
    groupCreatedSuccessfully: 'تم إنشاء المجموعة بنجاح',
    
    // Courses
    courseManagement: 'إدارة الدورات',
    addCourse: 'إضافة دورة',
    editCourse: 'تعديل دورة',
    courseDetails: 'تفاصيل الدورة',
    manageEnrollment: 'إدارة التسجيل',
    editSchedule: 'تعديل الجدول',
    courseTitle: 'عنوان الدورة',
    description: 'الوصف',
    teacher: 'المعلم',
    assignedTeacher: 'المعلم المكلف',
    maxStudents: 'الحد الأقصى للطلاب',
    duration: 'المدة',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    startTime: 'وقت البدء',
    endTime: 'وقت الانتهاء',
    fee: 'الرسوم',
    courseFee: 'رسوم الدورة (درهم)',
    assignToGroup: 'تعيين إلى مجموعة',
    courseCreatedSuccessfully: 'تم إنشاء الدورة بنجاح',
    courseInformation: 'معلومات الدورة',
    teachingInformation: 'معلومات التدريس',
    durationAndPricing: 'المدة والتسعير',
    
    // Subjects
    subjectsManagement: 'إدارة المواد',
    addSubject: 'إضافة مادة',
    editSubject: 'تعديل مادة',
    subjectName: 'اسم المادة',
    category: 'الفئة',
    selectCategory: 'اختر الفئة',
    categories: {
      sciences: 'العلوم',
      languages: 'اللغات',
      humanities: 'العلوم الإنسانية',
      socialSciences: 'العلوم الاجتماعية',
      technology: 'التكنولوجيا',
      arts: 'الفنون',
      sports: 'الرياضة'
    },
    subjectDescription: 'الوصف',
    activeSubjects: 'المواد النشطة',
    subjectAddedSuccessfully: 'تم إضافة المادة بنجاح',
    
    // Exams
    exams: 'الامتحانات',
    examsManagement: 'إدارة الامتحانات',
    recordGrades: 'تسجيل الدرجات',
    saveGrades: 'حفظ الدرجات',
    addExam: 'إضافة امتحان',
    exam: 'امتحان',
    semester: 'فصل دراسي',
    grades: 'الدرجات',
    average: 'المعدل',
    examsChartTitle: 'نظرة عامة على نتائج الامتحانات',
    optionalFeatureNote: 'هذه الخاصية اختيارية ويمكن تفعيلها حسب المركز',
    exportExcel: 'إكسل',
    bestGradesSummary: 'أفضل الدرجات حسب المادة',
    noExamsYet: 'لا توجد امتحانات لهذا القسم بعد.',
    activeSubjectsForAverage: 'المواد النشطة (لحساب المعدل العام)',
    coefficient: 'المعامل',
    notes: 'ملاحظات',
    bulkPasteGrades: 'لصق جماعي للدرجات (CSV/Excel)',
    showComments: 'إظهار الملاحظات',
    hideComments: 'إخفاء الملاحظات',
    generalAveragePerStudent: 'المعدل العام (لكل طالب)',
    
    // Schedule
    weeklySchedule: 'الجدول الأسبوعي',
    scheduleManagement: 'إدارة الجدول الزمني',
    currentWeek: 'الأسبوع الحالي',
    previousWeek: 'الأسبوع السابق',
    nextWeek: 'الأسبوع القادم',
    dayView: 'عرض يومي',
    weekView: 'عرض أسبوعي',
    listView: 'عرض قائمة',
    totalCoursesThisWeek: 'إجمالي الدورات هذا الأسبوع',
    activeTeachers: 'المعلمون النشطون',
    groupsScheduled: 'المجموعات المجدولة',
    subjectLegend: 'دليل المواد',
    
    
    // Attendance
    attendanceManagement: 'إدارة الحضور',
    attendanceAnalyticsSummary: 'ملخص تحليل الحضور',
    averageAttendanceRate: 'متوسط معدل الحضور',
    totalClassesThisMonth: 'إجمالي الدروس هذا الشهر',
    lateArrivals: 'التأخيرات',
    perfectAttendance: 'حضور كامل',
    markAttendance: 'تسجيل الحضور',
    takeAttendance: 'أخذ الحضور',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    classOverview: 'نظرة عامة على الفصول',
    studentAttendance: 'حضور الطلاب',
    attendanceReports: 'تقارير الحضور',
    monthlyReport: 'التقرير الشهري للحضور',
    classwiseReport: 'تقرير حسب الفصل',
    studentHistory: 'تاريخ الطالب',
    attendanceAnalytics: 'تحليل الحضور',
    attendanceRecordedSuccessfully: 'تم تسجيل الحضور بنجاح',
    selectGroup: 'اختر المجموعة',
    recordAttendance: 'تسجيل الحضور',
    markAllPresent: 'تسجيل الجميع حاضر',
    backToGroups: 'العودة للمجموعات',
    
    // Payments
    paymentManagement: 'إدارة المدفوعات',
    recordPayment: 'تسجيل دفعة',
    paymentHistory: 'سجل المدفوعات',
    totalCollected: 'إجمالي المحصل',
    pendingPayments: 'مدفوعات معلقة',
    paidPaymentsTitle: 'المدفوعات المدفوعة / Paiements effectués',
    pendingPaymentsTitle: 'المدفوعات المعلقة / Paiements en attente',
    overduePaymentsTitle: 'المدفوعات المتأخرة / Paiements en retard',
    totalRevenue: 'إجمالي الإيرادات',
    paidStudents: 'الطلاب الذين دفعوا',
    paymentsReceived: 'المدفوعات المستلمة',
    awaitingPayment: 'بانتظار الدفع',
    paidPayments: 'مدفوعات مدفوعة',
    overduePayments: 'مدفوعات متأخرة',
    paymentDetails: 'تفاصيل الدفع',
    studentInformation: 'معلومات الطالب',
    student: 'الطالب',
    course: 'الدورة',
    amount: 'المبلغ',
    paymentMethod: 'طريقة الدفع',
    transactionId: 'معرف العملية',
    paymentDate: 'تاريخ الدفع',
    dueDate: 'تاريخ الاستحقاق',
    invoiceNumber: 'رقم الفاتورة',
    downloadInvoice: 'تحميل الفاتورة',
    paymentRecordedSuccessfully: 'تم تسجيل الدفعة بنجاح',
    paymentUpdated: 'تم تحديث الدفعة',
    selectStudent: 'اختر الطالب',
    backToStudents: 'العودة إلى الطلاب',
    month: 'الشهر',
    allStatus: 'كل الحالات',
    allMonths: 'كل الشهور',
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    cash: 'نقدًا',
    creditCard: 'بطاقة ائتمان',
    bankTransfer: 'تحويل بنكي',
    mobilePayment: 'دفع عبر الهاتف',
    check: 'شيك',
    paymentType: 'نوع الدفع',
    tuitionFee: 'رسوم الدراسة',
    registrationFee: 'رسوم التسجيل',
    learningMaterials: 'مواد تعليمية',
    transportation: 'النقل',
    other: 'أخرى',
    actions: 'إجراءات',
    
    // Reports
    reportsAnalytics: 'التقارير والتحليلات',
    reportsTab: 'التقارير',
    analyticsTab: 'التحليلات',
    performanceTab: 'الأداء',
    quickReportsTab: 'تقارير سريعة',
    recentReports: 'أحدث التقارير',
    exportPdf: 'تصدير PDF',
    reportTitleLabel: 'العنوان',
    reportByLabel: 'بواسطة',
    reportDateLabel: 'التاريخ',
    reportFormatLabel: 'الصيغة',
    reportSizeLabel: 'الحجم',
    reportDownloadsLabel: 'التنزيلات',
    reportCategoryLabel: 'الفئة',
    reportStatusLabel: 'الحالة',
    reportDescriptionLabel: 'الوصف',
    allTypes: 'كل الأنواع',
    readyStatus: 'جاهز',
    generatingStatus: 'جاري الإنشاء',
    failedStatus: 'فشل',
    totalReports: 'إجمالي التقارير',
    generatedToday: 'المُولّد اليوم',
    downloads: 'التنزيلات',
    reportTypeLabel: 'نوع التقرير',
    dateRangeLabel: 'نطاق التاريخ',
    todayLabel: 'اليوم',
    thisWeekLabel: 'هذا الأسبوع',
    thisMonthLabel: 'هذا الشهر',
    lastMonthLabel: 'الشهر الماضي',
    generateReport: 'إنشاء تقرير',
    refreshData: 'تحديث البيانات',
    reportConfiguration: 'إعدادات التقرير',
    reportOptions: 'خيارات التقرير',
    reportType: 'نوع التقرير',
    dateRange: 'نطاق التاريخ',
    customRange: 'نطاق مخصص',
    outputFormat: 'صيغة الإخراج',
    includeCharts: 'تضمين الرسوم البيانية',
    includeDetails: 'تضمين البيانات التفصيلية',
    includeAnalytics: 'تضمين التحليلات المتقدمة',
    missingInformation: 'معلومات ناقصة',
    pleaseSelectReportTypeAndDateRange: 'يرجى اختيار نوع التقرير ونطاق التاريخ.',
    lastMonth: 'الشهر الماضي',
    thisQuarter: 'هذا الربع',
    reportGeneratedSuccessfully: 'تم إنشاء التقرير بنجاح',
    performanceReport: 'تقرير الأداء',
    analyticsReport: 'تقرير التحليلات',
    metric: 'المؤشر',
    value: 'القيمة',
    change: 'التغير',
    bucket: 'الفئة',
    group: 'المجموعة',
    score: 'النقطة',
    dataRefreshed: 'تم تحديث البيانات',
    allReportsUpdated: 'تم تحديث جميع التقارير وبيانات التحليلات بآخر المعلومات.',
    reportExported: 'تم تصدير التقرير',
    reportGenerated: 'تم إنشاء التقرير',
    hasBeenGenerated: 'تم إنشاؤه',
    hasBeenDownloaded: 'وتم تنزيله.',
    uploadSuccessful: 'تم الرفع بنجاح',
    connectSupabase: 'اربط Supabase للحفظ بشكل دائم.',
    allGeneratedReports: 'جميع التقارير المُنشأة',
    reportsToday: 'تقارير اليوم',
    beingGenerated: 'قيد الإنشاء',
    totalDownloads: 'إجمالي التنزيلات',
    quickReportGeneration: 'إنشاء تقارير سريعة',
    studentEnrollmentReport: 'تقرير تسجيل الطلاب',
    studentEnrollmentDescription: 'إحصائيات وتوجهات التسجيل الحالية',
    coursePerformanceReport: 'تقرير أداء المقررات',
    coursePerformanceDescription: 'معدلات الإكمال وتعليقات الطلاب',
    financialOverview: 'نظرة مالية عامة',
    financialOverviewDescription: 'الإيرادات والمصروفات وتحليلات المدفوعات',
    attendanceSummary: 'ملخص الحضور',
    attendanceSummaryDescription: 'تقارير الحضور اليومية والأسبوعية والشهرية',
    veryGood: 'جيد جدًا (16-18)',
    fair: 'مقبول (12-14)',
    passing: 'نجاح (10-12)',
    insufficient: 'غير كاف (<10)',
  },
};

export const getTranslation = (language: Language): Translation => {
  return translations[language];
};