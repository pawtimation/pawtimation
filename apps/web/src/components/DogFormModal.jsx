import React, { useState, useEffect } from 'react';
import { repo } from '../../../api/src/repo.js';

export function DogFormModal({ open, onClose, clientId, dog }) {
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    sex: '',
    colour: '',
    behaviourNotes: '',
    medicalNotes: '',
    feeding: '',
    walking: '',
    triggers: '',
    vet: '',
    medication: ''
  });

  useEffect(() => {
    if (dog) {
      setForm({
        name: dog.name || '',
        breed: dog.breed || '',
        age: dog.age || '',
        sex: dog.sex || '',
        colour: dog.colour || '',
        behaviourNotes: dog.behaviourNotes || '',
        medicalNotes: dog.medicalNotes || '',
        feeding: dog.feeding || '',
        walking: dog.walking || '',
        triggers: dog.triggers || '',
        vet: dog.vet || '',
        medication: dog.medication || ''
      });
    }
  }, [dog]);

  if (!open) return null;

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    const data = {
      ...form,
      clientId
    };

    if (dog?.id) {
      await repo.updateDog?.(dog.id, data);
    } else {
      await repo.createDog?.(data);
    }

    onClose(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">
          {dog ? 'Edit Dog' : 'Add Dog'}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" value={form.name} onChange={v => updateField('name', v)} />
          <Input label="Breed" value={form.breed} onChange={v => updateField('breed', v)} />
          <Input label="Age" value={form.age} onChange={v => updateField('age', v)} />
          <Input label="Sex" value={form.sex} onChange={v => updateField('sex', v)} />
          <Input label="Colour" value={form.colour} onChange={v => updateField('colour', v)} />
        </div>

        <Textarea label="Behaviour notes" value={form.behaviourNotes} onChange={v => updateField('behaviourNotes', v)} />
        <Textarea label="Medical notes" value={form.medicalNotes} onChange={v => updateField('medicalNotes', v)} />
        <Textarea label="Feeding instructions" value={form.feeding} onChange={v => updateField('feeding', v)} />
        <Textarea label="Walking instructions" value={form.walking} onChange={v => updateField('walking', v)} />
        <Textarea label="Known triggers" value={form.triggers} onChange={v => updateField('triggers', v)} />
        <Textarea label="Vet details" value={form.vet} onChange={v => updateField('vet', v)} />
        <Textarea label="Medication" value={form.medication} onChange={v => updateField('medication', v)} />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => onClose(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="text-sm text-slate-700 space-y-1">
      <div className="font-medium">{label}</div>
      <input
        className="border rounded px-2 py-1 text-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="text-sm text-slate-700 space-y-1 block">
      <div className="font-medium">{label}</div>
      <textarea
        className="border rounded px-2 py-1 text-sm w-full h-20"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
