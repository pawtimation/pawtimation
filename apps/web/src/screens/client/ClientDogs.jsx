import { useState, useEffect } from "react";
import { clientApi } from '../../lib/auth';
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "../../components/mobile/MobilePageHeader";
import { MobileEmptyState } from "../../components/mobile/MobileEmptyState";
import { MobileCard } from "../../components/mobile/MobileCard";
import { ClientDogFormModal } from "../../components/ClientDogFormModal";

export function ClientDogs() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dogModalOpen, setDogModalOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [clientId, setClientId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDogs();
  }, []);

  async function loadDogs() {
    try {
      // First get client info to get the clientId
      const meRes = await clientApi('/me');
      if (!meRes.ok) {
        console.error('Failed to get client info');
        setLoading(false);
        return;
      }
      
      const meData = await meRes.json();
      setClientId(meData.id);
      
      // Then load dogs
      const res = await clientApi('/dogs/list');
      
      if (res.ok) {
        const data = await res.json();
        const dogsList = Array.isArray(data) ? data : [];
        setDogs(dogsList);
      }
    } catch (err) {
      console.error('Failed to load dogs:', err);
    }
    setLoading(false);
  }

  function addDog() {
    setEditingDog(null);
    setDogModalOpen(true);
  }

  function editDog(dog) {
    // For now, editing is disabled - clients need to contact service provider
    alert('To update your dog\'s information, please contact your service provider. They can help you make any changes needed.');
    return;
    
    // When editing is enabled, uncomment this:
    // setEditingDog(dog);
    // setDogModalOpen(true);
  }

  function closeDogModal(saved) {
    setDogModalOpen(false);
    setEditingDog(null);
    if (saved) {
      loadDogs();
    }
  }

  function viewDogProfile(dogId) {
    navigate(`/client/dogs/${dogId}`);
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


  return (
    <>
      <div className="space-y-6">
        <div>
          <MobilePageHeader 
            title="My Dogs" 
            subtitle="Manage your furry friends"
          />
          
          <button
            onClick={addDog}
            className="mt-4 w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Dog
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
              <div key={dog.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{dog.name}</h3>
                    <p className="text-sm text-slate-600">
                      {dog.breed || 'Breed not specified'}
                      {dog.age && ` • ${dog.age} ${dog.age == 1 ? 'year' : 'years'} old`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editDog(dog);
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {(dog.sex || dog.colour) && (
                  <div className="flex gap-4 mb-3">
                    {dog.sex && (
                      <div className="text-sm">
                        <span className="text-slate-500">Sex:</span> <span className="text-slate-700">{dog.sex}</span>
                      </div>
                    )}
                    {dog.colour && (
                      <div className="text-sm">
                        <span className="text-slate-500">Colour:</span> <span className="text-slate-700">{dog.colour}</span>
                      </div>
                    )}
                  </div>
                )}

                {(dog.behaviourNotes || dog.medicalNotes || dog.feeding || dog.walking) && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {dog.behaviourNotes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Behaviour</p>
                        <p className="text-sm text-slate-700">{dog.behaviourNotes}</p>
                      </div>
                    )}
                    {dog.medicalNotes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Medical</p>
                        <p className="text-sm text-slate-700">{dog.medicalNotes}</p>
                      </div>
                    )}
                    {dog.feeding && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Feeding</p>
                        <p className="text-sm text-slate-700">{dog.feeding}</p>
                      </div>
                    )}
                    {dog.walking && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Walking</p>
                        <p className="text-sm text-slate-700">{dog.walking}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dog Form Modal */}
      {clientId && (
        <ClientDogFormModal
          open={dogModalOpen}
          onClose={closeDogModal}
          clientId={clientId}
          dog={editingDog}
        />
      )}
    </>
  );
}
