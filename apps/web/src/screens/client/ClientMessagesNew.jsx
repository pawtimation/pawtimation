import { useState, useEffect } from "react";
import { getInboxMessages, sendMessage, markInboxRead } from "../../lib/messagesApi";
import { getSession } from "../../lib/auth";
import dayjs from "dayjs";

export function ClientMessagesNew() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  async function loadMessages() {
    try {
      const session = getSession('CLIENT');
      
      if (!session || !session.userSnapshot) {
        console.error('Missing client authentication');
        return;
      }

      const clientData = session.userSnapshot;
      
      const businessId = session.businessId || clientData.businessId;
      const clientId = session.crmClientId || clientData.crmClientId;

      if (!businessId || !clientId) {
        console.error('Missing businessId or clientId in session');
        setLoading(false);
        return;
      }

      const data = await getInboxMessages(businessId, clientId, 'CLIENT');
      setMessages(data || []);
      
      await markInboxRead(businessId, clientId, 'CLIENT');
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSendMessage() {
    if (!messageInput.trim()) return;

    setSendingMessage(true);
    try {
      const session = getSession('CLIENT');
      
      if (!session || !session.userSnapshot) {
        alert('Authentication error');
        return;
      }

      const clientData = session.userSnapshot;

      if (!clientData.businessId || !clientData.clientId) {
        alert('Session error. Please log in again.');
        return;
      }

      await sendMessage({
        businessId: clientData.businessId,
        clientId: clientData.clientId,
        bookingId: null,
        senderRole: "client",
        message: messageInput.trim()
      }, 'CLIENT');

      setMessageInput("");
      await loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-600 mt-1">Chat with your pet care business</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{maxHeight: 'calc(100vh - 240px)', scrollBehavior: 'smooth'}}>
        {messages.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.senderRole === "client" 
                  ? "bg-teal-50 ml-8" 
                  : "bg-slate-100 mr-8"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-700">
                  {msg.senderRole === "client" ? "You" : "Business"}
                </p>
                <p className="text-xs text-slate-500">
                  {dayjs(msg.createdAt).format('MMM D, h:mm A')}
                </p>
              </div>
              <p className="text-sm text-slate-900 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border-t p-4 sticky bottom-0">
        <div className="flex gap-2">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            rows={2}
            disabled={sendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {sendingMessage ? (
              <span className="text-xs">Sending...</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
