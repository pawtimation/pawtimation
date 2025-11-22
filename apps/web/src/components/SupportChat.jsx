import React, { useEffect, useRef, useState } from 'react';

const knowledgeBase = {
  welcome: {
    message: "Hi there! I'm here to help with any questions about Pawtimation. What can I help you with today?",
  },
  topics: {
    general: {
      title: "General Questions",
      icon: "",
      faqs: [
        {
          q: "What is Pawtimation?",
          a: "Pawtimation is a simple, powerful CRM for dog-walking and pet-care businesses. It helps you manage bookings, clients, dogs, staff availability, routes, and invoices in one easy place. Built by someone who actually walks dogs — muddy shoes and all."
        },
        {
          q: "Who built this?",
          a: "Pawtimation was created by Andrew James, inspired by years of real dog-walking life with his chocolate lab, Hector. The goal was to build the CRM he wished existed."
        },
        {
          q: "Do you work outside the UK?",
          a: "Yes. Pawtimation works internationally and supports multiple time zones. Currency options are expanding soon."
        }
      ]
    },
    account: {
      title: "Account & Login",
      icon: "",
      faqs: [
        {
          q: "I can't log in / password isn't working",
          a: "Make sure you're using the correct email and password. If you still can't log in, try resetting your password. If nothing works, contact support and we'll sort it — no judgement, we all forget passwords."
        },
        {
          q: "How do I reset my password?",
          a: "Go to the login page → click Forgot password → follow the email instructions."
        }
      ]
    },
    client: {
      title: "Client Portal",
      icon: "",
      faqs: [
        {
          q: "How do I book a walk?",
          a: "Go to Bookings → Request a Walk. Choose your service, time, dog(s) and any notes. Your walker will review and confirm it."
        },
        {
          q: "Can I cancel a booking?",
          a: "Yes — open the booking and choose Cancel. If it's close to the walk time, your walker's cancellation policy may apply."
        },
        {
          q: "Where do I add my dog?",
          a: "Go to My Dogs → Add Dog. Include name, breed, behaviours, and any important notes."
        },
        {
          q: "How do invoices work for clients?",
          a: "You'll receive invoices automatically once walks are completed. You can view, download or pay them from your Invoices tab."
        }
      ]
    },
    staff: {
      title: "Staff Portal",
      icon: "",
      faqs: [
        {
          q: "How do I accept a job?",
          a: "Open Today or Calendar, tap the pending job, and confirm. Once accepted, it appears in your schedule."
        },
        {
          q: "Where do I see my daily route?",
          a: "Go to Today. Your jobs are already ordered into a logical walking route. (If Hector could organise his own walks, he'd pick the same order.)"
        },
        {
          q: "How do I set my availability?",
          a: "Go to Settings → Availability. Set your working days and hours — the admin will see your schedule instantly."
        }
      ]
    },
    bookings: {
      title: "Bookings",
      icon: "",
      faqs: [
        {
          q: "What does Pending mean?",
          a: "A client has requested a walk and it's awaiting admin/staff approval."
        },
        {
          q: "What does Confirmed mean?",
          a: "The booking has been approved and the walk is officially scheduled."
        },
        {
          q: "What does Completed mean?",
          a: "The staff member has marked the walk as finished and invoice items have been logged."
        },
        {
          q: "Why isn't my booking showing?",
          a: "Check: correct date, correct staff assignment, and that you refreshed after saving. If it still isn't visible, message support."
        }
      ]
    },
    invoices: {
      title: "Invoicing & Payments",
      icon: "",
      faqs: [
        {
          q: "How are invoices generated?",
          a: "Invoices are created automatically when a walk is completed. Each job produces invoice items which group by week/month depending on your settings."
        },
        {
          q: "How do I mark an invoice as paid?",
          a: "Open the invoice → Mark as Paid. Stripe payments will mark automatically once configured."
        },
        {
          q: "Can clients pay online?",
          a: "Yes — Stripe online payments are supported. Clients can pay securely via card."
        },
        {
          q: "Why is my invoice missing?",
          a: "Check: the job was marked Completed, the client has an active invoice cycle, and invoice filters at the top of the page. If you're still stuck, we'll help."
        }
      ]
    }
  }
};

export default function SupportChat({ onClose }){
  const [messages, setMessages] = useState([
    { type: 'bot', content: knowledgeBase.welcome.message }
  ]);
  const [currentView, setCurrentView] = useState('topics');
  const [feedbackCategory, setFeedbackCategory] = useState('IDEA');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState('MEDIUM');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const viewRef = useRef(null);

  useEffect(()=>{
    viewRef.current?.scrollTo(0, 999999);
  }, [messages]);

  const handleTopicClick = (topicKey) => {
    const topic = knowledgeBase.topics[topicKey];
    setMessages(prev => [...prev, 
      { type: 'user', content: topic.title },
      { type: 'bot', content: `Here are common questions about ${topic.title}:`, showFaqs: topic.faqs }
    ]);
    setCurrentView('chat');
  };

  const handleFaqClick = (faq) => {
    setMessages(prev => [...prev,
      { type: 'user', content: faq.q },
      { type: 'bot', content: faq.a }
    ]);
  };

  const handleBackToTopics = () => {
    setMessages([{ type: 'bot', content: knowledgeBase.welcome.message }]);
    setCurrentView('topics');
  };

  const handleContactHuman = () => {
    const subject = encodeURIComponent("Start My Pawtimation Free Trial");
    const body = encodeURIComponent(`Hi Andrew, I'd like to start my free trial. 
Here are my details:
Business name:
My name:
Staff login email:
Approx number of clients/dogs:
Anything specific I'd like to test:`);
    window.location.href = `mailto:hello@pawtimation.co.uk?subject=${subject}&body=${body}`;
  };

  const handleFeedbackClick = () => {
    setMessages(prev => [...prev, 
      { type: 'user', content: 'Send Feedback' },
      { type: 'bot', content: "We'd love to hear from you! Please share your thoughts below:" }
    ]);
    setCurrentView('feedback');
    setFeedbackSubmitted(false);
    setFeedbackTitle('');
    setFeedbackDescription('');
    setFeedbackCategory('IDEA');
    setFeedbackSeverity('MEDIUM');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackDescription.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(api.token ? { Authorization: `Bearer ${api.token}` } : {})
        },
        body: JSON.stringify({
          category: feedbackCategory,
          title: feedbackTitle || feedbackDescription.substring(0, 100),
          description: feedbackDescription,
          severity: feedbackCategory === 'BUG' ? feedbackSeverity : 'MEDIUM',
          source: 'CHAT_WIDGET',
          url: window.location.href
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setMessages(prev => [...prev,
          { type: 'bot', content: "Thank you for your feedback! We really appreciate you taking the time to help us improve Pawtimation. 🐾" }
        ]);
        setFeedbackTitle('');
        setFeedbackDescription('');
      } else {
        setMessages(prev => [...prev,
          { type: 'bot', content: "Sorry, there was an issue submitting your feedback. Please try again or contact us directly at hello@pawtimation.co.uk" }
        ]);
      }
    } catch (error) {
      setMessages(prev => [...prev,
        { type: 'bot', content: "Sorry, there was an issue submitting your feedback. Please try again or contact us directly at hello@pawtimation.co.uk" }
      ]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2rem)] bg-white border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white border-b border-white/20" style={{ background: '#3F9C9B' }}>
        <div className="flex items-center gap-2">
          <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-5 h-5 object-contain" />
          <div className="font-semibold">Pawtimation Support</div>
        </div>
        <button className="text-white hover:text-white/80 text-xl leading-none" onClick={onClose}>✕</button>
      </div>
      
      <div ref={viewRef} className="flex-1 overflow-auto p-3 space-y-3 min-h-0 bg-slate-50" style={{maxHeight: 'calc(100vh - 16rem)'}}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.type === 'bot' && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm p-1" style={{ backgroundColor: '#3F9C9B' }}>
                  <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                  <p className="text-sm text-slate-800">{msg.content}</p>
                  {msg.showFaqs && (
                    <div className="mt-3 space-y-2">
                      {msg.showFaqs.map((faq, faqIdx) => (
                        <button
                          key={faqIdx}
                          onClick={() => handleFaqClick(faq)}
                          className="block w-full text-left text-sm p-2 rounded hover:bg-slate-50 border border-slate-200 transition-colors"
                        >
                          {faq.q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.type === 'user' && (
              <div className="flex gap-2 items-start justify-end">
                <div className="rounded-lg p-3 max-w-[85%] text-white" style={{ backgroundColor: '#3F9C9B' }}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {currentView === 'topics' ? (
        <div className="p-3 border-t bg-white">
          <div className="grid grid-cols-2 gap-2 mb-2">
            {Object.entries(knowledgeBase.topics).map(([key, topic]) => (
              <button
                key={key}
                onClick={() => handleTopicClick(key)}
                className="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
                style={{ borderColor: '#3F9C9B' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3F9C9B'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <div className="text-sm font-medium text-slate-700">{topic.title}</div>
              </button>
            ))}
          </div>
          <button
            onClick={handleFeedbackClick}
            className="w-full p-3 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#3F9C9B' }}
          >
            💬 Send Feedback
          </button>
        </div>
      ) : currentView === 'feedback' ? (
        <div className="p-3 border-t bg-white space-y-3">
          {!feedbackSubmitted ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type of feedback</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'BUG', label: '🐛 Bug', color: '#E63946' },
                    { value: 'CONFUSION', label: '❓ Confusion', color: '#F59E0B' },
                    { value: 'IDEA', label: '💡 Idea', color: '#3F9C9B' },
                    { value: 'PRAISE', label: '👍 Praise', color: '#4CAF50' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFeedbackCategory(type.value)}
                      className={`p-2 border-2 rounded-lg text-sm font-medium transition-all ${
                        feedbackCategory === type.value ? 'border-opacity-100' : 'border-slate-200'
                      }`}
                      style={{
                        borderColor: feedbackCategory === type.value ? type.color : undefined,
                        color: feedbackCategory === type.value ? type.color : '#475569'
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              {feedbackCategory === 'BUG' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { value: 'LOW', label: '🟢 Low' },
                      { value: 'MEDIUM', label: '🟡 Med' },
                      { value: 'HIGH', label: '🟠 High' },
                      { value: 'CRITICAL', label: '🔴 Crit' }
                    ].map((sev) => (
                      <button
                        key={sev.value}
                        onClick={() => setFeedbackSeverity(sev.value)}
                        className={`p-2 border-2 rounded-lg text-xs font-medium transition-all ${
                          feedbackSeverity === sev.value ? 'border-teal-500 bg-teal-50' : 'border-slate-200'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="Brief summary..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBackToTopics}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackDescription.trim()}
                  className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#3F9C9B' }}
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm font-medium text-slate-700 mb-3">Feedback submitted!</p>
              <button
                onClick={handleBackToTopics}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                ← Back to Topics
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border-t bg-white flex gap-2">
          <button
            onClick={handleBackToTopics}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
          >
            ← Topics
          </button>
          <button
            onClick={handleContactHuman}
            className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#3F9C9B' }}
          >
            Contact Us
          </button>
        </div>
      )}
    </div>
  );
}
