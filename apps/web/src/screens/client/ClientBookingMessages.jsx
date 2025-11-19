import { useEffect, useState } from "react";
import { sendMessage, getBookingMessages, markBookingRead } from "../../lib/messagesApi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../../lib/auth";

export function ClientBookingMessages() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("id");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!bookingId) {
      navigate('/client/bookings');
      return;
    }

    const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
    if (!raw) {
      navigate('/client/login');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const businessId = parsed.businessId;
      
      if (!businessId) {
        console.error('No businessId found in auth data');
        return;
      }

      const list = await getBookingMessages(businessId, bookingId);
      setMessages(list || []);
      
      // Mark messages as read after loading (handles new messages arriving)
      await markBookingRead(businessId, bookingId, "client");
      window.dispatchEvent(new CustomEvent('messagesRead'));
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

    const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const businessId = parsed.businessId;
      const clientId = parsed.crmClientId || parsed.clientId;

      await sendMessage({
        businessId,
        clientId,
        bookingId,
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

  if (loading) {
    return <p className="text-sm text-slate-600">Loading messages…</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Messages about this booking</h1>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`border rounded p-3 ${m.senderRole === "client" ? "bg-slate-50" : "bg-white"}`}
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
