import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Admin
from app.utils.auth import hash_password, verify_password

# Database URL
DATABASE_URL = "postgresql+psycopg2://postgres:Admin@localhost:5432/edumanage"

def test_admin_auth():
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Test credentials
        test_username = "admin"
        test_password = "admin123"
        
        # Query admin user
        admin = db.query(Admin).filter(Admin.username == test_username).first()
        
        if admin:
            print(f"Found admin user: {admin.username}")
            # Test password
            if verify_password(test_password, admin.hashed_password):
                print("Password verification successful!")
            else:
                print("Password verification failed!")
        else:
            print("Admin user not found. Creating new admin user...")
            new_admin = Admin(
                username=test_username,
                hashed_password=hash_password(test_password)
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created successfully!")
            
        db.close()
        return True
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    test_admin_auth()