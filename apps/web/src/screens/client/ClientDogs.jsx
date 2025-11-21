import { useState, useEffect } from "react";
import { api } from "../../lib/auth";
import { useNavigate } from "react-router-dom";

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

      const res = await api(`/dogs/by-client/${clientId}`);
      
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
        const res = await api(`/dogs/create`, {
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
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={cancelForm} className="text-teal-600 font-medium">
              Cancel
            </button>
            <h1 className="text-lg font-semibold text-slate-900">
              {editingDog ? 'Edit Dog' : 'Add Dog'}
            </h1>
            <button onClick={handleSave} className="text-teal-600 font-semibold">
              Save
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter dog's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Breed
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({...formData, breed: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Golden Retriever"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Age
            </label>
            <input
              type="text"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., 3 years"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="text"
              value={formData.weightKg}
              onChange={(e) => setFormData({...formData, weightKg: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., 25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={4}
              placeholder="Any special requirements or notes..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">My Dogs</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            + Add Dog
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {dogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600 mb-4">You haven't added any dogs yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Add Your First Dog
            </button>
          </div>
        ) : (
          dogs.map((dog) => (
            <div key={dog.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{dog.name}</h3>
                  {dog.breed && (
                    <p className="text-sm text-slate-600">{dog.breed}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(dog)}
                    className="text-teal-600 font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dog.id)}
                    className="text-red-600 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {dog.age && (
                  <div className="flex gap-2">
                    <span className="text-sm text-slate-500">Age:</span>
                    <span className="text-sm text-slate-900">{dog.age}</span>
                  </div>
                )}
                {dog.weightKg && (
                  <div className="flex gap-2">
                    <span className="text-sm text-slate-500">Weight:</span>
                    <span className="text-sm text-slate-900">{dog.weightKg} kg</span>
                  </div>
                )}
                {dog.notes && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Notes:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{dog.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
