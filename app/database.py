from sqlalchemy import create_engine, event
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from .config import settings
from typing import Generator
import logging
import time
from functools import wraps
import contextlib

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def retry_on_exception(retries=3, delay=1):
    """Decorator for retrying database operations"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception: Exception | None = None
            for attempt in range(retries):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, SQLAlchemyError) as e:
                    last_exception = e
                    if attempt < retries - 1:
                        sleep_time = delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"Database operation failed, retrying in {sleep_time}s... ({str(e)})")
                        time.sleep(sleep_time)
            if last_exception:
                logger.error(f"All retries failed: {str(last_exception)}")
                raise last_exception
            else:
                raise Exception("Unexpected error: no exception captured")
        return wrapper
    return decorator

# Configure database engine with basic settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    echo=False,  # Log all SQL in debug mode
    connect_args={
        "connect_timeout": 10,
        "application_name": "edumanage",
        "keepalives": 1,
        "keepalives_idle": 60,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

# Configure session with performance optimizations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Performance optimization
    twophase=False  # Disable distributed transactions for better performance
)

Base = declarative_base()
from app.models import models
Base.metadata.create_all(bind=engine)

# Connection monitoring
@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    logger.debug("Connection checked in to pool")

# Set PostgreSQL specific configurations
@event.listens_for(Engine, "connect")
def set_pg_settings(dbapi_connection, connection_record):
    with contextlib.closing(dbapi_connection.cursor()) as cursor:
        # Performance and timeout settings
        cursor.execute("SET timezone TO 'UTC';")
        cursor.execute("SET statement_timeout TO '30000';")  # 30 second query timeout
        if settings.ENVIRONMENT == "production":
            # Production-specific optimizations
            cursor.execute("SET work_mem TO '16MB';")
            cursor.execute("SET maintenance_work_mem TO '128MB';")
            cursor.execute("SET random_page_cost TO 1.1;")  # Assuming SSD storage
            cursor.execute("SET effective_cache_size TO '4GB';")  # Adjust based on available memory
        
        # Session-level statistics
        cursor.execute("SET track_activities TO on;")
        cursor.execute("SET track_counts TO on;")

# Enhanced database dependency with logging, retries, and error handling
def get_db() -> Generator:
    db = SessionLocal()
    start_time = time.time()
    request_id = id(db)  # Unique identifier for this session
    
    logger.info("Starting database session %s", request_id)
    
    try:
        yield db
        db.commit()  # Auto-commit successful transactions
        duration = time.time() - start_time
        logger.info("Database session %s completed successfully in %.2fs", request_id, duration)
    
    except SQLAlchemyError as e:
        db.rollback()
        duration = time.time() - start_time
        logger.error("Database session %s failed after %.2fs: %s", request_id, duration, str(e))
        raise
    
    except Exception as e:
        db.rollback()
        duration = time.time() - start_time
        logger.error("Unexpected error in session %s after %.2fs: %s", request_id, duration, str(e))
        raise
    
    finally:
        db.close()
        logger.debug("Database session %s resources released", request_id)
