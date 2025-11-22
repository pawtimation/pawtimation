import { useState, useEffect } from "react";
import { getInboxMessages, sendMessage, markInboxRead } from "../../lib/messagesApi";
import { getSession, adminApi } from '../../lib/auth';

export function BusinessInbox() {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [list, setList] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadClients() {
    try {
      const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
      if (!session || !session.businessId) {
        console.error('No businessId found');
        return;
      }

      const response = await adminApi(`/clients/${session.businessId}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
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

    const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
    if (!session || !session.businessId) return;

    try {
      const data = await getInboxMessages(session.businessId, activeClient.id);
      setList(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  useEffect(() => {
    loadMessages();
    
    // Mark inbox messages as read for business
    const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
    if (session && session.businessId && activeClient) {
      markInboxRead(session.businessId, activeClient.id, "business");
    }
  }, [activeClient]);

  async function handleSend() {
    if (!input.trim() || !activeClient) return;

    const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
    if (!session || !session.businessId) return;

    try {
      await sendMessage({
        businessId: session.businessId,
        clientId: activeClient.id,
        bookingId: null,
        senderRole: "business",
        message: input.trim()
      });

      setInput("");
      loadMessages();
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
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Client Messages</h1>

      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Select Client
        </label>
        <select
          className="border rounded px-3 py-3 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={activeClient?.id || ""}
          onChange={(e) => {
            const client = clients.find(c => c.id === e.target.value);
            setActiveClient(client || null);
          }}
        >
          <option value="">-- Select a client --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      {!activeClient && (
        <p className="text-sm text-slate-600">
          Select a client to view and send messages.
        </p>
      )}

      {activeClient && (
        <>
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-700">
              Conversation with {activeClient.firstName} {activeClient.lastName}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 mb-4 border rounded-lg p-3 bg-slate-50">
            {list.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg p-4 ${
                  m.senderRole === "business"
                    ? "bg-teal-100 ml-8"
                    : "bg-white mr-8 border border-slate-200"
                }`}
              >
                <p className="text-sm leading-relaxed">{m.message}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            ))}

            {list.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-8">No messages yet. Start the conversation!</p>
            )}
          </div>

          <div className="flex gap-2 items-end">
            <input
              className="border rounded-lg px-4 py-3 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
