from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.responses import FileResponse

from ..database import get_db
from ..models.models import Timetable, Group, Course, Teacher
from ..schemas import TimetableCreate, TimetableRead, TimetableUpdate
from ..utils.auth import get_current_admin
from ..utils.pdf_generator import generate_group_timetable_pdf

router = APIRouter(prefix="/timetable", tags=["timetable"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[TimetableRead])
def list_timetable_entries(db: Session = Depends(get_db)):
    """Get all timetable entries"""
    return db.query(Timetable).order_by(Timetable.day_of_week, Timetable.start_time).all()


@router.get("/group/{group_id}", response_model=List[TimetableRead])
def get_group_timetable(group_id: int, db: Session = Depends(get_db)):
    """Get timetable entries for a specific group"""
    # Verify group exists
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return db.query(Timetable).filter(
        Timetable.group_id == group_id
    ).order_by(Timetable.day_of_week, Timetable.start_time).all()


@router.get("/group/{group_id}/pdf")
def get_group_timetable_pdf_route(group_id: int, db: Session = Depends(get_db)):
    """Generate and return a PDF timetable for a specific group"""
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    timetable_entries = db.query(Timetable).filter(
        Timetable.group_id == group_id
    ).order_by(Timetable.day_of_week, Timetable.start_time).all()

    rows = []
    for entry in timetable_entries:
        course_name = ""
        if entry.course_id:
            course = db.get(Course, entry.course_id)
            if course:
                course_name = course.name
        rows.append({
            "day": entry.day_of_week,
            "start": entry.start_time.strftime("%H:%M"),
            "end": entry.end_time.strftime("%H:%M"),
            "course": course_name,
        })

    pdf_path = generate_group_timetable_pdf(group.name, rows)
    return FileResponse(pdf_path, media_type='application/pdf', filename=f"timetable_{group.name}.pdf")


@router.post("/", response_model=TimetableRead)
def create_timetable_entry(payload: TimetableCreate, db: Session = Depends(get_db)):
    """Create a new timetable entry"""
    # Verify group exists
    group = db.get(Group, payload.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verify course exists if provided
    if payload.course_id:
        course = db.get(Course, payload.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
    
    # Check for time conflicts
    existing = db.query(Timetable).filter(
        Timetable.group_id == payload.group_id,
        Timetable.day_of_week == payload.day_of_week,
        Timetable.start_time < payload.end_time,
        Timetable.end_time > payload.start_time
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Time conflict with existing timetable entry"
        )
    
    obj = Timetable(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{timetable_id}", response_model=TimetableRead)
def get_timetable_entry(timetable_id: int, db: Session = Depends(get_db)):
    """Get a specific timetable entry"""
    obj = db.get(Timetable, timetable_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return obj


@router.put("/{timetable_id}", response_model=TimetableRead)
def update_timetable_entry(timetable_id: int, payload: TimetableUpdate, db: Session = Depends(get_db)):
    """Update a timetable entry"""
    obj = db.get(Timetable, timetable_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Verify group exists if being updated
    if payload.group_id and payload.group_id != obj.group_id:
        group = db.get(Group, payload.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
    
    # Verify course exists if being updated
    if payload.course_id and payload.course_id != obj.course_id:
        course = db.get(Course, payload.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
    
    # Check for time conflicts if time or group is being updated
    update_data = payload.dict(exclude_unset=True)
    if any(key in update_data for key in ['group_id', 'day_of_week', 'start_time', 'end_time']):
        new_group_id = update_data.get('group_id', obj.group_id)
        new_day = update_data.get('day_of_week', obj.day_of_week)
        new_start = update_data.get('start_time', obj.start_time)
        new_end = update_data.get('end_time', obj.end_time)
        
        existing = db.query(Timetable).filter(
            Timetable.id != timetable_id,
            Timetable.group_id == new_group_id,
            Timetable.day_of_week == new_day,
            Timetable.start_time < new_end,
            Timetable.end_time > new_start
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Time conflict with existing timetable entry"
            )
    
    for k, v in update_data.items():
        setattr(obj, k, v)
    
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{timetable_id}")
def delete_timetable_entry(timetable_id: int, db: Session = Depends(get_db)):
    """Delete a timetable entry"""
    obj = db.get(Timetable, timetable_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    db.delete(obj)
    db.commit()
    return {"message": "Timetable entry deleted successfully"}


@router.get("/day/{day_of_week}", response_model=List[TimetableRead])
def get_timetable_by_day(day_of_week: int, db: Session = Depends(get_db)):
    """Get all timetable entries for a specific day (0=Monday, 6=Sunday)"""
    if day_of_week < 0 or day_of_week > 6:
        raise HTTPException(status_code=400, detail="Invalid day of week (0-6)")
    
    return db.query(Timetable).filter(
        Timetable.day_of_week == day_of_week
    ).order_by(Timetable.start_time).all()