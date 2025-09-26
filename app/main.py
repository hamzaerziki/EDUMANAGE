from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from .config import settings
from .database import Base, engine, SessionLocal
from .models.models import Admin
from .utils.auth import pwd_context

# Routers
from .routes.auth import router as auth_router
from .routes.students import router as students_router
from .routes.groups import router as groups_router
from .routes.teachers import router as teachers_router
from .routes.courses import router as courses_router
from .routes.exams import router as exams_router
from .routes.attendance import router as attendance_router
from .routes.timetable import router as timetable_router
from .routes.payments import router as payments_router
from .routes.reports import router as reports_router
from .routes.documents import router as documents_router
from .routes.events import router as events_router
from .routes.subjects import router as subjects_router
from .routes.subject_grades import router as subject_grades_router
from .routes.feedback import router as feedback_router

app = FastAPI(title="EDUMANAGE Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounts for generated files
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Include routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(groups_router)
app.include_router(teachers_router)
app.include_router(courses_router)
app.include_router(exams_router)
app.include_router(attendance_router)
app.include_router(timetable_router)
app.include_router(payments_router)
app.include_router(reports_router)
app.include_router(documents_router)
app.include_router(events_router)
app.include_router(subjects_router)
app.include_router(subject_grades_router)
app.include_router(feedback_router)


@app.on_event("startup")
def on_startup():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Safe migration: ensure all required columns exist
    try:
        with engine.connect() as conn:
            # Ensure 'capacity' column exists on groups
            conn.execute(text("""
                ALTER TABLE groups
                ADD COLUMN IF NOT EXISTS capacity INTEGER
            """))
            
            # Ensure courses table has all required columns
            conn.execute(text("""
                ALTER TABLE courses
                ADD COLUMN IF NOT EXISTS description TEXT,
                ADD COLUMN IF NOT EXISTS category VARCHAR(100),
                ADD COLUMN IF NOT EXISTS max_students INTEGER,
                ADD COLUMN IF NOT EXISTS fee FLOAT,
                ADD COLUMN IF NOT EXISTS duration VARCHAR(100),
                ADD COLUMN IF NOT EXISTS schedule VARCHAR(200),
                ADD COLUMN IF NOT EXISTS start_date DATE,
                ADD COLUMN IF NOT EXISTS end_date DATE,
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
                ADD COLUMN IF NOT EXISTS level VARCHAR(50),
                ADD COLUMN IF NOT EXISTS prerequisites TEXT,
                ADD COLUMN IF NOT EXISTS objectives TEXT,
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            
            # Ensure feedback table exists with proper structure
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    student_id INTEGER NOT NULL,
                    teacher_id INTEGER NOT NULL,
                    course_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    satisfaction_score INTEGER NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
                    teaching_quality INTEGER NOT NULL CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
                    course_content INTEGER NOT NULL CHECK (course_content >= 1 AND course_content <= 5),
                    communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
                    helpfulness INTEGER NOT NULL CHECK (helpfulness >= 1 AND helpfulness <= 5),
                    comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, teacher_id, course_id)
                )
            """))
            
            # Ensure teacher statistics table exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS teacher_statistics (
                    id SERIAL PRIMARY KEY,
                    teacher_id INTEGER UNIQUE NOT NULL,
                    total_students INTEGER DEFAULT 0,
                    total_subjects INTEGER DEFAULT 0,
                    years_experience INTEGER DEFAULT 0,
                    satisfaction_score FLOAT DEFAULT 0.0,
                    average_rating FLOAT DEFAULT 0.0,
                    total_feedback_count INTEGER DEFAULT 0,
                    teaching_quality FLOAT DEFAULT 0.0,
                    course_content_rating FLOAT DEFAULT 0.0,
                    communication_rating FLOAT DEFAULT 0.0,
                    helpfulness_rating FLOAT DEFAULT 0.0,
                    attendance_rate FLOAT DEFAULT 85.0,
                    grade_improvement FLOAT DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Add sample data to courses if they don't have required fields
            conn.execute(text("""
                UPDATE courses 
                SET 
                    description = COALESCE(description, 'Description du cours'),
                    category = COALESCE(category, 'Général'),
                    max_students = COALESCE(max_students, 30),
                    fee = COALESCE(fee, 500.0),
                    duration = COALESCE(duration, '3 mois'),
                    schedule = COALESCE(schedule, 'Lun/Mer/Ven 10:00-12:00'),
                    status = COALESCE(status, 'active'),
                    level = COALESCE(level, 'intermediate'),
                    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
                WHERE description IS NULL OR category IS NULL OR max_students IS NULL
            """))
            
            conn.commit()
    except Exception as e:
        print(f"Migration error: {e}")
        pass
    
    # Bootstrap default admin if not exists
    db: Session = SessionLocal()
    try:
        admin = db.query(Admin).first()
        if not admin:
            hashed_password = pwd_context.hash(settings.ADMIN_PASSWORD)
            admin = Admin(
                username=settings.ADMIN_USERNAME,
                hashed_password=hashed_password
            )
            db.add(admin)
            db.commit()
            print(f"Created default admin: {settings.ADMIN_USERNAME}")
        
        # Initialize teacher statistics for all existing teachers
        from .services.teacher_stats_service import TeacherStatsService
        updated_count = TeacherStatsService.update_all_teacher_statistics(db)
        print(f"Initialized statistics for {updated_count} teachers")
        
    except Exception as e:
        print(f"Startup error: {e}")
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
