import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function AdminSupport() {
  const navigate = useNavigate();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    loadEscalations();
  }, []);

  async function loadEscalations() {
    try {
      const response = await fetch(`${API_BASE}/admin/support-escalations`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEscalations(data.escalations || []);
      }
    } catch (err) {
      console.error('Failed to load escalations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function viewTranscript(chatId) {
    try {
      const response = await fetch(`${API_BASE}/pawbot/history/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedChat({ chatId, messages: data.history || [] });
      }
    } catch (err) {
      console.error('Failed to load transcript:', err);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Support Queue</h2>
        <button onClick={() => navigate('/admin')} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading escalations...</div>
      ) : escalations.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">✓</div>
          <div className="text-slate-600">No escalated conversations at this time</div>
        </div>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {escalations.map((esc, idx) => (
            <div key={idx} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded">
                      {esc.reason || 'Escalated'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(esc.ts).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    User ID: {esc.userId} • Chat ID: {esc.chatId}
                  </div>
                  {esc.emailed && (
                    <div className="text-xs text-green-600 mt-1">✓ Email notification sent</div>
                  )}
                </div>
                <button
                  onClick={() => viewTranscript(esc.chatId)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  View transcript
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Chat Transcript: {selectedChat.chatId}</h3>
              <button
                onClick={() => setSelectedChat(null)}
                className="text-slate-600 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedChat.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-brand-teal text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">{msg.role === 'user' ? 'User' : 'PawBot'}</div>
                    <div>{msg.content}</div>
                  </div>
                </div>
              ))}
              {selectedChat.messages.length === 0 && (
                <div className="text-center text-slate-500 py-8">No messages in this chat</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
