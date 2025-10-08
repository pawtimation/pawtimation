import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';

export default function SupportChat({ onClose }){
  const [chatId, setChatId] = useState(null);
  const [history, setHistory] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
    setIsTyping(true);
    
    const r = await fetch(`${API_BASE}/support/chat/${chatId}/message`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: userLine.text })});
    const j = await r.json();
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setIsTyping(false);
    setBusy(false);
    if (j.messages) setHistory(h=>[...h, ...j.messages.filter(m=>m.role!=='user')]);
  }

  async function vote(v){
    if (!chatId) return;
    await fetch(`${API_BASE}/support/chat/${chatId}/csat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ vote: v })});
  }

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2rem)] bg-white border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-teal to-brand-blue text-white border-b border-white/20">
        <div className="font-semibold">Support</div>
        <button className="text-white hover:text-white/80 text-xl leading-none" onClick={onClose}>✕</button>
      </div>
      
      <div ref={viewRef} className="flex-1 overflow-auto p-3 space-y-2 min-h-0" style={{maxHeight: 'calc(100vh - 16rem)'}}>
        {history.map((m, i)=>(
          <div key={i} className={m.role==='assistant' || m.role==='system' ? 'text-sm bg-slate-100 p-3 rounded-lg' : 'text-sm bg-brand-teal/10 p-3 rounded-lg ml-8'}>
            <div className="text-xs font-medium text-slate-600 mb-1">{m.role==='user'?'You':(m.role==='system'?'System':'Pawtimation')}</div>
            <div className="text-slate-800">{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="text-sm bg-slate-100 p-3 rounded-lg">
            <div className="text-xs font-medium text-slate-600 mb-1">Pawtimation</div>
            <div className="text-slate-500 italic">Pawtimation Assistant is typing…</div>
          </div>
        )}
      </div>
      
      <div className="p-3 flex items-center gap-2 border-t bg-slate-50">
        <input 
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" 
          placeholder="Type your message…" 
          value={text} 
          onChange={e=>setText(e.target.value)} 
          onKeyDown={e=>{ if(e.key==='Enter') send(); }}
        />
        <button 
          className="px-4 py-2 rounded-lg bg-brand-teal text-white font-medium text-sm hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={busy} 
          onClick={send}
        >
          {busy?'…':'Send'}
        </button>
      </div>
      
      <div className="px-3 py-2 bg-slate-50 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Was this helpful?</span>
          <button 
            className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium" 
            onClick={()=>vote('up')}
          >
            ❤️ Yes
          </button>
          <button 
            className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-medium" 
            onClick={()=>vote('down')}
          >
            ✗ No
          </button>
        </div>
        <a 
          href="mailto:hello@pawtimation.co.uk" 
          className="text-brand-teal hover:text-brand-teal/80 underline text-xs"
        >
          Escalate to human
        </a>
      </div>
    </div>
  );
}
