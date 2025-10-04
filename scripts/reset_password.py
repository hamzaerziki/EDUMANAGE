from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
import os

# Database configuration
DATABASE_URL = "postgresql+psycopg2://postgres:Admin@localhost:5432/edumanage"

# Create database engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password(username: str, new_password: str):
    """Reset password for a specific user"""
    db = SessionLocal()
    try:
        # Hash the new password
        hashed_password = pwd_context.hash(new_password)
        
        # Update the password in the database
        result = db.execute(
            """
            UPDATE admins 
            SET hashed_password = :hashed_password 
            WHERE username = :username
            """,
            {
                "hashed_password": hashed_password,
                "username": username
            }
        )
        
        db.commit()
        print(f"Password updated successfully for user: {username}")
        
    except Exception as e:
        print(f"Error updating password: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Reset password for your user
    reset_password("hamzaerziki14@gmail.com", "Admin123")