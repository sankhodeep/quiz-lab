# Agent Guidelines for Quiz Lab Repository

This document provides a set of guidelines for agents working on this codebase. Adhering to these conventions is crucial for maintaining code quality, consistency, and a smooth development workflow.

## Table of Contents
1.  [Project Overview](#project-overview)
2.  [Commands](#commands)
    -   [Frontend](#frontend)
    -   [Backend](#backend)
3.  [Code Style & Conventions](#code-style--conventions)
    -   [General](#general)
    -   [Frontend (React)](#frontend-react)
    -   [Backend (Python/FastAPI)](#backend-pythonfastapi)
4.  [Testing](#testing)
5.  [Error Handling](#error-handling)
6.  [Dependencies](#dependencies)
7.  [Git & Commits](#git--commits)

---

## 1. Project Overview

This is a full-stack application for a medical MCQ practice platform.

-   **Frontend**: A React single-page application built with Vite.
-   **Backend**: A FastAPI server that provides a RESTful API.
-   **Database**: SQLite for storing user attempt data.

The two parts of the application are in the `frontend` and `backend` directories, respectively. They should be treated as separate projects in terms of dependencies and commands.

---

## 2. Commands

### Frontend

All frontend commands should be run from the `C:\quiz-lab\frontend` directory.

-   **Install Dependencies**:
    ```bash
    npm install
    ```

-   **Run Development Server**:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

-   **Build for Production**:
    ```bash
    npm run build
    ```

-   **Lint Files**:
    ```bash
    npm run lint
    ```
    This command uses ESLint to check for code quality. Please fix any issues it reports.

### Backend

All backend commands should be run from the repository root (`C:\quiz-lab`).

-   **Install Dependencies**:
    First, create and activate a virtual environment.
    ```bash
    # In C:\quiz-lab\backend
    python -m venv venv
    venv\Scripts\activate
    ```
    Then, install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```

-   **Run Development Server**:
    ```bash
    uvicorn backend.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

---

## 3. Code Style & Conventions

### General

-   **File Naming**: Use `kebab-case` for files and `PascalCase` for component files in React.
-   **Comments**: Add comments to explain complex logic. Use JSDoc for React components and Google-style docstrings for Python functions/modules.

### Frontend (React)

-   **Formatting**: Use 2-space indentation.
-   **Imports**:
    1.  React and its hooks.
    2.  Third-party libraries.
    3.  Local components, utilities, and assets.
-   **Naming**:
    -   Components: `PascalCase` (e.g., `QuestionCard`).
    -   Functions/Variables: `camelCase` (e.g., `handleImageClick`).
-   **Typing**: This project uses JavaScript with JSDoc for type annotations. Be diligent in documenting component props.
-   **Styling**: The project uses a combination of Tailwind CSS and plain CSS classes. Prefer using Tailwind CSS utility classes where possible.

### Backend (Python/FastAPI)

-   **Formatting**: Follow PEP 8 guidelines. A line length of ~90 characters is preferred.
-   **Imports**: Group imports in the following order:
    1.  Standard library.
    2.  Third-party libraries.
    3.  Application-specific modules.
-   **Naming**:
    -   Classes: `PascalCase` (e.g., `AttemptCreate`).
    -   Functions/Variables: `snake_case` (e.g., `get_db`).
-   **Typing**: Use type hints for all function signatures and variables where appropriate.
-   **API Design**: Follow RESTful principles. Use Pydantic models for request and response validation.

---

## 4. Testing

Currently, there are no automated tests for the frontend or backend. When adding new features, you should also add corresponding tests.

-   **Frontend**: Use a testing framework like Vitest or React Testing Library. Test files should be co-located with the component they are testing (e.g., `QuestionCard.test.jsx`).
-   **Backend**: Use `pytest`. Test files should be in a `tests` directory within the `backend` folder.

---

## 5. Error Handling

-   **Frontend**: Use `try...catch` blocks for API calls and handle potential errors gracefully, showing informative messages to the user.
-   **Backend**: Use `try...except` blocks in API endpoints to catch exceptions. Raise `HTTPException` with appropriate status codes and detail messages for client-side errors. Log server-side errors.

---

## 6. Dependencies

-   **Frontend**: Manage dependencies with `npm`. Do not use `yarn` or `pnpm`.
-   **Backend**: Manage dependencies with `pip` and `requirements.txt`.

---

## 7. Git & Commits

-   Follow conventional commit message standards (e.g., `feat: add dark mode toggle`).
-   Create feature branches off of `main`.
-   Ensure the code is linted and tested (when applicable) before committing.
