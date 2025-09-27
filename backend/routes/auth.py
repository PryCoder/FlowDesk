from fastapi import APIRouter, HTTPException
from models.user_model import UserRegistration, UserResponse, TokenResponse
from utils.database import supabase
from utils.security import hash_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegistration):
    # Check for existing email in Supabase
    existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_pw = hash_password(user_data.password)

    # Insert new user
    new_user = supabase.table("users").insert({
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password_hash": hashed_pw,
        "department": user_data.department,
        "role": user_data.role,
        "work_style": user_data.work_style,
        "skills": user_data.skills,
        "enable_2fa": user_data.enable_2fa,
        "accept_terms": user_data.accept_terms,
        "receive_notifications": user_data.receive_notifications
    },returning="representation").execute()  # <-- .select("*") ensures you get inserted row

    if not new_user.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_dict = new_user.data[0]
    access_token = create_access_token({"sub": user_dict["id"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/users", response_model=list[UserResponse])
def get_users():
    # Fetch all users
    users = supabase.table("users").select("*").execute()
    return users.data
