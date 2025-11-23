import React, { useState, useEffect } from 'react';
import * as dogsApi from '../lib/dogsApi';
import { adminApi } from '../lib/auth';

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

  const [dogPhotoUrl, setDogPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
      
      // Load dog photo
      loadDogPhoto(dog.id);
    }
  }, [dog]);

  async function loadDogPhoto(dogId) {
    try {
      const response = await adminApi(`/media/dog/${dogId}`);
      if (response.ok) {
        const photos = await response.json();
        if (photos && photos.length > 0) {
          setDogPhotoUrl(photos[0].downloadUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load dog photo:', err);
    }
  }

  async function handlePhotoUpload(event) {
    if (!dog?.id) {
      alert('Please save the dog first before uploading a photo');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await adminApi(`/media/upload/dog/${dog.id}`, {
        method: 'POST',
        body: formData,
        headers: {}
      });

      if (response.ok) {
        const result = await response.json();
        setDogPhotoUrl(result.downloadUrl);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('An error occurred while uploading');
    } finally {
      setUploadingPhoto(false);
    }
  }

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
      await dogsApi.updateDog(dog.id, data);
    } else {
      await dogsApi.createDog(data);
    }

    onClose(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">
          {dog ? 'Edit Dog' : 'Add Dog'}
        </h2>

        {/* Dog Photo Upload - Show for both add and edit */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center">
              {dogPhotoUrl ? (
                <img 
                  src={dogPhotoUrl} 
                  alt={form.name || 'Dog'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 4H6C4.34 4 3 5.34 3 7v10c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3zm-9 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                </svg>
              )}
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="dog-photo-upload"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto || !dog?.id}
            />
            <label
              htmlFor="dog-photo-upload"
              className={`inline-block px-4 py-2 bg-teal-600 text-white rounded text-sm font-medium transition-colors ${
                !dog?.id || uploadingPhoto 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-teal-700 cursor-pointer'
              }`}
            >
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </label>
            {!dog?.id ? (
              <p className="text-xs text-amber-600 mt-1 font-medium">Save the dog first to upload a photo</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">JPG, PNG or WEBP (max 10MB)</p>
            )}
          </div>
        </div>

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
