import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

const QuestionCard = ({ question, selectedOption, onSelectOption, isAttempted, correctAnswerIndex }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  const handleImageClick = (src) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  const getOptionStyle = (index, isCorrect) => {
    if (!isAttempted) {
      // Active Mode: Just show selection state
      return selectedOption === index
        ? 'bg-blue-600 border-blue-500 text-white'
        : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700';
    }

    // Review Mode
    if (index === correctAnswerIndex) {
      return 'bg-green-600 border-green-500 text-white'; // Always highlight correct answer
    }

    if (selectedOption === index && index !== correctAnswerIndex) {
        return 'bg-red-600 border-red-500 text-white'; // Highlight wrong selection
    }

    return 'bg-gray-800 border-gray-700 text-gray-400 opacity-60'; // Dim other options
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 mb-6">
      <div className="flex justify-between items-start mb-4 text-sm text-gray-500">
        <div>ID: {question.mcq_id}</div>
        <div className="flex gap-2">
            {question.labels?.map((label, i) => (
                <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs">{label}</span>
            ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
        {question.text}
      </h2>

      {question.question_media_path && (
        <div className="mb-6 relative group inline-block">
          <img
            src={`http://localhost:8000${question.question_media_path}`}
            alt="Question visual"
            className="rounded-lg max-h-64 object-cover border border-gray-700 cursor-pointer"
            onClick={() => handleImageClick(`http://localhost:8000${question.question_media_path}`)}
          />
           <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <ZoomIn className="text-white w-4 h-4" />
           </div>
        </div>
      )}

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isAttempted && onSelectOption(index)}
            disabled={isAttempted}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex justify-between items-center ${getOptionStyle(index, option.is_correct_answer)}`}
          >
            <span>{option.text}</span>
            {isAttempted && (
                <span className="text-sm font-mono opacity-80">{option.percentage}</span>
            )}
          </button>
        ))}
      </div>

      <ImageLightbox
        src={lightboxSrc}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt="Question Image"
      />
    </div>
  );
};

export default QuestionCard;
