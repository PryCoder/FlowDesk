from pydantic import BaseModel, EmailStr, Field
from typing import List

class UserRegistration(BaseModel):
    full_name: str = Field(..., alias="fullName")
    email: EmailStr
    password: str
    department: str
    role: str
    work_style: str = Field(..., alias="workStyle")
    skills: List[str] = []
    enable_2fa: bool = Field(False, alias="enable2FA")
    accept_terms: bool = Field(False, alias="acceptTerms")
    receive_notifications: bool = Field(True, alias="receiveNotifications")

    class Config:
        populate_by_name = True

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    department: str
    role: str
    work_style: str
    skills: List[str]
    enable_2fa: bool
    receive_notifications: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
