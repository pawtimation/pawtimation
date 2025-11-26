import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// REMOVED: import { repo } from '../../../api/src/repo.js';
import * as clientsApi from '../lib/clientsApi';
import * as dogsApi from '../lib/dogsApi';

const STEPS = [
  'Your details',
  'Address and access',
  'Emergency contact',
  'Your dogs',
  'Dog behaviour and vet',
  'Review and complete'
];

export function ClientOnboarding() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }
      const { clientId } = JSON.parse(raw);

      const [c, clientDogs] = await Promise.all([
        clientsApi.getClient(clientId),
        dogsApi.listDogsByClient(clientId)
      ]);

      if (!c) {
        localStorage.removeItem('pt_client');
        navigate('/client/login');
        return;
      }

      setClient(c);
      setDogs(clientDogs);
      setStep(c.onboardingStep || 1);
      setLoading(false);
    })();
  }, [navigate]);

  async function handleSaveStep(patch, nextStep) {
    if (!client) return;
    setSaving(true);
    try {
      const updated = await clientsApi.updateClient(client.id, {
        ...patch,
        onboardingStep: nextStep
      });
      setClient(updated);
      setStep(nextStep);
      setSaving(false);
    } catch (err) {
      console.error('Error saving step:', err);
      setSaving(false);
      alert('Could not save. Please try again.');
    }
  }

  async function handleComplete() {
    if (!client) return;
    setSaving(true);
    try {
      const updated = await clientsApi.markClientProfileComplete(client.id);
      setClient(updated);
      setSaving(false);
      navigate('/client/home');
    } catch (err) {
      console.error('Error completing profile:', err);
      setSaving(false);
      alert('Could not complete setup. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <p className="text-sm text-slate-600">Loading your details…</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Set up your account</h1>
        <p className="text-sm text-slate-600">
          A few steps so your pet-care team has everything they need to look after your dog safely.
        </p>
      </div>

      <Progress steps={STEPS} current={step} />

      <div className="card space-y-4">
        {step === 1 && (
          <StepDetails client={client} onSave={handleSaveStep} saving={saving} />
        )}
        {step === 2 && (
          <StepAddress client={client} onSave={handleSaveStep} saving={saving} />
        )}
        {step === 3 && (
          <StepEmergency client={client} onSave={handleSaveStep} saving={saving} />
        )}
        {step === 4 && (
          <StepDogs client={client} dogs={dogs} setDogs={setDogs} saving={saving} onSave={handleSaveStep} />
        )}
        {step === 5 && (
          <StepDogBehaviour client={client} saving={saving} onSave={handleSaveStep} />
        )}
        {step === 6 && (
          <StepReview client={client} dogs={dogs} onComplete={handleComplete} saving={saving} />
        )}
      </div>
    </div>
  );
}

function Progress({ steps, current }) {
  return (
    <ol className="grid grid-cols-3 gap-2 text-xs text-slate-600 md:grid-cols-6">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === current;
        const done = stepNumber < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={
                'inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ' +
                (done
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : active
                  ? 'bg-teal-100 border-teal-600 text-teal-700'
                  : 'bg-white border-slate-300 text-slate-500')
              }
            >
              {stepNumber}
            </span>
            <span className={active ? 'font-medium' : ''}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function StepDetails({ client, onSave, saving }) {
  const [name, setName] = useState(client.name || '');
  const [email, setEmail] = useState(client.email || '');
  const [phone, setPhone] = useState(client.phone || '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(
      { name, email, phone },
      2
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold">Your details</h2>
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Full name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Mobile number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

function StepAddress({ client, onSave, saving }) {
  const [address, setAddress] = useState(client.address || '');
  const [access, setAccess] = useState(client.accessNotes || '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(
      { address, accessNotes: access },
      3
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold">Address and access</h2>
      <textarea
        className="border rounded px-3 py-2 text-sm w-full"
        rows={3}
        placeholder="Home address"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2 text-sm w-full"
        rows={3}
        placeholder="Access instructions, keys, alarms, parking"
        value={access}
        onChange={e => setAccess(e.target.value)}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onSave({}, 1)}
          disabled={saving}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

function StepEmergency({ client, onSave, saving }) {
  const [contactName, setContactName] = useState(client.emergencyName || '');
  const [contactPhone, setContactPhone] = useState(client.emergencyPhone || '');
  const [vet, setVet] = useState(client.vetDetails || '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(
      {
        emergencyName: contactName,
        emergencyPhone: contactPhone,
        vetDetails: vet
      },
      4
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold">Emergency contact</h2>
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Emergency contact name"
        value={contactName}
        onChange={e => setContactName(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Emergency contact phone"
        value={contactPhone}
        onChange={e => setContactPhone(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2 text-sm w-full"
        rows={3}
        placeholder="Vet practice and any important notes"
        value={vet}
        onChange={e => setVet(e.target.value)}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onSave({}, 2)}
          disabled={saving}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

function StepDogs({ client, dogs, setDogs, onSave, saving }) {
  const [name, setName] = useState(dogs[0]?.name || '');
  const [breed, setBreed] = useState(dogs[0]?.breed || '');

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Create or update the dog in the repository
    let dog;
    if (dogs[0]?.id && !dogs[0].id.startsWith('local_')) {
      // Update existing dog
      dog = dogs[0];
      dog.name = name;
      dog.breed = breed;
    } else {
      // Create new dog
      dog = await dogsApi.createDog({
        clientId: client.id,
        name,
        breed
      });
    }
    
    setDogs([dog]);
    await onSave({}, 5);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold">Your dogs</h2>
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Dog name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        placeholder="Breed"
        value={breed}
        onChange={e => setBreed(e.target.value)}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onSave({}, 3)}
          disabled={saving}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

function StepDogBehaviour({ client, onSave, saving }) {
  const [behaviour, setBehaviour] = useState(client.behaviourNotes || '');
  const [medical, setMedical] = useState(client.medicalNotes || '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(
      {
        behaviourNotes: behaviour,
        medicalNotes: medical
      },
      6
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold">Dog behaviour and vet</h2>
      <textarea
        className="border rounded px-3 py-2 text-sm w-full"
        rows={3}
        placeholder="Behaviour, reactivity, recall, other things we should know"
        value={behaviour}
        onChange={e => setBehaviour(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2 text-sm w-full"
        rows={3}
        placeholder="Medical conditions, medication, allergies"
        value={medical}
        onChange={e => setMedical(e.target.value)}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onSave({}, 4)}
          disabled={saving}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

function StepReview({ client, dogs, onComplete, saving }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Review and complete</h2>
      <p className="text-sm text-slate-600">
        Please check that your details look correct. You can update them at any time from your profile.
      </p>
      <div className="border rounded px-3 py-2 text-xs text-slate-600 space-y-1">
        <div><span className="font-semibold">Name:</span> {client.name}</div>
        <div><span className="font-semibold">Email:</span> {client.email}</div>
        <div><span className="font-semibold">Phone:</span> {client.phone}</div>
        <div><span className="font-semibold">Address:</span> {client.address}</div>
      </div>
      <div className="border rounded px-3 py-2 text-xs text-slate-600 space-y-1">
        <div><span className="font-semibold">Dog:</span> {dogs[0]?.name || 'Not set'}</div>
        <div><span className="font-semibold">Behaviour notes:</span> {client.behaviourNotes || 'Not set'}</div>
        <div><span className="font-semibold">Medical notes:</span> {client.medicalNotes || 'Not set'}</div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onComplete}
          className="btn btn-primary text-sm"
          disabled={saving}
        >
          Finish setup
        </button>
      </div>
    </div>
  );
}
