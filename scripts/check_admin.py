from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Admin, Base
from app.utils.auth import hash_password

# Database connection
DATABASE_URL = "postgresql+psycopg2://postgres:Admin@localhost:5432/edumanage"
engine = create_engine(DATABASE_URL)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Check if admin exists
admin = db.query(Admin).filter(Admin.username == "admin").first()

if not admin:
    # Create admin user
    new_admin = Admin(
        username="admin",
        hashed_password=hash_password("admin123")
    )
    db.add(new_admin)
    db.commit()
    print("Admin user created successfully!")
else:
    print("Admin user already exists!")

db.close()