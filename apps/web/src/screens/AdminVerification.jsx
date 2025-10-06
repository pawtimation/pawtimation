import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminVerification() {
  const navigate = useNavigate();
  const [applications] = useState([
    {
      id: 'v_001',
      companionName: 'Sarah Johnson',
      email: 'sarah@example.com',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      documents: ['DBS Check', 'Insurance Certificate', 'References'],
      status: 'pending'
    },
    {
      id: 'v_002',
      companionName: 'Mike Thompson',
      email: 'mike@example.com',
      submittedAt: new Date(Date.now() - 172800000).toISOString(),
      documents: ['DBS Check', 'First Aid Certificate'],
      status: 'pending'
    }
  ]);

  function handleApprove(appId) {
    console.log('Approve:', appId);
    alert('Verification approved (no-op for now)');
  }

  function handleDeny(appId) {
    console.log('Deny:', appId);
    alert('Verification denied (no-op for now)');
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Verification Queue</h2>
        <button onClick={() => navigate('/admin')} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            This is a placeholder screen. Approve/Deny buttons are no-ops until document upload and verification logic is implemented.
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {applications.map((app) => (
          <div key={app.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{app.companionName}</h3>
                <div className="text-sm text-slate-600 mb-2">{app.email}</div>
                <div className="text-xs text-slate-500 mb-3">
                  Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {app.documents.map((doc, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(app.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeny(app.id)}
                  className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
