'use client';

import { useState } from 'react';
import { inviteMember } from '@/app/app/actions/team';
import {
  Mail,
  Shield,
  User,
  Loader2,
  X,
  CheckCircle2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
});

export function InviteModal({
  isOpen,
  onCloseAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
}) {
  const [email, setEmail] = useState('');
  // ✅ Upgrade: Added 'viewer' to match system capabilities
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [delivery, setDelivery] = useState<'sent' | 'manual_share_required'>(
    'sent',
  );
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = inviteSchema.safeParse({ email, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);

    try {
      // ✅ Upgrade: Handle the structured response from our server action
      const result = await inviteMember(email, role);

      if (result?.success) {
        setDelivery(result.delivery);
        setManualShareUrl(result.delivery === 'manual_share_required' ? result.inviteUrl : null);
        setSuccess(true);
        if (result.delivery === 'sent') {
          setTimeout(() => {
            setSuccess(false);
            setDelivery('sent');
            setManualShareUrl(null);
            setCopied(false);
            setEmail('');
            setRole('member');
            onCloseAction();
          }, 2000);
        }
      } else {
        // Show server-side errors (e.g., "User already invited")
        setError(result?.error || 'Invitation failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Modal Invite Error:', err);
      setError('System connection error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!manualShareUrl) return;
    try {
      await navigator.clipboard.writeText(manualShareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-neutral-200">
        {/* Header */}
        <div className="p-8 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/30">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-neutral-900 tracking-tight">
              Invite Personnel
            </h3>
            <p className="text-xs font-medium text-neutral-500">
              Provision a secure identity for your workspace.
            </p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors -mr-2 -mt-2 group"
          >
            <X className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
          </button>
        </div>

        {success ? (
          <div className="p-16 text-center flex flex-col items-center animate-in scale-in-95 duration-500">
            <div className="h-20 w-20 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-black text-neutral-900 tracking-tight">
              {delivery === 'sent'
                ? 'Invitation Dispatched'
                : 'Invitation Created'}
            </h4>
            <p className="text-sm text-neutral-500 mt-2 font-medium">
              {delivery === 'sent'
                ? 'The invite email was sent and the audit ledger was updated.'
                : 'Email delivery is unavailable. Share the secure invite link manually.'}
            </p>
            {manualShareUrl ? (
              <>
                <div className="mt-6 w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    Manual Share Link
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-neutral-700">
                    {manualShareUrl}
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
                  >
                    {copied ? 'Copied' : 'Copy Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setDelivery('sent');
                      setManualShareUrl(null);
                      setCopied(false);
                      setEmail('');
                      setRole('member');
                      onCloseAction();
                    }}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="field-228" className="text-xs font-black uppercase text-neutral-400 tracking-[0.2em] ml-1">
                Identity / Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-bold outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-100 transition-all placeholder:text-neutral-300 placeholder:font-medium"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label htmlFor="field-227" className="text-xs font-black uppercase text-neutral-400 tracking-[0.2em] ml-1">
                Access Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Viewer */}
                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    role === 'viewer'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-200'
                      : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Eye
                    className={`h-5 w-5 ${role === 'viewer' ? 'text-white' : 'text-neutral-400'}`}
                  />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Viewer
                  </span>
                </button>

                {/* Member */}
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    role === 'member'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-200'
                      : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <User
                    className={`h-5 w-5 ${role === 'member' ? 'text-white' : 'text-neutral-400'}`}
                  />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Member
                  </span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    role === 'admin'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-200'
                      : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${role === 'admin' ? 'text-white' : 'text-neutral-400'}`}
                  />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Admin
                  </span>
                </button>
              </div>
              <p className="text-xs text-center text-neutral-400 font-medium pt-1">
                {role === 'viewer' && 'Read-only access to published evidence.'}
                {role === 'member' && 'Can edit policies and complete tasks.'}
                {role === 'admin' && 'Full control over organization settings.'}
              </p>
            </div>

            {/* Submit */}
            <div className="space-y-4 pt-2">
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send Invitation'
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-neutral-300">
                <Shield className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Logged Event
                </span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
