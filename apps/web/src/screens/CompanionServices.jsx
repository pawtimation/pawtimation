import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useToast } from '../components/Toast';

function getSitterId(){
  try {
    const u = JSON.parse(localStorage.getItem('pt_user')||'{}');
    return u.sitterId || 's_demo_companion';
  } catch { return 's_demo_companion'; }
}

export function CompanionServices({ sitterId, onBack }){
  const id = sitterId || getSitterId();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  async function load(){
    try {
      const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
      setS(a.sitter);
    } catch (err) {
      console.error('Failed to load sitter:', err);
      setS({ id, name: 'Error', services: [] });
    }
  }
  useEffect(()=>{ load(); }, [id]);

  async function save(){
    setSaving(true);
    try {
      await fetch(`${API_BASE}/sitters/${id}`, { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ services: s.services }) 
      });
      showToast('Services saved successfully!', 'success');
      await load();
    } catch (err) {
      showToast('Failed to save services', 'error');
    } finally {
      setSaving(false);
    }
  }

  function addService(){
    const newService = { 
      key: `svc_${Date.now()}`, 
      label: 'New Service', 
      price: 0, 
      at: 'owner' 
    };
    setS({...s, services: [...(s.services || []), newService]});
  }

  function removeService(idx){
    const arr = [...s.services];
    arr.splice(idx, 1);
    setS({...s, services: arr});
  }

  if (!s) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {ToastComponent}
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
        <h2 className="text-2xl font-bold flex-1">Services & Pricing</h2>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Configure your services</h3>
            <p className="text-sm text-slate-600">Set what you offer and your pricing</p>
          </div>
          <button 
            onClick={addService}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            + Add service
          </button>
        </div>

        <div className="space-y-3">
          {s.services && s.services.length > 0 ? (
            s.services.map((svc, i)=>(
              <div key={svc.key} className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Service name</label>
                    <input 
                      className="border rounded-lg px-3 py-2 w-full" 
                      placeholder="e.g., Dog walking (30 min)"
                      value={svc.label} 
                      onChange={e=>{
                        const arr=[...s.services]; 
                        arr[i]={...svc,label:e.target.value}; 
                        setS({...s, services:arr});
                      }}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Price (£)</label>
                    <input 
                      type="number" 
                      className="border rounded-lg px-3 py-2 w-full" 
                      placeholder="0.00"
                      value={svc.price} 
                      onChange={e=>{
                        const arr=[...s.services]; 
                        arr[i]={...svc,price:Number(e.target.value)}; 
                        setS({...s, services:arr});
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-1">Typical range: £25–£45</p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Location</label>
                    <select 
                      className="border rounded-lg px-3 py-2 w-full" 
                      value={svc.at} 
                      onChange={e=>{
                        const arr=[...s.services]; 
                        arr[i]={...svc, at:e.target.value}; 
                        setS({...s, services:arr});
                      }}
                    >
                      <option value="owner">At owner's home</option>
                      <option value="sitter">At my home</option>
                    </select>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button 
                      onClick={() => removeService(i)}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove service"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-3">No services added yet</p>
              <button 
                onClick={addService}
                className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
              >
                Add your first service
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button 
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors" 
            disabled={saving} 
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button 
            className="px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors" 
            onClick={load}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-teal-900 mb-1">Pricing tips</h4>
            <p className="text-sm text-teal-800">
              Research local rates in your area. Consider your experience, qualifications, and the value you provide. 
              Be competitive but don't undervalue your services!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
