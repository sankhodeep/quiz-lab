# Medical MCQ Practice Platform

A self-hosted, full-stack application for practicing Medical Multiple Choice Questions (MCQs). It allows users to browse subjects and modules, attempt questions with timers, review explanations, and track basic performance stats.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)

## Features
- **Subject & Module Organization**: Browse questions organized by hierarchical folders.
- **Interactive Quiz Interface**:
  - Timer tracking for "thinking time" (pre-answer).
  - Immediate feedback upon selection.
  - Detailed explanations with text and image support.
  - Lightbox view for high-resolution medical images.
- **Study Mode**:
  - Review past questions in a read-only history mode.
  - Continuation logic to track explanation reading time.
- **Performance Tracking**: Records attempts, correctness, and timing data in a local SQLite database.

## Architecture
- **Backend**: Python (FastAPI)
  - Serves API endpoints for question data and attempt logging.
  - Manages SQLite database via SQLAlchemy.
  - Serve static media files from the question bank.
- **Frontend**: JavaScript (React + Vite)
  - Single Page Application (SPA) with Client-side routing.
  - Styled with Tailwind CSS.
  - Lucide React for icons.
- **Data Source**: Local File System
  - Questions are stored in JSON format within a specific directory structure.

## Prerequisites
- **Python**: 3.8+
- **Node.js**: 16+ (and `npm`)

## Setup & Installation

### Backend Setup
1.  Navigate to the `backend` directory (or root, depending on where you run it, but typical Python practice suggests a venv):
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server (from the repo root or backend folder, ensuring python path is correct):
    ```bash
    # From repo root
    uvicorn backend.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### Frontend Setup
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`.

## Configuration
Create a `.env` file in the root directory based on `.env.example`.

**Key Variables:**
*   `ROOT_FOLDER_PATH`: Path to your question bank folder (defaults to `./mock_data`).
*   `DATABASE_URL`: SQLAlchemy connection string (defaults to a local SQLite file in `data/`).

## Usage Guide
1.  **Prepare Data**: Ensure your question bank is structured as:
    ```
    Root/
      SubjectName/
        ModuleName/
          questions.json
          media/
    ```
2.  **Start Services**: Launch both backend and frontend terminals.
3.  **Practice**:
    - Open the browser to the frontend URL.
    - Select a Subject -> Select a Module.
    - Attempt questions. The timer runs until you select an option.
    - Review the explanation.
    - Navigate using Next/Previous.

## Project Structure
```
.
├── backend/                # FastAPI application
│   ├── main.py             # App entry point & routes
│   ├── database.py         # DB models & config
│   └── services/           # Business logic (File loading)
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route views
│   │   └── api.js          # Axios API wrapper
├── mock_data/              # Sample question bank
└── data/                   # SQLite database storage (generated)
```
