from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models.models import Course, Group, Student, Admin
from ..schemas import CourseCreate, CourseRead, CourseUpdate
from ..utils.auth import get_current_admin
from ..services.usage import UsageService

router = APIRouter(prefix="/courses", tags=["courses"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.id.desc()).all()


@router.post("/", response_model=CourseRead)
async def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    # Check if creating a new course is allowed under current subscription
    from ..services.usage import UsageService
    if not await UsageService.check_limit(db, admin.id, "courses"):
        raise HTTPException(
            status_code=400,
            detail="Cannot create new course: Would exceed subscription limit"
        )

    obj = Course(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    # Track the usage
    await UsageService.track_usage(db, admin.id, "courses")
    return obj


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db)):
    # Get course with joined relationships
    course = (
        db.query(Course)
        .options(joinedload(Course.group).joinedload(Group.students))
        .filter(Course.id == course_id)
        .first()
    )
    
    if not course:
        available_courses = db.query(Course).all()
        available_ids = [c.id for c in available_courses]
        raise HTTPException(
            status_code=404,
            detail=f"Course with ID {course_id} not found. Available course IDs: {available_ids}"
        )

    return CourseRead.model_validate(course)


@router.get("/{course_id}/validate")
def validate_course(course_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    """Validate if a course exists and return course info or available alternatives"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        return {"exists": True, "course": course}
    
    # Course doesn't exist, return available alternatives
    available_courses = db.query(Course).all()
    return {
        "exists": False, 
        "available_courses": [{"id": c.id, "name": c.name} for c in available_courses],
        "message": f"Course with ID {course_id} not found"
    }


@router.put("/{course_id}", response_model=CourseRead)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    obj = db.get(Course, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    obj = db.get(Course, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
