import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi, clearSession, getSession } from '../lib/auth';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileCard } from '../components/mobile/MobileCard';
import { DatePicker } from '../components/DatePicker';
import { PremiumTimePicker } from '../components/PremiumTimePicker';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ROLE_OPTIONS = ['Walker', 'Groomer', 'Sitter', 'Admin', 'Support', 'Other'];

const COMMON_SKILLS = [
  'Reactive dogs',
  'Senior dogs',
  'Multiple dog walks',
  'Puppies',
  'Large breeds',
  'Small breeds',
  'Cat sitting',
  'Grooming',
  'Training',
  'Medication administration',
  'First aid certified'
];

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
    profilePicture: '',
    role: 'Walker',
    address: {
      street: '',
      city: '',
      state: '',
      postcode: ''
    },
    emergencyContact: {
      name: '',
      phone: ''
    },
    bio: '',
    yearsExperience: 0,
    skills: []
  });

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newSkill, setNewSkill] = useState('');

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
            profilePicture: data.user.profilePicture || '',
            role: data.user.role || 'Walker',
            address: data.user.address || {
              street: '',
              city: '',
              state: '',
              postcode: ''
            },
            emergencyContact: data.user.emergencyContact || {
              name: '',
              phone: ''
            },
            bio: data.user.bio || '',
            yearsExperience: data.user.yearsExperience || 0,
            skills: data.user.skills || []
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
          phone: profile.phone,
          role: profile.role,
          address: profile.address,
          emergencyContact: profile.emergencyContact,
          bio: profile.bio,
          yearsExperience: profile.yearsExperience,
          skills: profile.skills
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

  function addSkill(skill) {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;
    if (profile.skills.includes(trimmedSkill)) {
      setMessage({ type: 'error', text: 'Skill already added' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, trimmedSkill]
    }));
    setNewSkill('');
  }

  function removeSkill(skillToRemove) {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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
    <div className="space-y-6 -mx-6 -mt-6 px-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-base text-slate-600">Manage your profile and preferences</p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'availability', label: 'Availability' }
          ].map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`px-2 py-4 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center ${
                activeSection === section.key
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
              }`}
              style={{ minHeight: '56px' }}
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
            <h2 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h2>
            
            <div className="space-y-4">
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
                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
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

              <div className="border-t-2 border-slate-100 my-6"></div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Address</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Street"
                    value={profile.address.street}
                    onChange={(e) => setProfile(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={profile.address.city}
                    onChange={(e) => setProfile(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="State"
                      value={profile.address.state}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Postcode"
                      value={profile.address.postcode}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, postcode: e.target.value }
                      }))}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Emergency Contact <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={profile.emergencyContact.name}
                    onChange={(e) => setProfile(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    value={profile.emergencyContact.phone}
                    onChange={(e) => setProfile(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Work Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Role</label>
                <select
                  value={profile.role}
                  onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Bio / About Me</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="Tell us about yourself and your experience..."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={profile.yearsExperience}
                  onChange={(e) => setProfile(prev => ({ 
                    ...prev, 
                    yearsExperience: Math.min(60, Math.max(0, parseInt(e.target.value) || 0))
                  }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Skills / Specialties</label>
                
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border-2 border-teal-200"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-teal-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(newSkill);
                        }
                      }}
                      placeholder="Add a skill..."
                      className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-600 transition-colors"
                    />
                    <button
                      onClick={() => addSkill(newSkill)}
                      disabled={!newSkill.trim()}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:bg-slate-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="border-t-2 border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Common Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_SKILLS.filter(skill => !profile.skills.includes(skill)).map(skill => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full px-6 py-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl text-lg font-bold hover:from-teal-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 active:scale-95 transition-all shadow-lg"
              style={{ minHeight: '64px' }}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {DAYS_OF_WEEK.filter(d => availability[d]?.start && availability[d]?.end).length} days active
              </span>
            </div>
              
            <div className="space-y-3 mb-4">
              {DAYS_OF_WEEK.map(day => {
                const dayAvail = availability[day] || { start: '', end: '' };
                const isAvailable = dayAvail.start && dayAvail.end;

                return (
                  <div 
                    key={day} 
                    className={`
                      border-2 rounded-xl p-4 transition-all duration-200
                      ${isAvailable 
                        ? 'border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50' 
                        : 'border-slate-200 bg-slate-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={() => toggleDayOff(day)}
                          className="w-5 h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                          {day}
                        </span>
                      </label>
                      {!isAvailable && (
                        <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                          Day off
                        </span>
                      )}
                    </div>

                    {isAvailable && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Start Time</label>
                          <PremiumTimePicker
                            value={dayAvail.start}
                            onChange={(value) => updateDay(day, 'start', value)}
                            placeholder="Select time"
                            availableTimes={timeSlots}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">End Time</label>
                          <PremiumTimePicker
                            value={dayAvail.end}
                            onChange={(value) => updateDay(day, 'end', value)}
                            placeholder="Select time"
                            availableTimes={timeSlots}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-slate-900">Exception Days</h3>
              <p className="text-xs text-slate-600">Add specific dates when you're unavailable</p>

              <div className="space-y-2">
                <DatePicker
                  value={newExceptionDate}
                  onChange={setNewExceptionDate}
                  preventPastDates={true}
                  placeholder="Select date"
                />
                <input
                  type="text"
                  value={newExceptionReason}
                  onChange={(e) => setNewExceptionReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:border-teal-300"
                />
                <button
                  onClick={addExceptionDay}
                  disabled={!newExceptionDate}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Exception Day
                </button>
              </div>

              {exceptionDays.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {exceptionDays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(exception => (
                      <div
                        key={exception.id}
                        className="flex items-center justify-between p-3 border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl hover:border-rose-300 transition-all"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(exception.date + 'T00:00:00').toLocaleDateString('en-GB', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{exception.reason}</p>
                        </div>
                        <button
                          onClick={() => removeExceptionDay(exception.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold text-sm bg-white px-5 py-3 rounded-xl border-2 border-rose-200 hover:border-rose-300 active:scale-95 transition-all"
                          style={{ minHeight: '48px' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl mt-3">
                  <p className="text-sm text-slate-500">No exception days added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Use the form above to add days off</p>
                </div>
              )}
            </div>

            <button
              onClick={saveAvailability}
              disabled={saving}
              className="w-full mt-4 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:bg-slate-300 transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </MobileCard>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleLogout}
          className="w-full bg-white text-teal-600 border border-teal-600 p-3 rounded font-medium hover:bg-teal-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
