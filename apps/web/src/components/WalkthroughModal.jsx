import React from 'react';

export function WalkthroughModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: "1. Choose Your Role",
      description: "Start by selecting whether you're a Pet Owner looking for care, or a Pet Companion offering services.",
      icon: "👤"
    },
    {
      title: "2. Complete Your Profile",
      description: "Pet Owners: Add your pets. Pet Companions: Complete your checklist (photo, bio, services, availability, verification).",
      icon: "✏️"
    },
    {
      title: "3. Get Started",
      description: "Pet Owners: Browse and book companions. Pet Companions: Publish your profile and start receiving booking requests.",
      icon: "🚀"
    }
  ];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('pt_walkthrough_dismissed', 'true');
    setCurrentStep(0);
    onClose();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step.icon}</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{step.title}</h3>
          <p className="text-slate-600">{step.description}</p>
        </div>

        <div className="flex gap-1 justify-center mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-teal-500'
                  : index < currentStep
                  ? 'w-2 bg-teal-300'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition font-semibold"
          >
            {currentStep === steps.length - 1 ? "Let's Go!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
