import React, { useState } from 'react';
import { staffApi } from '../lib/auth';

export function StaffWelcomeModal({ isOpen, onClose, userName }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Pawtimation',
      number: 1,
      content: "You've been added as a staff member for your pet-care team. Here's how everything works."
    },
    {
      title: 'Your Dashboard',
      number: 2,
      content: 'This shows all your upcoming bookings and visits. You\'ll see who you\'re caring for, where they are, and what\'s needed.'
    },
    {
      title: 'Confirm or Decline Jobs',
      number: 3,
      content: 'When you\'re assigned a booking, it will appear as "Pending". Just tap Confirm if you can do it or Decline if you can\'t. Your admin gets notified instantly.'
    },
    {
      title: 'Your Calendar',
      number: 4,
      content: 'Every confirmed booking automatically appears in your calendar. Tap any booking for full details.'
    },
    {
      title: 'Completing Jobs',
      number: 5,
      content: 'After finishing a booking, mark it as Completed. This updates the admin dashboard and creates the invoice items.'
    },
    {
      title: 'Important Notes & Safety',
      number: 6,
      content: 'Always check booking notes for important details: access codes, alarm instructions, dog behaviours, harness requirements, medical notes. Admins and clients rely on you reading these carefully.'
    }
  ];

  if (!isOpen) return null;

  const handleDismiss = async () => {
    try {
      await staffApi('/staff/welcome/dismiss', { method: 'POST' });
      onClose();
    } catch (err) {
      console.error('Failed to dismiss welcome modal:', err);
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-teal-700">{step.number}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
          {currentStep === 0 && userName && (
            <p className="text-lg text-teal-600 mb-2">Hi {userName}</p>
          )}
          <p className="text-gray-600 leading-relaxed">{step.content}</p>
        </div>

        <div className="flex gap-1 justify-center mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-teal-600'
                  : index < currentStep
                  ? 'w-2 bg-teal-300'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
        </button>

        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="w-full mt-2 px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
