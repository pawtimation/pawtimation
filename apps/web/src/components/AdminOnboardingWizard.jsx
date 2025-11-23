import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    id: 'servicesAdded',
    title: 'Add Your Services',
    description: 'What do you offer? 30-min walks, 60-min walks, group walks, puppy visits... Set your prices once, and they\'ll be used automatically in bookings and invoices.',
    buttonText: 'Add Services',
    route: '/admin/services',
    icon: '🦴'
  },
  {
    id: 'staffAdded',
    title: 'Add Your Staff',
    description: 'Add your team members so you can assign jobs straight away. We\'ll send them an invite so they can log in.',
    buttonText: 'Add Staff',
    route: '/admin/staff',
    icon: '👥'
  },
  {
    id: 'clientsAdded',
    title: 'Add Your Clients & Dogs',
    description: 'Add your clients, their dogs, addresses, and important notes. Clients will get access to their own portal automatically.',
    buttonText: 'Add Clients',
    route: '/admin/clients',
    icon: '🐕'
  },
  {
    id: 'bookingCreated',
    title: 'Create Your First Booking',
    description: 'Now let\'s add your first walk or visit. Choose the client, dog, service, time, and the staff member.',
    buttonText: 'Create Booking',
    route: '/admin/bookings',
    icon: '📅'
  },
  {
    id: 'bookingCompleted',
    title: 'Complete a Booking',
    description: 'When a walk is finished, mark it as "Completed". This automatically creates the invoice items for you.',
    buttonText: 'View Bookings',
    route: '/admin/bookings',
    icon: '✅'
  },
  {
    id: 'invoiceGenerated',
    title: 'Generate Your First Invoice',
    description: 'Go to Finance → Invoices. Select completed jobs and generate a clean, professional invoice. Send it via WhatsApp or directly to the client portal.',
    buttonText: 'Go to Finance',
    route: '/admin/finance',
    icon: '💷'
  },
  {
    id: 'paymentReceived',
    title: 'Get Paid',
    description: 'Record cash, card, or cheque payments. Stripe payments update automatically.',
    buttonText: 'View Invoices',
    route: '/admin/finance',
    icon: '💰'
  }
];

export function AdminOnboardingWizard({ onClose }) {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    const interval = setInterval(loadProgress, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadProgress = async () => {
    try {
      const res = await adminApi('/admin/onboarding/progress');
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);
        setLoading(false);

        const firstIncompleteIndex = STEPS.findIndex(step => !data.progress[step.id]);
        if (firstIncompleteIndex !== -1) {
          setCurrentStepIndex(firstIncompleteIndex);
        }
      }
    } catch (err) {
      console.error('Failed to load onboarding progress:', err);
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await adminApi('/admin/onboarding/dismiss', {
        method: 'POST'
      });
      onClose();
    } catch (err) {
      console.error('Failed to dismiss wizard:', err);
      onClose();
    }
  };

  const handleAction = () => {
    const currentStep = STEPS[currentStepIndex];
    navigate(currentStep.route);
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (loading || !progress) {
    return null;
  }

  const allComplete = STEPS.every(step => progress[step.id]);

  if (allComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">All done!</h2>
          <p className="text-gray-600 mb-6">
            Your business is officially ready to run on Pawtimation.
            If you get stuck, press the "Help & Feedback" button at any time.
          </p>
          <button
            onClick={handleDismiss}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Start Using Pawtimation
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];
  const isStepComplete = progress[currentStep.id];
  const completedCount = STEPS.filter(step => progress[step.id]).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Skip onboarding (you can always come back later)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Welcome to Pawtimation
            </h3>
            <span className="text-sm text-gray-500">
              {completedCount} of {STEPS.length} complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentStep.title}
            {isStepComplete && <span className="ml-2 text-green-600">✓</span>}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {!isStepComplete ? (
              <button
                onClick={handleAction}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                {currentStep.buttonText}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Step Complete
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === STEPS.length - 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStepIndex
                  ? 'w-8 bg-teal-600'
                  : progress[step.id]
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={step.title}
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now (you can always come back)
          </button>
        </div>
      </div>
    </div>
  );
}
