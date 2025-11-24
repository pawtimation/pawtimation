import React, { useState } from 'react';
import { clientApi } from '../lib/auth';

export function ClientWelcomeModal({ isOpen, onClose, clientName }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Pawtimation',
      number: 1,
      content: 'This is your client portal — everything you need in one place.'
    },
    {
      title: 'Your Schedule',
      number: 2,
      content: 'See all your dog\'s upcoming walks, visits, and bookings at a glance. Pending bookings show as "Awaiting Confirmation". Confirmed bookings show the staff member and time.'
    },
    {
      title: 'Your Dogs',
      number: 3,
      content: 'Manage your dogs, notes, feeding instructions, behaviour info, and more. Your walkers use this to keep your dog safe and happy.'
    },
    {
      title: 'Invoices & Payments',
      number: 4,
      content: 'See all your invoices in one place. New invoices appear automatically. You can pay online or any method your walker accepts.'
    },
    {
      title: 'Booking Requests',
      number: 5,
      content: 'Depending on your business, you may be able to request new bookings. Your walker will confirm them and they\'ll appear in your schedule.'
    }
  ];

  if (!isOpen) return null;

  const handleDismiss = async () => {
    try {
      await clientApi('/client/welcome/dismiss', { method: 'POST' });
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
            <span className="text-2xl font-bold text-teal-600">{step.number}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
          {currentStep === 0 && clientName && (
            <p className="text-lg text-teal-600 mb-2">Hi {clientName}!</p>
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

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            If anything looks wrong or out of date, message your walker directly — they control everything on their admin side.
          </p>
        </div>
      </div>
    </div>
  );
}
