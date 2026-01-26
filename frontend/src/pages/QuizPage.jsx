import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getQuestions, submitAttempt, updateAttempt, completeQuizAttempt } from '../api';
import QuestionCard from '../components/QuestionCard';
import ExplanationView from '../components/ExplanationView';
import { CheckCircle, Home } from 'lucide-react';

/**
 * The main quiz interface component.
 * Refactored to match specific UI requirements and CSS structure.
 */
const QuizPage = () => {
  const { subjectId, moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const attemptId = queryParams.get('attemptId');

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
  const [userAnswers, setUserAnswers] = useState({}); // Map: index -> { selectedIndex, isCorrect, attemptId, timeTaken }

  // Timers
  const startTimeRef = useRef(0);
  const thinkingTimeRef = useRef(0);
  const explanationTimeRef = useRef(0);

  // Visual Timer State
  const [elapsedTime, setElapsedTime] = useState(0);

  // Apply Quiz Mode Theme to Body
  useEffect(() => {
    document.body.classList.add('quiz-mode');
    return () => {
      document.body.classList.remove('quiz-mode');
    };
  }, []);

  // Helper to format time
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startThinkingTimer = () => {
    startTimeRef.current = Date.now();
    thinkingTimeRef.current = 0;
    explanationTimeRef.current = 0;
    setElapsedTime(0);
  };

  const stopThinkingTimer = () => {
    const now = Date.now();
    thinkingTimeRef.current = (now - startTimeRef.current) / 1000;
    startTimeRef.current = now; // Reset for explanation
  };

  const stopExplanationTimer = () => {
    const now = Date.now();
    explanationTimeRef.current = (now - startTimeRef.current) / 1000;
  };

  // Load Questions
  useEffect(() => {
    getQuestions(subjectId, moduleId).then(data => {
      setQuestions(data);
      setLoading(false);
      startThinkingTimer();
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [subjectId, moduleId]);

  // Timer Logic
  useEffect(() => {
    let interval;
    // Only run timer if not loading, not completed, and explicitly not history mode
    const isHistory = userAnswers[currentIndex] !== undefined;

    if (!loading && !quizCompleted && !isHistory && !attempted) {
        interval = setInterval(() => {
            const now = Date.now();
            // Calculate elapsed time based on start time ref to avoid drift
            const seconds = Math.max(0, Math.floor((now - startTimeRef.current) / 1000));
            setElapsedTime(seconds);
        }, 1000);
    } else if (attempted || isHistory) {
        const recordedTime = userAnswers[currentIndex]?.timeTaken || (attempted ? thinkingTimeRef.current : 0);
        setElapsedTime(Math.floor(recordedTime));
    }

    return () => clearInterval(interval);
  }, [loading, quizCompleted, userAnswers, currentIndex, attempted]);

  const handleSelectOption = async (optionIndex) => {
    if (attempted) return;

    stopThinkingTimer();
    const timeTaken = thinkingTimeRef.current;

    setAttempted(true);
    setSelectedOptionIndex(optionIndex);

    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.options[optionIndex].is_correct_answer;

    let newAttemptId = null;
    try {
        const result = await submitAttempt({
            mcq_id: currentQuestion.mcq_id,
            subject: subjectId,
            module: moduleId,
            selected_option: currentQuestion.options[optionIndex].text,
            is_correct: isCorrect,
            time_taken_question_sec: timeTaken,
            quiz_attempt_id: attemptId
        });
        newAttemptId = result.id;
        setCurrentAttemptId(result.id);
    } catch (error) {
        console.error("Failed to submit attempt", error);
    }

    setUserAnswers(prev => ({
        ...prev,
        [currentIndex]: {
            selectedIndex: optionIndex,
            isCorrect: isCorrect,
            attemptId: newAttemptId,
            timeTaken: timeTaken
        }
    }));
  };

  const navigateToQuestion = (index) => {
      const historyData = userAnswers[index];
      if (historyData) {
          setAttempted(true);
          setSelectedOptionIndex(historyData.selectedIndex);
          setCurrentAttemptId(historyData.attemptId);
      } else {
          setAttempted(false);
          setSelectedOptionIndex(null);
          setCurrentAttemptId(null);
          startThinkingTimer();
      }
      setCurrentIndex(index);
      window.scrollTo(0,0);
  };

  const handleNext = async () => {
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

    if (currentIndex >= questions.length - 1) {
        setQuizCompleted(true);
        return;
    }

    navigateToQuestion(currentIndex + 1);
  };

  const handlePrevious = () => {
      if (currentIndex > 0) {
          navigateToQuestion(currentIndex - 1);
      }
  };

  const handleFinish = async () => {
    const attemptedIndexes = Object.keys(userAnswers).map(Number);
    const allIndexes = Array.from({ length: questions.length }, (_, i) => i);
    const skippedIndexes = allIndexes.filter(i => !attemptedIndexes.includes(i));
    const skippedMcqIds = skippedIndexes.map(i => questions[i].mcq_id);
    
    try {
        await completeQuizAttempt(attemptId, skippedMcqIds);
        setQuizCompleted(true);
    } catch (error) {
        console.error("Failed to finalize quiz:", error);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Quiz...</div>;
  if (!questions || questions.length === 0) return <div style={{ padding: '20px' }}>No questions available.</div>;

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
                    onClick={() => navigate(`/subject/${subjectId}`)}
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
    <div id="main-content-wrapper">
        <div className="quiz-container">
            <div id="quiz-metadata-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div id="question-number">
                        Module {moduleId} - Question {currentIndex + 1} of {questions.length}
                    </div>
                    <div id="mcq-id-display">
                        MCQ ID: {currentQuestion.mcq_id}
                    </div>
                    <div id="labels-display">
                        Labels: {currentQuestion.labels?.join(', ') || 'None'}
                    </div>
                </div>

                {/* Timer Display - Stopwatch */}
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {formatTime(elapsedTime)}
                </div>
            </div>

            <hr style={{ margin: '15px 0' }} />

            <div id="question-area">
                <QuestionCard
                    question={currentQuestion}
                    selectedOption={selectedOptionIndex}
                    onSelectOption={handleSelectOption}
                    isAttempted={attempted}
                    correctAnswerIndex={currentQuestion.options.findIndex(o => o.is_correct_answer)}
                    isReadOnly={isHistoryMode}
                />
            </div>

            {attempted && (
                <ExplanationView
                    explanationElements={currentQuestion.explanation_elements}
                    references={currentQuestion.references}
                    stats={{
                        time_taken_question_sec: userAnswers[currentIndex]?.timeTaken || 0
                    }}
                />
            )}

            <hr />

            <div className="navigation-buttons" style={{ position: 'sticky', bottom: '0', background: 'inherit', padding: '10px 0', zIndex: 10 }}>
                <button
                    id="prev-btn"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    style={{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
                >
                    Previous
                </button>
                <button
                    id="next-btn"
                    onClick={handleNext}
                    disabled={!attempted}
                    style={{ opacity: !attempted ? 0.5 : 1, cursor: !attempted ? 'not-allowed' : 'pointer' }}
                >
                    Next
                </button>
                <button
                    id="finish-btn"
                    onClick={handleFinish}
                    style={{ backgroundColor: '#28a745', color: 'white' }}
                >
                    Finish
                </button>
            </div>
        </div>
    </div>
  );
};

export default QuizPage;
