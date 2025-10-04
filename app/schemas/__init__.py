from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginResponse(Token):
    username: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

# Core entities
class AdminRead(BaseModel):
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GroupBase(BaseModel):
    name: str
    level: Optional[str] = None
    year: Optional[int] = None
    capacity: Optional[int] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    year: Optional[int] = None
    capacity: Optional[int] = None

class GroupRead(GroupBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class StudentBase(BaseModel):
    full_name: str
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    group_id: Optional[int] = None
    status: Optional[str] = "active"

class StudentCreate(StudentBase):
    full_name: str

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    group_id: Optional[int] = None
    status: Optional[str] = None

class StudentRead(StudentBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class TeacherBase(BaseModel):
    full_name: str
    speciality: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class TeacherCreate(TeacherBase):
    full_name: str

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    speciality: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class TeacherRead(TeacherBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    teacher_id: Optional[int] = None
    group_id: Optional[int] = None
    max_students: Optional[int] = None
    fee: Optional[float] = None
    duration: Optional[str] = None
    schedule: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    level: Optional[str] = None
    prerequisites: Optional[str] = None
    objectives: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    teacher_id: Optional[int] = None
    group_id: Optional[int] = None

class CourseRead(CourseBase):
    id: int
    group: Optional[GroupRead] = None
    students: Optional[List[StudentRead]] = None
    model_config = {"from_attributes": True}


# Attendance schemas
class ExamBase(BaseModel):
    course_id: int
    group_id: int
    exam_date: date
    max_score: float

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    course_id: Optional[int] = None
    group_id: Optional[int] = None
    exam_date: Optional[date] = None
    max_score: Optional[float] = None

class ExamRead(ExamBase):
    id: int
    model_config = {"from_attributes": True}


class ExamResultBase(BaseModel):
    exam_id: int
    student_id: int
    score: float

class ExamResultCreate(ExamResultBase):
    pass

class ExamResultRead(ExamResultBase):
    id: int
    model_config = {"from_attributes": True}

class RecordResultsRequest(BaseModel):
    results: List[ExamResultCreate]


class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: str  # present/absent/late

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    student_id: Optional[int] = None
    date: Optional[date] = None
    status: Optional[str] = None

class AttendanceRead(AttendanceBase):
    id: int
    model_config = {"from_attributes": True}


class TimetableBase(BaseModel):
    group_id: int
    day_of_week: int
    start_time: time
    end_time: time
    course_id: Optional[int] = None

class TimetableCreate(TimetableBase):
    pass

class TimetableUpdate(BaseModel):
    group_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    course_id: Optional[int] = None

class TimetableRead(TimetableBase):
    id: int
    model_config = {"from_attributes": True}


class PaymentBase(BaseModel):
    student_id: int
    amount: float
    date: date
    method: Optional[str] = None
    status: str = "paid"

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    student_id: Optional[int] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    method: Optional[str] = None
    status: Optional[str] = None

class PaymentRead(PaymentBase):
    id: int
    receipt_path: Optional[str] = None
    model_config = {"from_attributes": True}


class ReportBase(BaseModel):
    type: str
    period_start: Optional[date] = None
    period_end: Optional[date] = None

class ReportCreate(ReportBase):
    pass

class ReportRead(ReportBase):
    id: int
    file_path: str
    created_at: datetime
    model_config = {"from_attributes": True}


class DocumentBase(BaseModel):
    type: str
    student_id: Optional[int] = None
    signed: bool = False
    meta: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    signed: Optional[bool] = None
    meta: Optional[str] = None

class DocumentRead(DocumentBase):
    id: int
    file_path: str
    created_at: datetime
    model_config = {"from_attributes": True}


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    start: datetime
    end: Optional[datetime] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class EventRead(EventBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class SubjectBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class SubjectCreate(SubjectBase):
    name: str


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectRead(SubjectBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}

# Student subject grades (simplified persistence per subject/exam)
class StudentGradeBase(BaseModel):
    student_id: int
    group_id: int
    subject: str
    exam_name: str
    grade: float
    coefficient: float
    semester: str

class StudentGradeCreate(StudentGradeBase):
    pass

class StudentGradeRead(StudentGradeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class StudentGradesBulk(BaseModel):
    grades: List[StudentGradeCreate]

# Aggregated averages per student for a group and semester
class SubjectAverage(BaseModel):
    subject: str
    coefficient: float
    average: float

class GroupStudentAverage(BaseModel):
    student_id: int
    full_name: str
    average: Optional[float] = None
    sum_coefficients: float
    subjects: List[SubjectAverage]

# Teacher statistics
class TeacherGroupInfo(BaseModel):
    id: int
    name: str

class TeacherStats(BaseModel):
    teacher_id: int
    students_count: int
    subjects: List[str]
    subjects_count: int
    groups: List[TeacherGroupInfo]
    years_experience: float
    attendance_rate: Optional[float] = None  # in percent 0..100
    grade_improvement: Optional[float] = None  # percentage points (e.g., +12.3)
    student_satisfaction: Optional[float] = None  # 0..100 derived from recent avg grade
