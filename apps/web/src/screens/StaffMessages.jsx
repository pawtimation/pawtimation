import { useState, useEffect, useRef } from "react";
import { staffApi, getSession } from '../lib/auth';
import { getInboxMessages, sendMessage, markInboxRead } from "../lib/messagesApi";
import dayjs from 'dayjs';

export function StaffMessages() {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [list, setList] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadClients() {
    try {
      const session = getSession('STAFF');
      if (!session || !session.businessId) {
        console.error('No businessId found');
        return;
      }

      const response = await staffApi('/clients/list');
      if (response.ok) {
        const data = await response.json();
        setClients(data || []);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function loadMessages() {
    if (!activeClient) return;

    const session = getSession('STAFF');
    if (!session || !session.businessId) return;

    try {
      const data = await getInboxMessages(session.businessId, activeClient.id, 'STAFF');
      setList(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  useEffect(() => {
    loadMessages();
    
    const session = getSession('STAFF');
    if (session && session.businessId && activeClient) {
      markInboxRead(session.businessId, activeClient.id, 'STAFF');
    }
  }, [activeClient]);

  async function handleSend() {
    if (!input.trim() || !activeClient) return;

    const session = getSession('STAFF');
    if (!session || !session.businessId) return;

    try {
      await sendMessage({
        businessId: session.businessId,
        clientId: activeClient.id,
        bookingId: null,
        senderRole: "staff",
        message: input.trim()
      }, 'STAFF');

      setInput("");
      loadMessages();
      loadClients();
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

  function handleSelectClient(client) {
    setActiveClient(client);
    setShowChat(true);
  }

  function handleBackToList() {
    setShowChat(false);
  }

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim()).toLowerCase();
    const email = (client.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-600">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <div className="h-auto lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-0 lg:gap-6 lg:px-4">
        {/* LEFT PANEL - Client List */}
        <div className={`${showChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-slate-200`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Messages</h2>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      activeClient?.id === client.id ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm text-slate-900">
                        {client.name || 'Unnamed Client'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {client.email || 'No email'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Message Thread */}
        <div className={`${!showChat && activeClient ? 'hidden lg:flex' : showChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-slate-200`}>
          {!activeClient ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a client to view messages</h3>
                <p className="text-sm text-slate-600">
                  Choose a client from the list on the left to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
                    {(activeClient.name?.charAt(0) || 'C')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {activeClient.name || 'Client'}
                    </h3>
                    {activeClient.email && (
                      <p className="text-xs text-slate-600">
                        {activeClient.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {list.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-600">No messages yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start the conversation below</p>
                  </div>
                ) : (
                  list.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderRole === "staff" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[70%]">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            m.senderRole === "staff"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        </div>
                        <p className={`text-xs text-slate-500 mt-1.5 px-1 ${m.senderRole === "staff" ? "text-right" : "text-left"}`}>
                          {dayjs(m.createdAt).format('MMM D, h:mm A')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                  <textarea
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={2}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
