import React, { useState, useEffect } from 'react';
import { auth } from '../lib/auth';
import { FeatureGate } from '../components/FeatureGate';

export function CommunityEvents({ onBack }) {
  const [location, setLocation] = useState('Beaconsfield');
  const [events, setEvents] = useState([]);
  const [plan, setPlan] = useState('FREE');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadEvents();
    
    // Fetch user plan
    fetch('/api/me/plan', {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
    })
      .then(r => r.json())
      .then(data => setPlan(data.plan || 'FREE'));
  }, [location]);

  async function loadEvents() {
    const res = await fetch(`/api/events?near=${location}`);
    const data = await res.json();
    setEvents(data.events || []);
  }

  async function handleRSVP(eventId) {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      }
    });
    
    if (res.ok) {
      loadEvents();
    }
  }

  async function createEvent() {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      },
      body: JSON.stringify({
        ...newEvent,
        city: location
      })
    });

    if (res.ok) {
      setShowCreateForm(false);
      setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
      loadEvents();
    } else {
      const data = await res.json();
      if (data.error === 'PLAN_REQUIRED') {
        alert('Upgrade to Plus or Premium to create events');
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community & Events</h1>
          <p className="text-slate-600">Connect with local pet parents and companions</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">
            ← Back
          </button>
        )}
      </div>

      {/* Location selector */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <label className="block text-sm font-medium mb-2">Location</label>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Enter city or postcode"
          />
          <button 
            onClick={loadEvents}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Update
          </button>
        </div>
      </div>

      {/* Create Event Button */}
      <div className="bg-white rounded-lg shadow-card p-4">
        {plan === 'FREE' ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Create your own event</div>
              <div className="text-sm text-slate-600">Organise meetups for your community</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🔒 Plus</span>
              <button className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Upgrade
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create Event'}
          </button>
        )}

        {showCreateForm && plan !== 'FREE' && (
          <div className="mt-4 space-y-3">
            <input 
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <input 
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                className="border rounded px-3 py-2"
              />
            </div>
            <input 
              placeholder="Location/venue"
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
            <textarea 
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
            <button 
              onClick={createEvent}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Create Event
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming events in {location}</h2>
        
        {events.length === 0 && (
          <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-600">
            No events found in this area. Be the first to create one!
          </div>
        )}

        {events.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>📅 {new Date(event.date).toLocaleDateString()} at {event.time}</span>
                  <span>📍 {event.location}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'CONFIRMED' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {event.statusMessage}
              </span>
            </div>

            {event.description && (
              <p className="text-slate-700 mb-3">{event.description}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-sm font-medium">{event.attendees} attending</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRSVP(event.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  RSVP
                </button>
                <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                  Invite my Circle
                </button>
                {plan === 'PLUS' && (
                  <span className="text-xs text-sky-600">✨ Early access</span>
                )}
              </div>
            </div>

            {/* Map preview placeholder */}
            <div className="mt-3 h-24 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-sm">
              📍 Map preview: {event.location}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
