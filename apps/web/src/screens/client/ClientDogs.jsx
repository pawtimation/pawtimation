import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../../api/src/repo.js';

export function ClientDogs() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const clientId = parsed.crmClientId || parsed.clientId;

        if (!clientId) {
          navigate('/client/login');
          return;
        }

        const [c, d] = await Promise.all([
          repo.getClient(clientId),
          repo.listDogsByClient(clientId)
        ]);

        if (!c) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        setClient(c);
        setDogs(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading your dogs…</div>;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Dogs</h1>

      {dogs.length === 0 ? (
        <div className="card">
          <p className="text-sm text-slate-600">
            No dogs added yet. Your walker can add your dogs to your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dogs.map(dog => (
            <div
              key={dog.id}
              className="bg-white p-4 rounded border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <h2 className="font-semibold text-base">{dog.name}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {dog.breed || 'Breed not specified'}
              </p>
              {dog.age && (
                <p className="text-xs text-slate-500 mt-1">Age: {dog.age}</p>
              )}
              {dog.notes && (
                <p className="text-sm text-slate-700 mt-2 border-t pt-2">
                  {dog.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
