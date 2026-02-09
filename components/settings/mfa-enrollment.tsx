'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  QrCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type MFAEnrollmentProps = {
  initialEnabled: boolean;
  required: boolean;
};

export function MFAEnrollment({ initialEnabled, required }: MFAEnrollmentProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await fetch('/api/security/mfa/setup', {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.qrCode) {
        setError(payload?.error || 'Unable to start MFA setup');
        return;
      }
      setQrCode(payload.qrCode);
      setBackupCodes(payload.backupCodes || []);
    } catch {
      setError('Unable to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    setError(null);
    setSuccess(null);
    if (!token) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/security/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || 'Invalid verification code');
        return;
      }
      setEnabled(true);
      setSuccess('MFA enabled successfully.');
      setToken('');
    } catch {
      setError('Unable to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await fetch('/api/security/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || 'Unable to disable MFA');
        return;
      }
      setEnabled(false);
      setQrCode(null);
      setBackupCodes([]);
      setSuccess('MFA disabled.');
    } catch {
      setError('Unable to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-100 tracking-tight">
              Multi-Factor Authentication
            </h3>
            {required && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Protect privileged access with time-based one-time codes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          {success}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2
              className={`h-5 w-5 ${enabled ? 'text-emerald-400' : 'text-slate-500'}`}
            />
            <span className="text-sm font-semibold text-slate-100">
              {enabled ? 'MFA Enabled' : 'MFA Not Enabled'}
            </span>
          </div>
          {enabled ? (
            <button
              type="button"
              onClick={disableMFA}
              disabled={loading}
              className="text-xs font-semibold text-slate-300 hover:text-white"
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              onClick={startSetup}
              disabled={loading}
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Enable MFA
            </button>
          )}
        </div>

        {!enabled && qrCode && (
          <div className="grid grid-cols-1 lg:grid-cols-[200px,1fr] gap-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-40 w-40 rounded-xl border border-white/10 bg-white p-3">
                <img src={qrCode} alt="MFA QR Code" className="h-full w-full" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <QrCode className="h-3 w-3" />
                Scan with Authenticator
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-slate-900/40 px-4 py-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <KeyRound className="h-3 w-3" />
                  Backup Codes
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Store these codes safely. Each code can be used once.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-emerald-200">
                  {backupCodes.map((code) => (
                    <span key={code}>{code}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Verification Code
                </label>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              <button
                type="button"
                onClick={verifyToken}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify & Enable MFA
              </button>
            </div>
          </div>
        )}

        {!enabled && !qrCode && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div>
              <p className="font-semibold">MFA Required for Privileged Roles</p>
              <p className="mt-1 text-amber-100/80">
                Enable MFA to access sensitive enterprise features.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
