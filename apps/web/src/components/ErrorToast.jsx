import React, { useEffect } from 'react';

export function ErrorToast({ message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md border-2 border-red-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">
              {message || 'An error occurred. Please try again.'}
            </p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-2 text-red-200 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorToastContainer({ errors, onDismiss }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.map((error, index) => (
        <ErrorToast
          key={error.id || index}
          message={error.message}
          onClose={() => onDismiss(error.id || index)}
          duration={error.duration || 5000}
        />
      ))}
    </div>
  );
}
