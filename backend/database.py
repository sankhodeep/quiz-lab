"""
Database Configuration and Models.

This module handles the SQLite database connection, session creation,
and defines the SQLAlchemy ORM models used for tracking user performance.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Determine absolute path to data folder relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "study_data.db")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Use absolute path for SQLite
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class QuizAttempt(Base):
    """
    Represents a single, complete attempt at a quiz for a specific module.
    """
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True, nullable=False)
    module = Column(String, index=True, nullable=False)
    status = Column(String, default="in-progress")  # e.g., 'in-progress', 'completed'
    score = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    # Relationship to link back to individual question attempts
    logs = relationship("AttemptLog", back_populates="quiz_attempt")


class AttemptLog(Base):
    """
    Represents a single attempt at a Multiple Choice Question (MCQ).

    Attributes:
        id (int): Primary key.
        quiz_attempt_id (int, optional): Foreign key to the parent quiz attempt.
        mcq_id (str): Unique identifier for the question.
        subject (str): The subject area of the question.
        module (str): The specific module within the subject.
        selected_option (str): The option selected by the user (e.g., 'A', 'Option Text').
        is_correct (bool): True if the answer was correct, False otherwise.
        time_taken_question_sec (float): Time spent answering the question in seconds.
        time_taken_explanation_sec (float): Time spent reading the explanation in seconds.
        timestamp (datetime): The UTC time when the attempt was recorded.
    """
    __tablename__ = "attempt_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to the QuizAttempt table
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), index=True, nullable=True)

    mcq_id = Column(String, index=True)
    subject = Column(String, index=True)
    module = Column(String, index=True)
    selected_option = Column(String)  # Store text or label (A, B, etc.)
    is_correct = Column(Boolean)
    time_taken_question_sec = Column(Float, default=0.0)
    time_taken_explanation_sec = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship to link back to the parent QuizAttempt
    quiz_attempt = relationship("QuizAttempt", back_populates="logs")

def init_db():
    """
    Initializes the database by creating all tables defined in the metadata.

    This function should be called at application startup to ensure the
    schema exists.
    """
    Base.metadata.create_all(bind=engine)
