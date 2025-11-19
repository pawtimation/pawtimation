import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getJob, updateJobRequest } from '../../lib/jobApi';
import { listDogsForClient } from '../../lib/clientsApi';

export function ClientEditBooking() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const clientId = parsed.crmClientId || parsed.clientId;

        if (!clientId) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        const [j, dogList] = await Promise.all([
          getJob(id),
          listDogsForClient(clientId)
        ]);

        if (!j) {
          setError('Job not found');
          setLoading(false);
          return;
        }

        setJob(j);
        setDogs(dogList);
      } catch (err) {
        console.error('Failed to load booking:', err);
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    } else {
      navigate('/client/bookings');
    }
  }, [id, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (!job.dogIds || job.dogIds.length === 0) {
      setError('Please select at least one dog');
      return;
    }

    if (!job.start) {
      setError('Please select a date and time');
      return;
    }

    try {
      await updateJobRequest(id, {
        start: job.start,
        dogIds: job.dogIds,
        notes: job.notes || ''
      });

      navigate('/client/bookings');
    } catch (err) {
      console.error('Failed to update booking:', err);
      setError('Failed to update booking. Please try again.');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  if (error && !job) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={() => navigate('/client/bookings')}
          className="text-teal-700 text-sm underline"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Edit Booking</h1>

      <form onSubmit={handleSave} className="space-y-4 text-sm">
        <div>
          <label className="block mb-1 font-medium">Date and time</label>
          <input
            type="datetime-local"
            value={job.start ? job.start.slice(0, 16) : ''}
            onChange={(e) => setJob({ ...job, start: e.target.value })}
            className="border rounded px-2 py-1 w-64"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Dogs</label>
          {dogs.length === 0 ? (
            <p className="text-sm text-slate-600">No dogs found. Please add a dog first.</p>
          ) : (
            <div className="space-y-1">
              {dogs.map((dog) => (
                <label key={dog.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={job.dogIds?.includes(dog.id) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setJob({ ...job, dogIds: [...(job.dogIds || []), dog.id] });
                      } else {
                        setJob({
                          ...job,
                          dogIds: (job.dogIds || []).filter((d) => d !== dog.id)
                        });
                      }
                    }}
                  />
                  {dog.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Notes</label>
          <textarea
            value={job.notes || ''}
            onChange={(e) => setJob({ ...job, notes: e.target.value })}
            className="border rounded px-2 py-1 w-full max-w-md h-24"
            placeholder="Any special instructions for your dog walker"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => navigate('/client/bookings')}
            className="px-4 py-1 border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
