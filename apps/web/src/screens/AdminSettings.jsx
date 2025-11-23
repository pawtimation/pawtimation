import React, { useState, useEffect } from 'react';
import { fetchBusinessSettings, saveBusinessSettings, fetchAdminBusinesses } from '../lib/businessApi';
import { listServices, addService, updateService, deleteService } from '../lib/servicesApi';
import { fetchAutomationSettings, saveAutomationSettings } from '../lib/automationApi';
import { getSession } from '../lib/auth';
import { generateTimeSlots, formatTimeSlot } from '../lib/timeUtils';
import { TimePicker } from '../components/TimePicker';

const SECTIONS = [
  { id: 'profile', label: 'Business profile' },
  { id: 'hours', label: 'Working hours' },
  { id: 'policies', label: 'Policies' },
  { id: 'branding', label: 'Branding' },
  { id: 'finance', label: 'Finance settings' },
  { id: 'pricing', label: 'Service pricing' },
  { id: 'permissions', label: 'Staff permissions' },
  { id: 'automation', label: 'Automation rules' },
  { id: 'payments', label: 'Online payments' }
];

/* Business Selector for Admins - defined first so it can be used in AdminSettings */
function BusinessSelector({ onSelect }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    try {
      const data = await fetchAdminBusinesses();
      setBusinesses(data.businesses);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-slate-500">Loading businesses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="space-y-4">
        <header>
          <h1 className="text-lg font-semibold">Select a Business</h1>
          <p className="text-xs text-slate-600 mt-1">
            Choose which business's settings you want to manage
          </p>
        </header>

        <div className="space-y-3">
          <input
            type="text"
            className="input w-full"
            placeholder="Search businesses by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {businesses.length === 0 ? 'No businesses found' : 'No matching businesses'}
              </div>
            ) : (
              filtered.map((business) => (
                <button
                  key={business.id}
                  onClick={() => onSelect(business.id)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="font-medium text-sm">{business.name}</div>
                  <div className="text-xs text-slate-500 mt-1">ID: {business.id}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [active, setActive] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
  const isAdmin = session?.isAdmin && !session?.businessId;

  useEffect(() => {
    // For admins without businessId, try to load from session storage
    if (isAdmin) {
      const stored = sessionStorage.getItem('admin_selected_business');
      if (stored) {
        setSelectedBusinessId(stored);
      }
      setLoading(false);
    } else {
      loadSettings();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Load settings when business is selected by admin
    if (selectedBusinessId) {
      loadSettings(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  async function loadSettings(businessId = null) {
    setLoading(true);
    try {
      const data = await fetchBusinessSettings(businessId);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(section, data) {
    setSaveStatus('saving');
    try {
      // Merge section data with existing settings to avoid wiping other fields
      // Guard with default empty objects to prevent crashes when section doesn't exist yet
      const mergedData = {
        [section]: {
          ...(settings[section] || {}),
          ...data
        }
      };
      
      const updated = await saveBusinessSettings(mergedData, selectedBusinessId);
      setSettings(updated);
      setSaveStatus('saved');
      
      if (section === 'profile' && data.businessName) {
        // Dispatch event to update sidebar
        window.dispatchEvent(new CustomEvent('businessNameUpdated'));
      }
      
      if (section === 'branding' && !selectedBusinessId) {
        // Dispatch event with the updated branding data from state
        // Only dispatch for own business to prevent sidebar confusion
        window.dispatchEvent(new CustomEvent('brandingUpdated', { 
          detail: updated.branding || {}
        }));
      }
      
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  function handleBusinessSelect(businessId) {
    setSelectedBusinessId(businessId);
    sessionStorage.setItem('admin_selected_business', businessId);
  }

  function handleBusinessDeselect() {
    setSelectedBusinessId(null);
    sessionStorage.removeItem('admin_selected_business');
    setSettings(null);
  }

  // Show business selector for admins without selected business
  if (isAdmin && !selectedBusinessId) {
    return <BusinessSelector onSelect={handleBusinessSelect} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="text-red-600 font-semibold">Settings Unavailable</div>
          <p className="text-sm text-slate-600">
            Your account needs to be set up with a business. Please log out and log back in to complete setup.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                try {
                  await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8787'}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                  });
                } catch (e) {}
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/client/login');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-700 text-sm"
            >
              Log Out & Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* LEFT MINI-SIDEBAR */}
      <aside className="w-72 shrink-0">
        <div className="sticky top-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-sm text-slate-600 mb-6">
            Manage your business details, hours, policies, branding and automation.
          </p>
          
          {isAdmin && selectedBusinessId && (
            <button
              onClick={handleBusinessDeselect}
              className="w-full text-sm text-teal-700 hover:text-teal-800 mb-6 px-4 py-2.5 border border-teal-200 rounded-xl hover:bg-teal-50 font-medium transition-colors"
            >
              ← Change Business
            </button>
          )}
          
          <nav className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={
                  'w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ' +
                  (active === section.id
                    ? 'bg-teal-50 text-teal-900 border-teal-600'
                    : 'text-slate-700 hover:bg-slate-50 border-transparent')
                }
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* RIGHT CONTENT PANE */}
      <section className="flex-1">
        {saveStatus && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium shadow-sm ${
            saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            saveStatus === 'saving' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus === 'saved' && '✓ Settings saved successfully'}
            {saveStatus === 'saving' && '⏳ Saving...'}
            {saveStatus === 'error' && '✗ Failed to save settings'}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {active === 'profile' && (
            <BusinessProfileSection 
              data={settings.profile} 
              onSave={(data) => handleSave('profile', data)}
            />
          )}
          {active === 'hours' && (
            <WorkingHoursSection 
              data={settings.hours} 
              onSave={(data) => handleSave('hours', data)}
            />
          )}
          {active === 'policies' && (
            <PoliciesSection 
              data={settings.policies} 
              onSave={(data) => handleSave('policies', data)}
            />
          )}
          {active === 'branding' && (
            <BrandingSection 
              data={settings.branding} 
              onSave={(data) => handleSave('branding', data)}
            />
          )}
          {active === 'finance' && (
            <FinanceSection />
          )}
          {active === 'pricing' && <PricingSection />}
          {active === 'permissions' && <StaffPermissionsSection />}
          {active === 'automation' && <AutomationSection />}
          {active === 'payments' && <PaymentsSection />}
        </div>
      </section>
    </div>
  );
}

/* === SECTIONS === */

function BusinessProfileSection({ data, onSave }) {
  const [formData, setFormData] = useState(data);

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Business details</h2>
        <p className="text-sm text-slate-600 mt-1">
          These details are used on client-facing pages and invoices.
        </p>
      </header>

      <div className="space-y-5">
        <Field label="Business name">
          <input 
            className="input" 
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            placeholder="Your business" 
          />
        </Field>

        <Field label="Service area (e.g. postcodes, neighbourhoods)">
          <input 
            className="input" 
            value={formData.serviceArea}
            onChange={(e) => handleChange('serviceArea', e.target.value)}
            placeholder="e.g. SW1, SW2" 
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Contact email">
            <input 
              className="input" 
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="you@example.com" 
            />
          </Field>
          <Field label="Contact phone">
            <input 
              className="input" 
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+44..." 
            />
          </Field>
        </div>

        <Field label="Address line 1">
          <input 
            className="input" 
            value={formData.addressLine1}
            onChange={(e) => handleChange('addressLine1', e.target.value)}
            placeholder="Street address" 
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="City / town">
            <input 
              className="input" 
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City" 
            />
          </Field>
          <Field label="Postcode">
            <input 
              className="input" 
              value={formData.postcode}
              onChange={(e) => handleChange('postcode', e.target.value)}
              placeholder="Postcode" 
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors" type="submit">
          Save changes
        </button>
      </div>
    </form>
  );
}

function WorkingHoursSection({ data, onSave }) {
  const [hours, setHours] = useState(data);

  function handleChange(day, field, value) {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(hours);
  }

  const days = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Working hours</h2>
        <p className="text-xs text-slate-600">
          Default hours for your team. Individual staff can customise theirs separately.
        </p>
      </header>

      <div className="border rounded-md divide-y">
        {days.map(({ key, label }) => {
          const dayData = hours[key] || { open: false, start: '09:00', end: '17:00' };
          return (
            <div key={key} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="w-16">{label}</div>
              <div className="flex items-center gap-2">
                <select 
                  className="border rounded px-2 py-1 text-xs"
                  value={dayData.open ? 'open' : 'closed'}
                  onChange={(e) => handleChange(key, 'open', e.target.value === 'open')}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                {dayData.open && (
                  <>
                    <TimePicker
                      value={dayData.start}
                      onChange={(val) => handleChange(key, 'start', val)}
                      className="border rounded px-2 py-1 text-xs w-28"
                    />
                    <span className="text-xs text-slate-500">to</span>
                    <TimePicker
                      value={dayData.end}
                      onChange={(val) => handleChange(key, 'end', val)}
                      className="border rounded px-2 py-1 text-xs w-28"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary text-sm" type="submit">
          Save working hours
        </button>
      </div>
    </form>
  );
}

function PoliciesSection({ data, onSave }) {
  const [formData, setFormData] = useState(data);

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Policies</h2>
        <p className="text-xs text-slate-600">
          These rules are shown to clients during booking and used when generating invoices.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Cancellation window (hours before a booking)">
          <input 
            className="input" 
            type="number" 
            min="0" 
            value={formData.cancellationWindowHours}
            onChange={(e) => handleChange('cancellationWindowHours', Number(e.target.value))}
            placeholder="24" 
          />
        </Field>
        <Field label="Payment terms (days after invoice)">
          <input 
            className="input" 
            type="number" 
            min="0" 
            value={formData.paymentTermsDays}
            onChange={(e) => handleChange('paymentTermsDays', Number(e.target.value))}
            placeholder="14" 
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary text-sm" type="submit">
          Save policies
        </button>
      </div>
    </form>
  );
}

function BrandingSection({ data, onSave }) {
  // Initialize with safe defaults to prevent crashes on fresh accounts without branding
  const [formData, setFormData] = useState(() => ({
    logoUrl: '',
    primaryColor: '#00a58a',
    secondaryColor: '#0f172a',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    showPoweredBy: true,
    ...(data || {})
  }));
  const [uploading, setUploading] = useState(false);

  // Sync form state when data prop changes (e.g., after save or switching businesses)
  // Always sync to defaults when data is undefined/null (fresh business with no branding)
  useEffect(() => {
    setFormData({
      logoUrl: '',
      primaryColor: '#00a58a',
      secondaryColor: '#0f172a',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      showPoweredBy: true,
      ...(data || {})
    });
  }, [data]);

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      
      // Convert image to data URL for now (simple implementation)
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert('Failed to upload logo');
      setUploading(false);
    }
  }

  function handleRemoveLogo() {
    handleChange('logoUrl', '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Branding</h2>
        <p className="text-xs text-slate-600">
          Control how your client-facing pages look.
        </p>
      </header>

      {/* Logo Upload Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Business Logo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Recommended size: 600×600px (square). Max 2MB.
          </p>
        </div>

        {formData.logoUrl ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img 
                src={formData.logoUrl} 
                alt="Business logo preview"
                className="w-32 h-32 object-contain border rounded-lg bg-slate-50"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <label className="btn btn-secondary text-xs cursor-pointer">
                Change Logo
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="btn btn-secondary text-xs text-rose-600 hover:bg-rose-50"
                disabled={uploading}
              >
                Remove Logo
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed rounded-lg bg-slate-50">
            <p className="text-sm text-slate-600 mb-3">No logo uploaded</p>
            <label className="btn btn-primary text-xs cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Logo'}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Color Palette Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Colour Palette</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize the colours used on client-facing pages and booking forms.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Primary Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Primary Colour</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color"
                value={formData.primaryColor || '#00a58a'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text"
                value={formData.primaryColor || ''}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                placeholder="#00a58a"
                className="input flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-slate-500">Main brand colour for buttons and accents</p>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Secondary Colour</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color"
                value={formData.secondaryColor || '#0f172a'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text"
                value={formData.secondaryColor || ''}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                placeholder="#0f172a"
                className="input flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-slate-500">Headers and navigation elements</p>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Accent Colour</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color"
                value={formData.accentColor || '#f59e0b'}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text"
                value={formData.accentColor || ''}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                placeholder="#f59e0b"
                className="input flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-slate-500">Highlights and call-to-action elements</p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Background Colour</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color"
                value={formData.backgroundColor || '#ffffff'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text"
                value={formData.backgroundColor || ''}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="input flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-slate-500">Page background colour</p>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Text Colour</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color"
                value={formData.textColor || '#1e293b'}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text"
                value={formData.textColor || ''}
                onChange={(e) => handleChange('textColor', e.target.value)}
                placeholder="#1e293b"
                className="input flex-1 text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-slate-500">Primary text colour</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-700">
        <input 
          id="show-powered" 
          type="checkbox" 
          className="border rounded" 
          checked={formData.showPoweredBy}
          onChange={(e) => handleChange('showPoweredBy', e.target.checked)}
        />
        <label htmlFor="show-powered">
          Show "Powered by Pawtimation" on client pages
        </label>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary text-sm" type="submit">
          Save branding
        </button>
      </div>
    </form>
  );
}

function FinanceSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [frequency, setFrequency] = useState("disabled");
  const [trigger, setTrigger] = useState("completed");
  const [sendMode, setSendMode] = useState("draft");
  const [defaultTerms, setDefaultTerms] = useState(14);
  const [bankDetails, setBankDetails] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const settings = await fetchBusinessSettings();
        if (cancelled) return;
        const finance = settings.finance || {};
        setAutoEnabled(Boolean(finance.autoInvoicingEnabled));
        setFrequency(finance.autoInvoicingFrequency || "disabled");
        setTrigger(finance.autoInvoicingTrigger || "completed");
        setSendMode(finance.sendMode || "draft");
        setDefaultTerms(
          typeof finance.defaultPaymentTermsDays === "number"
            ? finance.defaultPaymentTermsDays
            : 14
        );
        setBankDetails(finance.bankDetails || "");
        setError("");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Could not load finance settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await saveBusinessSettings({
        finance: {
          autoInvoicingEnabled: autoEnabled,
          autoInvoicingFrequency: frequency,
          autoInvoicingTrigger: trigger,
          sendMode,
          defaultPaymentTermsDays: Number(defaultTerms) || 0,
          bankDetails
        }
      });
    } catch (e) {
      console.error(e);
      setError("Could not save finance settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Finance settings</h2>
        <p className="text-xs text-slate-600">
          Configure how invoices are generated, sent and paid.
        </p>
      </header>

      {loading ? (
        <p className="text-xs text-slate-600">Loading finance settings…</p>
      ) : (
        <>
          {error && (
            <div className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <Field label="Auto-invoicing">
              <select
                className="input"
                value={autoEnabled ? frequency : "disabled"}
                onChange={e => {
                  const value = e.target.value;
                  if (value === "disabled") {
                    setAutoEnabled(false);
                    setFrequency("disabled");
                  } else {
                    setAutoEnabled(true);
                    setFrequency(value);
                  }
                }}
              >
                <option value="disabled">Disabled</option>
                <option value="per_job">Per job</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>

            <Field label="When to invoice">
              <select
                className="input"
                value={trigger}
                onChange={e => setTrigger(e.target.value)}
                disabled={!autoEnabled}
              >
                <option value="completed">Completed jobs</option>
                <option value="approved_past">
                  Approved jobs with date in the past
                </option>
              </select>
            </Field>

            <Field label="Send mode">
              <select
                className="input"
                value={sendMode}
                onChange={e => setSendMode(e.target.value)}
                disabled={!autoEnabled}
              >
                <option value="draft">Create draft for review</option>
                <option value="auto">Generate and send automatically</option>
              </select>
            </Field>

            <Field label="Default payment terms (days)">
              <input
                className="input"
                type="number"
                min="0"
                value={defaultTerms}
                onChange={e => setDefaultTerms(e.target.value)}
              />
            </Field>

            <Field label="Bank details (shown on invoices)">
              <textarea
                className="input"
                rows={3}
                placeholder="Account name, sort code, account number"
                value={bankDetails}
                onChange={e => setBankDetails(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn-primary text-sm"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save finance settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PricingSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newServiceName, setNewServiceName] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const svc = await listServices();
        setServices(svc);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAdd() {
    if (!newServiceName.trim()) return;
    try {
      const created = await addService({ name: newServiceName });
      setServices([...services, created]);
      setNewServiceName('');
    } catch (error) {
      console.error('Failed to add service:', error);
    }
  }

  async function handleUpdate(id, patch) {
    try {
      const updated = await updateService(id, patch);
      setServices(services.map(s => (s.id === id ? updated : s)));
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteService(id);
      setServices(services.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Loading services…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold">Services</h2>
        <p className="text-xs text-slate-600">
          Configure prices, durations, visibility, and staff rules.
        </p>
      </header>

      {/* Add Service */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="New service name"
          value={newServiceName}
          onChange={e => setNewServiceName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          Add
        </button>
      </div>

      {/* Service List */}
      {services.length === 0 ? (
        <div className="border border-slate-200 rounded p-4 text-center text-sm text-slate-500">
          No services yet. Add your first service above.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map(service => (
            <div
              key={service.id}
              className="border border-slate-200 rounded p-4 space-y-3"
            >
              <div className="flex justify-between items-start gap-3">
                <input
                  className="input text-sm font-medium flex-1"
                  value={service.name}
                  onChange={e =>
                    handleUpdate(service.id, { name: e.target.value })
                  }
                />
                <button
                  className="text-red-600 text-xs hover:text-red-700"
                  onClick={() => handleDelete(service.id)}
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Price (£)">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={service.price || 0}
                    onChange={e =>
                      handleUpdate(service.id, { price: Number(e.target.value) })
                    }
                  />
                </Field>

                <Field label="Duration (mins)">
                  <input
                    className="input"
                    type="number"
                    min="5"
                    value={service.durationMins || 30}
                    onChange={e =>
                      handleUpdate(service.id, {
                        durationMins: Number(e.target.value)
                      })
                    }
                  />
                </Field>

                <Field label="Extra dog fee (£)">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={service.extraDogFee || 0}
                    onChange={e =>
                      handleUpdate(service.id, {
                        extraDogFee: Number(e.target.value)
                      })
                    }
                  />
                </Field>

                <Field label="Weekend fee (£)">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={service.weekendFee || 0}
                    onChange={e =>
                      handleUpdate(service.id, {
                        weekendFee: Number(e.target.value)
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Visibility to clients">
                <select
                  className="input"
                  value={service.visibleToClients ? 'yes' : 'no'}
                  onChange={e =>
                    handleUpdate(service.id, {
                      visibleToClients: e.target.value === 'yes'
                    })
                  }
                >
                  <option value="yes">Visible</option>
                  <option value="no">Hidden</option>
                </select>
              </Field>

              <Field label="Staff assignment rule">
                <select
                  className="input"
                  value={service.staffRule || 'any'}
                  onChange={e =>
                    handleUpdate(service.id, { staffRule: e.target.value })
                  }
                >
                  <option value="any">Any staff</option>
                  <option value="seniorOnly">Senior staff only</option>
                  <option value="specific">Assign to specific</option>
                </select>
              </Field>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffPermissionsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const settings = await fetchBusinessSettings();
        setRoles(settings.permissions.roleDefinitions || {});
      } catch (e) {
        console.error('Failed to load permissions:', e);
        setError('Could not load permissions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleToggle(role, key) {
    const updated = {
      ...roles,
      [role]: {
        ...roles[role],
        [key]: !roles[role][key]
      }
    };
    setRoles(updated);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const currentSettings = await fetchBusinessSettings();
      await saveBusinessSettings({
        permissions: {
          ...currentSettings.permissions,
          roleDefinitions: roles
        }
      });
    } catch (e) {
      console.error('Failed to save permissions:', e);
      setError('Could not save permissions');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Loading permissions…</p>;

  const permissionList = [
    ['canSeeFinance', 'View business finances'],
    ['canEditBusinessSettings', 'Edit business settings'],
    ['canViewClients', 'View clients'],
    ['canViewClientAddresses', 'View client addresses'],
    ['canViewInvoices', 'View invoices'],
    ['canApproveJobs', 'Approve jobs'],
    ['canAssignJobs', 'Assign staff to bookings']
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold">Staff Permissions</h2>
        <p className="text-xs text-slate-600">
          Control what staff users can see and do.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Role matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 font-semibold">Permission</th>
              <th className="text-center py-2 px-3 font-semibold">Admin</th>
              <th className="text-center py-2 px-3 font-semibold">Staff</th>
            </tr>
          </thead>
          <tbody>
            {permissionList.map(([key, label]) => (
              <tr key={key} className="border-b border-slate-100">
                <td className="py-3 pr-4">{label}</td>
                {['admin', 'staff'].map(role => (
                  <td key={role} className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                      checked={roles[role]?.[key] || false}
                      onChange={() => handleToggle(role, key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          className="btn btn-primary text-sm"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save permissions'}
        </button>
      </div>
    </div>
  );
}

function AutomationSection() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAutomationSettings();
        setSettings(data);
      } catch (e) {
        console.error('Failed to load automation settings:', e);
        setError('Could not load automation settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(key, value) {
    setSettings({ ...settings, [key]: value });
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      await saveAutomationSettings(settings);
    } catch (e) {
      console.error('Failed to save automation settings:', e);
      setError('Could not save automation settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Loading automation settings…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold">Automation rules</h2>
        <p className="text-xs text-slate-600">
          Configure automatic reminders, notifications, and workflows.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Booking reminders */}
      <ToggleRow
        title="Booking reminder emails"
        enabled={settings.bookingReminderEnabled}
        onToggle={v => update('bookingReminderEnabled', v)}
      />
      {settings.bookingReminderEnabled && (
        <Field label="Hours before booking">
          <input
            className="input"
            type="number"
            min="1"
            value={settings.bookingReminderHoursBefore || 24}
            onChange={e =>
              update('bookingReminderHoursBefore', Number(e.target.value))
            }
          />
        </Field>
      )}

      {/* Invoice reminders */}
      <ToggleRow
        title="Invoice overdue reminders"
        enabled={settings.invoiceReminderEnabled}
        onToggle={v => update('invoiceReminderEnabled', v)}
      />
      {settings.invoiceReminderEnabled && (
        <Field label="Days overdue">
          <input
            className="input"
            type="number"
            min="1"
            value={settings.invoiceReminderDaysOverdue || 3}
            onChange={e =>
              update('invoiceReminderDaysOverdue', Number(e.target.value))
            }
          />
        </Field>
      )}

      {/* Daily summary */}
      <ToggleRow
        title="Daily summary email"
        enabled={settings.dailySummaryEnabled}
        onToggle={v => update('dailySummaryEnabled', v)}
      />
      {settings.dailySummaryEnabled && (
        <Field label="Send at (HH:MM)">
          <TimePicker
            value={settings.dailySummaryTime || '18:00'}
            onChange={v => update('dailySummaryTime', v)}
            placeholder="Select time"
          />
        </Field>
      )}

      {/* Auto complete */}
      <ToggleRow
        title="Auto-mark jobs completed"
        enabled={settings.autoCompleteEnabled}
        onToggle={v => update('autoCompleteEnabled', v)}
      />
      {settings.autoCompleteEnabled && (
        <Field label="Hours after end time">
          <input
            className="input"
            type="number"
            min="1"
            value={settings.autoCompleteAfterHours || 2}
            onChange={e =>
              update('autoCompleteAfterHours', Number(e.target.value))
            }
          />
        </Field>
      )}

      {/* Conflict alerts */}
      <ToggleRow
        title="Staff conflict alerts"
        enabled={settings.conflictAlertsEnabled}
        onToggle={v => update('conflictAlertsEnabled', v)}
      />

      {/* Weekly snapshot */}
      <ToggleRow
        title="Weekly revenue snapshot"
        enabled={settings.weeklySnapshotEnabled}
        onToggle={v => update('weeklySnapshotEnabled', v)}
      />
      {settings.weeklySnapshotEnabled && (
        <Field label="Day of week">
          <select
            className="input"
            value={settings.weeklySnapshotDay || 'mon'}
            onChange={e => update('weeklySnapshotDay', e.target.value)}
          >
            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
              <option value={d} key={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex justify-end">
        <button
          className="btn btn-primary text-sm"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save automation settings'}
        </button>
      </div>
    </div>
  );
}

/* Toggle helper component */
function ToggleRow({ title, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
      <span className="text-sm">{title}</span>
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-slate-300"
        checked={enabled || false}
        onChange={e => onToggle(e.target.checked)}
      />
    </div>
  );
}

/* Payments Section - Stripe Connect Onboarding */
function PaymentsSection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStripeStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_return') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      loadStripeStatus();
    }
  }, []);

  async function loadStripeStatus() {
    try {
      setError(null);
      const response = await fetch('/stripe/connect/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load Stripe status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load Stripe status:', err);
      setError(err.message || 'Failed to load Stripe connection status');
    } finally {
      setLoading(false);
    }
  }

  async function startOnboarding() {
    try {
      setOnboarding(true);
      setError(null);
      
      const response = await fetch('/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start onboarding');
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (err) {
      console.error('Failed to start onboarding:', err);
      setError(err.message || 'Failed to start Stripe onboarding');
      setOnboarding(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-sm font-semibold">Online payments</h2>
          <p className="text-xs text-slate-600">
            Accept invoice payments online with Stripe
          </p>
        </header>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold">Online payments</h2>
        <p className="text-xs text-slate-600">
          Accept invoice payments online with Stripe
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium">Stripe account</h3>
            <p className="text-xs text-slate-600 mt-1">
              {status?.onboardingComplete
                ? 'Your Stripe account is connected and active'
                : status?.connected
                ? 'Onboarding in progress - complete your Stripe setup'
                : 'Not connected'}
            </p>
          </div>
          <div className="flex gap-2">
            {status?.onboardingComplete ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <>
                <button
                  onClick={loadStripeStatus}
                  disabled={loading}
                  className="btn btn-secondary text-sm"
                  title="Refresh connection status"
                >
                  {loading ? 'Checking...' : 'Refresh'}
                </button>
                <button
                  onClick={startOnboarding}
                  disabled={onboarding}
                  className="btn btn-primary text-sm"
                >
                  {onboarding ? 'Redirecting...' : status?.connected ? 'Continue setup' : 'Connect Stripe'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Capabilities Status */}
        {status?.connected && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-medium text-slate-700">Account capabilities:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                {status.chargesEnabled ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={status.chargesEnabled ? 'text-slate-700' : 'text-slate-500'}>
                  Accept payments
                </span>
              </div>
              <div className="flex items-center gap-2">
                {status.payoutsEnabled ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={status.payoutsEnabled ? 'text-slate-700' : 'text-slate-500'}>
                  Receive payouts
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fee Information */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">About processing fees</p>
            <p className="text-xs text-blue-800">
              Online payments are processed securely through Stripe. Stripe charges their standard processing fees directly to your connected account. Pawtimation does not add any extra fees.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      {!status?.onboardingComplete && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">How it works</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">1</span>
              <p>Connect your Stripe account using the button above</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">2</span>
              <p>Complete the onboarding process with Stripe (banking details, verification)</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">3</span>
              <p>Generate payment links for invoices and share them with your clients</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">4</span>
              <p>Funds are deposited directly into your bank account</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small helper for consistent label + children layout */
function Field({ label, children }) {
  return (
    <label className="text-sm font-semibold text-slate-900 space-y-2 block">
      <div>{label}</div>
      {children}
    </label>
  );
}
