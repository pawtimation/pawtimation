import { useState, useEffect } from "react";
import { getInboxMessages, sendMessage } from "../../lib/messagesApi";

export function ClientInbox() {
  const [list, setList] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const ptClient = localStorage.getItem('pt_client');
      const ptUser = localStorage.getItem('pt_user');
      
      if (!ptClient || !ptUser) {
        console.error('Missing client authentication');
        return;
      }

      const clientData = JSON.parse(ptClient);
      const userData = JSON.parse(ptUser);
      
      const businessId = userData.businessId;
      const clientId = clientData.id;

      const data = await getInboxMessages(businessId, clientId);
      setList(data || []);
    } catch (err) {
      console.error('Failed to load inbox messages:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend() {
    if (!input.trim()) return;

    try {
      const ptClient = localStorage.getItem('pt_client');
      const ptUser = localStorage.getItem('pt_user');
      
      if (!ptClient || !ptUser) {
        alert('Authentication error');
        return;
      }

      const clientData = JSON.parse(ptClient);
      const userData = JSON.parse(ptUser);

      await sendMessage({
        businessId: userData.businessId,
        clientId: clientData.id,
        bookingId: null,
        senderRole: "client",
        message: input.trim()
      });

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
    return <p className="text-sm text-slate-600">Loading messages…</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Messages</h1>

      <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
        {list.map((m) => (
          <div
            key={m.id}
            className={`border rounded p-3 ${
              m.senderRole === "client" ? "bg-slate-50" : "bg-white"
            }`}
          >
            <p className="text-sm">{m.message}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-sm text-slate-600">No messages yet. Send a message to start a conversation with the business.</p>
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
    </div>
  );
}
