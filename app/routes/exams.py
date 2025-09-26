from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Exam, ExamResult, Student
from ..schemas import ExamCreate, ExamRead, ExamUpdate, ExamResultRead, RecordResultsRequest
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/exams", tags=["exams"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[ExamRead])
def list_exams(db: Session = Depends(get_db)):
    return db.query(Exam).order_by(Exam.id.desc()).all()


@router.post("/", response_model=ExamRead)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    obj = Exam(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{exam_id}", response_model=ExamRead)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    obj = db.get(Exam, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Exam not found")
    return obj


@router.put("/{exam_id}", response_model=ExamRead)
def update_exam(exam_id: int, payload: ExamUpdate, db: Session = Depends(get_db)):
    obj = db.get(Exam, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Exam not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    obj = db.get(Exam, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.post("/{exam_id}/results", response_model=List[ExamResultRead])
def record_results(exam_id: int, payload: RecordResultsRequest, db: Session = Depends(get_db)):
    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    saved: List[ExamResult] = []
    for r in payload.results:
        # optional: ensure student exists
        student = db.get(Student, r.student_id)
        if not student:
            raise HTTPException(status_code=400, detail=f"Student {r.student_id} not found")
        # upsert by (exam_id, student_id)
        existing = db.query(ExamResult).filter(ExamResult.exam_id == exam_id, ExamResult.student_id == r.student_id).first()
        if existing:
            existing.score = r.score
            db.add(existing)
            saved.append(existing)
        else:
            er = ExamResult(exam_id=exam_id, student_id=r.student_id, score=r.score)
            db.add(er)
            saved.append(er)
    db.commit()
    for s in saved:
        db.refresh(s)
    return saved
