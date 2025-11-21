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

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2rem)] bg-white border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-brand-primary text-white border-b border-white/20">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="white" viewBox="0 0 100 100">
            <ellipse cx="20" cy="35" rx="8" ry="12"/>
            <ellipse cx="40" cy="25" rx="8" ry="12"/>
            <ellipse cx="60" cy="25" rx="8" ry="12"/>
            <ellipse cx="80" cy="35" rx="8" ry="12"/>
            <ellipse cx="50" cy="65" rx="18" ry="20"/>
          </svg>
          <div className="font-semibold">Pawtimation Support</div>
        </div>
        <button className="text-white hover:text-white/80 text-xl leading-none" onClick={onClose}>✕</button>
      </div>
      
      <div ref={viewRef} className="flex-1 overflow-auto p-3 space-y-3 min-h-0 bg-slate-50" style={{maxHeight: 'calc(100vh - 16rem)'}}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.type === 'bot' && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm" style={{ backgroundColor: '#20D6C7' }}>
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 100 100">
                    <ellipse cx="20" cy="35" rx="8" ry="12"/>
                    <ellipse cx="40" cy="25" rx="8" ry="12"/>
                    <ellipse cx="60" cy="25" rx="8" ry="12"/>
                    <ellipse cx="80" cy="35" rx="8" ry="12"/>
                    <ellipse cx="50" cy="65" rx="18" ry="20"/>
                  </svg>
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
                <div className="rounded-lg p-3 max-w-[85%] text-white" style={{ backgroundColor: '#20D6C7' }}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {currentView === 'topics' ? (
        <div className="p-3 border-t bg-white">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(knowledgeBase.topics).map(([key, topic]) => (
              <button
                key={key}
                onClick={() => handleTopicClick(key)}
                className="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-left"
                style={{ borderColor: '#20D6C7' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#20D6C7'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <div className="text-sm font-medium text-slate-700">{topic.title}</div>
              </button>
            ))}
          </div>
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
            style={{ backgroundColor: '#20D6C7' }}
          >
            Contact Us
          </button>
        </div>
      )}
    </div>
  );
}
