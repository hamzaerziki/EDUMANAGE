from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.models import Admin
from ..schemas import Token, LoginResponse, ChangePasswordRequest, RegisterRequest
from ..utils.auth import verify_password, hash_password, create_access_token, get_current_admin, pwd_context
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=admin.username, expires_delta=access_token_expires)
    return LoginResponse(access_token=token, username=admin.username)


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Ensure username uniqueness
    existing = db.query(Admin).filter(Admin.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    # Create new admin
    admin = Admin(
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    db.add(admin)
    db.commit()
    # Issue token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=admin.username, expires_delta=access_token_expires)
    return LoginResponse(access_token=token, username=admin.username)


@router.post("/change-password", response_model=Token)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    if not verify_password(payload.old_password, current_admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect")
    current_admin.hashed_password = hash_password(payload.new_password)
    db.add(current_admin)
    db.commit()
    token = create_access_token(subject=current_admin.username)
    return Token(access_token=token)


@router.get("/debug/admin-status")
def debug_admin_status(db: Session = Depends(get_db)):
    """Debug endpoint to check admin user status"""
    try:
        admins = db.query(Admin).all()
        admin_info = []
        for admin in admins:
            admin_info.append({
                "id": admin.id,
                "username": admin.username,
                "has_password": bool(admin.hashed_password),
                "password_length": len(admin.hashed_password) if admin.hashed_password else 0
            })
        
        return {
            "total_admins": len(admins),
            "admins": admin_info,
            "default_credentials": {
                "username": settings.ADMIN_USERNAME,
                "password": settings.ADMIN_PASSWORD
            }
        }
    except Exception as e:
        return {"error": str(e)}


@router.post("/debug/reset-admin")
def reset_admin_user(db: Session = Depends(get_db)):
    """Debug endpoint to reset admin user with default credentials"""
    try:
        from ..utils.auth import pwd_context
        
        # Delete existing admin users
        db.query(Admin).delete()
        
        # Create new admin with default credentials
        hashed_password = pwd_context.hash(settings.ADMIN_PASSWORD)
        admin = Admin(
            username=settings.ADMIN_USERNAME,
            hashed_password=hashed_password
        )
        db.add(admin)
        db.commit()
        
        return {
            "message": "Admin user reset successfully",
            "username": settings.ADMIN_USERNAME,
            "password": settings.ADMIN_PASSWORD,
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e), "status": "failed"}


@router.post("/debug/test-login")
def test_login_credentials(db: Session = Depends(get_db)):
    """Test login with default credentials"""
    try:
        from ..utils.auth import verify_password
        
        admin = db.query(Admin).filter(Admin.username == settings.ADMIN_USERNAME).first()
        if not admin:
            return {"error": "Admin user not found", "status": "no_admin"}
        
        password_valid = verify_password(settings.ADMIN_PASSWORD, admin.hashed_password)
        
        return {
            "admin_exists": True,
            "username": admin.username,
            "password_valid": password_valid,
            "expected_password": settings.ADMIN_PASSWORD,
            "status": "success" if password_valid else "invalid_password"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


@router.get("/debug/list-users")
def list_all_users(db: Session = Depends(get_db)):
    """Debug endpoint to list all users in database"""
    try:
        admins = db.query(Admin).all()
        user_list = []
        for admin in admins:
            user_list.append({
                "id": admin.id,
                "username": admin.username,
                "has_password": bool(admin.hashed_password),
                "password_hash_preview": admin.hashed_password[:50] + "..." if admin.hashed_password else None,
                "created_at": getattr(admin, 'created_at', 'N/A')
            })
        
        return {
            "total_users": len(admins),
            "users": user_list,
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


@router.post("/debug/test-password")
def test_password_hash(payload: dict, db: Session = Depends(get_db)):
    """Test password hashing and verification"""
    try:
        from ..utils.auth import pwd_context, verify_password
        
        username = payload.get("username", "")
        password = payload.get("password", "")
        
        if not username or not password:
            return {"error": "Username and password required", "status": "error"}
        
        # Find user
        admin = db.query(Admin).filter(Admin.username == username).first()
        if not admin:
            return {"error": f"User '{username}' not found", "status": "user_not_found"}
        
        # Test password verification
        password_valid = verify_password(password, admin.hashed_password)
        
        # Also test with common password variations
        test_passwords = [
            password,
            password.lower(),
            password.upper(),
            password.capitalize(),
            "admin123",
            "Admin123",
            "ADMIN123"
        ]
        
        test_results = {}
        for test_pwd in test_passwords:
            test_results[test_pwd] = verify_password(test_pwd, admin.hashed_password)
        
        return {
            "username": username,
            "password_provided": password,
            "password_valid": password_valid,
            "hash_preview": admin.hashed_password[:50] + "...",
            "test_results": test_results,
            "status": "tested"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}
