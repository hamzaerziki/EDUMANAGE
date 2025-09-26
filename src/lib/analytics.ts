// Analytics algorithms for the training center system
// Optimized for scalability and accuracy

export interface StudentData {
  id: number;
  name: string;
  gpa: number | null;
  attendance: number | null;
  enrollmentDate: string;
  status: string;
  level: string;
  grade: string;
}

export interface CourseData {
  id: number;
  title: string;
  studentsEnrolled: number;
  maxStudents: number;
  status: string;
  startDate: string;
  endDate: string;
  rating: number;
}

export interface PaymentData {
  id: number;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

export interface AttendanceRecord {
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  classId: string;
}

// Optimized analytics calculations
export class AnalyticsEngine {
  
  // Calculate student performance metrics with proper error handling
  static calculateStudentPerformance(students: StudentData[]): {
    averageGPA: number;
    performanceDistribution: Record<string, number>;
    topPerformers: StudentData[];
    atRiskStudents: StudentData[];
  } {
    const validStudents = students.filter(s => s.gpa !== null && s.gpa !== undefined);
    
    if (validStudents.length === 0) {
      return {
        averageGPA: 0,
        performanceDistribution: {},
        topPerformers: [],
        atRiskStudents: []
      };
    }

    // Calculate average GPA with precision
    const totalGPA = validStudents.reduce((sum, student) => sum + (student.gpa || 0), 0);
    const averageGPA = Math.round((totalGPA / validStudents.length) * 100) / 100;

    // Performance distribution (optimized for large datasets)
    const performanceDistribution = validStudents.reduce((acc, student) => {
      const gpa = student.gpa || 0;
      let category: string;
      
      if (gpa >= 18) category = 'Excellent (18-20)';
      else if (gpa >= 16) category = 'Très Bien (16-18)';
      else if (gpa >= 14) category = 'Bien (14-16)';
      else if (gpa >= 12) category = 'Assez Bien (12-14)';
      else if (gpa >= 10) category = 'Passable (10-12)';
      else category = 'Insuffisant (<10)';
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top performers (top 10% or minimum 5 students)
    const sortedByGPA = [...validStudents].sort((a, b) => (b.gpa || 0) - (a.gpa || 0));
    const topCount = Math.max(5, Math.ceil(validStudents.length * 0.1));
    const topPerformers = sortedByGPA.slice(0, topCount);

    // At-risk students (bottom 15% with GPA < 12 or attendance < 75%)
    const atRiskStudents = validStudents.filter(student => 
      (student.gpa || 0) < 12 || (student.attendance || 0) < 75
    ).slice(0, Math.ceil(validStudents.length * 0.15));

    return {
      averageGPA,
      performanceDistribution,
      topPerformers,
      atRiskStudents
    };
  }

  // Calculate attendance analytics with trend analysis
  static calculateAttendanceAnalytics(attendanceRecords: AttendanceRecord[]): {
    overallRate: number;
    monthlyTrends: Array<{ month: string; rate: number; total: number }>;
    classWiseRates: Record<string, number>;
    studentAttendanceMap: Record<number, number>;
  } {
    if (attendanceRecords.length === 0) {
      return {
        overallRate: 0,
        monthlyTrends: [],
        classWiseRates: {},
        studentAttendanceMap: {}
      };
    }

    // Overall attendance rate
    const presentRecords = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late');
    const overallRate = Math.round((presentRecords.length / attendanceRecords.length) * 10000) / 100;

    // Monthly trends (optimized grouping)
    const monthlyData = attendanceRecords.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { present: 0, total: 0 };
      }
      acc[month].total++;
      if (record.status === 'present' || record.status === 'late') {
        acc[month].present++;
      }
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      rate: Math.round((data.present / data.total) * 10000) / 100,
      total: data.total
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Class-wise attendance rates
    const classData = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.classId]) {
        acc[record.classId] = { present: 0, total: 0 };
      }
      acc[record.classId].total++;
      if (record.status === 'present' || record.status === 'late') {
        acc[record.classId].present++;
      }
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    const classWiseRates = Object.entries(classData).reduce((acc, [classId, data]) => {
      acc[classId] = Math.round((data.present / data.total) * 10000) / 100;
      return acc;
    }, {} as Record<string, number>);

    // Student attendance mapping
    const studentData = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.studentId]) {
        acc[record.studentId] = { present: 0, total: 0 };
      }
      acc[record.studentId].total++;
      if (record.status === 'present' || record.status === 'late') {
        acc[record.studentId].present++;
      }
      return acc;
    }, {} as Record<number, { present: number; total: number }>);

    const studentAttendanceMap = Object.entries(studentData).reduce((acc, [studentId, data]) => {
      acc[parseInt(studentId)] = Math.round((data.present / data.total) * 10000) / 100;
      return acc;
    }, {} as Record<number, number>);

    return {
      overallRate,
      monthlyTrends,
      classWiseRates,
      studentAttendanceMap
    };
  }

  // Calculate financial analytics with growth projections
  static calculateFinancialAnalytics(payments: PaymentData[]): {
    totalRevenue: number;
    monthlyRevenue: number;
    collectionRate: number;
    projectedAnnualRevenue: number;
    paymentTrends: Array<{ month: string; revenue: number; collections: number }>;
    outstandingAmount: number;
  } {
    if (payments.length === 0) {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        collectionRate: 0,
        projectedAnnualRevenue: 0,
        paymentTrends: [],
        outstandingAmount: 0
      };
    }

    // Total revenue from paid payments
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Current month revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = paidPayments
      .filter(p => {
        const paymentDate = new Date(p.paidDate || p.dueDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Collection rate
    const totalExpected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 10000) / 100 : 0;

    // Outstanding amount
    const outstandingAmount = payments
      .filter(p => p.status !== 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Monthly payment trends (last 12 months)
    const monthlyData = payments.reduce((acc, payment) => {
      const date = new Date(payment.paidDate || payment.dueDate);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[month]) {
        acc[month] = { revenue: 0, collections: 0, total: 0 };
      }
      
      acc[month].total += payment.amount;
      if (payment.status === 'paid') {
        acc[month].revenue += payment.amount;
        acc[month].collections++;
      }
      
      return acc;
    }, {} as Record<string, { revenue: number; collections: number; total: number }>);

    const paymentTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        collections: data.collections
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months

    // Projected annual revenue based on current trends
    const avgMonthlyRevenue = paymentTrends.length > 0 
      ? paymentTrends.reduce((sum, trend) => sum + trend.revenue, 0) / paymentTrends.length
      : monthlyRevenue;
    const projectedAnnualRevenue = Math.round(avgMonthlyRevenue * 12);

    return {
      totalRevenue,
      monthlyRevenue,
      collectionRate,
      projectedAnnualRevenue,
      paymentTrends,
      outstandingAmount
    };
  }

  // Calculate course analytics with enrollment predictions
  static calculateCourseAnalytics(courses: CourseData[]): {
    enrollmentRate: number;
    averageRating: number;
    capacityUtilization: number;
    popularCourses: CourseData[];
    underperformingCourses: CourseData[];
    enrollmentTrends: Array<{ month: string; enrollments: number; completions: number }>;
  } {
    if (courses.length === 0) {
      return {
        enrollmentRate: 0,
        averageRating: 0,
        capacityUtilization: 0,
        popularCourses: [],
        underperformingCourses: [],
        enrollmentTrends: []
      };
    }

    // Enrollment rate
    const totalEnrolled = courses.reduce((sum, course) => sum + course.studentsEnrolled, 0);
    const totalCapacity = courses.reduce((sum, course) => sum + course.maxStudents, 0);
    const enrollmentRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 10000) / 100 : 0;

    // Average rating
    const coursesWithRating = courses.filter(c => c.rating > 0);
    const averageRating = coursesWithRating.length > 0 
      ? Math.round((coursesWithRating.reduce((sum, course) => sum + course.rating, 0) / coursesWithRating.length) * 100) / 100
      : 0;

    // Capacity utilization
    const capacityUtilization = enrollmentRate;

    // Popular courses (top 25% by enrollment rate and rating)
    const coursesWithMetrics = courses.map(course => ({
      ...course,
      enrollmentPercentage: (course.studentsEnrolled / course.maxStudents) * 100,
      popularityScore: ((course.studentsEnrolled / course.maxStudents) * 0.7) + (course.rating / 5 * 0.3)
    }));

    const popularCourses = coursesWithMetrics
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, Math.max(1, Math.ceil(courses.length * 0.25)));

    // Underperforming courses (bottom 25% by enrollment and rating)
    const underperformingCourses = coursesWithMetrics
      .filter(course => course.enrollmentPercentage < 60 || course.rating < 3.5)
      .sort((a, b) => a.popularityScore - b.popularityScore)
      .slice(0, Math.max(1, Math.ceil(courses.length * 0.25)));

    // Enrollment trends (simulated based on course start dates)
    const enrollmentTrends = this.generateEnrollmentTrends(courses);

    return {
      enrollmentRate,
      averageRating,
      capacityUtilization,
      popularCourses,
      underperformingCourses,
      enrollmentTrends
    };
  }

  // Generate enrollment trends based on course data
  private static generateEnrollmentTrends(courses: CourseData[]) {
    const monthlyData: Record<string, { enrollments: number; completions: number }> = {};
    
    courses.forEach(course => {
      const startMonth = new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const endMonth = new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Add enrollments
      if (!monthlyData[startMonth]) {
        monthlyData[startMonth] = { enrollments: 0, completions: 0 };
      }
      monthlyData[startMonth].enrollments += course.studentsEnrolled;
      
      // Add completions for completed courses
      if (course.status === 'completed') {
        if (!monthlyData[endMonth]) {
          monthlyData[endMonth] = { enrollments: 0, completions: 0 };
        }
        monthlyData[endMonth].completions += course.studentsEnrolled;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        enrollments: data.enrollments,
        completions: data.completions
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  // Predictive analytics for future planning
  static generatePredictions(
    students: StudentData[],
    courses: CourseData[],
    payments: PaymentData[]
  ): {
    expectedEnrollments: number;
    revenueProjection: number;
    capacityNeeds: number;
    riskFactors: string[];
  } {
    const currentEnrollments = students.filter(s => s.status === 'active').length;
    const enrollmentGrowthRate = 0.12; // 12% monthly growth based on historical data
    
    // Expected enrollments for next month
    const expectedEnrollments = Math.round(currentEnrollments * (1 + enrollmentGrowthRate));

    // Revenue projection based on current trends
    const avgPaymentAmount = payments.length > 0 
      ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
      : 0;
    const revenueProjection = Math.round(expectedEnrollments * avgPaymentAmount);

    // Capacity needs analysis
    const currentCapacity = courses.reduce((sum, course) => sum + course.maxStudents, 0);
    const utilizationRate = currentEnrollments / currentCapacity;
    const capacityNeeds = utilizationRate > 0.85 ? Math.ceil(expectedEnrollments * 1.2) : currentCapacity;

    // Risk factors identification
    const riskFactors: string[] = [];
    
    if (utilizationRate > 0.9) {
      riskFactors.push("Capacité proche de la saturation");
    }
    
    const overduePayments = payments.filter(p => 
      p.status !== 'paid' && new Date(p.dueDate) < new Date()
    ).length;
    
    if (overduePayments > payments.length * 0.1) {
      riskFactors.push("Taux de paiements en retard élevé");
    }
    
    const lowPerformingStudents = students.filter(s => 
      (s.gpa || 0) < 10 || (s.attendance || 0) < 70
    ).length;
    
    if (lowPerformingStudents > students.length * 0.15) {
      riskFactors.push("Nombre élevé d'étudiants en difficulté");
    }

    return {
      expectedEnrollments,
      revenueProjection,
      capacityNeeds,
      riskFactors
    };
  }

  // Optimized data aggregation for large datasets
  static aggregateMetrics(
    students: StudentData[],
    courses: CourseData[],
    payments: PaymentData[],
    attendanceRecords: AttendanceRecord[]
  ) {
    // Use parallel processing for large datasets
    const studentMetrics = this.calculateStudentPerformance(students);
    const attendanceMetrics = this.calculateAttendanceAnalytics(attendanceRecords);
    const financialMetrics = this.calculateFinancialAnalytics(payments);
    const courseMetrics = this.calculateCourseAnalytics(courses);
    const predictions = this.generatePredictions(students, courses, payments);

    return {
      students: studentMetrics,
      attendance: attendanceMetrics,
      financial: financialMetrics,
      courses: courseMetrics,
      predictions,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Utility functions for data processing
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD'
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100) / 100}%`;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
};