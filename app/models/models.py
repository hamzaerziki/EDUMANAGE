from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float, Text, Boolean, Time, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    level = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    students = relationship("Student", back_populates="group", cascade="all,delete")
    courses = relationship("Course", back_populates="group", cascade="all,delete")
    timetable_entries = relationship("Timetable", back_populates="group", cascade="all,delete")


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=True)
    phone = Column(String(30), nullable=True)
    status = Column(String(20), default="active")

    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    group = relationship("Group", back_populates="students")

    attendances = relationship("Attendance", back_populates="student", cascade="all,delete")
    payments = relationship("Payment", back_populates="student", cascade="all,delete")
    exam_results = relationship("ExamResult", back_populates="student", cascade="all,delete")

    created_at = Column(DateTime, default=datetime.utcnow)


class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    speciality = Column(String(100), nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=True)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("Course", back_populates="teacher")
    statistics = relationship("TeacherStatistics", back_populates="teacher", uselist=False)


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    
    # Course details
    max_students = Column(Integer, nullable=True)
    fee = Column(Float, nullable=True)
    duration = Column(String, nullable=True)  # e.g., "3 months", "1 semester"
    schedule = Column(String, nullable=True)  # e.g., "Mon/Wed/Fri 10:00-12:00"
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    
    # Course status and metadata
    status = Column(String, default="active")  # active, inactive, completed
    level = Column(String, nullable=True)  # beginner, intermediate, advanced
    prerequisites = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="courses")
    group = relationship("Group", back_populates="courses")
    exams = relationship("Exam", back_populates="course")
    feedback = relationship("Feedback", back_populates="course")


class Exam(Base):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    exam_date = Column(Date, nullable=False)
    max_score = Column(Float, nullable=False, default=20.0)

    course = relationship("Course", back_populates="exams")
    group = relationship("Group")
    results = relationship("ExamResult", back_populates="exam", cascade="all,delete")


class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)

    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="exam_results")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='uq_attendance_student_date'),
    )
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False)  # present/absent/late

    student = relationship("Student", back_populates="attendances")


class Timetable(Base):
    __tablename__ = "timetable"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0..6
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)

    group = relationship("Group", back_populates="timetable_entries")
    course = relationship("Course")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    method = Column(String(30), nullable=True)
    status = Column(String(10), nullable=False, default="paid")  # paid/unpaid
    receipt_path = Column(String(255), nullable=True)

    student = relationship("Student", back_populates="payments")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    file_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # certificate/report_card/absence_excuse
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(String(255), nullable=False)
    signed = Column(Boolean, default=False)
    meta = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(30), nullable=True)  # holiday/meeting/event
    start = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SubjectGrade(Base):
    __tablename__ = "subject_grades"
    # Unique per (group, student, subject, semester)
    __table_args__ = (
        UniqueConstraint("group_id", "student_id", "subject", "semester", name="uq_subject_grades_key"),
    )

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(150), nullable=False)
    semester = Column(String(50), nullable=False)
    # Persist list of numeric grades as JSON
    grades = Column(JSON, nullable=False, default=list)
    coefficient = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student")
    group = relationship("Group")


class StudentGrade(Base):
    __tablename__ = "student_grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)  # Subject name (e.g., "Math", "Physics")
    exam_name = Column(String(100), nullable=False)  # Exam name (e.g., "Exam 1", "Exam 2")
    grade = Column(Float, nullable=False)  # The actual grade/score
    coefficient = Column(Float, nullable=False, default=1.0)  # Subject coefficient
    semester = Column(String(50), nullable=False)  # Semester (e.g., "2025-S1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student")
    group = relationship("Group")

    # Unique constraint to prevent duplicate grades for same student/subject/exam
    __table_args__ = (
        UniqueConstraint('student_id', 'subject', 'exam_name', 'semester', name='uq_student_grade'),
    )


class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    
    # Rating scales
    rating = Column(Integer, nullable=False)  # 1-5
    satisfaction_score = Column(Integer, nullable=False)  # 1-10
    teaching_quality = Column(Integer, nullable=False)  # 1-5
    course_content = Column(Integer, nullable=False)  # 1-5
    communication = Column(Integer, nullable=False)  # 1-5
    helpfulness = Column(Integer, nullable=False)  # 1-5
    
    # Optional comments
    comments = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student")
    teacher = relationship("Teacher")
    course = relationship("Course")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'teacher_id', 'course_id', name='uq_student_teacher_course_feedback'),
    )


class TeacherStatistics(Base):
    __tablename__ = "teacher_statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), unique=True, nullable=False)
    
    # Student and course statistics
    total_students = Column(Integer, default=0)
    total_subjects = Column(Integer, default=0)
    years_experience = Column(Integer, default=0)
    
    # Performance statistics (from feedback)
    satisfaction_score = Column(Float, default=0.0)  # 0-100%
    average_rating = Column(Float, default=0.0)      # 0-5 stars
    total_feedback_count = Column(Integer, default=0)
    
    # Teaching quality metrics (from feedback)
    teaching_quality = Column(Float, default=0.0)    # 0-5 scale
    course_content_rating = Column(Float, default=0.0)  # 0-5 scale
    communication_rating = Column(Float, default=0.0)   # 0-5 scale
    helpfulness_rating = Column(Float, default=0.0)     # 0-5 scale
    
    # Attendance and performance
    attendance_rate = Column(Float, default=85.0)    # Default 85%
    grade_improvement = Column(Float, default=0.0)   # Percentage improvement
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="statistics")


class InstitutionSettings(Base):
    __tablename__ = "institution_settings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(120), nullable=True)
    timeZone = Column(String(50), nullable=True)
    language = Column(String(10), nullable=True)
    darkMode = Column(Boolean, default=False)
    fontSize = Column(String(10), default="medium")
    autoPrint = Column(Boolean, default=True)
    logoDataUrl = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)
