import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

/**
 * Displays the main question content and options using the provided CSS structure.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Object} props.question - The question object.
 * @param {string} props.question.mcq_id - Unique question ID.
 * @param {string} props.question.text - The question text.
 * @param {Array<string>} [props.question.labels] - Optional labels/tags for the question.
 * @param {string} [props.question.question_media_path] - Optional path to a question image.
 * @param {Array<Object>} props.question.options - List of answer options.
 * @param {string} props.question.options[].text - Option text.
 * @param {string} [props.question.options[].percentage] - Optional stat percentage.
 * @param {number|null} props.selectedOption - The index of the currently selected option.
 * @param {function} props.onSelectOption - Callback when an option is selected.
 * @param {boolean} props.isAttempted - Whether the question has been submitted.
 * @param {number} props.correctAnswerIndex - The index of the correct option.
 * @returns {JSX.Element} The rendered question card.
 */
const QuestionCard = ({ question, selectedOption, onSelectOption, isAttempted, correctAnswerIndex }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  const handleImageClick = (src) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  /**
   * Determines the CSS classes for an option based on its state (selected, correct, wrong).
   * Uses the provided CSS class names: option-btn, correct, incorrect, selected.
   */
  const getOptionClassName = (index) => {
    let classes = 'option-btn';

    if (isAttempted) {
        if (index === correctAnswerIndex) {
            classes += ' correct';
        } else if (selectedOption === index) {
            classes += ' incorrect';
        } else if (selectedOption !== null && index !== selectedOption) {
            // "answered" logic is handled by parent or just opacity
        }
    }

    if (selectedOption === index) {
        classes += ' selected';
    }

    return classes;
  };

  return (
    // The container classes like "bg-gray-900" are removed to let the parent .quiz-container or CSS handle it.
    // However, the CSS structure provided implies flat structure inside .quiz-container.
    // But this component isolates the "Question Card" logic.
    // I will render the text, image, and options here using the IDs/classes from the CSS.
    <div className={isAttempted ? "answered" : ""}>

      {/* Question Text */}
      <div id="question-text">
        {question.text}
      </div>

      {/* Question Image */}
      {question.question_media_path && (
        <img
            id="question-image"
            src={`${question.question_media_path}`}
            alt="Question"
            onClick={() => handleImageClick(`${question.question_media_path}`)}
            style={{ cursor: 'pointer' }}
        />
      )}

      {/* Options Grid */}
      <div className="options-grid">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isAttempted && onSelectOption(index)}
            disabled={isAttempted} // Disable all buttons after attempt, or just non-selected ones via CSS?
            // The CSS: .answered .option-btn:not(.selected) { opacity: 0.7; pointer-events: none; }
            // So we don't necessarily need 'disabled' attribute if CSS handles it, but good for a11y.
            // But if we disable, the click won't fire anyway.
            className={getOptionClassName(index)}
          >
            <span>{option.text}</span>
            {isAttempted && (
                <span className="percentage-display">{option.percentage}</span>
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
