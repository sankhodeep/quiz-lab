from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv

from backend.database import SessionLocal, init_db, AttemptLog
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
    "http://localhost:5173", # Vite default
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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class AttemptCreate(BaseModel):
    mcq_id: str
    subject: str
    module: str
    selected_option: str
    is_correct: bool
    time_taken_question_sec: float

class AttemptUpdate(BaseModel):
    time_taken_explanation_sec: float

# Routes

@app.get("/subjects")
def get_subjects():
    return question_source.get_subjects()

@app.get("/modules/{subject_name}")
def get_modules(subject_name: str):
    modules = question_source.get_modules(subject_name)
    if not modules:
        # Check if subject exists first? Or just return empty list.
        # FileSystemSource returns empty list if invalid path.
        pass
    return modules

@app.get("/questions/{subject}/{module}")
def get_questions(subject: str, module: str):
    questions = question_source.get_questions(subject, module)
    if not questions:
        raise HTTPException(status_code=404, detail="Questions not found or empty")
    return questions

import traceback

@app.post("/submit_attempt")
def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
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
    db_attempt = db.query(AttemptLog).filter(AttemptLog.id == attempt_id).first()
    if not db_attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    db_attempt.time_taken_explanation_sec = update_data.time_taken_explanation_sec
    db.commit()
    return {"status": "updated"}

@app.get("/")
def read_root():
    return {"message": "Medical MCQ Platform API is running"}
