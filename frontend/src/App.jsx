import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ModulePage from './pages/ModulePage';
import QuizPage from './pages/QuizPage';
import AttemptHistoryPage from './pages/AttemptHistoryPage';
import QuizReplayPage from './pages/QuizReplayPage';
import StatsPage from './pages/StatsPage';

/**
 * The main application component.
 *
 * Sets up the React Router and defines the main routes for the application.
 * It also handles system theme detection to toggle dark mode.
 *
 * @component
 * @returns {JSX.Element} The rendered application component.
 */
function App() {
  useEffect(() => {
    // Check system preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Apply initial theme
    if (darkModeMediaQuery.matches) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Listen for changes
    const handleChange = (e) => {
      if (e.matches) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    };

    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <Router>
      <div style={{ width: '100%' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subject/:subjectId" element={<ModulePage />} />
          <Route path="/history/:subjectId/:moduleId" element={<AttemptHistoryPage />} />
          <Route path="/quiz/:subjectId/:moduleId" element={<QuizPage />} />
          <Route path="/replay/:subjectId/:moduleId/:attemptId" element={<QuizReplayPage />} />
          <Route path="/stats/:attemptId" element={<StatsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
