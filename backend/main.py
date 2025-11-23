"""
Medical MCQ Platform API.

This module initializes the FastAPI application, configures middleware (CORS),
mounts static files for the question bank, and defines all API endpoints.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import traceback
from dotenv import load_dotenv

from backend.database import SessionLocal, init_db, AttemptLog
from backend.services.question_source import FileSystemSource

load_dotenv()

app = FastAPI()

# Configuration
ROOT_FOLDER = os.getenv("ROOT_FOLDER_PATH", "./mock_data")
ORIGINS = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
init_db()

# Initialize Question Source
question_source = FileSystemSource(ROOT_FOLDER)

# Mount Static Files (The Library)
# We mount the ROOT_FOLDER to /static/library
if os.path.exists(ROOT_FOLDER):
    app.mount("/static/library", StaticFiles(directory=ROOT_FOLDER), name="library")
else:
    print(f"Warning: Root folder {ROOT_FOLDER} does not exist.")

# Dependencies
def get_db():
    """
    Dependency that yields a database session.

    Yields:
        Session: SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class AttemptCreate(BaseModel):
    """
    Schema for creating a new question attempt.

    Attributes:
        mcq_id (str): Unique ID of the question.
        subject (str): Subject name.
        module (str): Module name.
        selected_option (str): The option the user selected.
        is_correct (bool): Whether the answer was correct.
        time_taken_question_sec (float): Time taken to answer.
    """
    mcq_id: str
    subject: str
    module: str
    selected_option: str
    is_correct: bool
    time_taken_question_sec: float

class AttemptUpdate(BaseModel):
    """
    Schema for updating an existing attempt (e.g., adding explanation time).

    Attributes:
        time_taken_explanation_sec (float): Time spent reading the explanation.
    """
    time_taken_explanation_sec: float

# Routes

@app.get("/subjects")
def get_subjects():
    """
    Fetch all available subjects.

    Returns:
        List[str]: A list of subject names.
    """
    return question_source.get_subjects()

@app.get("/modules/{subject_name}")
def get_modules(subject_name: str):
    """
    Fetch all modules for a given subject.

    Args:
        subject_name (str): The name of the subject.

    Returns:
        List[str]: A list of module names.
    """
    modules = question_source.get_modules(subject_name)
    if not modules:
        # Check if subject exists first? Or just return empty list.
        # FileSystemSource returns empty list if invalid path.
        pass
    return modules

@app.get("/questions/{subject}/{module}")
def get_questions(subject: str, module: str):
    """
    Fetch all questions for a specific module.

    Args:
        subject (str): The name of the subject.
        module (str): The name of the module.

    Returns:
        List[Dict]: A list of question objects.

    Raises:
        HTTPException: 404 if questions are not found.
    """
    questions = question_source.get_questions(subject, module)
    if not questions:
        raise HTTPException(status_code=404, detail="Questions not found or empty")
    return questions

@app.post("/submit_attempt")
def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
    """
    Record a user's attempt at answering a question.

    Args:
        attempt (AttemptCreate): The attempt data.
        db (Session): Database session.

    Returns:
        dict: A dictionary containing the new attempt ID and status.

    Raises:
        HTTPException: 500 if an error occurs during database commit.
    """
    try:
        db_attempt = AttemptLog(
            mcq_id=attempt.mcq_id,
            subject=attempt.subject,
            module=attempt.module,
            selected_option=attempt.selected_option,
            is_correct=attempt.is_correct,
            time_taken_question_sec=attempt.time_taken_question_sec
        )
        db.add(db_attempt)
        db.commit()
        db.refresh(db_attempt)
        return {"id": db_attempt.id, "status": "recorded"}
    except Exception as e:
        print(f"Error submitting attempt: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/attempt/{attempt_id}")
def update_attempt(attempt_id: int, update_data: AttemptUpdate, db: Session = Depends(get_db)):
    """
    Update an existing attempt, typically to add explanation reading time.

    Args:
        attempt_id (int): The ID of the attempt to update.
        update_data (AttemptUpdate): The data to update.
        db (Session): Database session.

    Returns:
        dict: Status message.

    Raises:
        HTTPException: 404 if the attempt ID is not found.
    """
    db_attempt = db.query(AttemptLog).filter(AttemptLog.id == attempt_id).first()
    if not db_attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    db_attempt.time_taken_explanation_sec = update_data.time_taken_explanation_sec
    db.commit()
    return {"status": "updated"}

@app.get("/")
def read_root():
    """
    Root endpoint to verify API status.

    Returns:
        dict: A status message.
    """
    return {"message": "Medical MCQ Platform API is running"}
