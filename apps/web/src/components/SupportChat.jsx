import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';

export default function SupportChat({ onClose }){
  const [chatId, setChatId] = useState(null);
  const [history, setHistory] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const viewRef = useRef(null);

  useEffect(()=>{
    (async ()=>{
      const u = JSON.parse(localStorage.getItem('pt_user')||'{}');
      const r = await fetch(`${API_BASE}/support/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user: u||{id:'guest'} })});
      const j = await r.json();
      setChatId(j.chatId);
      setHistory([{ role:'assistant', text:'Hi - I am your Pawtimation assistant. How can I help today?' }]);
    })();
  },[]);

  useEffect(()=>{
    viewRef.current?.scrollTo(0, 999999);
  }, [history]);

  async function send(){
    if (!chatId || !text.trim()) return;
    const userLine = { role:'user', text: text.trim() };
    setHistory(h=>[...h, userLine]);
    setText('');
    setBusy(true);
    const r = await fetch(`${API_BASE}/support/chat/${chatId}/message`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: userLine.text })});
    const j = await r.json();
    setBusy(false);
    if (j.messages) setHistory(h=>[...h, ...j.messages.filter(m=>m.role!=='user')]);
  }

  async function vote(v){
    if (!chatId) return;
    await fetch(`${API_BASE}/support/chat/${chatId}/csat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ vote: v })});
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-white border rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="font-semibold">Support</div>
        <button className="text-slate-500" onClick={onClose}>✕</button>
      </div>
      <div ref={viewRef} className="h-64 overflow-auto p-3 space-y-2">
        {history.map((m, i)=>(
          <div key={i} className={m.role==='assistant' || m.role==='system' ? 'text-sm bg-slate-100 p-2 rounded' : 'text-sm bg-emerald-50 p-2 rounded self-end'}>
            <div className="text-xs text-slate-500 mb-1">{m.role==='user'?'You':(m.role==='system'?'System':'Pawtimation')}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 flex items-center gap-2 border-t">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Type your message…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }}/>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white" disabled={busy} onClick={send}>{busy?'…':'Send'}</button>
      </div>
      <div className="px-3 py-2 flex items-center justify-between text-sm">
        <div>Was this helpful?
          <button className="ml-2 px-2" title="Paw up" onClick={()=>vote('up')}>👍</button>
          <button className="px-2" title="Paw down" onClick={()=>vote('down')}>👎</button>
        </div>
        <div className="text-slate-500 text-xs">High-priority issues are escalated automatically.</div>
      </div>
    </div>
  );
}
