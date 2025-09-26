from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, time as time_cls

from ..database import get_db
from ..models.models import Event, Timetable, Course
from ..schemas import EventCreate, EventRead, EventUpdate
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[EventRead])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.desc()).all()


@router.post("/", response_model=EventRead)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    obj = Event(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)):
    obj = db.get(Event, event_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    return obj


@router.put("/{event_id}", response_model=EventRead)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    obj = db.get(Event, event_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    obj = db.get(Event, event_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.get("/fullcalendar")
def fullcalendar_feed(db: Session = Depends(get_db)):
    # Combine events with timetable entries for the current week (starting Sunday)
    out = []
    now = datetime.now()
    # find most recent Sunday
    start_of_week = now - timedelta(days=(now.weekday() + 1) % 7)
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    # Add stored events
    for e in db.query(Event).all():
        out.append({
            'id': f'evt-{e.id}',
            'title': e.title,
            'start': e.start.isoformat(),
            'end': e.end.isoformat() if e.end else None,
            'extendedProps': {'type': e.type or 'event'}
        })

    # Add timetable sessions mapped to current week dates
    entries = db.query(Timetable).all()
    courses_map = {c.id: c for c in db.query(Course).all()}
    for t in entries:
        # Our day_of_week uses 0..6 with 0=Sunday
        day_offset = t.day_of_week
        day_date = start_of_week + timedelta(days=day_offset)
        start_dt = datetime.combine(day_date.date(), t.start_time)
        end_dt = datetime.combine(day_date.date(), t.end_time)
        title = courses_map.get(t.course_id).name if t.course_id and t.course_id in courses_map else 'Class'
        out.append({
            'id': f'tt-{t.id}',
            'title': title,
            'start': start_dt.isoformat(),
            'end': end_dt.isoformat(),
            'extendedProps': {'type': 'timetable', 'group_id': t.group_id, 'course_id': t.course_id}
        })

    return out
