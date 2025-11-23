import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestions, submitAttempt, updateAttempt } from '../api';
import QuestionCard from '../components/QuestionCard';
import ExplanationView from '../components/ExplanationView';
import StickyFooter from '../components/StickyFooter';
import { ArrowLeft, CheckCircle, Home } from 'lucide-react';

/**
 * The main quiz interface component.
 *
 * Manages the state of the quiz session, including:
 * - Fetching questions.
 * - Tracking current question index.
 * - Handling user answers and submission.
 * - Managing timers for thinking and explanation phases.
 * - Displaying quiz results upon completion.
 *
 * @component
 * @returns {JSX.Element} The rendered quiz page.
 */
const QuizPage = () => {
  const { subjectId, moduleId } = useParams();
  const navigate = useNavigate();

  // Data State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Progress State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Question State
  const [attempted, setAttempted] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [currentAttemptId, setCurrentAttemptId] = useState(null);

  // History State
  const [userAnswers, setUserAnswers] = useState({}); // Map: index -> { selectedIndex, isCorrect, attemptId }

  // Timers
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const thinkingTimeRef = useRef(0);
  const explanationTimeRef = useRef(0); // Actually cumulative time since answer reveal

  // Load Questions
  useEffect(() => {
    getQuestions(subjectId, moduleId).then(data => {
      setQuestions(data);
      setLoading(false);
      // Start timer for first question
      startThinkingTimer();
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    return () => clearInterval(timerRef.current);
  }, [subjectId, moduleId]);

  /**
   * Starts the timer for the "thinking" phase (before answering).
   */
  const startThinkingTimer = () => {
    startTimeRef.current = Date.now();
    thinkingTimeRef.current = 0;
    explanationTimeRef.current = 0;
  };

  /**
   * Stops the thinking timer and records the elapsed time.
   * Resets the start time to begin tracking explanation time.
   */
  const stopThinkingTimer = () => {
    const now = Date.now();
    thinkingTimeRef.current = (now - startTimeRef.current) / 1000;
    startTimeRef.current = now; // Reset start time for explanation timer
  };

  /**
   * Stops the explanation timer and records the elapsed time.
   */
  const stopExplanationTimer = () => {
    const now = Date.now();
    explanationTimeRef.current = (now - startTimeRef.current) / 1000;
  };

  /**
   * Handles the selection of an answer option.
   * Stops timers, records the attempt in the backend, and updates local state.
   *
   * @param {number} optionIndex - The index of the selected option.
   */
  const handleSelectOption = async (optionIndex) => {
    if (attempted) return;

    stopThinkingTimer();
    setAttempted(true);
    setSelectedOptionIndex(optionIndex);

    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.options[optionIndex].is_correct_answer;

    // Optimistic UI update, send to backend
    let newAttemptId = null;
    try {
        const result = await submitAttempt({
            mcq_id: currentQuestion.mcq_id,
            subject: subjectId,
            module: moduleId,
            selected_option: currentQuestion.options[optionIndex].text,
            is_correct: isCorrect,
            time_taken_question_sec: thinkingTimeRef.current
        });
        newAttemptId = result.id;
        setCurrentAttemptId(result.id);
    } catch (error) {
        console.error("Failed to submit attempt", error);
    }

    // Update history
    setUserAnswers(prev => ({
        ...prev,
        [currentIndex]: {
            selectedIndex: optionIndex,
            isCorrect: isCorrect,
            attemptId: newAttemptId
        }
    }));
  };

  /**
   * Navigates to the next question.
   * Updates explanation timing for the current question before moving on.
   */
  const handleNext = async () => {
    // If currently attempted, save explanation time
    if (attempted && currentAttemptId) {
        stopExplanationTimer();
        try {
            await updateAttempt(currentAttemptId, {
                time_taken_explanation_sec: explanationTimeRef.current
            });
        } catch (error) {
            console.error("Failed to update explanation time", error);
        }
    }

    // If last question, show completion
    if (currentIndex >= questions.length - 1) {
        setQuizCompleted(true);
        return;
    }

    // Move to next
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    window.scrollTo(0,0);
  };

  /**
   * Navigates to the previous question (history mode).
   */
  const handlePrevious = () => {
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          window.scrollTo(0,0);
      }
  };

  // Effect to restore state when navigating between questions
  useEffect(() => {
      const historyData = userAnswers[currentIndex];

      if (historyData) {
          // History Mode (Read Only)
          setAttempted(true);
          setSelectedOptionIndex(historyData.selectedIndex);
          setCurrentAttemptId(historyData.attemptId);
          // Don't start timers
      } else {
          // New Question (Active Mode)
          setAttempted(false);
          setSelectedOptionIndex(null);
          setCurrentAttemptId(null);
          startThinkingTimer();
      }
  }, [currentIndex, userAnswers, questions]); // questions dependency ensures it runs after load


  if (loading) return <div className="text-white p-8">Loading Quiz...</div>;
  if (!questions || questions.length === 0) return <div className="text-white p-8">No questions available.</div>;

  // Quiz Summary View
  if (quizCompleted) {
      const total = questions.length;
      const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
      const scorePercentage = Math.round((correctCount / total) * 100);

      return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                  <p className="text-gray-400 mb-6">You have completed all questions in this module.</p>

                  <div className="bg-gray-800 rounded-xl p-6 mb-8">
                      <div className="text-4xl font-bold mb-1">{correctCount} / {total}</div>
                      <div className="text-sm text-gray-500">Correct Answers</div>
                      <div className="mt-2 text-green-400 font-mono">{scorePercentage}% Score</div>
                  </div>

                  <button
                    onClick={() => navigate(`/modules/${subjectId}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                      <Home size={20} />
                      Back to Modules
                  </button>
              </div>
          </div>
      );
  }

  const currentQuestion = questions[currentIndex];
  const isHistoryMode = userAnswers[currentIndex] !== undefined;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-30 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ArrowLeft />
         </button>
         <div className="font-mono text-sm text-gray-500">
            {isHistoryMode ? "History (Read Only)" : (attempted ? "Timer: Reviewing" : "Timer: Thinking")}
         </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <QuestionCard
            question={currentQuestion}
            selectedOption={selectedOptionIndex}
            onSelectOption={handleSelectOption}
            isAttempted={attempted}
            correctAnswerIndex={currentQuestion.options.findIndex(o => o.is_correct_answer)}
            isReadOnly={isHistoryMode}
        />

        {attempted && (
            <ExplanationView
                explanationElements={currentQuestion.explanation_elements}
                references={currentQuestion.references}
                stats={{
                    time_taken_question_sec: isHistoryMode ? 0 : thinkingTimeRef.current // Don't show confusing 0s in history or store it
                }}
            />
        )}
      </div>

      <StickyFooter
        onPrevious={handlePrevious}
        onNext={handleNext}
        disablePrevious={currentIndex === 0}
        disableNext={!attempted}
        currentIndex={currentIndex}
        totalCount={questions.length}
        isLastQuestion={currentIndex === questions.length - 1}
      />
    </div>
  );
};

export default QuizPage;
