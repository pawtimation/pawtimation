import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function CompanionMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
    if (roomId) {
      loadMessages(roomId);
    }
  }, [roomId]);

  async function loadRooms() {
    try {
      const response = await fetch(`${API_BASE}/chat/rooms`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(room) {
    try {
      const response = await fetch(`${API_BASE}/chat/messages?room=${room}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    try {
      const response = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId,
          content: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(roomId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="text-slate-500">Loading messages...</div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-brand-ink">Messages</h2>
        <button onClick={() => navigate('/companion')} className="text-[color:var(--brand)] font-medium hover:text-[color:var(--brandDark)] transition-colors">
          ← Back
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Conversations</h3>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/companion/messages?room=${room.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    roomId === room.id ? 'bg-brand-teal text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="font-medium">{room.name || 'Direct Message'}</div>
                  <div className={`text-sm ${roomId === room.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {room.lastMessage || 'No messages'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white border rounded-xl flex flex-col" style={{ height: '600px' }}>
          {!roomId ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.userId === auth.user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.userId === auth.user?.id
                            ? 'bg-brand-teal text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div>{msg.content}</div>
                        <div className={`text-xs mt-1 ${
                          msg.userId === auth.user?.id ? 'text-white/70' : 'text-slate-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={sendMessage} className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-4 py-2"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
