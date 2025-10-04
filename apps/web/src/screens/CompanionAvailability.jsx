import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import MonthCalendar from '../components/MonthCalendar.jsx';

function getSitterId(){
  try {
    const u = JSON.parse(localStorage.getItem('pt_user')||'{}');
    return u.sitterId || 's_demo_companion';
  } catch { return 's_demo_companion'; }
}

export function CompanionAvailability({ sitterId, onBack }){
  const id = sitterId || getSitterId();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  async function load(){
    try {
      const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
      setS(a.sitter);
    } catch (err) {
      console.error('Failed to load sitter:', err);
      setS({ id, name: 'Error', availability: { unavailable: [] } });
    }
  }
  useEffect(()=>{ load(); }, [id]);

  async function save(){
    setSaving(true);
    await fetch(`${API_BASE}/sitters/${id}`, { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ availability: s.availability }) 
    });
    setSaving(false);
    await load();
  }

  if (!s) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2" 
          onClick={onBack}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-bold flex-1">Availability Calendar</h2>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Manage your schedule</h3>
          <p className="text-sm text-slate-600">Mark dates when you're unavailable</p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button 
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors font-medium"
            onClick={()=>setCalMonth(m=>{ const nm=(m+11)%12; if(nm===11) setCalYear(y=>y-1); return nm; })}
          >
            ← Previous
          </button>
          <div className="flex-1 text-center font-semibold text-lg">
            {new Date(calYear, calMonth, 1).toLocaleString('en-GB', { month:'long', year:'numeric' })}
          </div>
          <button 
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors font-medium"
            onClick={()=>setCalMonth(m=>{ const nm=(m+1)%12; if(nm===0) setCalYear(y=>y+1); return nm; })}
          >
            Next →
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <MonthCalendar
            year={calYear}
            month={calMonth}
            selected={s.availability?.unavailable||[]}
            onToggle={(iso, toAdd)=>{
              const cur = new Set(s.availability?.unavailable||[]);
              if (toAdd) cur.add(iso); else cur.delete(iso);
              setS({...s, availability:{ ...(s.availability||{}), unavailable:[...cur].sort() }});
            }}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Unavailable dates (you can also edit manually)
          </label>
          <input 
            className="border rounded-lg w-full px-4 py-2 text-sm font-mono" 
            placeholder="YYYY-MM-DD, YYYY-MM-DD, ..."
            value={(s.availability?.unavailable||[]).join(', ')}
            onChange={e=>setS({...s, availability:{...s.availability, unavailable:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}})}
          />
          <p className="text-xs text-slate-500 mt-1">Comma-separated dates in YYYY-MM-DD format</p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button 
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors" 
            disabled={saving} 
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save availability'}
          </button>
          <button 
            className="px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors" 
            onClick={load}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📅</div>
          <div>
            <h4 className="font-semibold text-sky-900 mb-1">Keep your calendar up to date</h4>
            <p className="text-sm text-sky-800">
              Update your availability regularly to avoid double bookings. Pet owners can only book when you're marked as available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
