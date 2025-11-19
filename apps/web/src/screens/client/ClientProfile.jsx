import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../../api/src/repo.js';

export function ClientProfile() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const clientId = parsed.crmClientId || parsed.clientId;

        if (!clientId) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        const c = await repo.getClient(clientId);

        if (!c) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        setClient(c);
      } catch (err) {
        console.error('Failed to load profile:', err);
        localStorage.removeItem('pt_client');
        localStorage.removeItem('pt_user');
        navigate('/client/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading profile…</div>;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Profile</h1>

      <div className="bg-white p-6 border border-slate-200 rounded space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Name
          </label>
          <p className="text-sm mt-1">
            {client.firstName || client.name || 'Not set'}{' '}
            {client.lastName || ''}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Email
          </label>
          <p className="text-sm mt-1">{client.email || 'Not set'}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Phone
          </label>
          <p className="text-sm mt-1">{client.phone || 'Not set'}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Address
          </label>
          <p className="text-sm mt-1">
            {client.addressLine1 || 'Not set'}
            {client.city && `, ${client.city}`}
            {client.postcode && ` ${client.postcode}`}
          </p>
        </div>

        {client.emergencyContact && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Emergency Contact
            </label>
            <p className="text-sm mt-1">{client.emergencyContact}</p>
          </div>
        )}

        {client.notes && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Notes
            </label>
            <p className="text-sm mt-1">{client.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm text-blue-900">
          To update your profile information, please contact your dog walker.
        </p>
      </div>
    </div>
  );
}
