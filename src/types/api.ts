// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'manager';
  created_at: string;
}

// Course Types
export interface Course {
  id: number;
  name: string;
  description?: string;
  teacher_id?: number;
  group_id?: number;
  max_students?: number;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  group?: Group;
  students?: Student[];
}

// Group Types
export interface Group {
  id: number;
  name: string;
  level?: string;
  year?: number;
  capacity?: number;
  created_at: string;
  students?: Student[];
  courses?: Course[];
}

// Student Types
export interface Student {
  id: number;
  full_name: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  email?: string;
  phone?: string;
  group_id?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

// Teacher Types
export interface Teacher {
  id: number;
  full_name: string;
  speciality?: string;
  email?: string;
  phone?: string;
  created_at: string;
  courses?: Course[];
  stats?: TeacherStats;
}

export interface TeacherStats {
  students: number;
  subjects: number;
  experience: number;
  satisfaction: number;
  attendance: number;
  gradeImprovement: number;
  feedbackCount: number;
  averageRating: number;
}