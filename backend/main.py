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
from datetime import datetime
from sqlalchemy.orm import joinedload
import os
import traceback
from dotenv import load_dotenv

from backend.database import SessionLocal, init_db, AttemptLog, QuizAttempt
from backend.services.question_source import FileSystemSource

# Explicitly load the .env file from the same directory as main.py
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    print(f"Loading .env file from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f".env file not found at: {dotenv_path}")

app = FastAPI()

# Configuration
ROOT_FOLDER = os.getenv("ROOT_FOLDER_PATH", "./mock_data")
print(f"Root folder is: {ROOT_FOLDER}")
ORIGINS = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    quiz_attempt_id: Optional[int] = None

class AttemptUpdate(BaseModel):
    """
    Schema for updating an existing attempt (e.g., adding explanation time).

    Attributes:
        time_taken_explanation_sec (float): Time spent reading the explanation.
    """
    time_taken_explanation_sec: float

class QuizComplete(BaseModel):
    """
    Schema for finalizing a quiz attempt.
    """
    skipped_ids: List[str]

class QuizAttemptCreate(BaseModel):
    subject: str
    module: str

class AttemptLogResponse(BaseModel):
    mcq_id: str
    selected_option: str
    is_correct: bool
    time_taken_question_sec: float

    class Config:
        orm_mode = True

class QuizAttemptResponse(BaseModel):
    id: int
    subject: str
    module: str
    status: str
    score: int
    percentage: float
    correct_count: int
    incorrect_count: int
    skipped_count: int
    total_questions: int
    start_time: datetime
    end_time: Optional[datetime]
    logs: List[AttemptLogResponse]

    class Config:
        orm_mode = True

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

@app.get("/history/{subject}/{module}", response_model=List[QuizAttemptResponse])
def get_attempt_history(subject: str, module: str, db: Session = Depends(get_db)):
    """
    Fetch all quiz attempts for a specific module.
    """
    history = db.query(QuizAttempt).filter(
        QuizAttempt.subject == subject,
        QuizAttempt.module == module
    ).order_by(QuizAttempt.start_time.desc()).all()
    return history

@app.post("/attempts", response_model=QuizAttemptResponse)
def create_quiz_attempt(attempt_data: QuizAttemptCreate, db: Session = Depends(get_db)):
    """
    Start a new quiz attempt.
    """
    questions = question_source.get_questions(attempt_data.subject, attempt_data.module)
    if not questions:
        raise HTTPException(status_code=404, detail="Module questions not found.")

    new_attempt = QuizAttempt(
        subject=attempt_data.subject,
        module=attempt_data.module,
        total_questions=len(questions)
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    return new_attempt

@app.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
@app.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
def get_quiz_attempt(attempt_id: int, db: Session = Depends(get_db)):
    """
    Get a specific quiz attempt by its ID, including all its answer logs.
    """
    attempt = db.query(QuizAttempt).options(joinedload(QuizAttempt.logs)).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found.")
    return attempt


@app.post("/attempts/{attempt_id}/complete", response_model=QuizAttemptResponse)
def complete_quiz_attempt(attempt_id: int, completion_data: QuizComplete, db: Session = Depends(get_db)):
    """
    Mark a quiz attempt as complete and calculate final stats.
    """
    quiz_attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not quiz_attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found.")
    
    if quiz_attempt.status == 'completed':
        # Allow re-calculating if needed, but for now, let's prevent changes.
        return quiz_attempt

    quiz_attempt.status = 'completed'
    quiz_attempt.end_time = datetime.utcnow()
    quiz_attempt.skipped_count = len(completion_data.skipped_ids)
    
    # Final percentage calculation
    if quiz_attempt.total_questions > 0:
        quiz_attempt.percentage = (quiz_attempt.correct_count / quiz_attempt.total_questions) * 100
    else:
        quiz_attempt.percentage = 0.0

    db.commit()
    db.refresh(quiz_attempt)
    return quiz_attempt

@app.post("/submit_attempt")
def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
    """
    Record a user's attempt at answering a question.
    Also updates the parent QuizAttempt stats if a quiz_attempt_id is provided.
    """
    try:
        # Create the individual log
        db_attempt = AttemptLog(
            mcq_id=attempt.mcq_id,
            subject=attempt.subject,
            module=attempt.module,
            selected_option=attempt.selected_option,
            is_correct=attempt.is_correct,
            time_taken_question_sec=attempt.time_taken_question_sec,
            quiz_attempt_id=attempt.quiz_attempt_id
        )
        db.add(db_attempt)

        # If part of a quiz, update the aggregate stats
        if attempt.quiz_attempt_id:
            quiz_attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt.quiz_attempt_id).first()
            if quiz_attempt:
                if attempt.is_correct:
                    quiz_attempt.correct_count += 1
                    quiz_attempt.score += 4
                else:
                    quiz_attempt.incorrect_count += 1
                    quiz_attempt.score -= 1
                
                # Live percentage update
                if quiz_attempt.total_questions > 0:
                    quiz_attempt.percentage = (quiz_attempt.correct_count / quiz_attempt.total_questions) * 100

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
