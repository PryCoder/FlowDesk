from fastapi import APIRouter
from models.user_model import UserResponse
from utils.database import supabase

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def get_users():
    result = supabase.table("users").select("*").execute()
    return result.data
