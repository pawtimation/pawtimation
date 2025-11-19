import { useEffect, useState } from "react";
import { sendMessage, getBookingMessages } from "../../lib/messagesApi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../../lib/auth";
import { api } from "../../lib/auth";

export function BookingMessages() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("id");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState(null);

  async function load() {
    if (!bookingId) {
      navigate('/admin');
      return;
    }

    const user = auth.user;
    if (!user || !user.businessId) {
      console.error('No businessId found in auth data');
      navigate('/login');
      return;
    }

    try {
      // Fetch the booking to get the clientId
      const response = await api(`/jobs/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.job && data.job.clientId) {
          setClientId(data.job.clientId);
        }
      }

      const list = await getBookingMessages(user.businessId, bookingId);
      setMessages(list || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [bookingId]);

  async function handleSend() {
    if (!input.trim()) return;

    const user = auth.user;
    if (!user || !user.businessId) return;

    if (!clientId) {
      alert('Cannot send message: booking not loaded yet');
      return;
    }

    try {
      await sendMessage({
        businessId: user.businessId,
        clientId,
        bookingId,
        senderRole: "business",
        message: input.trim()
      });

      setInput("");
      load();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading messages…</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Messages with client</h1>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`border rounded p-3 ${m.senderRole === "business" ? "bg-slate-50" : "bg-white"}`}
          >
            <p className="text-sm">{m.message}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-sm text-slate-600">No messages yet.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Write a message"
        />

        <button
          className="bg-teal-600 text-white px-4 py-1 rounded text-sm hover:bg-teal-700"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
