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

  const timeValue = stats?.time_taken_question_sec;

  return (
    <div id="explanation-area">
      <h3>Explanation</h3>

      <div id="explanation-content">
        {explanationElements.map((element, index) => {
          if (element.type === 'text') {
             if (element.content.includes('<table')) {
                 return <div key={index} dangerouslySetInnerHTML={{ __html: element.content }} />;
             }
            return <p key={index}>{element.content}</p>;
          } else if (element.type === 'image') {
            return (
              <img
                key={index}
                src={`${element.path}`}
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
