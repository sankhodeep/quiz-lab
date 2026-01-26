import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAttemptHistory, createQuizAttempt, deleteQuizAttempt } from '../api';
import { BookCopy, Clock, Percent, Target, Check, X, SkipForward, Trash2 } from 'lucide-react';

const AttemptHistoryPage = () => {
  const { subjectId, moduleId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttemptHistory(subjectId, moduleId)
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching attempt history:", err);
        setLoading(false);
      });
  }, [subjectId, moduleId]);

  const handleNewAttempt = async () => {
    try {
      const newAttempt = await createQuizAttempt(subjectId, moduleId);
      navigate(`/quiz/${subjectId}/${moduleId}?attemptId=${newAttempt.id}`);
    } catch (err) {
      console.error("Error starting new attempt:", err);
      // You might want to show an error to the user here
    }
  };

  const handleDeleteAttempt = async (attemptId) => {
    if (window.confirm("Are you sure you want to delete this attempt from history?")) {
      try {
        await deleteQuizAttempt(attemptId);
        setHistory(prev => prev.filter(attempt => attempt.id !== attemptId));
      } catch (err) {
        console.error("Error deleting attempt:", err);
        alert("Failed to delete attempt.");
      }
    }
  };

  if (loading) return <div className="text-white p-8">Loading history...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2 text-blue-400">Attempt History</h1>
      <p className="text-lg text-gray-400 mb-8">{subjectId} &gt; {moduleId}</p>
      
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">Past Attempts</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No attempts found for this module.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stats (C/I/S)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {history.map(attempt => (
                  <tr key={attempt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(attempt.start_time).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{attempt.score} / {attempt.total_questions * 4}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-green-500 flex items-center gap-1"><Check size={16} />{attempt.correct_count}</span>
                        <span className="text-red-500 flex items-center gap-1"><X size={16} />{attempt.incorrect_count}</span>
                        <span className="text-yellow-500 flex items-center gap-1"><SkipForward size={16} />{attempt.skipped_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{attempt.percentage.toFixed(2)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link to={`/stats/${attempt.id}`} className="text-blue-400 hover:text-blue-300 font-semibold mr-4">Stats</Link>
                      <Link to={`/replay/${subjectId}/${moduleId}/${attempt.id}`} className="text-blue-400 hover:text-blue-300 font-semibold mr-4">Replay</Link>
                      <button
                        onClick={() => handleDeleteAttempt(attempt.id)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                        title="Delete Attempt"
                      >
                        <Trash2 size={18} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={handleNewAttempt}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all w-full md:w-auto"
        >
          Start New Attempt
        </button>
      </div>
    </div>
  );
};

export default AttemptHistoryPage;