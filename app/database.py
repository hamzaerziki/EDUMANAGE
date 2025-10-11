from sqlalchemy import create_engine, event, text
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

# Auto-migration function to fix schema issues
def auto_migrate_database():
    """Automatically fix database schema issues on startup with proper transaction handling"""
    try:
        # Use autocommit mode to avoid transaction issues
        with engine.connect() as conn:
            # Set autocommit mode to handle each statement independently
            conn = conn.execution_options(autocommit=True)
            
            logger.info("Starting database schema migration...")
            
            # First, ensure institution_settings table exists
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS institution_settings (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR,
                        address VARCHAR,
                        phone VARCHAR,
                        email VARCHAR
                    )
                """))
                logger.info("✓ Base institution_settings table ensured")
            except Exception as e:
                logger.warning(f"Table creation warning: {e}")
            
            # Add missing columns one by one with individual transaction handling
            columns_to_add = [
                ("language", "VARCHAR"),
                ("time_zone", "VARCHAR"),
                ("dark_mode", "BOOLEAN DEFAULT FALSE"),
                ("font_size", "VARCHAR"),
                ("auto_print", "BOOLEAN DEFAULT FALSE"),
                ("logo_data_url", "TEXT"),
                ("location", "VARCHAR"),
                ("logo_path", "VARCHAR"),
                ("academic_year", "INTEGER"),
                ("current_semester", "VARCHAR"),
                ("grading_scale", "JSONB"),
                ("attendance_types", "JSONB"),
                ("payment_methods", "JSONB"),
                ("document_types", "JSONB"),
                ("event_types", "JSONB"),
                ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in columns_to_add:
                try:
                    # Check if column exists by querying information_schema
                    result = conn.execute(text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'institution_settings' 
                        AND column_name = :column_name
                    """), {"column_name": column_name})
                    
                    if result.fetchone() is None:
                        # Column doesn't exist, add it
                        conn.execute(text(f"ALTER TABLE institution_settings ADD COLUMN {column_name} {column_type}"))
                        logger.info(f"✓ Added column {column_name}")
                    else:
                        logger.debug(f"✓ Column {column_name} already exists")
                        
                except Exception as add_error:
                    logger.warning(f"Could not add column {column_name}: {add_error}")
                    # Continue with next column instead of failing completely
                    continue
            
            logger.info("✓ Institution settings schema migration completed")
            
            # Create categories table if it doesn't exist
            try:
                conn.execute(text("SELECT COUNT(*) FROM categories LIMIT 1"))
                logger.info("Categories table exists")
            except Exception:
                logger.info("Creating categories table...")
                
                # Create categories table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS categories (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL UNIQUE,
                        description TEXT,
                        color VARCHAR DEFAULT '#3B82F6',
                        icon VARCHAR DEFAULT 'BookOpen',
                        order_index INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Insert default categories
                conn.execute(text("""
                    INSERT INTO categories (name, description, color, icon, order_index) VALUES
                    ('Standard Education', 'Traditional academic education levels', '#3B82F6', 'GraduationCap', 1),
                    ('Professional Training', 'Professional and vocational training programs', '#10B981', 'Briefcase', 2),
                    ('Language Learning', 'Language courses and certifications', '#F59E0B', 'Globe', 3),
                    ('Arts & Music', 'Creative arts and music education', '#8B5CF6', 'Music', 4)
                    ON CONFLICT (name) DO NOTHING
                """))
                
                conn.commit()
                logger.info("✓ Created categories table with default data")
            
            # Update education_levels table to support category_id
            try:
                conn.execute(text("SELECT category_id FROM education_levels LIMIT 1"))
                logger.info("Education levels table is up to date")
            except Exception:
                logger.info("Updating education_levels table...")
                
                # Add new columns to education_levels
                new_columns = [
                    "ALTER TABLE education_levels ADD COLUMN IF NOT EXISTS category_id INTEGER DEFAULT 1",
                    "ALTER TABLE education_levels ADD COLUMN IF NOT EXISTS min_age INTEGER",
                    "ALTER TABLE education_levels ADD COLUMN IF NOT EXISTS max_age INTEGER",
                    "ALTER TABLE education_levels ADD COLUMN IF NOT EXISTS prerequisites TEXT"
                ]
                
                for sql in new_columns:
                    try:
                        conn.execute(text(sql))
                    except Exception as col_error:
                        logger.debug(f"Column might already exist: {col_error}")
                
                # Update existing levels to use category_id = 1 (Standard Education)
                conn.execute(text("""
                    UPDATE education_levels 
                    SET category_id = 1 
                    WHERE category_id IS NULL OR category_id = 0
                """))
                
                conn.commit()
                logger.info("✓ Updated education_levels table schema")
                
    except Exception as e:
        logger.error(f"Auto-migration failed: {e}")

# Run auto-migration and then create all tables
auto_migrate_database()
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
