from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import Group
from ..schemas import GroupCreate, GroupRead, GroupUpdate
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/groups", tags=["groups"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[GroupRead])
def list_groups(db: Session = Depends(get_db)):
    return db.query(Group).order_by(Group.id.desc()).all()


@router.post("/", response_model=GroupRead)
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    obj = Group(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{group_id}", response_model=GroupRead)
def get_group(group_id: int, db: Session = Depends(get_db)):
    obj = db.get(Group, group_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    return obj


@router.put("/{group_id}", response_model=GroupRead)
def update_group(group_id: int, payload: GroupUpdate, db: Session = Depends(get_db)):
    obj = db.get(Group, group_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    obj = db.get(Group, group_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
