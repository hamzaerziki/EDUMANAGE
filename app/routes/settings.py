from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import InstitutionSettings
from pydantic import BaseModel
from typing import Optional
import logging

router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

class InstitutionSettingsSchema(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    timeZone: Optional[str] = None
    language: Optional[str] = None
    darkMode: Optional[bool] = None
    fontSize: Optional[str] = None
    autoPrint: Optional[bool] = None
    logoDataUrl: Optional[str] = None
    location: Optional[str] = None

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            address=obj.address,
            phone=obj.phone,
            email=obj.email,
            timeZone=obj.time_zone,
            language=obj.language,
            darkMode=obj.dark_mode,
            fontSize=obj.font_size,
            autoPrint=obj.auto_print,
            logoDataUrl=obj.logo_data_url,
            location=obj.location
        )

@router.get("/settings", response_model=InstitutionSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    logger.info("Fetching institution settings")
    settings = db.query(InstitutionSettings).first()
    if not settings:
        logger.warning("No settings found, creating default settings.")
        # Create default settings if they don't exist
        default_settings = InstitutionSettings(
            name="École Privée Excellence",
            address="123 Avenue Mohammed V, Casablanca, Maroc",
            phone="+212 522 123 456",
            email="contact@excellence.ma",
            time_zone="Africa/Casablanca",
            language="fr",
            dark_mode=False,
            font_size="medium",
            auto_print=True,
            logo_data_url="",
            location="Casablanca, Maroc",
        )
        db.add(default_settings)
        db.flush()
        db.refresh(default_settings)
        settings = default_settings
        logger.info("Default settings created and saved.")
    else:
        logger.info("Settings found in the database.")
    return InstitutionSettingsSchema.from_orm(settings)

@router.put("/settings", response_model=InstitutionSettingsSchema)
def update_settings(settings_data: InstitutionSettingsSchema, db: Session = Depends(get_db)):
    settings = db.query(InstitutionSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    # Map camelCase frontend fields to snake_case database fields
    field_mapping = {
        'timeZone': 'time_zone',
        'darkMode': 'dark_mode',
        'fontSize': 'font_size',
        'autoPrint': 'auto_print',
        'logoDataUrl': 'logo_data_url'
    }
    
    for key, value in settings_data.dict(exclude_unset=True).items():
        # Map camelCase field names to snake_case for database
        db_field_name = field_mapping.get(key, key)
        if hasattr(settings, db_field_name):
            setattr(settings, db_field_name, value)

    db.flush()
    db.refresh(settings)
    return InstitutionSettingsSchema.from_orm(settings)
