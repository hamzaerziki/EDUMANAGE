from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Subject
from ..schemas import SubjectCreate, SubjectRead, SubjectUpdate
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/subjects", tags=["subjects"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.id.desc()).all()


@router.post("/", response_model=SubjectRead)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Subject).filter(Subject.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this name already exists")
    obj = Subject(
        name=payload.name,
        category=payload.category,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    obj = db.get(Subject, subject_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return obj


@router.put("/{subject_id}", response_model=SubjectRead)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db)):
    obj = db.get(Subject, subject_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    data = payload.dict(exclude_unset=True)
    # Prevent duplicate names if name is being changed
    new_name = data.get("name")
    if new_name:
        other = db.query(Subject).filter(Subject.name == new_name, Subject.id != subject_id).first()
        if other:
            raise HTTPException(status_code=400, detail="Another subject with this name already exists")
    for k, v in data.items():
        if k == 'is_active' and v is None:
            continue
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    obj = db.get(Subject, subject_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
