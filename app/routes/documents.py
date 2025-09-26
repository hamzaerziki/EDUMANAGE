from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Document, Student
from ..schemas import DocumentCreate, DocumentRead, DocumentUpdate
from ..utils.auth import get_current_admin
from ..utils.pdf_generator import generate_document_pdf

router = APIRouter(prefix="/documents", tags=["documents"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[DocumentRead])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.id.desc()).all()


@router.post("/generate", response_model=DocumentRead)
def generate_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    student_name = None
    if payload.student_id:
        student = db.get(Student, payload.student_id)
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")
        student_name = student.full_name

    file_path = generate_document_pdf(doc_type=payload.type, student_name=student_name, meta=payload.meta, signed=payload.signed)
    record = Document(type=payload.type, student_id=payload.student_id, file_path=file_path, signed=payload.signed, meta=payload.meta)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    obj = db.get(Document, doc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    return obj


@router.put("/{doc_id}", response_model=DocumentRead)
def update_document(doc_id: int, payload: DocumentUpdate, db: Session = Depends(get_db)):
    obj = db.get(Document, doc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    obj = db.get(Document, doc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
