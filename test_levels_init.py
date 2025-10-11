#!/usr/bin/env python3

"""
Test script to initialize education levels in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.models import EducationLevel, Grade

def create_default_levels():
    """Create default Moroccan education levels"""
    
    # First create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
    
    db = SessionLocal()
    
    try:
        # Check if levels already exist
        existing_count = db.query(EducationLevel).count()
        if existing_count > 0:
            print(f"Found {existing_count} existing education levels. Skipping initialization.")
            return
        
        print("Creating default Moroccan education levels...")
        
        # Create Primaire level
        primaire = EducationLevel(
            name="Primaire",
            category="Standard",
            order_index=1,
            description="Enseignement primaire (6 années)"
        )
        db.add(primaire)
        db.flush()
        
        primaire_grades = [
            ("1ère Année Primaire", "1ap", 1),
            ("2ème Année Primaire", "2ap", 2),
            ("3ème Année Primaire", "3ap", 3),
            ("4ème Année Primaire", "4ap", 4),
            ("5ème Année Primaire", "5ap", 5),
            ("6ème Année Primaire", "6ap", 6),
        ]
        
        for name, code, order in primaire_grades:
            grade = Grade(
                name=name,
                code=code,
                level_id=primaire.id,
                order_index=order
            )
            db.add(grade)
        
        # Create Collège level
        college = EducationLevel(
            name="Collège",
            category="Standard",
            order_index=2,
            description="Enseignement secondaire collégial (3 années)"
        )
        db.add(college)
        db.flush()
        
        college_grades = [
            ("1ère Année Collège", "1ac", 1),
            ("2ème Année Collège", "2ac", 2),
            ("3ème Année Collège", "3ac", 3),
        ]
        
        for name, code, order in college_grades:
            grade = Grade(
                name=name,
                code=code,
                level_id=college.id,
                order_index=order
            )
            db.add(grade)
        
        # Create Lycée level
        lycee = EducationLevel(
            name="Lycée",
            category="Standard",
            order_index=3,
            description="Enseignement secondaire qualifiant (3 années)"
        )
        db.add(lycee)
        db.flush()
        
        lycee_grades = [
            ("Tronc Commun Sciences", "tc-sci", 1),
            ("Tronc Commun Lettres", "tc-let", 2),
            ("1ère Année Bac Sciences Math", "1bac-sci-math", 3),
            ("1ère Année Bac Sciences Exp", "1bac-sci-exp", 4),
            ("1ère Année Bac Lettres", "1bac-let", 5),
            ("2ème Année Bac Sciences Math", "2bac-math", 6),
            ("2ème Année Bac PC", "2bac-pc", 7),
            ("2ème Année Bac SVT", "2bac-svt", 8),
            ("2ème Année Bac Lettres", "2bac-let", 9),
            ("2ème Année Bac Économie", "2bac-eco", 10),
        ]
        
        for name, code, order in lycee_grades:
            grade = Grade(
                name=name,
                code=code,
                level_id=lycee.id,
                order_index=order
            )
            db.add(grade)
        
        db.commit()
        
        print("✅ Default education levels created successfully!")
        print(f"✅ Created 3 levels with {len(primaire_grades + college_grades + lycee_grades)} grades total")
        
        # Display what was created
        levels = db.query(EducationLevel).all()
        for level in levels:
            grade_count = len(level.grades)
            print(f"  - {level.name}: {grade_count} grades ({level.category})")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating default levels: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_default_levels()