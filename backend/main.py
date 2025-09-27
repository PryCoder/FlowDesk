from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes.auth import router as auth_router
from routes.users import router as users_router  # Import users router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AI Employee Assistant Backend...")
    yield
    print("👋 Shutting down backend...")

app = FastAPI(
    title="AI Employee Assistant API",
    description="Backend for AI-powered employee registration and management",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])  # Include users router

@app.get("/")
async def root():
    return {"message": "AI Employee Assistant API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
