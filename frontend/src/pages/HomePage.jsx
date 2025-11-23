import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubjects } from '../api';
import { Book, ChevronRight } from 'lucide-react';

const HomePage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubjects().then(data => {
      setSubjects(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-white p-8">Loading subjects...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Medical Practice Library</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(subject => (
          <Link
            key={subject}
            to={`/subject/${subject}`}
            className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-blue-500 hover:bg-gray-800 transition-all group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
                  <Book size={24} />
                </div>
                <h2 className="text-xl font-semibold">{subject}</h2>
              </div>
              <ChevronRight className="text-gray-600 group-hover:text-white transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
