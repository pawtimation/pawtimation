import React, { useState, useEffect } from 'react';
import { fetchBusinessSettings, saveBusinessSettings } from '../lib/businessApi';

const SECTIONS = [
  { id: 'profile', label: 'Business profile' },
  { id: 'hours', label: 'Working hours' },
  { id: 'policies', label: 'Policies' },
  { id: 'branding', label: 'Branding' },
  { id: 'finance', label: 'Finance settings' },
  { id: 'pricing', label: 'Service pricing' },
  { id: 'permissions', label: 'Staff permissions' },
  { id: 'automation', label: 'Automation rules' }
];

export function AdminSettings() {
  const [active, setActive] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await fetchBusinessSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(section, data) {
    setSaveStatus('saving');
    try {
      const updated = await saveBusinessSettings({ [section]: data });
      setSettings(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
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
        <p className="text-sm text-red-600">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* LEFT MINI-SIDEBAR */}
      <aside className="w-56 shrink-0">
        <h1 className="text-lg font-semibold mb-3">Settings</h1>
        <p className="text-xs text-slate-600 mb-4">
          Manage your business details, hours, policies, branding and automation.
        </p>
        <nav className="space-y-1 text-sm">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={
                'w-full text-left px-3 py-2 rounded ' +
                (active === section.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100')
              }
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* RIGHT CONTENT PANE */}
      <section className="flex-1">
        {saveStatus && (
          <div className={`mb-4 p-3 rounded text-sm ${
            saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-700' :
            saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
            'bg-red-50 text-red-700'
          }`}>
            {saveStatus === 'saved' && 'Settings saved successfully'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'error' && 'Failed to save settings'}
          </div>
        )}

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
          <FinanceSection 
            data={settings.finance} 
            onSave={(data) => handleSave('finance', data)}
          />
        )}
        {active === 'pricing' && <PricingSection />}
        {active === 'permissions' && <PermissionsSection />}
        {active === 'automation' && <AutomationSection />}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Business details</h2>
        <p className="text-xs text-slate-600">
          These details are used on client-facing pages and invoices.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
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

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Address line 1">
          <input 
            className="input" 
            value={formData.addressLine1}
            onChange={(e) => handleChange('addressLine1', e.target.value)}
            placeholder="Street address" 
          />
        </Field>
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

      <div className="flex justify-end">
        <button className="btn btn-primary text-sm" type="submit">
          Save business details
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
                    <input
                      type="time"
                      className="border rounded px-2 py-1 text-xs"
                      value={dayData.start}
                      onChange={(e) => handleChange(key, 'start', e.target.value)}
                    />
                    <span className="text-xs text-slate-500">to</span>
                    <input
                      type="time"
                      className="border rounded px-2 py-1 text-xs"
                      value={dayData.end}
                      onChange={(e) => handleChange(key, 'end', e.target.value)}
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
        <h2 className="text-sm font-semibold">Branding</h2>
        <p className="text-xs text-slate-600">
          Control how your client-facing pages look.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Primary colour (hex)">
          <input 
            className="input" 
            value={formData.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            placeholder="#00a58a"
          />
        </Field>
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

function FinanceSection({ data, onSave }) {
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
        <h2 className="text-sm font-semibold">Finance settings</h2>
        <p className="text-xs text-slate-600">
          Configure how invoices are generated, sent and paid.
        </p>
      </header>

      <div className="space-y-3 text-sm">
        <Field label="Auto-invoicing">
          <select 
            className="input"
            value={formData.autoInvoicingFrequency}
            onChange={(e) => handleChange('autoInvoicingFrequency', e.target.value)}
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
            value={formData.autoInvoicingTrigger}
            onChange={(e) => handleChange('autoInvoicingTrigger', e.target.value)}
          >
            <option value="completed">Completed jobs</option>
            <option value="approved_past">Approved jobs with date in the past</option>
          </select>
        </Field>

        <Field label="Send mode">
          <select 
            className="input"
            value={formData.sendMode}
            onChange={(e) => handleChange('sendMode', e.target.value)}
          >
            <option value="draft">Create draft for review</option>
            <option value="auto_send">Generate and send automatically</option>
          </select>
        </Field>

        <Field label="Default payment terms (days)">
          <input 
            className="input" 
            type="number" 
            min="0" 
            value={formData.defaultPaymentTermsDays}
            onChange={(e) => handleChange('defaultPaymentTermsDays', Number(e.target.value))}
            placeholder="14" 
          />
        </Field>

        <Field label="Bank details (shown on invoices)">
          <textarea
            className="input"
            rows={3}
            value={formData.bankDetails}
            onChange={(e) => handleChange('bankDetails', e.target.value)}
            placeholder="Account name, sort code, account number"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary text-sm" type="submit">
          Save finance settings
        </button>
      </div>
    </form>
  );
}

function PricingSection() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Service pricing</h2>
        <p className="text-xs text-slate-600">
          Define the services you offer and how much they cost.
        </p>
      </header>

      <div className="border rounded-md p-3 text-xs text-slate-500">
        This section will list your services (walks, boarding, grooming, visits) with
        duration and price per service. We will wire this into booking and invoicing next.
      </div>
    </div>
  );
}

function PermissionsSection() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Staff permissions</h2>
        <p className="text-xs text-slate-600">
          Control what staff can see and do in the system.
        </p>
      </header>

      <div className="border rounded-md p-3 text-slate-500 text-xs">
        This section will let you define which staff can view client details, approve
        bookings, see invoices and adjust settings.
      </div>
    </div>
  );
}

function AutomationSection() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold">Automation rules</h2>
        <p className="text-xs text-slate-600">
          Configure reminders and automated actions such as invoice reminders or daily
          summaries.
        </p>
      </header>

      <div className="border rounded-md p-3 text-xs text-slate-500">
        This section will later support automated reminders, daily reports and other
        time-saving rules. For now it is a placeholder.
      </div>
    </div>
  );
}

/* Small helper for consistent label + children layout */
function Field({ label, children }) {
  return (
    <label className="text-xs text-slate-700 space-y-1 block">
      <div>{label}</div>
      {children}
    </label>
  );
}
