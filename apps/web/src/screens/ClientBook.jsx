import { useEffect, useState } from 'react';
import { listDogsForClient } from '../lib/clientsApi';
import { listBusinessServices } from '../lib/servicesApi';
import { createJobRequest } from '../lib/jobApi';
import { getJob } from '../lib/jobApi';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function ClientBook() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  const [serviceId, setServiceId] = useState('');
  const [dogIds, setDogIds] = useState([]);
  const [start, setStart] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const repeatId = params.get('repeat');

  // Load dogs + services
  useEffect(() => {
    async function load() {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const cId = parsed.crmClientId || parsed.clientId;
        const bId = parsed.businessId;

        if (!cId || !bId) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        setClientId(cId);
        setBusinessId(bId);

        const [dogResponse, serviceResponse] = await Promise.all([
          listDogsForClient(cId),
          listBusinessServices(bId)
        ]);

        // Handle API response shape
        const dogList = dogResponse.dogs || dogResponse;
        const serviceList = serviceResponse.services || serviceResponse;
        
        setDogs(dogList);
        setServices(serviceList);

        // If repeating a previous booking
        if (repeatId) {
          const past = await getJob(repeatId);
          if (past) {
            setServiceId(past.serviceId || '');
            setDogIds(past.dogIds || []);
            setNotes(past.notes || '');
            
            // Pre-fill start time from previous booking (user can modify)
            if (past.start) {
              // Check if it's a naive datetime-local string (no timezone info)
              // Naive format: YYYY-MM-DDTHH:mm (exactly 16 chars) or YYYY-MM-DDTHH:mm:ss
              // ISO with timezone: ends with Z or +/-HH:MM
              const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(past.start);
              
              if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(past.start)) {
                // Use naive datetime directly
                setStart(past.start.slice(0, 16));
              } else {
                // Convert ISO string to datetime-local format preserving local wall-clock time
                const date = new Date(past.start);
                if (!Number.isNaN(date.getTime())) {
                  // Format as YYYY-MM-DDTHH:mm in local timezone
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                  setStart(localDateTime);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load booking form:', err);
        setError('Failed to load booking form. Please try again.');
      }

      setLoading(false);
    }

    load();
  }, [repeatId, navigate]);

  // Toggle dog selection
  function toggleDog(id) {
    if (dogIds.includes(id)) {
      setDogIds(dogIds.filter((d) => d !== id));
    } else {
      setDogIds([...dogIds, id]);
    }
  }

  // Validation
  function validate() {
    if (!serviceId) return 'Please choose a service.';
    if (dogIds.length === 0) return 'Please select at least one dog.';
    if (!start) return 'Please choose a date and time.';

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return 'Invalid date/time.';

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createJobRequest({
        clientId,
        businessId,
        serviceId,
        dogIds,
        start,
        notes
      });

      navigate('/client/bookings');
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking. Please try again.');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Request a Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        {/* Service selection */}
        <div>
          <label className="block mb-1 font-medium">Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="border w-full max-w-md px-2 py-1 rounded"
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMinutes || 60} mins)
              </option>
            ))}
          </select>
          {selectedService && (
            <p className="text-xs text-slate-600 mt-1">
              Duration: {selectedService.durationMinutes || 60} minutes
              {selectedService.priceCents && (
                <> • Price: £{(selectedService.priceCents / 100).toFixed(2)}</>
              )}
            </p>
          )}
        </div>

        {/* Dog selection */}
        <div>
          <label className="block mb-1 font-medium">Dogs</label>

          {dogs.length === 0 ? (
            <p className="text-slate-500">
              You have no dogs added.{' '}
              <button
                type="button"
                onClick={() => navigate('/client/dogs')}
                className="text-teal-700 underline"
              >
                Add a dog first
              </button>
            </p>
          ) : (
            <div className="space-y-1">
              {dogs.map((dog) => (
                <label key={dog.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={dogIds.includes(dog.id)}
                    onChange={() => toggleDog(dog.id)}
                  />
                  {dog.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date/time */}
        <div>
          <label className="block mb-1 font-medium">Date & Time</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border px-2 py-1 w-full max-w-md rounded"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border rounded w-full max-w-md h-24 px-2 py-1"
            placeholder="Any special instructions for your dog walker..."
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Request Booking
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
