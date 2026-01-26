import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAttemptStats } from '../api';
import { Home, CheckCircle, XCircle, Clock } from 'lucide-react';

const StatsPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatsData() {
      try {
        const statsData = await getAttemptStats(attemptId);
        setStats(statsData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load stats data:", err);
        setLoading(false);
      }
    }
    loadStatsData();
  }, [attemptId]);

  if (loading) return <div className="text-white p-8">Loading stats...</div>;
  if (!stats) return <div className="text-white p-8">Could not load stats for attempt {attemptId}.</div>;

  const { attempt_summary, questions_stats, label_performance } = stats;

  const incorrectAnswers = questions_stats.filter(q => !q.is_correct);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Performance Analysis</h1>
            <p className="text-lg text-gray-400">{attempt_summary.subject} {'>'} {attempt_summary.module}</p>
          </div>
          <button
            onClick={() => navigate(`/history/${attempt_summary.subject}/${attempt_summary.module}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Home size={18} /> Back to History
          </button>
        </div>

        {/* Overall Summary */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <div className="text-gray-400 text-sm">Score</div>
                <div className="text-2xl font-bold">{attempt_summary.score} / {attempt_summary.total_questions * 4}</div>
            </div>
            <div>
                <div className="text-gray-400 text-sm">Percentage</div>
                <div className="text-2xl font-bold">{attempt_summary.percentage.toFixed(1)}%</div>
            </div>
            <div className="flex flex-col items-center justify-center">
                 <div className="text-gray-400 text-sm mb-1">Breakdown (C/I/S)</div>
                 <div className="flex items-center gap-3">
                    <span className="text-green-500 flex items-center gap-1"><CheckCircle size={16} />{attempt_summary.correct_count}</span>
                    <span className="text-red-500 flex items-center gap-1"><XCircle size={16} />{attempt_summary.incorrect_count}</span>
                    <span className="text-yellow-500 flex items-center gap-1"><Clock size={16} />{attempt_summary.skipped_count}</span>
                </div>
            </div>
             <div>
                <div className="text-gray-400 text-sm">Date</div>
                <div className="text-lg font-semibold">{new Date(attempt_summary.start_time).toLocaleDateString()}</div>
            </div>
        </div>

        {/* Performance by Topic */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Performance by Topic</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Topic/Label</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Correct</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Avg. Time (s)</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {label_performance.map(label => (
                  <tr key={label.label}>
                    <td className="px-4 py-3 whitespace-nowrap">{label.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{label.correct} / {label.total}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{label.average_time.toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Incorrect Answers Review</h2>
          {incorrectAnswers.length > 0 ? (
            <ul className="space-y-2">
              {incorrectAnswers.map(q => (
                <li key={q.mcq_id}>
                  <Link
                    to={`/replay/${attempt_summary.subject}/${attempt_summary.module}/${attemptId}?question=${q.mcq_id}`}
                    className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-mono text-sm text-red-400">{q.mcq_id}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No incorrect answers. Great job!</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default StatsPage;