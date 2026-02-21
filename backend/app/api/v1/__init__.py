from fastapi import APIRouter
from .endpoints import auth, profile

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router)
api_router.include_router(profile.router)
