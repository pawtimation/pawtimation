import React from 'react';
import { DatePicker } from './DatePicker';
import { PremiumTimePicker } from './PremiumTimePicker';

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

export function WeeklyAvailabilitySection({
  availability,
  exceptionDays,
  newExceptionDate,
  newExceptionReason,
  onUpdateDay,
  onToggleDayOff,
  onSetNewExceptionDate,
  onSetNewExceptionReason,
  onAddExceptionDay,
  onRemoveExceptionDay,
  onSave,
  saving = false
}) {
  const timeSlots = generateTimeSlots(6, 22, 15);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {DAYS_OF_WEEK.filter(d => availability[d]?.start && availability[d]?.end).length} days active
          </span>
        </div>
        
        <div className="grid gap-3">
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
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={() => onToggleDayOff(day)}
                        className="w-5 h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer transition-all"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                        {day}
                      </span>
                      {isAvailable && dayAvail.start && dayAvail.end && (
                        <span className="ml-2 text-xs text-teal-700 font-medium">
                          {dayAvail.start} - {dayAvail.end}
                        </span>
                      )}
                    </div>
                  </label>
                  {!isAvailable && (
                    <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Day off
                    </span>
                  )}
                </div>

                {isAvailable && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Start Time
                      </label>
                      <PremiumTimePicker
                        value={dayAvail.start}
                        onChange={(value) => onUpdateDay(day, 'start', value)}
                        placeholder="Select time"
                        availableTimes={timeSlots}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        End Time
                      </label>
                      <PremiumTimePicker
                        value={dayAvail.end}
                        onChange={(value) => onUpdateDay(day, 'end', value)}
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Exception Days</h2>
          <p className="text-sm text-slate-600 mt-1">
            Add specific dates when you're unavailable (holidays, sick days, etc.)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <DatePicker
              value={newExceptionDate}
              onChange={onSetNewExceptionDate}
              preventPastDates={true}
              placeholder="Select date"
            />
          </div>
          <input
            type="text"
            value={newExceptionReason}
            onChange={(e) => onSetNewExceptionReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:border-teal-300"
          />
          <button
            onClick={onAddExceptionDay}
            disabled={!newExceptionDate}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Add Exception
          </button>
        </div>

        {exceptionDays.length > 0 ? (
          <div className="space-y-2">
            {exceptionDays
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(exception => (
                <div
                  key={exception.id}
                  className="flex items-center justify-between p-3 border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl hover:border-rose-300 transition-all"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(exception.date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    {exception.reason && (
                      <p className="text-xs text-slate-600 mt-0.5">{exception.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveExceptionDay(exception.id)}
                    className="text-rose-600 hover:text-rose-800 p-2 hover:bg-rose-100 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border-2 border-slate-100">
            No exception days added yet
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full px-6 py-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl text-lg font-bold hover:from-teal-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 active:scale-95 transition-all shadow-lg"
          style={{ minHeight: '64px' }}
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
}
