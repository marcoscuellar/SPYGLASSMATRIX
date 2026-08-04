'use client';
/* ============================================================
   Login — split sign-in on the locked brand, wired to real auth.
   Email + password → session cookie. First sign-in with a temporary
   password forces a password reset before landing on the Desk.
   ============================================================ */
import React from 'react';
import { useRouter } from 'next/navigation';
import { SpyglassMark } from './ui';

type Mode = 'signin' | 'reset';

export function LoginView() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');   // temp/current password
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Could not sign in.'); setBusy(false); return; }
      if (data.mustReset) { setMode('reset'); setBusy(false); return; }
      router.push('/desk');
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  };

  const setNewPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Choose a password of at least 8 characters.'); return; }
    if (newPassword !== confirm) { setError('Those passwords don’t match.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Could not set your password.'); setBusy(false); return; }
      router.push('/desk');
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="lgn">
      <div className="panel">
        <div className="brand">
          <SpyglassMark color="#fff" height={30} />
          <span className="name">Spyglass <span className="mk">Matrix</span></span>
        </div>
        <div className="lede">
          <div className="kick">Recruiting, measured</div>
          <h1>The client agrees the target. Then you measure against it.</h1>
          <p>Sign in to your desk — every live role, its OHMatrix, and the candidates scored against it.</p>
        </div>
        <div className="note">Ollin:Hire · access is invite-only</div>
      </div>

      <div className="formwrap">
        {mode === 'signin' ? (
          <form onSubmit={signIn}>
            <div className="h">Sign in</div>
            <div className="s">Welcome back. Enter your details to continue.</div>

            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@firm.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <div className="err">{error}</div>}

            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>

            <div className="alt">New here? Ask your admin for an invite.</div>
            <div className="demoflag">First time in? Sign in with the temporary password you were sent — we’ll ask you to set your own.</div>
          </form>
        ) : (
          <form onSubmit={setNewPw}>
            <div className="h">Set your password</div>
            <div className="s">You signed in with a temporary password. Choose a new one to finish.</div>

            <div className="field">
              <label htmlFor="new">New password</label>
              <input id="new" type="password" autoComplete="new-password" placeholder="At least 8 characters"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" placeholder="Re-enter it"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            {error && <div className="err">{error}</div>}

            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Set password & continue →'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
