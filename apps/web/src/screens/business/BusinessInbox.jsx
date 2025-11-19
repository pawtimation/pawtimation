import { useState, useEffect } from "react";
import { getInboxMessages, sendMessage, markInboxRead } from "../../lib/messagesApi";
import { auth } from "../../lib/auth";
import { api } from "../../lib/auth";

export function BusinessInbox() {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [list, setList] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadClients() {
    try {
      const user = auth.user;
      if (!user || !user.businessId) {
        console.error('No businessId found');
        return;
      }

      const response = await api(`/clients/${user.businessId}`);
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

    const user = auth.user;
    if (!user || !user.businessId) return;

    try {
      const data = await getInboxMessages(user.businessId, activeClient.id);
      setList(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  useEffect(() => {
    loadMessages();
    
    // Mark inbox messages as read for business
    const user = auth.user;
    if (user && user.businessId && activeClient) {
      markInboxRead(user.businessId, activeClient.id, "business");
    }
  }, [activeClient]);

  async function handleSend() {
    if (!input.trim() || !activeClient) return;

    const user = auth.user;
    if (!user || !user.businessId) return;

    try {
      await sendMessage({
        businessId: user.businessId,
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
          className="border rounded px-3 py-2 text-sm w-full max-w-md"
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

          <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
            {list.map((m) => (
              <div
                key={m.id}
                className={`border rounded p-3 ${
                  m.senderRole === "business"
                    ? "bg-slate-50"
                    : "bg-white"
                }`}
              >
                <p className="text-sm">{m.message}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            ))}

            {list.length === 0 && (
              <p className="text-sm text-slate-600">No messages yet. Start the conversation!</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1 flex-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message"
            />
            <button
              onClick={handleSend}
              className="bg-teal-600 text-white px-4 py-1 rounded text-sm hover:bg-teal-700"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
