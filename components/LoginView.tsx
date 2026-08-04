'use client';
/* ============================================================
   Login — split sign-in on the locked brand. The form is wired to
   route through to the Desk for the demo flow; real credential auth
   (validation + sessions + route protection) is the backend follow-up.
   ============================================================ */
import React from 'react';
import { useRouter } from 'next/navigation';

export function LoginView() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Demo: no backend yet — route through to the Desk.
    setTimeout(() => router.push('/desk'), 500);
  };

  return (
    <div className="lgn">
      <div className="panel">
        <div className="brand">
          <span className="mark" />
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
        <form onSubmit={submit}>
          <div className="h">Sign in</div>
          <div className="s">Welcome back. Enter your details to continue.</div>

          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@firm.com" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
          </div>
          <div className="row"><a href="#">Forgot password?</a></div>

          <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>

          <div className="alt">New to Spyglass? <a href="#">Request access</a></div>
          <div className="demoflag">Demo — the form routes to the Desk. Credential sign-in &amp; sessions are the next backend step.</div>
        </form>
      </div>
    </div>
  );
}
