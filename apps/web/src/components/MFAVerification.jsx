import { useState } from 'react';

export default function MFAVerification({ mfaChallenge, email, onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaChallenge,
          mfaToken: code,
          isBackupCode: useBackupCode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid code');
      }

      const data = await response.json();
      onSuccess(data);
    } catch (err) {
      setError(err.message === 'Invalid MFA code' ? 'Invalid code. Please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Two-Factor Authentication</h2>
        <p className="text-sm text-slate-500 mt-1">
          {useBackupCode 
            ? 'Enter a backup code'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
        <p className="text-xs text-slate-400 mt-1">{email}</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-widest font-mono"
            type="text"
            placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
            value={code}
            onChange={(e) => {
              const value = useBackupCode 
                ? e.target.value.toUpperCase().slice(0, 8)
                : e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
            }}
            maxLength={useBackupCode ? 8 : 6}
            required
            disabled={loading}
            autoFocus
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode('');
            setError('');
          }}
          className="text-sm text-teal-600 hover:text-teal-700"
          disabled={loading}
        >
          {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code'}
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || (useBackupCode ? code.length !== 8 : code.length !== 6)}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>
    </div>
  );
}
