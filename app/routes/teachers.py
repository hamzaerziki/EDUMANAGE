from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from sqlalchemy import func

from ..database import get_db
from ..models.models import Teacher, Student, Group, Course, Attendance, StudentGrade, Feedback, Admin
from ..schemas import TeacherCreate, TeacherRead, TeacherUpdate, TeacherStats, TeacherGroupInfo
from ..utils.auth import get_current_admin
from ..services.teacher_stats_service import TeacherStatsService
from ..services.usage import UsageService

router = APIRouter(prefix="/teachers", tags=["teachers"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[TeacherRead])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).order_by(Teacher.id.desc()).all()


@router.post("/", response_model=TeacherRead)
async def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    # Check if creating a new teacher is allowed under current subscription
    from ..services.usage import UsageService
    if not await UsageService.check_limit(db, admin.id, "teachers"):
        raise HTTPException(
            status_code=400,
            detail="Cannot create new teacher: Would exceed subscription limit"
        )

    obj = Teacher(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    # Track the usage
    await UsageService.track_usage(db, admin.id, "teachers")
    return obj


@router.get("/{teacher_id}", response_model=TeacherRead)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return obj


@router.put("/{teacher_id}", response_model=TeacherRead)
def update_teacher(teacher_id: int, payload: TeacherUpdate, db: Session = Depends(get_db)):
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    obj = db.get(Teacher, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.get("/{teacher_id}/stats")
def get_teacher_stats(teacher_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Get detailed statistics for a specific teacher"""
    try:
        # Get statistics from database (will create if not exists)
        stats = TeacherStatsService.get_teacher_statistics(db, teacher_id)
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting teacher stats: {e}")
        return {
            "students": 0,
            "subjects": 0,
            "experience": 0,
            "satisfaction": 0,
            "attendance": 85,
            "gradeImprovement": 0,
            "feedbackCount": 0,
            "averageRating": 0
        }


@router.get("/stats/overview")
def get_teachers_overview_stats(db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Get overall statistics for all teachers"""
    try:
        from datetime import datetime, timedelta
        
        print("📊 Getting teacher overview stats...")
        
        # Get all teachers
        teachers = db.query(Teacher).all()
        print(f"📊 Found {len(teachers)} teachers in database")
        
        # Calculate basic stats
        total_teachers = len(teachers)
        # Since Teacher model doesn't have status field, consider all as active
        active_teachers = total_teachers
        on_leave = 0
        
        # Calculate new teachers this month
        now = datetime.utcnow()
        first_day_of_month = datetime(now.year, now.month, 1)
        new_this_month = len([t for t in teachers if t.created_at and t.created_at >= first_day_of_month])
        
        result = {
            "totalTeachers": total_teachers,
            "activeTeachers": active_teachers,
            "onLeave": on_leave,
            "newThisMonth": new_this_month
        }
        
        print(f"📊 Calculated overview stats: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Error getting teacher overview stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "totalTeachers": 0,
            "activeTeachers": 0,
            "onLeave": 0,
            "newThisMonth": 0
        }


@router.post("/{teacher_id}/update-stats")
def update_teacher_stats(teacher_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Manually update statistics for a specific teacher"""
    try:
        success = TeacherStatsService.update_teacher_statistics(db, teacher_id)
        if success:
            return {"message": f"Successfully updated statistics for teacher {teacher_id}", "success": True}
        else:
            return {"message": f"Failed to update statistics for teacher {teacher_id}", "success": False}
    except Exception as e:
        print(f"Error updating teacher stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-all-stats")
def update_all_teacher_stats(db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Manually update statistics for all teachers"""
    try:
        updated_count = TeacherStatsService.update_all_teacher_statistics(db)
        return {"message": f"Updated statistics for {updated_count} teachers", "updated_count": updated_count}
    except Exception as e:
        print(f"Error updating all teacher stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{teacher_id}/debug-stats")
def debug_teacher_stats(teacher_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Debug teacher statistics calculation"""
    try:
        from ..models.models import Course, Student, Feedback
        
        # Get teacher
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        # Get courses
        courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
        
        # Get students in teacher's groups
        group_ids = [c.group_id for c in courses if c.group_id]
        students = []
        if group_ids:
            students = db.query(Student).filter(Student.group_id.in_(group_ids)).all()
        
        # Get feedback
        feedback = db.query(Feedback).filter(Feedback.teacher_id == teacher_id).all()
        
        # Get existing stats from database
        from ..models.models import TeacherStatistics
        existing_stats = db.query(TeacherStatistics).filter(TeacherStatistics.teacher_id == teacher_id).first()
        
        debug_info = {
            "teacher": {
                "id": teacher.id,
                "name": teacher.full_name,
                "created_at": str(teacher.created_at)
            },
            "courses": [{"id": c.id, "name": c.name, "group_id": c.group_id} for c in courses],
            "group_ids": group_ids,
            "students": [{"id": s.id, "name": s.full_name, "group_id": s.group_id} for s in students],
            "feedback": [{"id": f.id, "rating": f.rating, "satisfaction_score": f.satisfaction_score} for f in feedback],
            "existing_stats": {
                "exists": existing_stats is not None,
                "data": {
                    "total_students": existing_stats.total_students if existing_stats else None,
                    "total_subjects": existing_stats.total_subjects if existing_stats else None,
                    "satisfaction_score": existing_stats.satisfaction_score if existing_stats else None,
                    "total_feedback_count": existing_stats.total_feedback_count if existing_stats else None
                } if existing_stats else None
            }
        }
        
        return debug_info
        
    except Exception as e:
        print(f"Error debugging teacher stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
