import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Admin, Teacher, Student, InstitutionSettings

router = APIRouter()

@router.get("/system-info")
def get_system_info(db: Session = Depends(get_db)):
    try:
        total_students = db.query(Student).count()
        
        package_json_path = "c:\\Users\\hamza\\Downloads\\EDUMANAGE\\edumanage-saas-main\\package.json"
        with open(package_json_path, 'r') as f:
            import json
            package_json = json.load(f)
            version = package_json.get("version", "1.2.4")

        return {
            "version": version,
            "totalStudents": total_students,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/check-settings")
def check_settings(db: Session = Depends(get_db)):
    try:
        settings = db.query(InstitutionSettings).first()
        if settings:
            return settings
        else:
            return {"message": "No settings found in the database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
