import React from 'react';

export function FriendJobPosted({ pet, startDate, endDate, rate, onDone }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="inline-block p-3 bg-emerald-100 rounded-full mb-3">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="font-semibold text-xl mb-2">Job Posted to Your Friends</h3>
        <p className="text-slate-600 text-sm">
          Your trusted friends will be notified about this paid pet care opportunity
        </p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-2">Job Details</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Pet:</span>
            <span className="font-medium">{pet?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Dates:</span>
            <span className="font-medium">{startDate} to {endDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Rate:</span>
            <span className="font-medium">£{(rate / 100).toFixed(2)}/day</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-900">
          💡 Your friends can view and accept this job through their Pawtimation account. 
          You'll be notified when someone accepts.
        </p>
      </div>

      <button
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}
