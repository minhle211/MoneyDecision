"""Auth: register, login, and Firebase token exchange."""
import json
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash, create_access_token, verify_password
from app.models import get_db, User
from app.schemas import UserCreate, UserResponse, Token, FirebaseTokenRequest

router = APIRouter(prefix="/auth", tags=["auth"])

_firebase_initialized = False


def _get_firebase_auth():
    """Lazy-init Firebase Admin and return auth. Returns None if not configured."""
    global _firebase_initialized
    settings = get_settings()
    if not settings.firebase_service_account_json:
        return None
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not _firebase_initialized:
            cred_dict = json.loads(settings.firebase_service_account_json)
            firebase_admin.initialize_app(credentials.Certificate(cred_dict))
            _firebase_initialized = True
        return firebase_auth
    except Exception:
        return None


@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at most 72 characters.",
        )
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(subject=str(user.id))
    return Token(access_token=token)


@router.post("/firebase", response_model=Token)
def firebase_login(data: FirebaseTokenRequest, db: Session = Depends(get_db)):
    """Exchange Firebase ID token for app JWT. Requires FIREBASE_SERVICE_ACCOUNT_JSON on backend."""
    firebase_auth = _get_firebase_auth()
    if not firebase_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase login is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON on the backend.",
        )
    try:
        decoded: dict[str, Any] = firebase_auth.verify_id_token(data.id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
        )
    email = decoded.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token has no email",
        )
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            display_name=decoded.get("name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return Token(access_token=token)
