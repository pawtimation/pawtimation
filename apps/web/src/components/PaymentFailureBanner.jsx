import React from 'react';

export function PaymentFailureBanner({ business }) {
  if (!business?.gracePeriodEnd) return null;

  const now = new Date();
  const gracePeriodEnd = new Date(business.gracePeriodEnd);
  const timeRemaining = gracePeriodEnd - now;
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  // Grace period has already expired (automation will handle suspension)
  if (timeRemaining <= 0) {
    return null;
  }

  // Determine severity level for styling
  const isUrgent = hoursRemaining <= 24;
  const isCritical = hoursRemaining <= 6;

  const bgColor = isCritical ? 'bg-red-50' : isUrgent ? 'bg-orange-50' : 'bg-yellow-50';
  const borderColor = isCritical ? 'border-red-500' : isUrgent ? 'border-orange-500' : 'border-yellow-500';
  const textColor = isCritical ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-yellow-800';
  const accentColor = isCritical ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-yellow-500';

  const gracePeriodDate = gracePeriodEnd.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4 mb-6 shadow-sm`}>
      <div className="flex items-start">
        <svg 
          className={`w-6 h-6 ${accentColor} mr-3 flex-shrink-0`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <div className="flex-1">
          <h3 className={`${textColor} font-semibold mb-1`}>
            {isCritical ? '🚨 Urgent: ' : isUrgent ? '⚠️ ' : '⏰ '}
            Payment Failed - Action Required
          </h3>
          <p className={`${textColor} mb-3`}>
            {isCritical ? (
              <>
                <strong>Your service will be suspended in {Math.max(1, Math.round(hoursRemaining))} hour{hoursRemaining > 1 ? 's' : ''}!</strong>
                {' '}Please update your payment method immediately to avoid service interruption.
              </>
            ) : isUrgent ? (
              <>
                Your most recent payment could not be processed. You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</strong> until {gracePeriodDate} to update your payment details.
              </>
            ) : (
              <>
                Your most recent payment failed. Please update your payment method by <strong>{gracePeriodDate}</strong> to avoid service interruption.
              </>
            )}
          </p>
          <div className="flex gap-3">
            <a
              href="/admin/settings?tab=billing"
              className={`inline-flex items-center px-4 py-2 ${
                isCritical ? 'bg-red-600 hover:bg-red-700' : 
                isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 
                'bg-yellow-600 hover:bg-yellow-700'
              } text-white rounded-md font-medium text-sm transition-colors`}
            >
              Update Payment Method
            </a>
            <a
              href="mailto:hello@pawtimation.co.uk?subject=Payment%20Issue%20Assistance"
              className={`inline-flex items-center px-4 py-2 border ${borderColor} ${textColor} rounded-md font-medium text-sm hover:bg-white/50 transition-colors`}
            >
              Need Help?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
