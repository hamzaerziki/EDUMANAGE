from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Attendance
from ..schemas import AttendanceCreate, AttendanceRead, AttendanceUpdate
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/attendance", tags=["attendance"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[AttendanceRead])
def list_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).order_by(Attendance.id.desc()).all()


@router.post("/", response_model=AttendanceRead)
def create_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    # Upsert on (student_id, date) — prefer the latest record (by id), and clean duplicates
    rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == payload.student_id, Attendance.date == payload.date)
        .order_by(Attendance.id.desc())
        .all()
    )
    if rows:
        latest = rows[0]
        latest.status = payload.status
        # Remove older duplicates if any
        for old in rows[1:]:
            db.delete(old)
        db.add(latest)
        db.commit()
        db.refresh(latest)
        return latest
    obj = Attendance(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{attendance_id}", response_model=AttendanceRead)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    obj = db.get(Attendance, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return obj


@router.put("/{attendance_id}", response_model=AttendanceRead)
def update_attendance(attendance_id: int, payload: AttendanceUpdate, db: Session = Depends(get_db)):
    obj = db.get(Attendance, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    obj = db.get(Attendance, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
