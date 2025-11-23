import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clientApi } from '../../lib/auth';
import { MobilePageHeader } from "../../components/mobile/MobilePageHeader";
import { MobileCard } from "../../components/mobile/MobileCard";

export function ClientDogProfile() {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDog();
  }, [dogId]);

  async function loadDog() {
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) {
        navigate('/client/login');
        return;
      }

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId;

      const dogsRes = await clientApi(`/dogs/by-client/${clientId}`);
      if (dogsRes.ok) {
        const dogs = await dogsRes.json();
        const dogsList = Array.isArray(dogs) ? dogs : [];
        const matchedDog = dogsList.find(d => String(d.id) === String(dogId));
        
        if (matchedDog) {
          setDog(matchedDog);
        } else {
          navigate('/client/dogs');
        }
      } else {
        navigate('/client/dogs');
      }
    } catch (err) {
      console.error('Failed to load dog:', err);
      navigate('/client/dogs');
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="space-y-6">
        <MobilePageHeader 
          title="Dog Not Found" 
          subtitle="This dog could not be found"
        />
        <button
          onClick={() => navigate('/client/dogs')}
          className="btn btn-primary"
        >
          Back to My Dogs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/client/dogs')}
          className="text-teal-600 text-sm mb-3 hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Dogs
        </button>
        
        <MobilePageHeader 
          title={dog.name} 
          subtitle={dog.breed || 'No breed specified'}
        />
      </div>

      <MobileCard>
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {dog.age && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-slate-600 font-medium">Age</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{dog.age} {dog.age == 1 ? 'year' : 'years'}</p>
              </div>
            )}
            
            {dog.weightKg && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-xs text-slate-600 font-medium">Weight</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{dog.weightKg} kg</p>
              </div>
            )}
          </div>

          {dog.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-amber-800 font-semibold">Special Notes</span>
              </div>
              <p className="text-sm text-amber-900">{dog.notes}</p>
            </div>
          )}
        </div>
      </MobileCard>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note:</span> To update {dog.name}'s information, please contact your service provider.
        </p>
      </div>
    </div>
  );
}
