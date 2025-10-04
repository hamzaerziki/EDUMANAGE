// Simple cache for API responses to reduce redundant calls
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = {
  SHORT: 30 * 1000,    // 30 seconds
  MEDIUM: 2 * 60 * 1000, // 2 minutes  
  LONG: 5 * 60 * 1000    // 5 minutes
};

// Cache invalidation patterns - when one entity changes, clear related caches
const CACHE_INVALIDATION_PATTERNS = {
  subjects: ['/subjects/', '/teachers/'], // When subjects change, clear teachers cache too (for subject selection)
  teachers: ['/teachers/', '/courses/', '/stats/'], // When teachers change, clear courses and stats
  students: ['/students/', '/groups/', '/attendance/', '/payments/', '/stats/'],
  courses: ['/courses/', '/teachers/', '/groups/', '/stats/'],
  groups: ['/groups/', '/students/', '/courses/', '/stats/'],
  payments: ['/payments/', '/students/', '/stats/'],
  attendance: ['/attendance/', '/students/', '/stats/'],
  exams: ['/exams/', '/students/', '/courses/', '/stats/'],
  events: ['/events/', '/stats/'],
  timetable: ['/timetable/', '/teachers/', '/courses/'],
  subjectGrades: ['/grades/', '/subjects/', '/students/', '/stats/'],
  feedback: ['/feedback/', '/teachers/', '/courses/', '/stats/']
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const AUTH_TOKEN_KEY = 'authToken';
const LAST_ACTIVITY_KEY = 'lastActivity';
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes instead of 5 minutes

function getAuthToken(): string | null {
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

function isTokenExpired(): boolean {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
    return last && now - last > INACTIVITY_LIMIT_MS;
  } catch {
    return true;
  }
}

function clearAuthData(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('currentUser');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {}
}

function getCachedData<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number): void {
  apiCache.set(key, { data, timestamp: Date.now(), ttl });
}

// Enhanced cache invalidation function
function invalidateCache(entity: keyof typeof CACHE_INVALIDATION_PATTERNS): void {
  const patterns = CACHE_INVALIDATION_PATTERNS[entity];
  let clearedCount = 0;
  
  patterns.forEach(pattern => {
    for (const [key] of apiCache) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
        clearedCount++;
      }
    }
  });
  
  console.log(`🗑️ Cache invalidated for ${entity}: cleared ${clearedCount} entries`);
}

// Force refresh function for critical operations
function forceRefresh(): void {
  apiCache.clear();
  console.log('🗑️ Full cache cleared - forcing fresh data load');
}

export async function apiRequest<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(opts.headers as any || {}),
  };
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const method = (opts.method || 'GET').toUpperCase();
  
  // Only cache GET requests
  if (method === 'GET') {
    // Avoid stale caches on GET
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    headers['Pragma'] = 'no-cache';
    
    const cacheKey = `${method}:${API_BASE}${path}`;
    const cachedData = getCachedData<T>(cacheKey);
    if (cachedData) {
      console.log('📦 Using cached data for:', path);
      return cachedData;
    }
  }

  // Check for session expiry before making request
  if (token && isTokenExpired()) {
    console.warn('Session expired due to inactivity');
    clearAuthData();
    // Redirect to login instead of throwing error
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login';
      return Promise.reject(new Error('Session expired - redirecting to login'));
    }
  }

  // Update last activity timestamp on each request (only if we have a token)
  if (token) {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch {}
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    method,
    headers,
    cache: 'no-store',
  });
  
  if (res.status === 401) {
    console.warn('Received 401 Unauthorized - clearing auth data');
    clearAuthData();
    // Redirect to login instead of throwing error
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login';
      return Promise.reject(new Error('Unauthorized - redirecting to login'));
    }
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    // Cache successful GET responses
    if (method === 'GET') {
      const cacheKey = `${method}:${API_BASE}${path}`;
      setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);
    }
    return data;
  }
  
  // @ts-ignore
  const textData = await res.text();
  if (method === 'GET') {
    const cacheKey = `${method}:${API_BASE}${path}`;
    setCachedData(cacheKey, textData, CACHE_TTL.SHORT);
  }
  // @ts-ignore
  return textData;
}

export async function loginBackend(username: string, password: string): Promise<{ access_token: string; token_type?: string; username?: string; }>{
  console.log('Attempting login with:', { username, API_BASE });
  
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Login error:', error);
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  } catch (error) {
    console.error('Login exception:', error);
    throw error;
  }
}


export async function registerAdmin(username: string, password: string): Promise<{ access_token: string; username?: string; }>{
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export const groupsApi = {
  async list(): Promise<Array<{ id: number; name: string; level?: string; year?: number; capacity?: number }>> {
    return apiRequest('/groups/');
  },
  async get(id: number): Promise<{ id: number; name: string; level?: string; year?: number; capacity?: number | null }>{
    return apiRequest(`/groups/${id}`);
  },
  async create(data: { name: string; level?: string; year?: number; capacity?: number | null }): Promise<{ id: number; name: string; level?: string; year?: number; capacity?: number | null }> {
    await apiRequest('/groups/', { method: 'POST', body: JSON.stringify({
      name: data.name,
      level: data.level ?? null,
      year: data.year ?? null,
      capacity: data.capacity ?? null,
    }) });
    invalidateCache('groups');
    return { id: 0, name: data.name, level: data.level, year: data.year, capacity: data.capacity };
  },
  async update(id: number, data: Partial<{ name: string; level?: string; year?: number; capacity?: number | null }>): Promise<any> {
    await apiRequest(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('groups');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/groups/${id}`, { method: 'DELETE' });
    invalidateCache('groups');
    return { ok: true };
  }
};

export const eventsApi = {
  async feed(): Promise<any[]> {
    return apiRequest('/events/fullcalendar');
  },
  async create(data: { title: string; description?: string; type?: string; location?: string; start: string; end?: string }): Promise<any> {
    await apiRequest('/events/', { method: 'POST', body: JSON.stringify({
      title: data.title,
      description: data.description || '',
      type: data.type || 'event',
      start: data.start,
      end: data.end || data.start,
    }) });
    invalidateCache('events');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/events/${id}`, { method: 'DELETE' });
    invalidateCache('events');
    return { ok: true };
  }
};

export const paymentsApi = {
  async list(): Promise<any[]> {
    return apiRequest('/payments/');
  },
  async create(data: { student_id: number; amount: number; date: string; method?: string | null; status?: 'paid'|'unpaid' }): Promise<any> {
    await apiRequest('/payments/', { method: 'POST', body: JSON.stringify({
      student_id: data.student_id,
      amount: data.amount,
      date: data.date,
      method: data.method ?? null,
      status: data.status ?? 'paid',
    }) });
    invalidateCache('payments');
    return {};
  },
  async get(id: number): Promise<any> { 
    return apiRequest(`/payments/${id}`);
  },
  async update(id: number, data: Partial<{ student_id: number; amount: number; date: string; method?: string | null; status?: 'paid'|'unpaid' }>): Promise<any> {
    await apiRequest(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('payments');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/payments/${id}`, { method: 'DELETE' });
    invalidateCache('payments');
    return { ok: true };
  },
  async receipt(id: number): Promise<{ path: string }>{
    return apiRequest(`/payments/${id}/receipt`);
  }
};

export const studentsApi = {
  async list(): Promise<any[]> {
    return apiRequest('/students/');
  },
  async get(id: number): Promise<any> { 
    return apiRequest(`/students/${id}`);
  },
  async create(data: { full_name: string; email?: string | null; phone?: string | null; birth_date?: string | null; gender?: string | null; address?: string | null; group_id?: number | null; status?: string | null }): Promise<any> {
    const payload = {
      full_name: data.full_name,
      birth_date: data.birth_date ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      group_id: data.group_id ?? null,
      status: data.status ?? 'active',
    };
    await apiRequest('/students/', { method: 'POST', body: JSON.stringify(payload) });
    invalidateCache('students');
    return {};
  },
  async update(id: number, data: Partial<{ full_name: string; email?: string | null; phone?: string | null; birth_date?: string | null; gender?: string | null; address?: string | null; group_id?: number | null; status?: string | null }>): Promise<any> {
    await apiRequest(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('students');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/students/${id}`, { method: 'DELETE' });
    invalidateCache('students');
    return { ok: true };
  }
};

export const timetableApi = {
  async list(): Promise<any[]> { 
    return apiRequest('/timetable/');
  },
  async create(data: { group_id: number; day_of_week: number; start_time: string; end_time: string; course_id?: number | null }): Promise<any> {
    await apiRequest('/timetable/', { method: 'POST', body: JSON.stringify({
      group_id: data.group_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      course_id: data.course_id ?? null,
    }) });
    invalidateCache('timetable');
    return {};
  },
  async update(id: number, data: Partial<{ group_id: number; day_of_week: number; start_time: string; end_time: string; course_id?: number | null }>): Promise<any> {
    await apiRequest(`/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('timetable');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/timetable/${id}`, { method: 'DELETE' });
    invalidateCache('timetable');
    return { ok: true };
  },
  async groupPdf(groupId: number): Promise<{ path: string }>{
    return apiRequest(`/timetable/group/${groupId}/pdf`);
  },
};

export const coursesApi = {
  async list(): Promise<any[]> { 
    return apiRequest('/courses/');
  },
  async get(id: number): Promise<any> { 
    return apiRequest(`/courses/${id}`);
  },
  async create(data: { name: string; teacher_id?: number | null; group_id?: number | null }): Promise<any> {
    await apiRequest('/courses/', { method: 'POST', body: JSON.stringify({
      name: data.name,
      teacher_id: data.teacher_id ?? null,
      group_id: data.group_id ?? null,
    }) });
    invalidateCache('courses');
    return {};
  },
  async update(id: number, data: Partial<{ name: string; teacher_id?: number | null; group_id?: number | null }>): Promise<any> {
    await apiRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('courses');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }> {
    await apiRequest(`/courses/${id}`, { method: 'DELETE' });
    invalidateCache('courses');
    return { ok: true };
  }
};

export const teachersApi = {
  async list(): Promise<any[]> { 
    return apiRequest('/teachers/');
  },
  async get(id: number): Promise<any> { 
    return apiRequest(`/teachers/${id}`);
  },
  async stats(id: number): Promise<{
    students: number;
    subjects: number;
    experience: number;
    satisfaction: number;
    attendance: number;
    gradeImprovement: number;
    feedbackCount: number;
    averageRating: number;
  }> { 
    try {
      console.log(`Getting stats for teacher ID: ${id}`);
      // Try to get real stats from backend first
      const stats = await apiRequest(`/teachers/${id}/stats`);
      console.log('Backend stats response:', stats);
      
      // Validate the response has all required fields
      if (stats && typeof stats === 'object') {
        return {
          students: Number(stats.students) || 0,
          subjects: Number(stats.subjects) || 0,
          experience: Number(stats.experience) || 0,
          satisfaction: Number(stats.satisfaction) || 0,
          attendance: Number(stats.attendance) || 85,
          gradeImprovement: Number(stats.gradeImprovement) || 0,
          feedbackCount: Number(stats.feedbackCount) || 0,
          averageRating: Number(stats.averageRating) || 0,
        };
      }
    } catch (error) {
      console.error('Backend stats failed, calculating from frontend:', error);
    }

    // Fallback calculation with comprehensive error handling
    try {
      console.log(`Calculating fallback stats for teacher ID: ${id}`);
      
      // Initialize default values
      let teacher = null;
      let courses = [];
      let students = [];
      let feedbackStats = {
        averageRating: 0,
        totalFeedbacks: 0,
        satisfactionScore: 0,
        teachingQuality: 0,
        courseContent: 0,
        communication: 0,
        helpfulness: 0
      };

      // Safely load data with individual error handling
      try {
        teacher = await apiRequest(`/teachers/${id}`);
        console.log('Teacher data loaded:', teacher);
      } catch (e) {
        console.warn('Failed to load teacher data:', e);
      }

      try {
        const allCourses = await coursesApi.list();
        courses = Array.isArray(allCourses) ? allCourses : [];
        console.log('All courses loaded:', courses.length);
      } catch (e) {
        console.warn('Failed to load courses:', e);
        courses = [];
      }

      try {
        const allStudents = await studentsApi.list();
        students = Array.isArray(allStudents) ? allStudents : [];
        console.log('All students loaded:', students.length);
      } catch (e) {
        console.warn('Failed to load students:', e);
        students = [];
      }

      try {
        feedbackStats = await feedbackApi.getStatsByTeacher(id);
        console.log('Feedback stats loaded:', feedbackStats);
      } catch (e) {
        console.warn('Failed to load feedback stats:', e);
      }

      // Safe calculation with null checks
      const teacherCourses = courses.filter((c: any) => c && c.teacher_id === id);
      console.log('Teacher courses:', teacherCourses.length);

      const teacherGroupIds = teacherCourses
        .map((c: any) => c && c.group_id)
        .filter((id: any) => id != null);
      console.log('Teacher group IDs:', teacherGroupIds);

      const studentsInTeacherGroups = students.filter((s: any) => 
        s && s.group_id && teacherGroupIds.includes(s.group_id)
      );
      console.log('Students in teacher groups:', studentsInTeacherGroups.length);

      // Count unique students safely
      const enrolledStudents = new Set();
      
      if (Array.isArray(studentsInTeacherGroups)) {
        studentsInTeacherGroups.forEach((s: any) => {
          if (s && s.id) {
            enrolledStudents.add(s.id);
          }
        });
      }

      // Add students from course enrollments safely
      if (Array.isArray(teacherCourses)) {
        teacherCourses.forEach((course: any) => {
          if (course && course.enrolled_students && Array.isArray(course.enrolled_students)) {
            course.enrolled_students.forEach((studentId: any) => {
              if (studentId != null) {
                enrolledStudents.add(studentId);
              }
            });
          }
        });
      }

      const totalStudents = enrolledStudents.size;
      console.log('Total unique students:', totalStudents);

      // Calculate subjects safely
      const uniqueSubjects = new Set();
      if (Array.isArray(teacherCourses)) {
        teacherCourses.forEach((c: any) => {
          if (c && c.name && typeof c.name === 'string' && c.name.trim()) {
            uniqueSubjects.add(c.name.trim());
          }
        });
      }

      // Calculate experience safely
      let experience = 0;
      if (teacher && teacher.created_at) {
        try {
          const joinDate = new Date(teacher.created_at);
          experience = Math.max(0, new Date().getFullYear() - joinDate.getFullYear());
        } catch (e) {
          console.warn('Error calculating experience:', e);
        }
      }

      // Calculate satisfaction safely
      let satisfactionPercentage = 0;
      if (feedbackStats && typeof feedbackStats.satisfactionScore === 'number' && feedbackStats.satisfactionScore > 0) {
        satisfactionPercentage = Math.round((feedbackStats.satisfactionScore / 10) * 100);
      }

      // Calculate grade improvement safely
      let gradeImprovement = 0;
      if (feedbackStats && typeof feedbackStats.teachingQuality === 'number' && feedbackStats.teachingQuality > 0) {
        gradeImprovement = Math.round((feedbackStats.teachingQuality / 5) * 100);
      }

      const result = {
        students: totalStudents,
        subjects: uniqueSubjects.size,
        experience: experience,
        satisfaction: satisfactionPercentage,
        attendance: 85, // Default
        gradeImprovement: gradeImprovement,
        feedbackCount: Number(feedbackStats?.totalFeedbacks) || 0,
        averageRating: Number(feedbackStats?.averageRating) || 0,
      };

      console.log('Calculated teacher stats:', result);
      return result;

    } catch (error) {
      console.error('Error in fallback calculation:', error);
      return {
        students: 0,
        subjects: 0,
        experience: 0,
        satisfaction: 0,
        attendance: 85,
        gradeImprovement: 0,
        feedbackCount: 0,
        averageRating: 0,
      };
    }
  },
  async getOverviewStats(): Promise<{
    totalTeachers: number;
    activeTeachers: number;
    onLeave: number;
    newThisMonth: number;
  }> {
    return apiRequest('/teachers/stats/overview');
  },
  async updateStats(id: number): Promise<any> {
    return apiRequest(`/teachers/${id}/update-stats`, { method: 'POST' });
  },
  async updateAllStats(): Promise<any> {
    return apiRequest('/teachers/update-all-stats', { method: 'POST' });
  },
  async debugStats(id: number): Promise<any> {
    return apiRequest(`/teachers/${id}/debug-stats`);
  },
  async create(data: { full_name: string; speciality?: string | null; email?: string | null; phone?: string | null }): Promise<any> {
    await apiRequest('/teachers/', { method: 'POST', body: JSON.stringify({
      full_name: data.full_name,
      speciality: data.speciality ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
    }) });
    invalidateCache('teachers');
    return {};
  },
  async update(id: number, data: Partial<{ full_name: string; speciality?: string | null; email?: string | null; phone?: string | null }>): Promise<any> {
    await apiRequest(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('teachers');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{
    await apiRequest(`/teachers/${id}`, { method: 'DELETE' });
    invalidateCache('teachers');
    return { ok: true };
  },
};

export const attendanceApi = {
  async list(): Promise<any[]> { 
    return apiRequest(`/attendance/?_=${Date.now()}`);
  },
  async create(data: { student_id: number; date: string; status: 'present'|'absent'|'late' }): Promise<any> {
    await apiRequest('/attendance/', { method: 'POST', body: JSON.stringify(data) });
    invalidateCache('attendance');
    return {};
  },
  async update(id: number, data: Partial<{ student_id: number; date: string; status: 'present'|'absent'|'late' }>): Promise<any> {
    await apiRequest(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('attendance');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }>{ 
    await apiRequest(`/attendance/${id}`, { method: 'DELETE' });
    invalidateCache('attendance');
    return { ok: true };
  }
};

export const subjectsApi = {
  async list(): Promise<Array<{ id: number; name: string; category?: string | null; description?: string | null; is_active: boolean }>> {
    return apiRequest('/subjects/');
  },
  async create(data: { name: string; category?: string | null; description?: string | null; is_active?: boolean }): Promise<any> {
    await apiRequest('/subjects/', { method: 'POST', body: JSON.stringify({
      name: data.name,
      category: data.category ?? null,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
    }) });
    invalidateCache('subjects');
    return {};
  },
  async update(id: number, data: Partial<{ name: string; category?: string | null; description?: string | null; is_active?: boolean }>): Promise<any> {
    await apiRequest(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('subjects');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }> {
    await apiRequest(`/subjects/${id}`, { method: 'DELETE' });
    invalidateCache('subjects');
    return { ok: true };
  },
};

export const examsApi = {
  async list(): Promise<any[]> {
    return apiRequest('/exams/');
  },
  async create(data: { course_id: number; group_id: number; exam_date: string; max_score?: number }): Promise<any> {
    await apiRequest('/exams/', { method: 'POST', body: JSON.stringify({
      course_id: data.course_id,
      group_id: data.group_id,
      exam_date: data.exam_date,
      max_score: data.max_score ?? 20.0,
    }) });
    invalidateCache('exams');
    return {};
  },
  async get(id: number): Promise<any> {
    return apiRequest(`/exams/${id}`);
  },
  async update(id: number, data: Partial<{ course_id: number; group_id: number; exam_date: string; max_score: number }>): Promise<any> {
    await apiRequest(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('exams');
    return {};
  },
  async remove(id: number): Promise<{ ok: boolean }> {
    await apiRequest(`/exams/${id}`, { method: 'DELETE' });
    invalidateCache('exams');
    return { ok: true };
  },
  async recordResults(examId: number, results: Array<{ student_id: number; score: number }>): Promise<any[]> {
    // Note: old endpoint expects exam_id inside each result as well
    await apiRequest(`/exams/${examId}/results`, { method: 'POST', body: JSON.stringify({ results: results.map(r => ({ ...r, exam_id: examId })) }) });
    invalidateCache('exams');
    return [];
  },
};

export const subjectGradesApi = {
  async upsertBulk(payload: { grades: Array<{ student_id: number; group_id: number; subject: string; exam_name: string; grade: number; coefficient: number; semester: string }> }): Promise<any[]> {
    await apiRequest('/subject-grades/bulk', { method: 'POST', body: JSON.stringify(payload) });
    invalidateCache('subjectGrades');
    return [];
  },
  async getByGroupSubject(params: { group_id: number; subject: string; semester: string }): Promise<any[]> {
    const q = new URLSearchParams({ group_id: String(params.group_id), subject: params.subject, semester: params.semester }).toString();
    return apiRequest(`/subject-grades/by-group-subject?${q}`);
  },
  async getAveragesByGroup(params: { group_id: number; semester: string }): Promise<Array<{ student_id: number; full_name: string; average: number | null; sum_coefficients: number; subjects: Array<{ subject: string; coefficient: number; average: number }> }>> {
    const q = new URLSearchParams({ group_id: String(params.group_id), semester: params.semester }).toString();
    return apiRequest(`/subject-grades/averages/by-group?${q}`);
  },
  async getByStudent(params: { student_id: number; semester?: string; group_id?: number }): Promise<any[]> {
    const q = new URLSearchParams({ student_id: String(params.student_id) });
    if (params.semester) q.set('semester', params.semester);
    if (params.group_id != null) q.set('group_id', String(params.group_id));
    return apiRequest(`/subject-grades/by-student?${q.toString()}`);
  },
};

export const feedbackApi = {
  async list(): Promise<any[]> { 
    return apiRequest('/feedback/');
  },
  
  async create(data: { 
    student_id: number; 
    teacher_id: number; 
    course_id: number; 
    rating: number; // 1-5 stars
    satisfaction_score: number; // 1-10
    teaching_quality: number; // 1-5
    course_content: number; // 1-5
    communication: number; // 1-5
    helpfulness: number; // 1-5
    comments?: string;
  }): Promise<any> {
    await apiRequest('/feedback/', { method: 'POST', body: JSON.stringify(data) });
    invalidateCache('feedback');
    return {};
  },
  
  async getByTeacher(teacherId: number): Promise<any[]> { 
    return apiRequest(`/feedback/teacher/${teacherId}`);
  },
  
  async getStatsByTeacher(teacherId: number): Promise<{
    averageRating: number;
    totalFeedbacks: number;
    satisfactionScore: number;
    teachingQuality: number;
    courseContent: number;
    communication: number;
    helpfulness: number;
  }> {
    return apiRequest(`/feedback/teacher/${teacherId}/stats`);
  },
  
  async getTeacherStats(teacherId: number): Promise<any> {
    return apiRequest(`/feedback/teacher/${teacherId}/stats`);
  },
};

// Export cache management functions for manual use if needed
export const cacheUtils = {
  invalidate: invalidateCache,
  forceRefresh,
  getCacheSize: () => apiCache.size,
  clearAll: () => {
    apiCache.clear();
    console.log('🗑️ All cache cleared manually');
  }
};

// Export the constants that were made private
export { API_BASE, AUTH_TOKEN_KEY, LAST_ACTIVITY_KEY };
