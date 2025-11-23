import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ModulePage from './pages/ModulePage';
import QuizPage from './pages/QuizPage';

/**
 * The main application component.
 *
 * Sets up the React Router and defines the main routes for the application.
 * It also applies the base layout styles (dark mode background, font).
 *
 * @component
 * @returns {JSX.Element} The rendered application component.
 */
function App() {
  return (
    <Router>
      <div className="bg-gray-950 min-h-screen text-gray-100 font-sans">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subject/:subjectId" element={<ModulePage />} />
          <Route path="/quiz/:subjectId/:moduleId" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
