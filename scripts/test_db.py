from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Admin
from app.utils.auth import hash_password

# Database URL from your .env file
DATABASE_URL = "postgresql+psycopg2://postgres:Admin@localhost:5432/edumanage"

def test_db_connection():
    try:
        # Create test engine
        engine = create_engine(DATABASE_URL)
        
        # Try to connect and create a session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Try a simple query
        admin = db.query(Admin).first()
        if admin:
            print("Database connection successful!")
            print(f"Found admin user: {admin.username}")
        else:
            print("Database connection successful, but no admin user found.")
            print("Creating admin user...")
            new_admin = Admin(
                username="admin",
                hashed_password=hash_password("admin123")
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created successfully!")
            
        db.close()
        return True
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return False

if __name__ == "__main__":
    test_db_connection()