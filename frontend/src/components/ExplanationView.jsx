import React, { useState } from 'react';
import { ZoomIn, BookOpen } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

/**
 * Component to display the explanation for a question after it has been answered.
 * Supports mixed text and image content, and displays references and timing stats.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.explanationElements - List of content blocks (text or image) for the explanation.
 * @param {string} props.explanationElements[].type - Type of element ('text' or 'image').
 * @param {string} [props.explanationElements[].content] - Text content if type is 'text'.
 * @param {string} [props.explanationElements[].path] - Image path if type is 'image'.
 * @param {Array<string>} [props.references] - List of reference strings.
 * @param {Object} props.stats - Statistics about the attempt.
 * @param {number} props.stats.time_taken_question_sec - Time taken to answer the question.
 * @returns {JSX.Element} The rendered explanation view.
 */
const ExplanationView = ({ explanationElements, references, stats }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  /**
   * Opens the lightbox with the selected image.
   * @param {string} src - The URL of the image to display.
   */
  const handleImageClick = (src) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-400" />
        Explanation
      </h3>

      <div className="space-y-4 text-gray-300 leading-relaxed mb-6">
        {explanationElements.map((element, index) => {
          if (element.type === 'text') {
            return <p key={index}>{element.content}</p>;
          } else if (element.type === 'image') {
            return (
              <div key={index} className="my-4 relative group inline-block">
                <img
                  src={`http://localhost:8000${element.path}`}
                  alt="Explanation visual"
                  className="rounded-lg max-h-64 object-cover border border-gray-600 cursor-pointer hover:opacity-90 transition"
                  onClick={() => handleImageClick(`http://localhost:8000${element.path}`)}
                />
                 <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    <ZoomIn className="text-white w-4 h-4" />
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {references && references.length > 0 && (
        <div className="border-t border-gray-700 pt-4 text-sm text-gray-500">
          <p className="font-semibold mb-1">References:</p>
          <ul className="list-disc list-inside space-y-1">
            {references.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Debugging View (Optional, requested in context) */}
      <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-500 font-mono">
        <p>Thinking Time: {stats.time_taken_question_sec.toFixed(2)}s</p>
      </div>

      <ImageLightbox
        src={lightboxSrc}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt="Explanation Image"
      />
    </div>
  );
};

export default ExplanationView;
