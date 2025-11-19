import React from 'react';

export function DogCard({ dog, onEdit }) {
  return (
    <div className="card space-y-1 text-sm text-slate-700">
      <div className="flex justify-between">
        <div className="font-semibold">{dog.name || 'Dog'}</div>
        <button
          type="button"
          className="text-xs text-teal-700 hover:underline"
          onClick={() => onEdit(dog)}
        >
          Edit
        </button>
      </div>

      <div><span className="font-medium">Breed:</span> {dog.breed || '—'}</div>
      <div><span className="font-medium">Age:</span> {dog.age || '—'}</div>
      <div><span className="font-medium">Sex:</span> {dog.sex || '—'}</div>
      <div><span className="font-medium">Colour:</span> {dog.colour || '—'}</div>

      <div><span className="font-medium">Behaviour:</span> {dog.behaviourNotes || '—'}</div>
      <div><span className="font-medium">Medical:</span> {dog.medicalNotes || '—'}</div>
    </div>
  );
}
