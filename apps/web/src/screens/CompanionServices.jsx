import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { useToast } from '../components/Toast';
import { HeroBanner } from '../ui/primitives';

function getSitterId(){
  try {
    const u = JSON.parse(localStorage.getItem('pt_user')||'{}');
    return u.sitterId || 's_demo_companion';
  } catch { return 's_demo_companion'; }
}

export function CompanionServices({ sitterId, onBack }){
  const navigate = useNavigate();
  const id = sitterId || getSitterId();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/companion');
    }
  };

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
    <div className="max-w-screen-sm mx-auto px-4 flex flex-col gap-4 pb-24">
      {ToastComponent}
      <HeroBanner 
        title="Services & Pricing"
        onBack={handleBack}
      />

      <div className="card-base space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Configure your services</h3>
            <p className="text-sm text-slate-600">Set what you offer and your pricing</p>
          </div>
          <button 
            onClick={addService}
            className="btn btn-primary whitespace-nowrap"
          >
            + Add service
          </button>
        </div>

        <div className="space-y-3">
          {s.services && s.services.length > 0 ? (
            s.services.map((svc, i)=>(
              <div key={svc.key} className="card-base flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex-1 w-full grid gap-3 md:gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="col-span-2 md:col-span-2">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Service name</label>
                      <input 
                        className="border rounded-lg px-3 py-2 w-full min-h-[44px] text-[15px]" 
                        placeholder="e.g., Dog walking"
                        value={svc.label} 
                        onChange={e=>{
                          const arr=[...s.services]; 
                          arr[i]={...svc,label:e.target.value}; 
                          setS({...s, services:arr});
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Price (£)</label>
                      <input 
                        type="number" 
                        className="border rounded-lg px-3 py-2 w-full min-h-[44px] text-[15px]" 
                        placeholder="0"
                        value={svc.price} 
                        onChange={e=>{
                          const arr=[...s.services]; 
                          arr[i]={...svc,price:Number(e.target.value)}; 
                          setS({...s, services:arr});
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-600 mb-1 block truncate">Location</label>
                      <select 
                        className="border rounded-lg px-3 py-2 w-full min-h-[44px] text-[15px]" 
                        value={svc.at} 
                        onChange={e=>{
                          const arr=[...s.services]; 
                          arr[i]={...svc, at:e.target.value}; 
                          setS({...s, services:arr});
                        }}
                      >
                        <option value="owner">Owner's home</option>
                        <option value="sitter">My home</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeService(i)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors self-end"
                  title="Remove service"
                  aria-label="Remove service"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="card-base text-center py-6">
              <p className="text-gray-600 mb-3">No services added yet</p>
              <button 
                onClick={addService}
                className="btn btn-primary"
              >
                Add your first service
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-[var(--brandSoft)] p-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-teal-900 mb-1">Pricing tips</h4>
            <p className="text-teal-800">
              Research local rates in your area. Consider your experience, qualifications, and the value you provide. 
              Be competitive but don't undervalue your services!
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="mx-auto max-w-screen-sm px-4 py-3 flex gap-3">
          <button 
            className="btn btn-secondary flex-1" 
            onClick={load}
          >
            Reset
          </button>
          <button 
            className="btn btn-primary flex-1" 
            disabled={saving} 
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
