import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestions, getQuizAttempt } from '../api';
import QuestionCard from '../components/QuestionCard';
import ExplanationView from '../components/ExplanationView';
import { Home } from 'lucide-react';

const QuizReplayPage = () => {
  const { subjectId, moduleId, attemptId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    document.body.classList.add('quiz-mode');
    return () => {
      document.body.classList.remove('quiz-mode');
    };
  }, []);

  useEffect(() => {
    async function loadReplayData() {
      try {
        const questionsData = await getQuestions(subjectId, moduleId);
        const attemptData = await getQuizAttempt(attemptId);
        
        setQuestions(questionsData);
        setAttemptDetails(attemptData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load replay data:", err);
        setLoading(false);
      }
    }
    loadReplayData();
  }, [subjectId, moduleId, attemptId]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Replay...</div>;
  if (!questions.length || !attemptDetails) return <div style={{ padding: '20px' }}>Could not load replay data.</div>;

  const currentQuestion = questions[currentIndex];
  const correspondingLog = attemptDetails.logs.find(log => log.mcq_id === currentQuestion.mcq_id);
  
  // This is the new debugging line
  console.log("Current Log for this question:", correspondingLog);

  let selectedOptionIndex = -1;
  if (correspondingLog) {
      selectedOptionIndex = currentQuestion.options.findIndex(opt => opt.text === correspondingLog.selected_option);
  }

  return (
    <div id="main-content-wrapper">
        <div className="quiz-container">
            <div id="quiz-metadata-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="text-xl font-bold">Replay Mode</h2>
                  <div>Module {moduleId} - Question {currentIndex + 1} of {questions.length}</div>
                </div>
                {correspondingLog?.time_taken_question_sec && (
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {correspondingLog.time_taken_question_sec.toFixed(1)}s
                  </div>
                )}
            </div>

            <hr style={{ margin: '15px 0' }} />

            <div id="question-area">
                <QuestionCard
                    question={currentQuestion}
                    selectedOption={selectedOptionIndex}
                    onSelectOption={() => {}} // No action on select in replay
                    isAttempted={true} // Always show answers
                    correctAnswerIndex={currentQuestion.options.findIndex(o => o.is_correct_answer)}
                    isReadOnly={true} // Disable selection
                />
            </div>

            <ExplanationView
                explanationElements={currentQuestion.explanation_elements}
                references={currentQuestion.references}
                stats={{ time_taken_question_sec: correspondingLog?.time_taken_question_sec }}
            />

            <hr />

            <div className="navigation-buttons" style={{ position: 'sticky', bottom: '0', background: 'inherit', padding: '10px 0', zIndex: 10 }}>
                <button
                    id="prev-btn"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
                >
                    Previous
                </button>
                <button
                    id="next-btn"
                    onClick={handleNext}
                    disabled={currentIndex >= questions.length - 1}
                    style={{ opacity: currentIndex >= questions.length - 1 ? 0.5 : 1 }}
                >
                    Next
                </button>
                 <button
                    onClick={() => navigate(`/history/${subjectId}/${moduleId}`)}
                    style={{ backgroundColor: '#007bff', color: 'white' }}
                >
                    <Home size={20} /> Back to History
                </button>
            </div>
        </div>
    </div>
  );
};

export default QuizReplayPage;