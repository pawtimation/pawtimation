import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'
import { ArrowLeft } from '../components/Icons'
import { trackEvent } from '../lib/metrics'
import { HeroBanner } from '../ui/primitives'

function Card({children}){ return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div> }

function formatTier(tier){
  if(tier === 'PREMIUM') return 'Pro'
  if(tier === 'VERIFIED') return 'Verified'
  if(tier === 'TRAINEE') return 'Trainee'
  return tier
}

export function BrowseSitters({ onBack }){
  const navigate = useNavigate()
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/owner')
    }
  }
  
  const [tier, setTier] = useState('')
  const [service, setService] = useState('')
  const [radius, setRadius] = useState('10')
  const [date, setDate] = useState('')
  const [sort, setSort] = useState('rating')
  const [list, setList] = useState([])
  const [postcode, setPostcode] = useState('HP20')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    trackEvent('browse_open');
  }, []);

  async function load(){
    setLoading(true)
    setError(null)
    
    const params = new URLSearchParams();
    if (tier) params.append('tier', tier);
    if (postcode) params.append('postcode', postcode);
    if (service) params.append('service', service);
    if (radius) params.append('radius', radius);
    if (date) params.append('date', date);
    if (sort) params.append('sort', sort);
    
    try {
      const url = `${API_BASE}/sitters/search?${params.toString()}`;
      const j = await (await fetch(url)).json();
      setList(j.results||[]);
      trackEvent('browse_search', { service, tier, postcode, radius, date, sort });
    } catch(e) {
      console.error('Failed to load sitters:', e);
      setError('Failed to load companions. Please try again.');
      setList([]);
    }
    setLoading(false)
  }
  
  useEffect(()=>{ load() }, []);

  function handleSearch() {
    load();
  }

  function handleClear() {
    setTier('');
    setService('');
    setRadius('10');
    setDate('');
    setSort('rating');
    setPostcode('HP20');
    setTimeout(() => load(), 100);
  }

  const resultCount = list.length;

  return (
    <div className="space-y-4">
      <HeroBanner 
        title="Browse Companions" 
        subtitle="Find care near you"
        imageUrl="/chocolate-lab-running.jpg"
        onBack={handleBack}
      />
      
      <Card>
        
        {/* Enhanced Filter Bar */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Service</label>
              <select 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={service} 
                onChange={e=>setService(e.target.value)}
              >
                <option value="">All services</option>
                <option value="walk30">30min Walk</option>
                <option value="walk60">60min Walk</option>
                <option value="dropin">Drop-in Visit</option>
                <option value="daycare">Day Care</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Tier <span className="text-xs text-slate-500">(Trainee=new, Pro=experienced)</span>
              </label>
              <select 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={tier} 
                onChange={e=>setTier(e.target.value)}
              >
                <option value="">All tiers</option>
                <option value="TRAINEE">Trainee</option>
                <option value="VERIFIED">Verified</option>
                <option value="PREMIUM">Pro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Postcode/Area</label>
              <input 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={postcode} 
                onChange={e=>setPostcode(e.target.value)} 
                placeholder="HP20 or 'Beaconsfield'"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Radius (miles)</label>
              <select 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={radius} 
                onChange={e=>setRadius(e.target.value)}
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Date (optional)</label>
              <input 
                type="date" 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={date} 
                onChange={e=>setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Sort by</label>
              <select 
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500" 
                value={sort} 
                onChange={e=>setSort(e.target.value)}
              >
                <option value="rating">Best rated</option>
                <option value="nearest">Nearest</option>
                <option value="price_low">Price (low→high)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500" 
              onClick={handleSearch}
            >
              Search
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500" 
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className="text-sm text-slate-600 mb-3">
            {resultCount === 0 ? 'No results' : `${resultCount} companion${resultCount === 1 ? '' : 's'} found`}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-3xl mb-3">⏳</div>
            <p className="text-slate-600">Loading companions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <button onClick={load} className="px-4 py-2 bg-brand-blue text-white rounded font-medium hover:bg-brand-teal transition-colors">
              Try again
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p className="mb-3">No companions match your filters yet.</p>
            <p className="text-sm text-slate-500 mb-4">Try widening the radius or removing the service filter.</p>
            <button onClick={handleClear} className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {list.map(s=>(
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 bg-white flex items-start justify-between hover:border-teal-300 transition">
                <div>
                  <div className="font-semibold text-lg">{s.name} <span className="text-xs ml-2 px-2 py-0.5 bg-slate-100 rounded">{formatTier(s.tier)}</span></div>
                  <div className="text-slate-600 text-sm">{s.postcode} • ⭐ {s.rating} ({s.reviews})</div>
                  {s.services && s.services.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {s.services.slice(0, 2).map((svc, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded">{svc}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">£{(s.ratePerDay/100).toFixed(0)}/day</div>
                  <button className="mt-1 px-3 py-1 bg-brand-blue text-white rounded text-sm font-medium hover:bg-brand-teal transition-colors" onClick={()=>window.location.hash=`#/c/${s.id}`}>View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
