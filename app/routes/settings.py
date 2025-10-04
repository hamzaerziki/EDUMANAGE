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
        orm_mode = True

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
            timeZone="Africa/Casablanca",
            language="fr",
            darkMode=False,
            fontSize="medium",
            autoPrint=True,
            logoDataUrl="",
            location="Casablanca, Maroc",
        )
        db.add(default_settings)
        db.flush()
        db.refresh(default_settings)
        settings = default_settings
        logger.info("Default settings created and saved.")
    else:
        logger.info("Settings found in the database.")
    return settings

@router.put("/settings", response_model=InstitutionSettingsSchema)
def update_settings(settings_data: InstitutionSettingsSchema, db: Session = Depends(get_db)):
    settings = db.query(InstitutionSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    for key, value in settings_data.dict(exclude_unset=True).items():
        setattr(settings, key, value)

    db.flush()
    db.refresh(settings)
    return settings
