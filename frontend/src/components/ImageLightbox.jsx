import React, { useState, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * A modal overlay to display an image at full size.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.src - The source URL of the image.
 * @param {string} [props.alt] - The alt text for the image.
 * @param {boolean} props.isOpen - Whether the lightbox is currently visible.
 * @param {function} props.onClose - Callback function to close the lightbox.
 * @returns {JSX.Element|null} The rendered lightbox or null if not open.
 */
const ImageLightbox = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative max-w-full max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          <X size={32} />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
