import { useState, useEffect } from "react";
import { getInboxMessages, sendMessage, markInboxRead } from "../../lib/messagesApi";
import { getSession, clientApi } from "../../lib/auth";

export function ClientInbox() {
  const [list, setList] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);

  async function loadBusiness() {
    try {
      const response = await clientApi('/business/branding');
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.branding);
      }
    } catch (err) {
      console.error('Failed to load business branding:', err);
    }
  }

  async function load() {
    try {
      const session = getSession('CLIENT');
      
      if (!session || !session.userSnapshot) {
        console.error('Missing client authentication');
        return;
      }

      const clientData = session.userSnapshot;
      
      const businessId = session.businessId || clientData.businessId;
      const clientId = session.crmClientId || clientData.crmClientId || clientData.id;

      const data = await getInboxMessages(businessId, clientId, 'CLIENT');
      setList(data || []);
      
      // Mark messages as read after loading (handles new messages arriving)
      await markInboxRead(businessId, clientId, 'CLIENT');
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } catch (err) {
      console.error('Failed to load inbox messages:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBusiness();
    load();
  }, []);

  async function handleSend() {
    if (!input.trim()) return;

    try {
      const session = getSession('CLIENT');
      
      if (!session || !session.userSnapshot) {
        alert('Authentication error');
        return;
      }

      const clientData = session.userSnapshot;

      await sendMessage({
        businessId: session.businessId || clientData.businessId,
        clientId: session.crmClientId || clientData.crmClientId || clientData.id,
        bookingId: null,
        senderRole: "client",
        message: input.trim()
      }, 'CLIENT');

      setInput("");
      load();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-600">Loading messages…</p>
      </div>
    );
  }

  const businessName = business?.businessName || 'Your Pet-Care Business';
  const businessLogo = business?.logoUrl;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Business Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {businessLogo ? (
            <img 
              src={businessLogo} 
              alt={businessName}
              className="w-16 h-16 rounded-full object-cover border-2 border-teal-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
              <img src="/pawtimation-paw.png" alt="" className="w-10 h-10" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Chat with {businessName}</h1>
            <p className="text-sm text-slate-600">Ask questions or share updates about your pet's care</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Messages List */}
        <div className="h-[500px] overflow-y-auto p-6">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No messages yet</h3>
              <p className="text-sm text-slate-600 mb-6 max-w-sm">
                Start a conversation with {businessName} to ask questions, request updates, or discuss your pet's care.
              </p>
              <button
                onClick={() => document.getElementById('messageInput')?.focus()}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Ask a question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderRole === "client" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${m.senderRole === "client" ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        m.senderRole === "client"
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{m.message}</p>
                    </div>
                    <p className={`text-xs text-slate-500 mt-1.5 px-1 ${m.senderRole === "client" ? "text-right" : "text-left"}`}>
                      {new Date(m.createdAt).toLocaleString('en-GB', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-3">
            <input
              id="messageInput"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
