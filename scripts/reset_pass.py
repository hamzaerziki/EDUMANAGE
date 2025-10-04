from app.database import SessionLocal
from app.models.models import Admin
from app.utils.auth import pwd_context

def reset_password(username: str, new_password: str):
    """Reset password for a specific user"""
    db = SessionLocal()
    try:
        # Hash the new password
        hashed_password = pwd_context.hash(new_password)
        
        # Find and update the admin
        admin = db.query(Admin).filter(Admin.username == username).first()
        if admin:
            admin.hashed_password = hashed_password
            db.commit()
            print(f"Password updated successfully for user: {username}")
        else:
            print(f"User not found: {username}")
        
    except Exception as e:
        print(f"Error updating password: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Reset password for your user
    reset_password("hamzaerziki14@gmail.com", "Admin123")