import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

function useSocket(){
  const url = useMemo(()=> {
    const base = API_BASE.startsWith('/') ? `${window.location.protocol}//${window.location.hostname}:8787` : API_BASE;
    return base;
  }, []);
  const [sock, setSock] = useState(null);
  useEffect(() => { const s = io(url); setSock(s); return () => s.disconnect(); }, [url]);
  return sock;
}

function Bubble({m}){
  const me = (auth.user?.name)||'You';
  const mine = m.user === me;
  return (
    <div className={`flex ${mine?'justify-end':'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 my-1 ${mine?'bg-emerald-600 text-white':'bg-slate-100 text-slate-800'}`}>
        <div className="text-xs opacity-70">{m.user}</div>
        <div>{m.text}</div>
      </div>
    </div>
  );
}

export function Chat({ roomId: initial, onBack }){
  const [roomId, setRoomId] = useState(initial || new URLSearchParams(location.search).get('room') || 'community');
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const sock = useSocket();
  const myName = (auth.user?.name) || 'You';

  useEffect(()=>{ fetch(`${API_BASE}/chat/room/${roomId}`).then(r=>r.json()).then(j=>setMsgs(j.messages||[])); }, [roomId]);
  useEffect(()=>{
    if(!sock) return;
    sock.emit('join', { roomId, user: myName });
    const onMsg = m => setMsgs(prev=>[...prev, m]);
    sock.on('message', onMsg);
    return ()=> sock.off('message', onMsg);
  }, [sock, roomId, myName]);
  useEffect(()=>{ listRef.current?.scrollTo({top:999999, behavior:'smooth'}); }, [msgs]);

  async function send(){
    if(!text.trim()) return;
    sock?.emit('message', { roomId, user: myName, text: text.trim() });
    setText('');
  }
  async function newPrivate(label='Private chat'){
    const r = await fetch(`${API_BASE}/chat/private`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ label }) });
    const j = await r.json();
    setRoomId(j.roomId);
    history.replaceState(null,'',`/chat?room=${j.roomId}`);
    alert(`Share link: ${location.origin}/chat?room=${j.roomId}`);
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl overflow-hidden shadow-sm border border-blue-100 p-6">
        <div className="absolute inset-0 opacity-15">
          <img src="/hector-4.jpg" alt="" className="w-full h-full object-cover object-top"/>
        </div>
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white font-medium transition" onClick={onBack}>← Back</button>
            <h2 className="text-2xl font-bold text-slate-800">{roomId==='community'?'Community Chat':'Private Chat'}</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className={`px-4 py-2 rounded-lg font-medium transition ${roomId==='community'?'bg-emerald-600 text-white':'bg-white/80 backdrop-blur-sm hover:bg-white'}`} onClick={()=>setRoomId('community')}>Community</button>
            <button className="px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white font-medium transition" onClick={()=>newPrivate()}>+ Private</button>
          </div>
        </div>
      </div>

      <div ref={listRef} className="bg-white border rounded-2xl p-3 h-[55vh] overflow-y-auto">
        {msgs.map(m => <Bubble key={m.id} m={m}/>)}
      </div>

      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 w-full" placeholder="Type a message…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }}/>
        <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={send}>Send</button>
      </div>
    </div>
  );
}
