from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Student, Admin
from ..schemas import StudentCreate, StudentRead, StudentUpdate
from ..utils.auth import get_current_admin
from ..services.usage import UsageService
from ..services.usage import UsageService

router = APIRouter(prefix="/students", tags=["students"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[StudentRead])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.id.desc()).all()


@router.post("/", response_model=StudentRead)
async def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    # Check if creating a new student is allowed under current subscription
    from ..services.usage import UsageService
    if not await UsageService.check_limit(db, admin.id, "students"):
        raise HTTPException(
            status_code=400,
            detail="Cannot create new student: Would exceed subscription limit"
        )

    obj = Student(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    # Track the usage
    await UsageService.track_usage(db, admin.id, "students")
    return obj


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    obj = db.get(Student, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Student not found")
    return obj


@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    obj = db.get(Student, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Student not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    obj = db.get(Student, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
