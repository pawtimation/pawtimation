import React from 'react';

export function DogCard({ dog, onEdit, photoUrl }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={dog.name || 'Dog'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-7 h-7 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{dog.name || 'Dog'}</h3>
              <p className="text-sm text-slate-600">
                {dog.breed || 'Breed not specified'}
                {dog.age && ` - ${dog.age} ${dog.age == 1 ? 'year' : 'years'} old`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(dog)}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {(dog.sex || dog.colour) && (
        <div className="flex gap-4 mb-3 pl-[72px]">
          {dog.sex && (
            <div className="text-sm">
              <span className="text-slate-500">Sex:</span> <span className="text-slate-700">{dog.sex}</span>
            </div>
          )}
          {dog.colour && (
            <div className="text-sm">
              <span className="text-slate-500">Colour:</span> <span className="text-slate-700">{dog.colour}</span>
            </div>
          )}
        </div>
      )}

      {(dog.behaviourNotes || dog.medicalNotes) && (
        <div className="space-y-2 pt-3 border-t border-slate-100 pl-[72px]">
          {dog.behaviourNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Behaviour</p>
              <p className="text-sm text-slate-700">{dog.behaviourNotes}</p>
            </div>
          )}
          {dog.medicalNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Medical</p>
              <p className="text-sm text-slate-700">{dog.medicalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
