import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const StickyFooter = ({
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  currentIndex,
  totalCount,
  mode
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 flex justify-between items-center z-40 text-white">
      <button
        onClick={onPrevious}
        disabled={disablePrevious}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          disablePrevious
            ? 'text-gray-500 cursor-not-allowed'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        <ChevronLeft size={20} />
        <span>Previous</span>
      </button>

      <div className="text-gray-400 font-medium">
        {totalCount > 0 ? `${currentIndex + 1} / ${totalCount}` : 'Loading...'}
      </div>

      <button
        onClick={onNext}
        disabled={disableNext}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          disableNext
            ? 'text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        <span>Next</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default StickyFooter;
