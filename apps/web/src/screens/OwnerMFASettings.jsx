import { useState, useEffect } from 'react';
import { ownerApi } from '../lib/auth';

export default function OwnerMFASettings() {
  const [mfaStatus, setMfaStatus] = useState({ enabled: false, backupCodesRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [encryptedSecret, setEncryptedSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    loadMfaStatus();
  }, []);

  async function loadMfaStatus() {
    try {
      const response = await ownerApi('/mfa/status');
      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data);
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    setError('');
    setLoading(true);
    
    try {
      const response = await ownerApi('/mfa/setup', { method: 'POST' });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start MFA setup');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setEncryptedSecret(data.encryptedSecret);
      setSetupStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndEnable() {
    setError('');
    setLoading(true);
    
    try {
      const response = await ownerApi('/mfa/verify-setup', {
        method: 'POST',
        body: { token: verificationCode, encryptedSecret }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setSetupStep('backup-codes');
      await loadMfaStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    setError('');
    setLoading(true);
    
    try {
      const response = await ownerApi('/mfa/disable', {
        method: 'POST',
        body: { password }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable MFA');
      }

      setShowDisableConfirm(false);
      setPassword('');
      await loadMfaStatus();
      alert('MFA has been disabled');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function regenerateBackupCodes() {
    setError('');
    
    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;

    setLoading(true);
    
    try {
      const response = await ownerApi('/mfa/regenerate-backup-codes', {
        method: 'POST',
        body: { password }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setSetupStep('backup-codes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadBackupCodes() {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pawtimation-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function finishSetup() {
    setSetupStep(null);
    setBackupCodes([]);
    setVerificationCode('');
    setQrCode('');
    setEncryptedSecret('');
  }

  if (loading && !setupStep) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600">Loading MFA settings...</div>
      </div>
    );
  }

  if (setupStep === 'verify') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Set Up Two-Factor Authentication</h2>
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Step 1: Scan QR Code</h3>
            <p className="text-sm text-slate-600 mb-4">
              Use an authenticator app like Google Authenticator or Authy to scan this QR code:
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="MFA QR Code" className="border-2 border-slate-200 rounded" />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Scan the QR code above with your authenticator app
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Step 2: Verify Code</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the 6-digit code from your authenticator app:
            </p>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSetupStep(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={verifyAndEnable}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (setupStep === 'backup-codes') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Backup Codes</h2>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
            <p className="font-semibold mb-1">Save these backup codes securely</p>
            <p className="text-sm">Each code can only be used once. Keep them in a safe place in case you lose access to your authenticator app.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="bg-white px-3 py-2 rounded border border-slate-300">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700"
            >
              Download Codes
            </button>
            <button
              onClick={finishSetup}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700"
            >
              I've Saved My Codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Two-Factor Authentication</h2>
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Status</h3>
            <p className="text-sm text-slate-600 mt-1">
              {mfaStatus.enabled ? (
                <span className="text-green-600 font-medium">Enabled</span>
              ) : (
                <span className="text-slate-500">Disabled</span>
              )}
            </p>
          </div>
          {mfaStatus.enabled && (
            <div className="text-sm text-slate-600">
              {mfaStatus.backupCodesRemaining} backup codes remaining
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          {!mfaStatus.enabled ? (
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Enable Two-Factor Authentication</h3>
              <p className="text-sm text-slate-600 mb-4">
                Add an extra layer of security to your account. You'll need to enter a code from your authenticator app each time you sign in.
              </p>
              <button
                onClick={startSetup}
                className="bg-teal-600 text-white py-2 px-6 rounded-md hover:bg-teal-700"
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Set Up MFA'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Manage MFA</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Your account is protected with two-factor authentication.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={regenerateBackupCodes}
                  className="bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700"
                  disabled={loading}
                >
                  Regenerate Backup Codes
                </button>
                <button
                  onClick={() => setShowDisableConfirm(true)}
                  className="bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700"
                  disabled={loading}
                >
                  Disable MFA
                </button>
              </div>

              {showDisableConfirm && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                  <p className="text-sm text-amber-800 mb-3">
                    Enter your password to disable two-factor authentication:
                  </p>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowDisableConfirm(false);
                        setPassword('');
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={disableMfa}
                      className="bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700 disabled:opacity-50"
                      disabled={loading || !password}
                    >
                      {loading ? 'Disabling...' : 'Confirm Disable'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
