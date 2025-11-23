import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getModules } from '../api';
import { Folder, ChevronRight, ArrowLeft } from 'lucide-react';

const ModulePage = () => {
  const { subjectId } = useParams();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModules(subjectId).then(data => {
      setModules(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [subjectId]);

  if (loading) return <div className="text-white p-8">Loading modules...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <Link to="/" className="flex items-center text-gray-400 hover:text-white mb-6 w-fit">
        <ArrowLeft size={20} className="mr-2" />
        Back to Subjects
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-white">{subjectId}</h1>
      <p className="text-gray-400 mb-8">Select a module to start practicing</p>

      <div className="space-y-4">
        {modules.map(module => (
          <Link
            key={module}
            to={`/quiz/${subjectId}/${module}`}
            className="block bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-blue-500 hover:bg-gray-800 transition-all group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
                  <Folder size={24} />
                </div>
                <h2 className="text-lg font-medium">{module}</h2>
              </div>
              <ChevronRight className="text-gray-600 group-hover:text-white transition" />
            </div>
          </Link>
        ))}
        {modules.length === 0 && (
          <div className="text-gray-500">No modules found in this folder.</div>
        )}
      </div>
    </div>
  );
};

export default ModulePage;
