from passlib.hash import bcrypt
import jwt
import os
from datetime import datetime, timedelta

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mysecretkey")
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)

def create_access_token(data: dict, expires_minutes: int = 60) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
