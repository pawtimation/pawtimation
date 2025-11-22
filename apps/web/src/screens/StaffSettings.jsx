import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi, clearSession, getSession } from '../lib/auth';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileCard } from '../components/mobile/MobileCard';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateTimeSlots(startHour = 6, endHour = 22, interval = 15) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
}

export function StaffSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [staffId, setStaffId] = useState(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: ''
  });

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    whatsappAlerts: false,
    emailAlerts: true
  });

  const [availability, setAvailability] = useState({
    Mon: { start: '09:00', end: '17:00' },
    Tue: { start: '09:00', end: '17:00' },
    Wed: { start: '09:00', end: '17:00' },
    Thu: { start: '09:00', end: '17:00' },
    Fri: { start: '09:00', end: '17:00' },
    Sat: { start: '', end: '' },
    Sun: { start: '', end: '' }
  });
  const [exceptionDays, setExceptionDays] = useState([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');

  const timeSlots = generateTimeSlots(6, 22, 15);

  useEffect(() => {
    loadAllSettings();
  }, []);

  async function loadAllSettings() {
    setLoading(true);
    try {
      const session = getSession('STAFF');
      if (!session || !session.userSnapshot) return;
      
      const user = session.userSnapshot;
      setStaffId(user.id);

      const [profileRes, availRes, photoRes] = await Promise.all([
        staffApi('/me'),
        staffApi(`/staff/${user.id}/availability`),
        staffApi(`/media/staff/${user.id}`)
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.user) {
          setProfile({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            profilePicture: data.user.profilePicture || ''
          });
          if (data.user.notificationPreferences) {
            setNotifications({
              pushNotifications: data.user.notificationPreferences.pushNotifications !== false,
              whatsappAlerts: data.user.notificationPreferences.whatsappAlerts || false,
              emailAlerts: data.user.notificationPreferences.emailAlerts !== false
            });
          }
        }
      }

      // Load profile photo
      if (photoRes.ok) {
        const photos = await photoRes.json();
        if (photos && photos.length > 0) {
          setProfilePhotoUrl(photos[0].downloadUrl);
        }
      }

      if (availRes.ok) {
        const availData = await availRes.json();
        if (availData) {
          if (availData.exceptionDays) {
            setExceptionDays(availData.exceptionDays);
            const { exceptionDays, ...weeklySchedule } = availData;
            if (Object.keys(weeklySchedule).length > 0) {
              setAvailability(weeklySchedule);
            }
          } else {
            setAvailability(availData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(event) {
    if (!staffId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    setUploadingPhoto(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await staffApi(`/media/upload/staff/${staffId}`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type with boundary for multipart/form-data
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePhotoUrl(result.downloadUrl);
        setMessage({ type: 'success', text: 'Profile photo updated!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to upload photo' });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage({ type: 'error', text: 'An error occurred while uploading' });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveProfile() {
    if (!staffId) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await staffApi(`/staff/${staffId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile saved' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save profile' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    if (!staffId) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await staffApi(`/staff/${staffId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          notificationPreferences: notifications
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailability() {
    if (!staffId) return;
    setSaving(true);
    setMessage(null);

    try {
      const availabilityData = {
        ...availability,
        exceptionDays
      };
      
      const response = await staffApi(`/staff/${staffId}/availability`, {
        method: 'POST',
        body: JSON.stringify(availabilityData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Availability saved' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save availability' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  }

  function updateDay(day, field, value) {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  }

  function toggleDayOff(day) {
    const isOff = !availability[day].start && !availability[day].end;
    setAvailability(prev => ({
      ...prev,
      [day]: isOff 
        ? { start: '09:00', end: '17:00' }
        : { start: '', end: '' }
    }));
  }

  function addExceptionDay() {
    if (!newExceptionDate) return;
    
    const newException = {
      date: newExceptionDate,
      reason: newExceptionReason || 'Day off',
      id: Date.now().toString()
    };
    
    setExceptionDays(prev => [...prev, newException]);
    setNewExceptionDate('');
    setNewExceptionReason('');
  }

  function removeExceptionDay(id) {
    setExceptionDays(prev => prev.filter(ex => ex.id !== id));
  }

  async function handleLogout() {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8787'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    // Clear only staff session
    clearSession('STAFF');
    window.location.replace('/staff/login');
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <MobilePageHeader 
          title="Settings" 
          subtitle="Manage your profile and preferences"
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'availability', label: 'Availability' }
          ].map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeSection === section.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-2 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {activeSection === 'profile' && (
        <div className="space-y-4">
          <MobileCard>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h2>
            
            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Profile Photo</label>
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-200 flex items-center justify-center">
                    {profilePhotoUrl ? (
                      <img 
                        src={profilePhotoUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <label
                  htmlFor="photo-upload"
                  className={`mt-4 px-6 py-2 bg-teal-50 text-teal-700 rounded-xl font-semibold hover:bg-teal-100 transition-colors cursor-pointer ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </label>
                <p className="text-xs text-slate-500 mt-2">JPG, PNG or WEBP (max 10MB)</p>
              </div>

              <div className="border-t-2 border-slate-100 my-6"></div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full mt-4 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:bg-slate-300 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </MobileCard>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <MobileCard>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Notification Preferences</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900">Push Notifications</p>
                  <p className="text-xs text-slate-500">Get alerts on your device</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900">WhatsApp Alerts</p>
                  <p className="text-xs text-slate-500">Receive updates via WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.whatsappAlerts}
                  onChange={(e) => setNotifications(prev => ({ ...prev, whatsappAlerts: e.target.checked }))}
                  className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900">Email Alerts</p>
                  <p className="text-xs text-slate-500">Get notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
              </label>
            </div>

            <button
              onClick={saveNotifications}
              disabled={saving}
              className="w-full mt-4 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:bg-slate-300 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </MobileCard>
        </div>
      )}

      {activeSection === 'availability' && (
        <div className="space-y-4">
          <MobileCard>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Weekly Schedule</h2>
              
              <div className="space-y-3 mb-4">
                {DAYS_OF_WEEK.map(day => {
                  const dayAvail = availability[day] || { start: '', end: '' };
                  const isAvailable = dayAvail.start && dayAvail.end;

                  return (
                    <div key={day} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={() => toggleDayOff(day)}
                            className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                          />
                          <span className="font-medium text-slate-900 text-sm">{day}</span>
                        </label>
                        {!isAvailable && (
                          <span className="text-xs text-slate-500">Day off</span>
                        )}
                      </div>

                      {isAvailable && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Start</label>
                            <select
                              value={dayAvail.start}
                              onChange={(e) => updateDay(day, 'start', e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">End</label>
                            <select
                              value={dayAvail.end}
                              onChange={(e) => updateDay(day, 'end', e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <h3 className="font-semibold text-slate-900 mb-2 mt-6">Exception Days</h3>
              <p className="text-xs text-slate-600 mb-3">Add days when you're unavailable</p>

              <div className="space-y-2 mb-3">
                <input
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="text"
                  value={newExceptionReason}
                  onChange={(e) => setNewExceptionReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={addExceptionDay}
                  disabled={!newExceptionDate}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 disabled:bg-slate-300 transition-colors"
                >
                  Add Exception
                </button>
              </div>

              {exceptionDays.length > 0 && (
                <div className="space-y-2 mb-4">
                  {exceptionDays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(exception => (
                      <div
                        key={exception.id}
                        className="flex items-center justify-between p-2 border border-slate-200 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(exception.date + 'T00:00:00').toLocaleDateString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-slate-600">{exception.reason}</p>
                        </div>
                        <button
                          onClick={() => removeExceptionDay(exception.id)}
                          className="text-rose-600 hover:text-rose-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              )}

            <button
              onClick={saveAvailability}
              disabled={saving}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:bg-slate-300 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </MobileCard>
        </div>
      )}

      <MobileCard>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </MobileCard>
    </div>
  );
}
