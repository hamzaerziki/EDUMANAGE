from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.models import EducationLevel, Grade, Category

router = APIRouter(prefix="/levels", tags=["levels"])

# Pydantic models for API
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    order_index: int
    is_active: bool
    created_at: datetime
    levels_count: Optional[int] = 0

    class Config:
        from_attributes = True

class GradeCreate(BaseModel):
    name: str
    code: Optional[str] = None
    order_index: int = 0
    description: Optional[str] = None

class GradeResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    level_id: int
    order_index: int
    is_active: bool
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class EducationLevelCreate(BaseModel):
    name: str
    category_id: int
    order_index: int = 0
    description: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    prerequisites: Optional[str] = None
    grades: List[GradeCreate] = []

class EducationLevelUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    order_index: Optional[int] = None
    description: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    prerequisites: Optional[str] = None
    is_active: Optional[bool] = None

class EducationLevelResponse(BaseModel):
    id: int
    name: str
    category_id: int
    category_name: Optional[str] = None
    order_index: int
    is_active: bool
    description: Optional[str]
    min_age: Optional[int]
    max_age: Optional[int]
    prerequisites: Optional[str]
    created_at: datetime
    grades: List[GradeResponse] = []

    class Config:
        from_attributes = True

# API endpoints
@router.get("/", response_model=List[EducationLevelResponse])
def list_levels(
    category_id: Optional[int] = None,
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all education levels with their grades"""
    query = db.query(EducationLevel)
    
    if active_only:
        query = query.filter(EducationLevel.is_active == True)
    
    if category:
        query = query.filter(EducationLevel.category == category)
    
    levels = query.order_by(EducationLevel.order_index, EducationLevel.name).all()
    return levels

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """List all available categories"""
    categories = db.query(EducationLevel.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

@router.get("/{level_id}", response_model=EducationLevelResponse)
def get_level(level_id: int, db: Session = Depends(get_db)):
    """Get a specific education level with its grades"""
    level = db.query(EducationLevel).filter(EducationLevel.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education level not found"
        )
    return level

@router.post("/", response_model=EducationLevelResponse)
def create_level(level_data: EducationLevelCreate, db: Session = Depends(get_db)):
    """Create a new education level with grades"""
    
    # Check if level name already exists
    existing = db.query(EducationLevel).filter(EducationLevel.name == level_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Education level '{level_data.name}' already exists"
        )
    
    # Create the education level
    level = EducationLevel(
        name=level_data.name,
        category=level_data.category,
        order_index=level_data.order_index,
        description=level_data.description
    )
    db.add(level)
    db.flush()  # Get the ID without committing
    
    # Create grades for this level
    for grade_data in level_data.grades:
        grade = Grade(
            name=grade_data.name,
            code=grade_data.code,
            level_id=level.id,
            order_index=grade_data.order_index,
            description=grade_data.description
        )
        db.add(grade)
    
    db.commit()
    db.refresh(level)
    return level

@router.put("/{level_id}", response_model=EducationLevelResponse)
def update_level(
    level_id: int, 
    level_data: EducationLevelUpdate, 
    db: Session = Depends(get_db)
):
    """Update an education level"""
    level = db.query(EducationLevel).filter(EducationLevel.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education level not found"
        )
    
    # Update fields if provided
    update_data = level_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(level, field, value)
    
    level.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(level)
    return level

@router.delete("/{level_id}")
def delete_level(level_id: int, db: Session = Depends(get_db)):
    """Delete an education level (soft delete by setting is_active=False)"""
    level = db.query(EducationLevel).filter(EducationLevel.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education level not found"
        )
    
    # Soft delete - set as inactive
    level.is_active = False
    level.updated_at = datetime.utcnow()
    
    # Also deactivate all grades under this level
    for grade in level.grades:
        grade.is_active = False
        grade.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": f"Education level '{level.name}' has been deactivated"}

# Grade-specific endpoints
@router.post("/{level_id}/grades", response_model=GradeResponse)
def add_grade_to_level(
    level_id: int, 
    grade_data: GradeCreate, 
    db: Session = Depends(get_db)
):
    """Add a new grade to an existing education level"""
    level = db.query(EducationLevel).filter(EducationLevel.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education level not found"
        )
    
    grade = Grade(
        name=grade_data.name,
        code=grade_data.code,
        level_id=level_id,
        order_index=grade_data.order_index,
        description=grade_data.description
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade

@router.get("/{level_id}/grades", response_model=List[GradeResponse])
def list_grades_for_level(
    level_id: int, 
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all grades for a specific education level"""
    query = db.query(Grade).filter(Grade.level_id == level_id)
    
    if active_only:
        query = query.filter(Grade.is_active == True)
    
    grades = query.order_by(Grade.order_index, Grade.name).all()
    return grades

@router.delete("/grades/{grade_id}")
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    """Delete a grade (soft delete)"""
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    grade.is_active = False
    grade.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Grade '{grade.name}' has been deactivated"}

@router.post("/initialize-default")
def initialize_default_levels(db: Session = Depends(get_db)):
    """Initialize default Moroccan education levels if they don't exist"""
    
    # Check if any levels exist
    existing_count = db.query(EducationLevel).count()
    if existing_count > 0:
        return {"message": "Education levels already exist"}
    
    # Create default Moroccan levels
    default_levels = [
        {
            "name": "Primaire",
            "category": "Standard",
            "order_index": 1,
            "description": "Enseignement primaire (6 années)",
            "grades": [
                {"name": "1ère Année Primaire", "code": "1ap", "order_index": 1},
                {"name": "2ème Année Primaire", "code": "2ap", "order_index": 2},
                {"name": "3ème Année Primaire", "code": "3ap", "order_index": 3},
                {"name": "4ème Année Primaire", "code": "4ap", "order_index": 4},
                {"name": "5ème Année Primaire", "code": "5ap", "order_index": 5},
                {"name": "6ème Année Primaire", "code": "6ap", "order_index": 6},
            ]
        },
        {
            "name": "Collège",
            "category": "Standard",
            "order_index": 2,
            "description": "Enseignement secondaire collégial (3 années)",
            "grades": [
                {"name": "1ère Année Collège", "code": "1ac", "order_index": 1},
                {"name": "2ème Année Collège", "code": "2ac", "order_index": 2},
                {"name": "3ème Année Collège", "code": "3ac", "order_index": 3},
            ]
        },
        {
            "name": "Lycée",
            "category": "Standard",
            "order_index": 3,
            "description": "Enseignement secondaire qualifiant (3 années)",
            "grades": [
                {"name": "Tronc Commun Sciences", "code": "tc-sci", "order_index": 1},
                {"name": "Tronc Commun Lettres", "code": "tc-let", "order_index": 2},
                {"name": "1ère Année Bac Sciences Math", "code": "1bac-sci-math", "order_index": 3},
                {"name": "1ère Année Bac Sciences Exp", "code": "1bac-sci-exp", "order_index": 4},
                {"name": "1ère Année Bac Lettres", "code": "1bac-let", "order_index": 5},
                {"name": "2ème Année Bac Sciences Math", "code": "2bac-math", "order_index": 6},
                {"name": "2ème Année Bac PC", "code": "2bac-pc", "order_index": 7},
                {"name": "2ème Année Bac SVT", "code": "2bac-svt", "order_index": 8},
                {"name": "2ème Année Bac Lettres", "code": "2bac-let", "order_index": 9},
                {"name": "2ème Année Bac Économie", "code": "2bac-eco", "order_index": 10},
            ]
        }
    ]
    
    created_levels = []
    
    for level_data in default_levels:
        level = EducationLevel(
            name=level_data["name"],
            category=level_data["category"],
            order_index=level_data["order_index"],
            description=level_data["description"]
        )
        db.add(level)
        db.flush()
        
        for grade_data in level_data["grades"]:
            grade = Grade(
                name=grade_data["name"],
                code=grade_data["code"],
                level_id=level.id,
                order_index=grade_data["order_index"]
            )
            db.add(grade)
        
        created_levels.append(level.name)
    
    db.commit()
    
    return {
        "message": "Default education levels initialized successfully",
        "created_levels": created_levels
    }