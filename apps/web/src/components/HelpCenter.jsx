import React, { useState } from 'react';

const HELP_SECTIONS = [
  {
    title: 'Getting Started with Pawtimation',
    icon: '🚀',
    content: [
      'Add services (set your prices once)',
      'Add staff members',
      'Add clients and their dogs',
      'Create your first booking',
      'Mark it as completed',
      'Generate an invoice',
      'Record payment'
    ]
  },
  {
    title: 'How Bookings Work',
    icon: '📅',
    content: [
      'PENDING → Booking created, awaiting confirmation',
      'BOOKED → Staff confirmed, appears on calendars',
      'COMPLETED → Walk finished, invoice items created',
      'CANCELLED → Booking cancelled (no charge)'
    ]
  },
  {
    title: 'Staff Portal',
    icon: '👥',
    content: [
      'Staff can confirm or decline jobs',
      'View their schedule and upcoming walks',
      'Mark bookings as completed',
      'Access dog notes and safety info',
      'Message admin for questions'
    ]
  },
  {
    title: 'Client Portal',
    icon: '🐾',
    content: [
      'Clients see their dog\'s schedule',
      'View all bookings (pending and confirmed)',
      'Access invoices and payment history',
      'Manage dog profiles and notes',
      'Request new bookings (if enabled)'
    ]
  },
  {
    title: 'Invoicing',
    icon: '💷',
    content: [
      'Completed jobs auto-create invoice items',
      'Generate professional PDF invoices',
      'Send via WhatsApp or client portal',
      'Track payments (cash, card, Stripe)',
      'Automatic overdue reminders'
    ]
  }
];

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(0);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 transition-all hover:scale-110 z-40"
        title="Help & Guides"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 transition-all hover:scale-110 z-40"
        title="Help & Guides"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Help & Guides</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-3">
            {HELP_SECTIONS.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === index ? -1 : index)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <span className="font-semibold text-gray-900">{section.title}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedSection === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === index && (
                  <div className="px-4 py-3 bg-white">
                    <ul className="space-y-2">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-gray-700">
                          <span className="text-teal-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Need more help?</p>
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.hash = '#feedback';
              }}
              className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
            >
              Use the Feedback button or contact us directly
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
