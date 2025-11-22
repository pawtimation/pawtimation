import { useState, useEffect } from "react";
import { api, clientApi } from '../../lib/auth';
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "../../components/mobile/MobilePageHeader";
import { MobileEmptyState } from "../../components/mobile/MobileEmptyState";
import { MobileCard } from "../../components/mobile/MobileCard";

export function ClientDogs() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    weightKg: "",
    notes: ""
  });

  useEffect(() => {
    loadDogs();
  }, []);

  async function loadDogs() {
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) {
        navigate('/client/login');
        return;
      }

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId;
      
      if (!clientId) {
        console.error('No clientId found in session');
        setLoading(false);
        return;
      }

      const res = await clientApi(`/dogs/by-client/${clientId}`);
      
      if (res.ok) {
        const data = await res.json();
        setDogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load dogs:', err);
    }
    setLoading(false);
  }

  async function handleSave() {
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) return;

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId;

      if (!clientId) {
        alert('Session error. Please log in again.');
        return;
      }
      
      if (editingDog) {
        alert('Dog editing is not yet available in the mobile app. Please contact your service provider to update dog information.');
        return;
      } else {
        const res = await clientApi(`/dogs/create`, {
          method: 'POST',
          body: JSON.stringify({
            clientId,
            ...formData
          })
        });
        
        if (res.ok) {
          await loadDogs();
          setShowAddForm(false);
          resetForm();
        } else {
          alert('Failed to save. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to save dog:', err);
      alert('Failed to save. Please try again.');
    }
  }

  async function handleDelete(dogId) {
    alert('Dog removal is not yet available in the mobile app. Please contact your service provider to remove a dog.');
    return;
  }

  function resetForm() {
    setFormData({
      name: "",
      breed: "",
      age: "",
      weightKg: "",
      notes: ""
    });
  }

  function startEdit(dog) {
    alert('Dog editing is not yet available in the mobile app. Please contact your service provider to update dog information.');
    return;
  }

  function cancelForm() {
    setShowAddForm(false);
    setEditingDog(null);
    resetForm();
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div>
          <MobilePageHeader 
            title={editingDog ? 'Edit Dog' : 'Add Dog'} 
            subtitle="Enter your dog's information"
          />
          
          <div className="flex gap-3 mt-4">
            <button onClick={cancelForm} className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
              Save Dog
            </button>
          </div>
        </div>

        <MobileCard>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Dog's Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                placeholder="e.g. Buddy"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Breed
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                placeholder="e.g. Golden Retriever"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Age (years)
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                placeholder="e.g. 3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                placeholder="e.g. 25"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Special Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors resize-none"
                placeholder="Any special needs, allergies, or behavioral notes..."
                rows="4"
              />
            </div>
          </div>
        </MobileCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <MobilePageHeader 
          title="My Dogs" 
          subtitle="Manage your furry friends"
        />
        
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-sm"
        >
          + Add New Dog
        </button>
      </div>

      <div className="space-y-4">
        {dogs.length === 0 ? (
          <MobileEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No dogs added yet"
            message="Add your first dog to get started with bookings"
          />
        ) : (
          dogs.map((dog) => (
            <MobileCard 
              key={dog.id}
              onClick={() => startEdit(dog)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{dog.name}</h3>
                    <p className="text-sm text-slate-600">{dog.breed || 'No breed specified'}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {dog.age && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-700">{dog.age} {dog.age == 1 ? 'year' : 'years'} old</p>
                  </div>
                )}
                {dog.weightKg && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <p className="text-sm text-slate-700">{dog.weightKg} kg</p>
                  </div>
                )}
                {dog.notes && (
                  <div className="flex items-start gap-2 mt-2">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-600 flex-1">{dog.notes}</p>
                  </div>
                )}
              </div>
            </MobileCard>
          ))
        )}
      </div>
    </div>
  );
}
