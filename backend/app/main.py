from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import recommendation
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Make sure we have the required environment variables
if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY environment variable not set. Gemini recommendation endpoint will not work.")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your router
app.include_router(recommendation.router)

# Root endpoint
@app.get("/")
def home():
    return {"message": "HabitQuest API is running"}