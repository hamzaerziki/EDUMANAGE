from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ..database import get_db
from ..models.models import Feedback, Student, Teacher, Course
from ..utils.auth import get_current_admin
from ..services.teacher_stats_service import TeacherStatsService

router = APIRouter(prefix="/feedback", tags=["feedback"])


# Test endpoint to verify router is working
@router.get("/test")
def test_feedback_endpoint():
    """Test endpoint to verify feedback router is working"""
    return {"message": "Feedback router is working!", "status": "ok"}


# Pydantic schemas
class FeedbackCreate(BaseModel):
    student_id: int
    teacher_id: int
    course_id: int
    rating: int = Field(..., ge=1, le=5)
    satisfaction_score: int = Field(..., ge=1, le=10)
    teaching_quality: int = Field(..., ge=1, le=5)
    course_content: int = Field(..., ge=1, le=5)
    communication: int = Field(..., ge=1, le=5)
    helpfulness: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    student_id: int
    teacher_id: int
    course_id: int
    rating: int
    satisfaction_score: int
    teaching_quality: int
    course_content: int
    communication: int
    helpfulness: int
    comments: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeacherStats(BaseModel):
    averageRating: float
    totalFeedbacks: int
    satisfactionScore: float
    teachingQuality: float
    courseContent: float
    communication: float
    helpfulness: float


@router.post("/", response_model=FeedbackResponse)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Create new student feedback/evaluation"""
    
    try:
        print(f"Creating feedback: student_id={feedback.student_id}, teacher_id={feedback.teacher_id}, course_id={feedback.course_id}")
        
        # Check if student exists
        student = db.query(Student).filter(Student.id == feedback.student_id).first()
        if not student:
            print(f"Student with ID {feedback.student_id} not found")
            raise HTTPException(status_code=404, detail=f"Student with ID {feedback.student_id} not found")
        
        # Check if teacher exists
        teacher = db.query(Teacher).filter(Teacher.id == feedback.teacher_id).first()
        if not teacher:
            print(f"Teacher with ID {feedback.teacher_id} not found")
            raise HTTPException(status_code=404, detail=f"Teacher with ID {feedback.teacher_id} not found")
        
        # Check if course exists
        course = db.query(Course).filter(Course.id == feedback.course_id).first()
        if not course:
            print(f"Course with ID {feedback.course_id} not found")
            # Let's see what courses exist
            all_courses = db.query(Course).all()
            course_ids = [c.id for c in all_courses]
            print(f"Available course IDs: {course_ids}")
            
            # Try to create a default course if none exists
            if not all_courses:
                print("No courses exist, creating default course")
                default_course = Course(
                    id=feedback.course_id,
                    name="Default Course",
                    teacher_id=feedback.teacher_id,
                    group_id=None
                )
                db.add(default_course)
                db.commit()
                db.refresh(default_course)
                course = default_course
                print(f"Created default course with ID {course.id}")
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Course with ID {feedback.course_id} not found. Available courses: {course_ids}. Please refresh the page or contact administrator."
                )
        
        print(f"All entities found - Student: {student.full_name}, Teacher: {teacher.full_name}, Course: {course.name}")
        
        # Check if feedback already exists for this combination
        existing_feedback = db.query(Feedback).filter(
            Feedback.student_id == feedback.student_id,
            Feedback.teacher_id == feedback.teacher_id,
            Feedback.course_id == feedback.course_id
        ).first()
        
        if existing_feedback:
            print(f"Updating existing feedback with ID {existing_feedback.id}")
            # Update existing feedback
            for field, value in feedback.dict().items():
                setattr(existing_feedback, field, value)
            existing_feedback.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_feedback)
            
            # Update teacher statistics
            TeacherStatsService.update_teacher_statistics(db, feedback.teacher_id)
            
            return existing_feedback
        
        # Create new feedback
        print("Creating new feedback record")
        db_feedback = Feedback(**feedback.dict())
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        print(f"Feedback created successfully with ID {db_feedback.id}")
        
        # Update teacher statistics after creating feedback
        TeacherStatsService.update_teacher_statistics(db, feedback.teacher_id)
        print(f"Updated teacher statistics for teacher {feedback.teacher_id}")
        
        return db_feedback
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        db.rollback()
        print(f"Unexpected error creating feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error creating feedback: {str(e)}")


@router.get("/", response_model=List[FeedbackResponse])
def list_feedback(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """List all feedback"""
    feedback = db.query(Feedback).offset(skip).limit(limit).all()
    return feedback


@router.get("/teacher/{teacher_id}/stats", response_model=TeacherStats)
def get_teacher_stats(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Get aggregated statistics for a teacher"""
    
    try:
        # Calculate averages
        stats = db.query(
            func.avg(Feedback.rating).label('avg_rating'),
            func.count(Feedback.id).label('total_feedbacks'),
            func.avg(Feedback.satisfaction_score).label('avg_satisfaction'),
            func.avg(Feedback.teaching_quality).label('avg_teaching_quality'),
            func.avg(Feedback.course_content).label('avg_course_content'),
            func.avg(Feedback.communication).label('avg_communication'),
            func.avg(Feedback.helpfulness).label('avg_helpfulness')
        ).filter(Feedback.teacher_id == teacher_id).first()
        
        if not stats or stats.total_feedbacks == 0:
            return TeacherStats(
                averageRating=0.0,
                totalFeedbacks=0,
                satisfactionScore=0.0,
                teachingQuality=0.0,
                courseContent=0.0,
                communication=0.0,
                helpfulness=0.0
            )
        
        return TeacherStats(
            averageRating=round(float(stats.avg_rating or 0), 2),
            totalFeedbacks=int(stats.total_feedbacks or 0),
            satisfactionScore=round(float(stats.avg_satisfaction or 0), 2),
            teachingQuality=round(float(stats.avg_teaching_quality or 0), 2),
            courseContent=round(float(stats.avg_course_content or 0), 2),
            communication=round(float(stats.avg_communication or 0), 2),
            helpfulness=round(float(stats.avg_helpfulness or 0), 2)
        )
        
    except Exception as e:
        print(f"Error getting teacher stats: {e}")
        return TeacherStats(
            averageRating=0.0,
            totalFeedbacks=0,
            satisfactionScore=0.0,
            teachingQuality=0.0,
            courseContent=0.0,
            communication=0.0,
            helpfulness=0.0
        )


@router.get("/teacher/{teacher_id}", response_model=List[FeedbackResponse])
def get_teacher_feedback(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Get all feedback for a specific teacher"""
    feedback = db.query(Feedback).filter(Feedback.teacher_id == teacher_id).all()
    return feedback


@router.get("/course/{course_id}", response_model=List[FeedbackResponse])
def get_course_feedback(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Get all feedback for a specific course"""
    feedback = db.query(Feedback).filter(Feedback.course_id == course_id).all()
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Delete feedback"""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(feedback)
    db.commit()
    return {"ok": True}
