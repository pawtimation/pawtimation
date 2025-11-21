import React, { useEffect, useState } from 'react';
import { api } from '../lib/auth';
import { rankStaff } from '../lib/staff.js';
import DateTimePicker from './DateTimePicker';
import { getTodayDate } from '../lib/timeUtils';
import { AddressMap } from './AddressMap';
import { RouteDisplay, RouteGenerator } from './RouteDisplay';
import { buildNavigationURL } from '../lib/navigationUtils';

// Helper function to map booking data to form state
function mapBookingToForm(booking) {
  if (!booking) return {
    clientId: '',
    dogIds: [],
    serviceId: '',
    start: '',
    status: 'PENDING',
    priceCents: 0,
    notes: '',
    staffId: '',
    recurrence: 'none',
    recurrenceEndDate: '',
    recurrenceInterval: 1
  };
  
  // Convert UTC time to local time for editing
  let localStart = '';
  if (booking.start) {
    const date = new Date(booking.start);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    localStart = `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  return {
    clientId: booking.clientId || '',
    dogIds: booking.dogIds || [],
    serviceId: booking.serviceId || '',
    start: localStart,
    status: booking.status || 'PENDING',
    priceCents: booking.priceCents || 0,
    notes: booking.notes || '',
    staffId: booking.staffId || '',
    recurrence: 'none',
    recurrenceEndDate: '',
    recurrenceInterval: 1
  };
}

export function BookingFormModal({ open, onClose, editing, businessId }) {
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [suggestedStaff, setSuggestedStaff] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [bookingRoute, setBookingRoute] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    clientId: '',
    dogIds: [],
    serviceId: '',
    start: '',
    status: 'PENDING',
    priceCents: 0,
    notes: '',
    staffId: '',
    recurrence: 'none',
    recurrenceEndDate: '',
    recurrenceInterval: 1
  });

  useEffect(() => {
    if (open) loadData();
  }, [open, businessId]);

  useEffect(() => {
    if (editing) {
      setForm(mapBookingToForm(editing));
      setCurrentBooking(editing);
      setIsEditing(true);
      
      if (editing.clientId) {
        setSelectedClient(editing.clientId);
        loadDogsForClient(editing.clientId);
      }
      // Load route if it exists
      if (editing.route) {
        setBookingRoute(editing.route);
      } else {
        setBookingRoute(null);
      }
    } else {
      setForm(mapBookingToForm(null));
      setCurrentBooking(null);
      setIsEditing(false);
      setSelectedClient('');
      setDogs([]);
      setBookingRoute(null);
    }
  }, [editing, open]);

  // Auto-assign price based on selected service
  useEffect(() => {
    if (form.serviceId && services.length > 0) {
      const svc = services.find(s => s.id === form.serviceId);
      if (svc && svc.priceCents !== undefined) {
        update('priceCents', svc.priceCents);
      }
    }
  }, [form.serviceId, services]);

  // Auto-suggest staff when booking details change
  useEffect(() => {
    if (!form.start || !form.serviceId || !businessId || !dataLoaded) {
      setSuggestedStaff([]);
      return;
    }

    const service = services.find(s => s.id === form.serviceId);
    if (!service) return;

    const startDate = new Date(form.start);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (service.durationMinutes || 30));

    const bookingForRanking = {
      ...form,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };

    // Exclude the current booking being edited from conflict checks
    // Use currentBooking.id for just-created bookings, or editing.id for bookings opened for editing
    const excludeBookingId = currentBooking?.id || editing?.id;
    const ranked = rankStaff(staff, bookingForRanking, allBookings, excludeBookingId);
    setSuggestedStaff(ranked);

    // Auto-assign best match if no staff selected and data is loaded
    if (!form.staffId && ranked.length > 0 && ranked[0].score > 0) {
      update('staffId', ranked[0].staff.id);
    }
  }, [form.start, form.serviceId, staff, allBookings, services, dataLoaded]);

  async function loadData() {
    if (!businessId) return;
    
    setDataLoaded(false);

    try {
      const [clientsRes, servicesRes, staffRes, bookingsRes] = await Promise.all([
        api(`/clients/list`),
        api(`/services/list`),
        api(`/staff/list`),
        api(`/bookings/list`)
      ]);

      const c = clientsRes.ok ? await clientsRes.json() : [];
      const s = servicesRes.ok ? await servicesRes.json() : [];
      const st = staffRes.ok ? await staffRes.json() : [];
      const b = bookingsRes.ok ? await bookingsRes.json() : [];

      setClients(Array.isArray(c) ? c : c.clients || []);
      setServices(Array.isArray(s) ? s : s.services || []);
      setStaff(Array.isArray(st) ? st : st.staff || []);
      setAllBookings(Array.isArray(b) ? b : b.bookings || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to load booking data', err);
      setDataLoaded(true);
    }
  }

  async function loadDogsForClient(clientId) {
    try {
      const res = await api(`/dogs/by-client/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setDogs(Array.isArray(data) ? data : data.dogs || []);
      }
    } catch (err) {
      console.error('Failed to load dogs', err);
    }
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!businessId) return;

    const service = services.find(s => s.id === form.serviceId);
    const client = clients.find(c => c.id === form.clientId);

    // Basic validation
    if (!form.clientId || !form.serviceId || !form.start) {
      alert("Client, service and start date are required");
      return;
    }

    if (!form.staffId) {
      alert("Please assign a staff member to this booking");
      return;
    }

    const startDate = new Date(form.start);
    const endDate = new Date(startDate);
    if (service?.durationMinutes) {
      endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
    }

    // Always normalise status to UPPERCASE for the backend
    const statusUpper = (form.status || "PENDING").toUpperCase();

    try {
      if (isEditing && currentBooking?.id) {
        //
        // 🔁 UPDATE EXISTING BOOKING
        // Hits POST /bookings/:bookingId/update
        //
        const payload = {
          start: startDate.toISOString(),
          serviceId: form.serviceId,
          staffId: form.staffId || null,
          status: statusUpper,
          // Optional, but supported by patched backend
          priceCents: form.priceCents,
        };

        const res = await api(`/bookings/${currentBooking.id}/update`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error || "Failed to update booking";
          alert(msg);
          return;
        }

        const data = await res.json();

        // Keep local list in sync if setter is provided
        if (setAllBookings && data.booking) {
          setAllBookings(prev => {
            const existing = (prev || []).find(b => b.id === data.booking.id);
            if (existing) {
              // Update existing
              return prev.map(b => (b.id === data.booking.id ? data.booking : b));
            } else {
              // Add new (in case it was just created)
              return [...prev, data.booking];
            }
          });
        }
        
        // If this was a just-created booking (not originally passed as editing prop), close after update
        if (currentBooking && !editing) {
          onClose(true);
          return;
        }
      } else {
        //
        // 🆕 CREATE NEW BOOKING (or recurring bookings)
        //
        
        // Check if this is a recurring booking
        if (form.recurrence && form.recurrence !== 'none') {
          // Validate end date for recurring bookings
          if (!form.recurrenceEndDate) {
            alert("Please select an end date for recurring bookings");
            return;
          }
          
          const endDate = new Date(form.recurrenceEndDate);
          if (endDate <= startDate) {
            alert("End date must be after the start date");
            return;
          }
          
          // Create recurring bookings
          const payload = {
            clientId: form.clientId,
            dogIds: form.dogIds,
            serviceId: form.serviceId,
            start: startDate.toISOString(),
            notes: form.notes,
            staffId: form.staffId,
            recurrence: form.recurrence,
            recurrenceEndDate: form.recurrenceEndDate,
            recurrenceInterval: form.recurrenceInterval
          };

          const res = await api("/bookings/create-recurring", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const msg = errorData.error || "Failed to create recurring bookings";
            alert(msg);
            return;
          }

          const data = await res.json();
          
          // Show success message
          alert(`Successfully created ${data.created} recurring booking${data.created > 1 ? 's' : ''}!${data.errors ? ` (${data.errors.length} failed)` : ''}`);
          
          if (setAllBookings && data.jobs) {
            setAllBookings(prev => ([...(prev || []), ...data.jobs]));
          }
        } else {
          // Single booking
          const payload = {
            clientId: form.clientId,
            dogIds: form.dogIds,
            serviceId: form.serviceId,
            start: startDate.toISOString(),
            notes: form.notes,
            staffId: form.staffId
          };

          const res = await api("/bookings/create", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const msg = errorData.error || "Failed to create booking";
            alert(msg);
            return;
          }

          const data = await res.json();
          
          // For non-recurring single bookings, reload booking data and switch to edit mode
          if (data.job?.id && form.recurrence === 'none') {
            // Fetch the full booking details to get complete data
            try {
              const bookingRes = await api(`/bookings/${data.job.id}`);
              if (bookingRes.ok) {
                const fullBooking = await bookingRes.json();
                
                // IMPORTANT: Set currentBooking BEFORE updating allBookings
                // This ensures the useEffect has the excludeBookingId when it runs
                setCurrentBooking(fullBooking);
                setIsEditing(true);
                
                // Now update allBookings - useEffect will run with correct excludeBookingId
                if (setAllBookings) {
                  setAllBookings(prev => ([...(prev || []), fullBooking]));
                }
                
                // Use mapper to convert booking to form state
                setForm(mapBookingToForm(fullBooking));
                
                // Load dogs for the client
                if (fullBooking.clientId) {
                  setSelectedClient(fullBooking.clientId);
                  await loadDogsForClient(fullBooking.clientId);
                }
                
                // Load route if it exists
                if (fullBooking.route) {
                  setBookingRoute(fullBooking.route);
                }
                
                // Keep modal open - route generation UI will appear
                return;
              }
            } catch (err) {
              console.error("Failed to fetch booking details after creation", err);
            }
          }
        }
      }

      // Close modal and let parent refresh if needed
      onClose(true);
    } catch (err) {
      console.error("Booking save error", err);
      alert("Could not save booking. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">
          {isEditing && currentBooking && !editing ? 'Edit Booking (Just Created)' : isEditing ? 'Edit Booking' : 'Create Booking'}
        </h2>

        <Select
          label="Client"
          value={form.clientId}
          onChange={v => {
            update('clientId', v);
            setSelectedClient(v);
            loadDogsForClient(v);
          }}
          options={clients.map(c => ({ value: c.id, label: c.name }))}
        />

        {form.clientId && (() => {
          const client = clients.find(c => c.id === form.clientId);
          if (client?.address) {
            return (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <AddressMap address={client.address} />
              </div>
            );
          }
          return null;
        })()}

        {dogs.length > 0 && (
          <CheckboxGroup
            label="Dogs"
            values={form.dogIds}
            onChange={v => update('dogIds', v)}
            options={dogs.map(d => ({ value: d.id, label: d.name }))}
          />
        )}

        <Select
          label="Service"
          value={form.serviceId}
          onChange={v => update('serviceId', v)}
          options={services.map(s => ({ value: s.id, label: s.name }))}
        />

        <DateTimePicker
          label="Start date & time"
          value={form.start}
          onChange={v => update('start', v)}
          minDate={editing ? null : getTodayDate()}
          required
        />

        {/* Walking Route Generation */}
        {isEditing && currentBooking?.id && form.clientId && form.serviceId && (() => {
          const bookingId = currentBooking.id;
          const client = clients.find(c => c.id === form.clientId);
          const hasCoordinates = client?.lat && client?.lng;
          
          if (!hasCoordinates) {
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                <p>💡 Add GPS coordinates to the client's address to enable walking route generation.</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {bookingRoute ? (
                <RouteDisplay 
                  route={bookingRoute}
                  onNavigate={() => {
                    const client = clients.find(c => c.id === form.clientId);
                    const coords = bookingRoute.geojson?.geometry?.coordinates;
                    const url = buildNavigationURL(client?.lat, client?.lng, coords);
                    if (url) {
                      window.open(url, '_blank');
                    }
                  }}
                  showNavigation={true}
                />
              ) : (
                <RouteGenerator
                  bookingId={bookingId}
                  onRouteGenerated={(route) => setBookingRoute(route)}
                />
              )}
            </div>
          );
        })()}
        
        {/* Save confirmation message after creating booking */}
        {isEditing && currentBooking && !editing && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800 font-medium">✓ Booking created successfully!</p>
            <p className="text-xs text-emerald-700 mt-1">You can now generate a walking route, make changes, or close this dialog.</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm space-y-1 text-slate-700">
            <div className="font-medium">Assign Staff <span className="text-rose-600">*</span></div>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={form.staffId}
              onChange={e => {
                const value = e.target.value;
                if (value === 'RECOMMEND') {
                  // Auto-assign best staff
                  if (suggestedStaff.length > 0 && suggestedStaff[0].score > 0) {
                    update('staffId', suggestedStaff[0].staff.id);
                  } else {
                    alert('No available staff found for this time slot. Please select manually or change the time.');
                    update('staffId', '');
                  }
                } else {
                  update('staffId', value);
                }
              }}
            >
              <option value="">Select staff…</option>
              <option value="RECOMMEND">✨ Recommend staff (auto-assign)</option>
              {staff.map(s => {
                const suggestionInfo = suggestedStaff.find(sg => sg.staff.id === s.id);
                let label = s.name;
                if (suggestionInfo) {
                  label += ` — Match: ${suggestionInfo.score}%`;
                  if (!suggestionInfo.qualified) label += ' (Not qualified)';
                  else if (suggestionInfo.conflicts.length > 0) label += ` (${suggestionInfo.conflicts.length} conflict${suggestionInfo.conflicts.length > 1 ? 's' : ''})`;
                  else if (!suggestionInfo.available) label += ' (Outside availability)';
                }
                return (
                  <option key={s.id} value={s.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          {form.staffId && (() => {
            const selectedStaffInfo = suggestedStaff.find(s => s.staff.id === form.staffId);
            if (selectedStaffInfo && selectedStaffInfo.conflicts.length > 0) {
              return (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 space-y-1">
                  <div className="font-medium">
                    ⚠️ Warning: This staff member has {selectedStaffInfo.conflicts.length} conflicting booking{selectedStaffInfo.conflicts.length > 1 ? 's' : ''} at this time
                  </div>
                  {selectedStaffInfo.conflicts.slice(0, 3).map((conflict, idx) => {
                    const conflictStart = new Date(conflict.start);
                    const conflictEnd = new Date(conflict.end);
                    const timeStr = `${conflictStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${conflictEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
                    
                    // Enrich conflict with service and client names
                    const conflictService = services.find(s => s.id === conflict.serviceId);
                    const conflictClient = clients.find(c => c.id === conflict.clientId);
                    const serviceName = conflictService?.name || 'Service';
                    const clientName = conflictClient?.name;
                    
                    return (
                      <div key={idx} className="text-[11px] text-rose-600">
                        • {timeStr} - {serviceName} {clientName ? `for ${clientName}` : ''}
                      </div>
                    );
                  })}
                  {selectedStaffInfo.conflicts.length > 3 && (
                    <div className="text-[11px] text-rose-600">
                      ...and {selectedStaffInfo.conflicts.length - 3} more
                    </div>
                  )}
                </div>
              );
            }
            if (selectedStaffInfo && !selectedStaffInfo.available) {
              return (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  ⚠️ Note: This booking is outside the staff member's usual availability hours
                </div>
              );
            }
            if (selectedStaffInfo && selectedStaffInfo.score === 100) {
              return (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                  ✓ Perfect match: Qualified, available, and no conflicts
                </div>
              );
            }
          })()}
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={v => update('status', v)}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'BOOKED', label: 'Booked' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={v => update('notes', v)}
        />

        {!isEditing && (
          <>
            <Select
              label="Recurrence"
              value={form.recurrence}
              onChange={v => update('recurrence', v)}
              options={[
                { value: 'none', label: 'None (single booking)' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Fortnightly (every 2 weeks)' },
                { value: 'custom', label: 'Custom interval...' }
              ]}
            />

            {form.recurrence !== 'none' && (
              <>
                {form.recurrence === 'custom' && (
                  <Input
                    label="Repeat every (days)"
                    type="number"
                    value={form.recurrenceInterval}
                    onChange={v => update('recurrenceInterval', parseInt(v) || 1)}
                  />
                )}
                
                <Input
                  label="End date"
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={v => update('recurrenceEndDate', v)}
                />
                
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  ℹ️ This will create multiple bookings from the start date to the end date. Staff availability will be checked for each occurrence.
                </div>
              </>
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          {isEditing && currentBooking && !editing ? (
            // Just-created booking in edit mode
            <>
              <button className="btn btn-secondary text-sm" onClick={() => onClose(true)}>
                Close
              </button>
              <button className="btn btn-primary text-sm" onClick={save}>
                Save changes
              </button>
            </>
          ) : (
            // Original create/edit flow
            <>
              <button className="btn btn-secondary text-sm" onClick={() => onClose(false)}>
                Cancel
              </button>
              <button className="btn btn-primary text-sm" onClick={save}>
                {isEditing ? 'Save booking' : (form.recurrence !== 'none' ? 'Create recurring bookings' : 'Save booking')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <select
        className="border rounded px-2 py-1 text-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <textarea
        className="border rounded px-2 py-1 text-sm w-full h-20"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function CheckboxGroup({ label, values, onChange, options }) {
  function toggle(value) {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  return (
    <div className="space-y-1">
      <div className="font-medium text-sm text-slate-700">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
