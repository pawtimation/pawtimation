import React, { useState, useEffect } from 'react';
import { clientApi } from '../lib/auth';

export function ClientDogFormModal({ open, onClose, clientId, dog }) {
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
  const [saving, setSaving] = useState(false);
  const [currentDog, setCurrentDog] = useState(null);

  useEffect(() => {
    if (dog) {
      setCurrentDog(dog);
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
    } else {
      // Reset form for new dog
      setCurrentDog(null);
      setForm({
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
      setDogPhotoUrl(null);
    }
  }, [dog, open]);

  async function loadDogPhoto(dogId) {
    try {
      const response = await clientApi(`/media/dog/${dogId}`);
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
    const activeDog = currentDog || dog;
    if (!activeDog?.id) {
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

      const response = await clientApi(`/media/upload/dog/${activeDog.id}`, {
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

  function handleClose() {
    // If a dog was created during this session, trigger refresh
    const shouldRefresh = Boolean(currentDog?.id || dog?.id);
    onClose(shouldRefresh);
  }

  async function save() {
    setSaving(true);
    try {
      const data = {
        ...form,
        clientId
      };

      const activeDog = currentDog || dog;
      if (activeDog?.id) {
        // Update existing dog - use PATCH method with correct endpoint
        const response = await clientApi(`/dogs/${activeDog.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update dog');
        }

        // For updates, close and refresh
        onClose(true);
      } else {
        // Create new dog
        const response = await clientApi('/dogs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create dog');
        }

        // Get the created dog data with ID
        const created = await response.json();
        const createdDog = created?.dog || created;
        
        // Keep modal open and enable photo upload
        if (createdDog && createdDog.id) {
          setCurrentDog(createdDog);
          loadDogPhoto(createdDog.id);
          alert(`${form.name} has been added! You can now upload a photo.`);
        } else {
          onClose(true);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save dog. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {dog ? 'Edit Dog' : 'Add Dog'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Dog Photo Upload */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center">
                {dogPhotoUrl ? (
                  <img 
                    src={dogPhotoUrl} 
                    alt={form.name || 'Dog'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                disabled={uploadingPhoto || !(currentDog?.id || dog?.id)}
              />
              <label
                htmlFor="dog-photo-upload"
                className={`inline-block px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors ${
                  !(currentDog?.id || dog?.id) || uploadingPhoto 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-teal-700 cursor-pointer'
                }`}
              >
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </label>
              {!(currentDog?.id || dog?.id) ? (
                <p className="text-xs text-amber-600 mt-1 font-medium">Save the dog first to upload a photo</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">JPG, PNG or WEBP (max 10MB)</p>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={form.name} onChange={v => updateField('name', v)} placeholder="e.g. Max" />
            <Input label="Breed" value={form.breed} onChange={v => updateField('breed', v)} placeholder="e.g. Golden Retriever" />
            <Input label="Age" value={form.age} onChange={v => updateField('age', v)} placeholder="e.g. 3" type="number" />
            <Input label="Sex" value={form.sex} onChange={v => updateField('sex', v)} placeholder="e.g. Male" />
            <Input label="Colour" value={form.colour} onChange={v => updateField('colour', v)} placeholder="e.g. Golden" className="sm:col-span-2" />
          </div>

          {/* Detailed Info */}
          <Textarea label="Behaviour notes" value={form.behaviourNotes} onChange={v => updateField('behaviourNotes', v)} placeholder="Any behavioral notes..." />
          <Textarea label="Medical notes" value={form.medicalNotes} onChange={v => updateField('medicalNotes', v)} placeholder="Any medical conditions..." />
          <Textarea label="Feeding instructions" value={form.feeding} onChange={v => updateField('feeding', v)} placeholder="Feeding schedule and preferences..." />
          <Textarea label="Walking instructions" value={form.walking} onChange={v => updateField('walking', v)} placeholder="Walking preferences and requirements..." />
          <Textarea label="Known triggers" value={form.triggers} onChange={v => updateField('triggers', v)} placeholder="Things that might upset or excite your dog..." />
          <Textarea label="Vet details" value={form.vet} onChange={v => updateField('vet', v)} placeholder="Veterinarian name and contact..." />
          <Textarea label="Medication" value={form.medication} onChange={v => updateField('medication', v)} placeholder="Current medications and dosages..." />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 sm:p-6 flex gap-3">
          <button
            type="button"
            className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-sm font-semibold text-slate-900 mb-2">{label}</div>
      <input
        type={type}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-900 mb-2">{label}</div>
      <textarea
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors resize-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    </label>
  );
}
