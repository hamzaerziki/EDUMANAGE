from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import os

from ..database import get_db
from ..models.models import Payment, Student
from ..schemas import PaymentCreate, PaymentRead, PaymentUpdate
from ..utils.auth import get_current_admin
from ..utils.pdf_generator import generate_receipt_pdf
from ..config import settings

router = APIRouter(prefix="/payments", tags=["payments"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[PaymentRead])
def list_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.id.desc()).all()


@router.post("/", response_model=PaymentRead)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    obj = Payment(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    # Generate receipt PDF only when status is paid
    if (obj.status or '').lower() == 'paid':
        student = db.get(Student, obj.student_id)
        if not student:
            raise HTTPException(status_code=400, detail="Student not found for payment")
        receipt_path = generate_receipt_pdf(student_name=student.full_name, payment={
            'id': obj.id,
            'amount': obj.amount,
            'date': obj.date,
            'method': obj.method,
        })
        obj.receipt_path = receipt_path
        db.add(obj)
        db.commit()
        db.refresh(obj)
    return obj


@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    obj = db.get(Payment, payment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    return obj


@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: int, payload: PaymentUpdate, db: Session = Depends(get_db)):
    obj = db.get(Payment, payment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    obj = db.get(Payment, payment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.get("/{payment_id}/receipt")
def download_receipt(payment_id: int, db: Session = Depends(get_db)):
    obj = db.get(Payment, payment_id)
    if not obj or not obj.receipt_path:
        raise HTTPException(status_code=404, detail="Receipt not found")
    # Return a public URL path via /storage mount
    rel_path = os.path.relpath(obj.receipt_path, settings.STORAGE_DIR).replace("\\", "/")
    return {"path": f"/storage/{rel_path}"}
