import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

/**
 * Component to display the explanation using the specific CSS structure.
 * Matches #explanation-area and its children.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.explanationElements - List of content blocks.
 * @param {Array<string>} [props.references] - List of reference strings.
 * @param {Object} props.stats - Statistics (optional to display).
 */
const ExplanationView = ({ explanationElements, references, stats }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  const handleImageClick = (src) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  // Helper to process text content that might contain HTML tables or specific formatting?
  // The CSS has styles for #explanation-content table, th, td.
  // If the backend returns HTML in 'content', we might need dangerouslySetInnerHTML.
  // Assuming 'content' is plain text or simple HTML.
  // The provided code used <p>{element.content}</p>.
  // I will stick to that but if the content contains tables, it might need dangerous HTML.
  // For now, I'll assume standard elements.

  return (
    <div id="explanation-area">
      <h3>Explanation</h3>

      <div id="explanation-content">
        {explanationElements.map((element, index) => {
          if (element.type === 'text') {
            // Check if content looks like it contains HTML (e.g. <table>)
             if (element.content.includes('<table')) {
                 return <div key={index} dangerouslySetInnerHTML={{ __html: element.content }} />;
             }
            return <p key={index}>{element.content}</p>;
          } else if (element.type === 'image') {
            return (
              <img
                key={index}
                src={`${element.path}`} // removed hardcoded localhost
                alt="Explanation visual"
                onClick={() => handleImageClick(`${element.path}`)}
                style={{ cursor: 'pointer' }}
              />
            );
          }
          return null;
        })}
      </div>

      {references && references.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>References:</h4>
          <ul id="references-list">
            {references.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats display - optional, matching previous logic but maybe styling it simply */}
      {/* The user didn't ask to remove it, but didn't ask to style it.
          I'll add it as a simple paragraph at the bottom. */}
      {stats && (
          <p style={{ fontSize: '0.8em', color: '#777', marginTop: '10px' }}>
              Time taken: {stats.time_taken_question_sec.toFixed(1)}s
          </p>
      )}

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
