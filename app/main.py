# In app/main.py, update the CORS middleware and add the health check endpoint
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import logging
from typing import Callable

from .config import settings
from .database import Base, engine, SessionLocal
from .models.models import Admin
from .utils.auth import pwd_context

# Create tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logging.getLogger("uvicorn.access").handlers = logging.getLogger().handlers

import time
import logging
from fastapi import Request
from colorama import Fore, Style, init

init(autoreset=True)

# ... other imports

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    
    status_code = response.status_code
    if 200 <= status_code < 300:
        status_color = Fore.GREEN
    elif 400 <= status_code < 600:
        status_color = Fore.RED
    else:
        status_color = Fore.YELLOW

    log_message = (
        f'{request.method} {request.url.path} {request.scope["server"][0]}:{request.scope["server"][1]} '
        f'{status_color}{status_code}{Style.RESET_ALL} '
        f'"{request.headers.get("user-agent", "N/A")}" '
        f'({process_time:.2f}ms)'
    )
    
    logging.getLogger("api").info(log_message)
    
    return response

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
api_logger = logging.getLogger("api")
api_logger.propagate = False
api_logger.handlers = [logging.StreamHandler()]
api_logger.handlers[0].setFormatter(logging.Formatter('%(asctime)s - %(message)s'))

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Health check endpoint
@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    try:
        # Test database connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "detail": str(e)}
        )

# Routers
from .routes.auth import router as auth_router
from .routes.students import router as students_router
from .routes.groups import router as groups_router
from .routes.teachers import router as teachers_router
from .routes.courses import router as courses_router
from .routes.exams import router as exams_router
from .routes.attendance import router as attendance_router
from .routes.timetable import router as timetable_router
from .routes.payments import router as payments_router
from .routes.reports import router as reports_router
from .routes.documents import router as documents_router
from .routes.events import router as events_router
from .routes.subjects import router as subjects_router
from .routes.subject_grades import router as subject_grades_router
from .routes.feedback import router as feedback_router
from .routes.system import router as system_router
from .routes.settings import router as settings_router
from .routes.subscriptions import router as subscriptions_router

# Include all routes with API version prefix
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(groups_router)
app.include_router(teachers_router)
app.include_router(courses_router)
app.include_router(exams_router)
app.include_router(attendance_router)
app.include_router(timetable_router)
app.include_router(payments_router)
app.include_router(reports_router)
app.include_router(documents_router)
app.include_router(events_router)
app.include_router(subjects_router)
app.include_router(subject_grades_router)
app.include_router(feedback_router)
app.include_router(system_router)
app.include_router(settings_router)
app.include_router(subscriptions_router)
