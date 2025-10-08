from datetime import datetime, date, time
from sqlalchemy import Boolean, Column, Integer, String, Text, Float, ForeignKey, DateTime, Date, Time, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Subscription-related models
class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    billing_interval = Column(String, nullable=False)  # monthly, yearly
    features = Column(JSON, nullable=False)  # JSON array of included features
    max_students = Column(Integer, nullable=True)
    max_teachers = Column(Integer, nullable=True)
    max_courses = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String, nullable=False)  # active, cancelled, expired
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    admin = relationship("Admin", backref="subscriptions")
    plan = relationship("SubscriptionPlan")

class SubscriptionInvoice(Base):
    __tablename__ = "subscription_invoices"
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # paid, pending, failed
    billing_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    payment_method = Column(String, nullable=True)
    invoice_number = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscription = relationship("Subscription", backref="invoices")

class UsageMetrics(Base):
    __tablename__ = "usage_metrics"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    metric_name = Column(String, nullable=False)  # students_count, teachers_count, courses_count, etc.
    metric_value = Column(Integer, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("Admin", backref="usage_metrics")

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    students = relationship("Student", back_populates="group")
    courses = relationship("Course", back_populates="group")
    exams = relationship("Exam", back_populates="group")
    timetable_slots = relationship("Timetable", back_populates="group")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(1), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("Group", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student")
    exam_results = relationship("ExamResult", back_populates="student")
    payments = relationship("Payment", back_populates="student")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    speciality = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="teacher")

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
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    exam_date = Column(Date, nullable=False)
    max_score = Column(Float, nullable=False)
    
    course = relationship("Course", back_populates="exams")
    group = relationship("Group", back_populates="exams")
    results = relationship("ExamResult", back_populates="exam")

class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    score = Column(Float, nullable=False)
    
    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="exam_results")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # present/absent/late
    
    student = relationship("Student", back_populates="attendance_records")

class Timetable(Base):
    __tablename__ = "timetable"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 1=Monday, 7=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    
    group = relationship("Group", back_populates="timetable_slots")

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
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=True)  # academic/social/holiday
    start = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentGrade(Base):
    __tablename__ = "student_grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    subject = Column(String, nullable=False)
    exam_name = Column(String, nullable=False)
    grade = Column(Float, nullable=False)
    coefficient = Column(Float, nullable=False)
    semester = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5
    satisfaction_score = Column(Integer, nullable=True)  # 1-10 scale
    teaching_quality = Column(Integer, nullable=True)  # 1-5 scale
    course_content = Column(Integer, nullable=True)  # 1-5 scale
    communication = Column(Integer, nullable=True)  # 1-5 scale
    helpfulness = Column(Integer, nullable=True)  # 1-5 scale
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="feedback")
    teacher = relationship("Teacher", backref="feedback_received")

class InstitutionSettings(Base):
    __tablename__ = "institution_settings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    time_zone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    dark_mode = Column(Boolean, nullable=True)
    font_size = Column(String, nullable=True)
    auto_print = Column(Boolean, nullable=True)
    logo_data_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    logo_path = Column(String, nullable=True)
    academic_year = Column(Integer, nullable=True)
    current_semester = Column(String, nullable=True)
    grading_scale = Column(JSON, nullable=True)
    attendance_types = Column(JSON, nullable=True)
    payment_methods = Column(JSON, nullable=True)
    document_types = Column(JSON, nullable=True)
    event_types = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TeacherStatistics(Base):
    __tablename__ = "teacher_statistics"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    total_students = Column(Integer, default=0)
    total_subjects = Column(Integer, default=0)
    years_experience = Column(Integer, default=0)
    satisfaction_score = Column(Float, default=0.0)
    average_rating = Column(Float, default=0.0)
    total_feedback_count = Column(Integer, default=0)
    teaching_quality = Column(Float, default=0.0)
    course_content_rating = Column(Float, default=0.0)
    communication_rating = Column(Float, default=0.0)
    helpfulness_rating = Column(Float, default=0.0)
    attendance_rate = Column(Float, default=0.0)
    grade_improvement = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    teacher = relationship("Teacher", backref="statistics")
