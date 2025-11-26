import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clientApi, getSession } from '../lib/auth';
import dayjs from 'dayjs';
import DateTimePicker from '../components/DateTimePicker';

export function ClientBook() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const repeatId = params.get('repeat');

  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [clientData, setClientData] = useState(null);
  
  const [serviceId, setServiceId] = useState('');
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [repeatId]);

  async function loadData() {
    try {
      const session = getSession('CLIENT');
      if (!session) {
        navigate('/client/login');
        return;
      }

      const clientId = session.crmClientId || session.userId;
      const businessId = session.businessId;

      if (!clientId || !businessId) {
        navigate('/client/login');
        return;
      }

      setClientData({ clientId, businessId });

      const [dogsRes, servicesRes] = await Promise.all([
        clientApi(`/dogs/by-client/${clientId}`),
        clientApi(`/business/${businessId}/services`)
      ]);

      if (dogsRes.ok) {
        const dogsData = await dogsRes.json();
        setDogs(Array.isArray(dogsData) ? dogsData : dogsData.dogs || []);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        const servicesList = Array.isArray(servicesData) ? servicesData : servicesData.services || [];
        // Only show services visible to clients
        setServices(servicesList.filter(s => s.allowClientBooking !== false && s.active !== false));
      }

      // Set default date to tomorrow at 9am
      const tomorrow = dayjs().add(1, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DDTHH:mm:ss');
      setDateTime(tomorrow);

    } catch (err) {
      console.error('Failed to load booking form:', err);
      setError('Failed to load booking form');
    } finally {
      setLoading(false);
    }
  }

  function toggleDog(dogId) {
    if (selectedDogs.includes(dogId)) {
      setSelectedDogs(selectedDogs.filter(id => id !== dogId));
    } else {
      setSelectedDogs([...selectedDogs, dogId]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!serviceId) {
      setError('Please select a service');
      return;
    }

    if (selectedDogs.length === 0) {
      setError('Please select at least one dog');
      return;
    }

    if (!dateTime) {
      setError('Please select a date and time');
      return;
    }

    setSubmitting(true);

    try {

      const response = await clientApi('/client/bookings/request', {
        method: 'POST',
        body: {
          clientId: clientData.clientId,
          serviceId,
          dogIds: selectedDogs,
          dateTime,
          notes
        }
      });

      if (response.ok) {
        navigate('/client/bookings');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to request booking');
      }
    } catch (err) {
      console.error('Failed to request booking:', err);
      setError('Failed to request booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const selectedService = services.find(s => s.id === serviceId);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/client/bookings')}
            className="text-slate-600 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Request a Booking</h1>
        </div>
        <p className="text-sm text-slate-600">Book a service for your dog</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-6">
        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Service
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          >
            <option value="">✓ Select service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          {selectedService && (
            <p className="mt-2 text-sm text-slate-600">
              {selectedService.durationMinutes} minutes
            </p>
          )}
        </div>

        {/* Dog Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Dogs
          </label>
          {dogs.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 mb-2">You haven't added any dogs yet.</p>
              <button
                type="button"
                onClick={() => navigate('/client/dogs')}
                className="text-sm text-teal-700 font-medium underline"
              >
                Add a dog first
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dogs.map(dog => (
                <label
                  key={dog.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDogs.includes(dog.id)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDogs.includes(dog.id)}
                    onChange={() => toggleDog(dog.id)}
                    className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{dog.name}</p>
                    {dog.breed && (
                      <p className="text-sm text-slate-500">{dog.breed}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <DateTimePicker
            label="Date & Time"
            value={dateTime}
            onChange={setDateTime}
            minDate={dayjs().format('YYYY-MM-DD')}
            required
            className="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Any special instructions for your service provider..."
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-sm text-rose-900">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2 pb-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Requesting...' : 'Request Booking'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/client/bookings')}
            className="px-6 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
